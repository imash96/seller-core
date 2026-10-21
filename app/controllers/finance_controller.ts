import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import FinancialAccount from '#models/financial_account'
import CreditCard from '#models/credit_card'
import CreditCardSellerAccount from '#models/credit_card_seller_account'
import FinanceCategory from '#models/finance_category'
import FinancialTransaction from '#models/financial_transaction'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import {
  createCreditCardValidator,
  updateCreditCardValidator,
  createFinancialTransactionValidator,
  updateFinancialAccountValidator,
} from '#validators/operations'
import { CreditCardStatus, FinancialTransactionStatus } from '../enums/index.js'

export default class FinanceController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [accounts, cards, transactions, savedViews, sharedLookups] = await Promise.all([
      FinancialAccount.query().where('userId', user.id).orderBy('accountName'),
      CreditCard.query()
        .where('userId', user.id)
        .preload('sellerAccountLinks', (q) => q.preload('sellerAccount'))
        .orderBy('createdAt', 'desc'),
      FinancialTransaction.query()
        .where('userId', user.id)
        .preload('financialAccount')
        .preload('creditCard')
        .preload('category')
        .preload('sellerAccount')
        .orderBy('transactionDate', 'desc')
        .limit(100),
      WorkspaceLookupService.savedViewsFor(user.id, 'finance'),
      WorkspaceLookupService.lookups(user.id),
    ])
    return inertia.render('finance', {
      ...sharedLookups,
      financialAccounts: accounts.map((a) => a.serialize()),
      creditCards: cards.map((c) => c.serialize()),
      financialTransactions: transactions.map((t) => t.serialize()),
      savedViews,
    })
  }

  async storeFinancialAccount({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const accountName = String(request.input('accountName', '')).trim()
    if (!accountName) {
      session.flash('error', 'Account name is required.')
      return response.redirect().back()
    }

    const account = await FinancialAccount.create({
      userId: user.id,
      accountName,
      accountType: String(request.input('accountType', 'bank_checking')),
      dataClassification: String(request.input('dataClassification', 'business')),
      institutionName: request.input('institutionName') || 'Mercury Bank',
      accountNumberLast4: request.input('accountNumberLast4') || '4401',
      currencyCode: String(request.input('currencyCode', 'USD')).toUpperCase(),
      currentBalance: Number(request.input('currentBalance', 0)).toFixed(2),
      isActive: true,
    })

    session.flash('success', `Financial account "${account.accountName}" created.`)
    return response.redirect().back()
  }

  async updateFinancialAccount({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateFinancialAccountValidator)
    const account = await FinancialAccount.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    if (payload.accountName !== undefined) account.accountName = payload.accountName
    if (payload.currentBalance !== undefined)
      account.currentBalance = String(payload.currentBalance)
    if (payload.isActive !== undefined) account.isActive = payload.isActive
    await account.save()
    session.flash('success', `Financial account "${account.accountName}" updated.`)
    return response.redirect().back()
  }

  async deleteFinancialAccount({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const account = await FinancialAccount.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    await account.delete()
    session.flash('success', 'Financial account deleted.')
    return response.redirect().back()
  }

  async storeCreditCard({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createCreditCardValidator)

    const card = await CreditCard.create({
      userId: user.id,
      cardLabel: payload.cardLabel,
      brandName: payload.brandName,
      issuerBank: payload.issuerBank ?? null,
      cardholderName: payload.cardholderName.toUpperCase(),
      last4Digits: payload.last4Digits,
      expMonth: payload.expMonth,
      expYear: payload.expYear,
      vaultTokenReference: `tok_vault_${payload.last4Digits}_${Date.now()}`,
      currencyCode: payload.currencyCode || 'USD',
      creditLimit: (payload.creditLimit ?? 25000).toFixed(2),
      currentBalance: (payload.currentBalance ?? 0).toFixed(2),
      statementBalance: (payload.currentBalance ?? 0).toFixed(2),
      minimumPaymentDue: (payload.minimumPaymentDue ?? 0).toFixed(2),
      nextPaymentDueDate: payload.nextPaymentDueDate
        ? DateTime.fromISO(payload.nextPaymentDueDate)
        : DateTime.now().plus({ days: 15 }),
      reminderDaysBefore: 5,
      autoPayEnabled: false,
      dataClassification: payload.dataClassification || 'business',
      status: CreditCardStatus.ACTIVE,
    })

    if (payload.sellerAccountId) {
      await CreditCardSellerAccount.create({
        userId: user.id,
        creditCardId: card.id,
        sellerAccountId: payload.sellerAccountId,
        usagePurpose: payload.usagePurpose || 'primary_billing',
        isPrimary: true,
      })
    }

    session.flash('success', `Card "${card.cardLabel}" (•••• ${card.last4Digits}) registered.`)
    return response.redirect().back()
  }

  async updateCreditCard({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateCreditCardValidator)
    const card = await CreditCard.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    if (payload.cardLabel !== undefined) card.cardLabel = payload.cardLabel
    if (payload.creditLimit !== undefined) card.creditLimit = String(payload.creditLimit)
    if (payload.minimumPaymentDue !== undefined) {
      card.minimumPaymentDue = String(payload.minimumPaymentDue)
    }
    if (payload.nextPaymentDueDate !== undefined) {
      card.nextPaymentDueDate = payload.nextPaymentDueDate
        ? DateTime.fromISO(payload.nextPaymentDueDate)
        : null
    }
    if (payload.status !== undefined) card.status = payload.status
    await card.save()
    session.flash('success', `Card "${card.cardLabel}" updated.`)
    return response.redirect().back()
  }

  async deleteCreditCard({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const card = await CreditCard.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    card.status = CreditCardStatus.CANCELLED
    await card.save()
    session.flash('success', `Card "${card.cardLabel}" (•••• ${card.last4Digits}) cancelled.`)
    return response.redirect().back()
  }

  async storeFinancialTransaction({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createFinancialTransactionValidator)

    const exchangeRate = Number(payload.exchangeRate ?? 1.0)
    const originalAmount = Number(payload.originalAmount)
    const reportingAmount = Math.round(originalAmount * exchangeRate * 100) / 100

    const tx = await FinancialTransaction.create({
      userId: user.id,
      financialAccountId: payload.financialAccountId ?? null,
      creditCardId: payload.creditCardId ?? null,
      sellerAccountId: payload.sellerAccountId ?? null,
      orderId: payload.orderId ?? null,
      referenceNumber: payload.referenceNumber,
      transactionType: payload.transactionType,
      dataClassification: payload.dataClassification || 'business',
      status: FinancialTransactionStatus.POSTED,
      description: payload.description,
      vendorOrPayer: payload.vendorOrPayer ?? null,
      originalCurrencyCode: payload.originalCurrencyCode || 'USD',
      originalAmount: originalAmount.toFixed(2),
      exchangeRate: exchangeRate.toFixed(8),
      reportingCurrencyCode: payload.reportingCurrencyCode || 'USD',
      reportingAmount: reportingAmount.toFixed(2),
      taxAmount: Number(payload.taxAmount ?? 0).toFixed(2),
      transactionDate: DateTime.fromISO(payload.transactionDate),
      conversionDate: DateTime.fromISO(payload.transactionDate),
      metadata: {},
    })

    const paymentMod = await import('#events/payment_reconciled')
    const PaymentReconciled = paymentMod.default
    await PaymentReconciled.dispatch({
      financialTransactionId: tx.id,
      userId: user.id,
      status: tx.status,
      amount: tx.reportingAmount,
      currencyCode: tx.reportingCurrencyCode,
      requestId: request.id(),
    })

    session.flash(
      'success',
      `Ledger entry ${tx.referenceNumber} (${tx.originalAmount} ${tx.originalCurrencyCode} -> ${tx.reportingAmount} ${tx.reportingCurrencyCode}) posted.`
    )
    return response.redirect().back()
  }

  async voidFinancialTransaction({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const tx = await FinancialTransaction.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    tx.status = 'voided'
    await tx.save()
    session.flash('success', `Ledger entry ${tx.referenceNumber} voided.`)
    return response.redirect().back()
  }

  async storeFinanceCategory({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    if (!name) {
      session.flash('error', 'Finance category name is required.')
      return response.redirect().back()
    }
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    await FinanceCategory.updateOrCreate(
      { userId: user.id, slug },
      {
        userId: user.id,
        name,
        slug,
        categoryType: String(request.input('categoryType', 'expense')),
        costBucket: String(request.input('costBucket', 'operations')),
        dataClassification: String(request.input('dataClassification', 'business')),
        isTaxDeductible:
          request.input('isTaxDeductible') === 'true' || request.input('isTaxDeductible') === true,
        isActive: true,
      }
    )
    session.flash('success', `Finance category "${name}" saved.`)
    return response.redirect().back()
  }

  async updateFinanceCategory({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const category = await FinanceCategory.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()

    if (request.input('name')) category.name = String(request.input('name')).trim()
    if (request.input('categoryType')) category.categoryType = String(request.input('categoryType'))
    if (request.input('costBucket')) category.costBucket = String(request.input('costBucket'))
    if (request.input('dataClassification'))
      category.dataClassification = String(request.input('dataClassification'))
    if (request.input('isTaxDeductible') !== undefined) {
      category.isTaxDeductible =
        request.input('isTaxDeductible') === 'true' || request.input('isTaxDeductible') === true
    }
    await category.save()
    session.flash('success', `Finance category "${category.name}" updated.`)
    return response.redirect().back()
  }

  async deleteFinanceCategory({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const category = await FinanceCategory.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()
    await category.delete()
    session.flash('success', 'Finance category deleted.')
    return response.redirect().back()
  }
}
