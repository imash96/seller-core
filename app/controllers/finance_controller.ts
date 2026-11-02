import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import FinancialAccount from '#models/financial_account'
import CreditCard from '#models/credit_card'
import CreditCardSellerAccount from '#models/credit_card_seller_account'
import FinanceCategory from '#models/finance_category'
import FinancialTransaction from '#models/financial_transaction'
import ManualReconciliation from '#models/manual_reconciliation'
import {
  ManualReconciliationService,
  ReconciliationError,
} from '#services/manual_reconciliation_service'
import GenerateFinanceReport from '#jobs/generate_finance_report'
import SellerAccount from '#models/seller_account'
import Order from '#models/order'
import { RbacService } from '#services/rbac_service'
import { AuditContext } from '#services/audit_context'
import { FinanceAccessService, type FinanceAction } from '#services/finance_access_service'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import {
  createCreditCardValidator,
  updateCreditCardValidator,
  createFinancialTransactionValidator,
  updateFinancialAccountValidator,
} from '#validators/operations'
import { CreditCardStatus, FinancialTransactionStatus } from '../enums/index.js'
import {
  amountOf,
  currencyOf,
  money,
  normalizeCurrencyCode,
  normalizePriceMoney,
} from '../types/price.js'

export default class FinanceController {
  private async checkClassification(
    ctx: HttpContext,
    action: FinanceAction,
    ...classifications: unknown[]
  ) {
    if (classifications.some((c) => !FinanceAccessService.isClassification(c))) {
      ctx.response.badRequest({ error: 'Invalid finance classification.' })
      return false
    }
    const permissions = await FinanceAccessService.permissions(ctx.auth.getUserOrFail())
    if (
      classifications.some((c) => !FinanceAccessService.canUse(c as string, action, permissions))
    ) {
      ctx.response.forbidden({ error: 'Household finance permission is required.' })
      return false
    }
    return true
  }

  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const effective = await RbacService.getEffectivePermissions(user)
    const can = (resource: string, action = 'read') =>
      RbacService.allows(user, effective, `${resource}.${action}`, resource)
    const canReadCards = can('credit_cards')
    const household = await FinanceAccessService.permissions(user)
    const [accounts, cards, transactions, savedViews, sharedLookups] = await Promise.all([
      FinancialAccount.query()
        .where('userId', user.id)
        .if(!household.read, (q) => q.where('dataClassification', 'business'))
        .orderBy('accountName'),
      canReadCards
        ? CreditCard.query()
            .where('userId', user.id)
            .if(!household.read, (q) => q.where('dataClassification', 'business'))
            .if(can('integrations'), (q) =>
              q.preload('sellerAccountLinks', (links) =>
                links
                  .where('userId', user.id)
                  .preload('sellerAccount', (account) => account.where('userId', user.id))
              )
            )
            .orderBy('createdAt', 'desc')
        : [],
      FinancialTransaction.query()
        .where('userId', user.id)
        .if(!household.read, (q) => q.where('dataClassification', 'business'))
        .preload('financialAccount', (q) =>
          q
            .where('userId', user.id)
            .if(!household.read, (r) => r.where('dataClassification', 'business'))
        )
        .preload('category', (q) =>
          q
            .where('userId', user.id)
            .if(!household.read, (r) => r.where('dataClassification', 'business'))
        )
        .if(can('integrations'), (q) =>
          q.preload('sellerAccount', (r) => r.where('userId', user.id))
        )
        .orderBy('transactionDate', 'desc')
        .limit(100),
      WorkspaceLookupService.savedViewsFor(user.id, 'finance'),
      WorkspaceLookupService.lookups(user),
    ])
    const transactionIds = transactions.map((t) => t.id)
    const reconciliations = transactionIds.length
      ? await ManualReconciliation.query()
          .where('userId', user.id)
          .whereIn('financialTransactionId', transactionIds)
          .whereNull('reversedAt')
      : []
    const matches = new Map(reconciliations.map((r) => [r.financialTransactionId, r.serialize()]))
    return inertia.render('finance', {
      ...sharedLookups,
      financeAccess: {
        household,
        creditCardsRead: canReadCards,
        creditCardsCreate: can('credit_cards', 'create'),
        canReconcile: can('finance', 'update'),
      },
      financialAccounts: accounts.map((a) => a.serialize()),
      creditCards: cards.map((c) => c.serialize()),
      financialTransactions: transactions.map((t) => ({
        ...t.serialize(),
        manualReconciliation: matches.get(t.id) ?? null,
      })),
      savedViews,
    })
  }

  async storeFinancialAccount(ctx: HttpContext) {
    const { auth, request, response, session } = ctx
    const user = auth.getUserOrFail()
    const classification = request.input('dataClassification', 'business')
    if (!(await this.checkClassification(ctx, 'create', classification))) return
    const accountName = String(request.input('accountName', '')).trim()
    if (!accountName) {
      session.flash('error', 'Account name is required.')
      return response.redirect().back()
    }

    const type = String(request.input('accountType', 'bank_checking'))
    const currency = normalizeCurrencyCode(request.input('currencyCode'), 'USD')
    const last4 = request.input('accountNumberLast4')
    // Balances are self-contained PriceMoney so an account can never lose its currency.
    const currentBalance = normalizePriceMoney(request.input('currentBalance') ?? 0, currency)
    const balance = amountOf(currentBalance)
    if (
      ![
        'bank_checking',
        'bank_savings',
        'cash',
        'credit_card',
        'marketplace_clearing',
        'payment_gateway',
      ].includes(type) ||
      !/^[A-Z]{3}$/.test(currency) ||
      (last4 && !/^\d{4}$/.test(String(last4))) ||
      !Number.isFinite(balance) ||
      Math.abs(balance) >= 1e12 ||
      accountName.length > 150
    ) {
      return response.badRequest({ error: 'Invalid account details.' })
    }

    const account = await AuditContext.runRequest(
      ctx,
      'financial_account.created',
      async (trx): Promise<FinancialAccount> =>
        await FinancialAccount.create(
          {
            userId: user.id,
            accountName,
            accountType: type,
            dataClassification: classification,
            institutionName: request.input('institutionName') || null,
            accountNumberLast4: request.input('accountNumberLast4') || null,
            currentBalance,
            isActive:
              request.input('isActive') !== undefined
                ? request.input('isActive') === 'true' || request.input('isActive') === true
                : true,
          },
          { client: trx }
        )
    )

    session.flash('success', `Financial account "${account.accountName}" created.`)
    return response.redirect().back()
  }

  async updateFinancialAccount(ctx: HttpContext) {
    const { auth, params, request, response, session } = ctx
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateFinancialAccountValidator)
    const account = await FinancialAccount.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    const classification = request.input('dataClassification', account.dataClassification)
    if (
      !(await this.checkClassification(ctx, 'update', account.dataClassification, classification))
    )
      return
    const newType = request.input('accountType')
    const newCurrency = request.input('currencyCode')
    const newLast4 = request.input('accountNumberLast4')
    if (
      (newType &&
        ![
          'bank_checking',
          'bank_savings',
          'cash',
          'credit_card',
          'marketplace_clearing',
          'payment_gateway',
        ].includes(String(newType))) ||
      (newCurrency && !/^[A-Za-z]{3}$/.test(String(newCurrency))) ||
      (newLast4 && !/^\d{4}$/.test(String(newLast4))) ||
      (payload.currentBalance !== undefined &&
        (!Number.isFinite(amountOf(payload.currentBalance)) ||
          Math.abs(amountOf(payload.currentBalance)) >= 1e12))
    ) {
      return response.badRequest({ error: 'Invalid account details.' })
    }
    if (payload.accountName !== undefined) account.accountName = payload.accountName
    if (request.input('accountType')) account.accountType = String(request.input('accountType'))
    if (request.input('institutionName') !== undefined) {
      account.institutionName = request.input('institutionName') || null
    }
    if (request.input('accountNumberLast4') !== undefined) {
      account.accountNumberLast4 = request.input('accountNumberLast4') || null
    }
    if (request.input('dataClassification')) {
      account.dataClassification = classification
    }
    if (payload.currentBalance !== undefined)
      account.currentBalance = normalizePriceMoney(
        payload.currentBalance,
        currencyOf(account.currentBalance)
      )
    if (payload.isActive !== undefined) account.isActive = payload.isActive
    await AuditContext.runRequest(ctx, 'financial_account.updated', async (trx) => {
      account.useTransaction(trx)
      await account.save()
    })
    session.flash('success', `Financial account "${account.accountName}" updated.`)
    return response.redirect().back()
  }

  async deleteFinancialAccount(ctx: HttpContext) {
    const { auth, params, response, session } = ctx
    const user = auth.getUserOrFail()
    const account = await FinancialAccount.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    if (!(await this.checkClassification(ctx, 'delete', account.dataClassification))) return
    await AuditContext.runRequest(ctx, 'financial_account.deleted', async (trx) => {
      account.useTransaction(trx)
      await account.delete()
    })
    session.flash('success', 'Financial account deleted.')
    return response.redirect().back()
  }

  async storeCreditCard(ctx: HttpContext) {
    const { auth, request, response, session } = ctx
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createCreditCardValidator)
    if (!(await this.checkClassification(ctx, 'create', payload.dataClassification ?? 'business')))
      return

    if (payload.nextPaymentDueDate && !DateTime.fromISO(payload.nextPaymentDueDate).isValid)
      return response.badRequest({ error: 'Invalid due date.' })
    if (
      payload.sellerAccountId &&
      !(await RbacService.hasPermission(user, 'integrations.read', 'integrations'))
    ) {
      return response.forbidden({ error: 'Seller account access is required.' })
    }
    if (
      payload.sellerAccountId &&
      !(await SellerAccount.query()
        .where('userId', user.id)
        .where('id', payload.sellerAccountId)
        .first())
    ) {
      return response.badRequest({ error: 'Invalid seller account.' })
    }

    const cardCurrency = normalizeCurrencyCode(payload.currencyCode, 'USD')
    const cardMoney = (value: unknown) => normalizePriceMoney(value ?? 0, cardCurrency)

    const card = await AuditContext.runRequest(
      ctx,
      'credit_card.created',
      async (trx): Promise<CreditCard> => {
        const createdCard = await CreditCard.create(
          {
            userId: user.id,
            cardLabel: payload.cardLabel,
            brandName: payload.brandName,
            issuerBank: payload.issuerBank ?? null,
            cardholderName: payload.cardholderName.toUpperCase(),
            last4Digits: payload.last4Digits,
            expMonth: payload.expMonth,
            expYear: payload.expYear,
            vaultTokenReference: null,
            creditLimit: cardMoney(payload.creditLimit ?? 0),
            currentBalance: cardMoney(payload.currentBalance ?? 0),
            statementBalance: cardMoney(payload.currentBalance ?? 0),
            minimumPaymentDue: cardMoney(payload.minimumPaymentDue ?? 0),
            nextPaymentDueDate: payload.nextPaymentDueDate
              ? DateTime.fromISO(payload.nextPaymentDueDate)
              : null,
            reminderDaysBefore: 5,
            autoPayEnabled: false,
            dataClassification: payload.dataClassification || 'business',
            status: CreditCardStatus.ACTIVE,
          },
          { client: trx }
        )

        if (payload.sellerAccountId) {
          await CreditCardSellerAccount.create(
            {
              userId: user.id,
              creditCardId: createdCard.id,
              sellerAccountId: payload.sellerAccountId,
              usagePurpose: payload.usagePurpose || 'primary_billing',
              isPrimary: true,
            },
            { client: trx }
          )
        }

        return createdCard
      }
    )

    session.flash('success', `Card "${card.cardLabel}" (•••• ${card.last4Digits}) registered.`)
    return response.redirect().back()
  }

  async updateCreditCard(ctx: HttpContext) {
    const { auth, params, request, response, session } = ctx
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateCreditCardValidator)
    const card = await CreditCard.query()
      .where('id', params.id)
      .andWhere('userId', user.id)
      .firstOrFail()
    if (!(await this.checkClassification(ctx, 'update', card.dataClassification))) return
    if (payload.nextPaymentDueDate && !DateTime.fromISO(payload.nextPaymentDueDate).isValid)
      return response.badRequest({ error: 'Invalid due date.' })
    if (payload.cardLabel !== undefined) card.cardLabel = payload.cardLabel
    if (payload.creditLimit !== undefined)
      card.creditLimit = normalizePriceMoney(payload.creditLimit, currencyOf(card.creditLimit))
    if (payload.currentBalance !== undefined)
      card.currentBalance = normalizePriceMoney(
        payload.currentBalance,
        currencyOf(card.currentBalance)
      )
    if (payload.minimumPaymentDue !== undefined) {
      card.minimumPaymentDue = normalizePriceMoney(
        payload.minimumPaymentDue,
        currencyOf(card.minimumPaymentDue)
      )
    }
    if (payload.nextPaymentDueDate !== undefined) {
      card.nextPaymentDueDate = payload.nextPaymentDueDate
        ? DateTime.fromISO(payload.nextPaymentDueDate)
        : null
    }
    if (payload.status !== undefined) card.status = payload.status
    await AuditContext.runRequest(ctx, 'credit_card.updated', async (trx) => {
      card.useTransaction(trx)
      await card.save()
    })
    session.flash('success', `Card "${card.cardLabel}" updated.`)
    return response.redirect().back()
  }

  async deleteCreditCard(ctx: HttpContext) {
    const { auth, params, response, session } = ctx
    const user = auth.getUserOrFail()
    const card = await CreditCard.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()
    if (!(await this.checkClassification(ctx, 'delete', card.dataClassification))) return

    card.status = CreditCardStatus.CANCELLED
    await AuditContext.runRequest(ctx, 'credit_card.cancelled', async (trx) => {
      card.useTransaction(trx)
      await card.save()
    })
    session.flash('success', `Card "${card.cardLabel}" (•••• ${card.last4Digits}) cancelled.`)
    return response.redirect().back()
  }

  async storeFinancialTransaction(ctx: HttpContext) {
    const { auth, request, response, session } = ctx
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createFinancialTransactionValidator)
    const classification = payload.dataClassification ?? 'business'
    if (!(await this.checkClassification(ctx, 'create', classification))) return
    if (!DateTime.fromISO(payload.transactionDate).isValid)
      return response.badRequest({ error: 'Invalid transaction date.' })

    // Foreign keys must belong to this workspace; DB foreign keys alone do not
    // prevent a valid ID from another tenant being linked to a ledger entry.
    const links = await Promise.all([
      payload.financialAccountId
        ? FinancialAccount.query()
            .where('userId', user.id)
            .where('id', payload.financialAccountId)
            .where('dataClassification', classification)
            .first()
        : true,
      payload.creditCardId
        ? CreditCard.query()
            .where('userId', user.id)
            .where('id', payload.creditCardId)
            .where('dataClassification', classification)
            .first()
        : true,
      payload.financeCategoryId
        ? FinanceCategory.query()
            .where('userId', user.id)
            .where('id', payload.financeCategoryId)
            .where('dataClassification', classification)
            .first()
        : true,
      payload.sellerAccountId
        ? SellerAccount.query()
            .where('userId', user.id)
            .where('id', payload.sellerAccountId)
            .first()
        : true,
      payload.orderId
        ? Order.query().where('userId', user.id).where('id', payload.orderId).first()
        : true,
    ])
    if (links.some((link) => !link))
      return response.badRequest({ error: 'Invalid ledger reference.' })
    if (
      payload.creditCardId &&
      !(await RbacService.hasPermission(user, 'credit_cards.read', 'credit_cards'))
    ) {
      return response.forbidden({ error: 'Credit card access is required.' })
    }

    if (
      await FinancialTransaction.query()
        .where('userId', user.id)
        .where('referenceNumber', payload.referenceNumber)
        .first()
    ) {
      return response.conflict({ error: 'A ledger entry with this reference already exists.' })
    }
    for (const [id, resource] of [
      [payload.sellerAccountId, 'integrations'],
      [payload.orderId, 'orders'],
    ] as const) {
      if (id && !(await RbacService.hasPermission(user, `${resource}.read`, resource))) {
        return response.forbidden({ error: 'Linked record access is required.' })
      }
    }
    const exchangeRate = Number(payload.exchangeRate ?? 1.0)
    if (!Number.isFinite(exchangeRate) || exchangeRate <= 0) {
      return response.badRequest({ error: 'Exchange rate must be strictly positive.' })
    }
    const originalAmount = normalizePriceMoney(
      payload.originalAmount,
      normalizeCurrencyCode(payload.originalCurrencyCode, 'USD')
    )
    if (amountOf(originalAmount) <= 0) {
      return response.badRequest({ error: 'Original amount must be strictly positive.' })
    }
    const reportingCurrency = normalizeCurrencyCode(payload.reportingCurrencyCode, 'USD')
    const reportingAmount = money(amountOf(originalAmount) * exchangeRate, reportingCurrency)

    const tx = await AuditContext.runRequest(
      ctx,
      'financial_transaction.posted',
      async (trx): Promise<FinancialTransaction> =>
        await FinancialTransaction.create(
          {
            userId: user.id,
            financialAccountId: payload.financialAccountId ?? null,
            creditCardId: payload.creditCardId ?? null,
            financeCategoryId: payload.financeCategoryId ?? null,
            sellerAccountId: payload.sellerAccountId ?? null,
            orderId: payload.orderId ?? null,
            referenceNumber: payload.referenceNumber,
            transactionType: payload.transactionType,
            dataClassification: classification,
            status: FinancialTransactionStatus.POSTED,
            description: payload.description,
            vendorOrPayer: payload.vendorOrPayer ?? null,
            originalAmount,
            exchangeRate: exchangeRate.toFixed(8),
            reportingAmount,
            taxTotal: normalizePriceMoney(payload.taxTotal ?? 0, originalAmount.currency_code),
            transactionDate: DateTime.fromISO(payload.transactionDate),
            conversionDate: DateTime.fromISO(payload.transactionDate),
            metadata: {},
          },
          { client: trx }
        )
    )

    session.flash(
      'success',
      `Ledger entry ${tx.referenceNumber} (${amountOf(tx.originalAmount)} ${currencyOf(tx.originalAmount)} -> ${amountOf(tx.reportingAmount)} ${currencyOf(tx.reportingAmount)}) posted.`
    )
    return response.redirect().back()
  }

  async voidFinancialTransaction(ctx: HttpContext) {
    const { auth, params, response, session } = ctx
    const user = auth.getUserOrFail()
    const household = await FinanceAccessService.permissions(user)
    const result = await AuditContext.runRequest(
      ctx,
      'financial_transaction.voided',
      async (trx) => {
        const tx = await FinancialTransaction.query({ client: trx })
          .where('userId', user.id)
          .where('id', params.id)
          .forUpdate()
          .first()
        if (!tx) return { status: 404, error: 'Transaction not found.' }
        if (!FinanceAccessService.canUse(tx.dataClassification, 'update', household))
          return { status: 403, error: 'Household finance permission is required.' }
        if (tx.status === 'reconciled')
          return {
            status: 409,
            error: 'Reverse the reconciliation before voiding this transaction.',
          }
        if (tx.status !== 'voided') {
          tx.status = 'voided'
          await tx.save()
        }
        return { status: 200, reference: tx.referenceNumber }
      }
    )
    if (result.status !== 200) return response.status(result.status).send({ error: result.error })
    session.flash('success', `Ledger entry ${result.reference} voided.`)
    return response.redirect().back()
  }

  /**
   * Queues a finance report for the requested period.
   *
   * The aggregation runs in `#jobs/generate_finance_report` (queue `reports`) so a
   * large ledger never blocks the request; the finished report lands in the
   * operator's in-app feed.
   */
  async generateReport({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const periodStart = request.input('periodStart')
    const periodEnd = request.input('periodEnd')
    try {
      await GenerateFinanceReport.dispatch({
        userId: user.id,
        periodStart: periodStart ? String(periodStart) : undefined,
        periodEnd: periodEnd ? String(periodEnd) : undefined,
        requestId: request.id(),
      })
      session.flash('success', 'Finance report queued; it will appear in your notifications.')
      return response.redirect().back()
    } catch (error) {
      session.flash('error', (error as Error).message || 'Failed to queue the finance report.')
      return response.redirect().back()
    }
  }

  async reconcileTransaction(ctx: HttpContext) {
    const { auth, request, response, params, session } = ctx
    // The statement amount arrives as a self-contained PriceMoney object; the legacy
    // `amount` + `currencyCode` pair is still accepted so older clients keep working.
    const observed = request.input('observedAmount')
    const observedMoney =
      observed && typeof observed === 'object' && !Array.isArray(observed)
        ? (observed as { amount?: unknown; currency_code?: unknown; currencyCode?: unknown })
        : null
    try {
      await ManualReconciliationService.reconcile({
        user: auth.getUserOrFail(),
        transactionId: params.id,
        reference: request.input('sourceReference'),
        amount: observedMoney ? observedMoney.amount : observed,
        currency: observedMoney
          ? (observedMoney.currency_code ?? observedMoney.currencyCode)
          : request.input('currencyCode'),
        notes: request.input('notes'),
        requestId: request.id(),
      })
      if (request.header('accept')?.includes('application/json') && !request.header('x-inertia'))
        return response.ok({ message: 'Manual match recorded.' })
      session.flash(
        'success',
        'Manual match recorded. The external statement was not verified by the app.'
      )
      return response.redirect().back()
    } catch (error) {
      if (!(error instanceof ReconciliationError)) throw error
      if (request.header('x-inertia')) {
        session.flash('error', error.message)
        return response.redirect().back()
      }
      return response.status(error.status).send({ error: error.message })
    }
  }

  async reverseReconciliation(ctx: HttpContext) {
    const { auth, request, response, params, session } = ctx
    try {
      await ManualReconciliationService.reverse({
        user: auth.getUserOrFail(),
        transactionId: params.id,
        reason: request.input('reason'),
        requestId: request.id(),
      })
      if (request.header('accept')?.includes('application/json') && !request.header('x-inertia'))
        return response.ok({ message: 'Manual match reversed.' })
      session.flash('success', 'Manual match reversed; the audit history was retained.')
      return response.redirect().back()
    } catch (error) {
      if (!(error instanceof ReconciliationError)) throw error
      if (request.header('x-inertia')) {
        session.flash('error', error.message)
        return response.redirect().back()
      }
      return response.status(error.status).send({ error: error.message })
    }
  }

  async storeFinanceCategory(ctx: HttpContext) {
    const { auth, request, response, session } = ctx
    const user = auth.getUserOrFail()
    const classification = request.input('dataClassification', 'business')
    if (!(await this.checkClassification(ctx, 'create', classification))) return
    const name = String(request.input('name', '')).trim()
    if (!name) {
      session.flash('error', 'Finance category name is required.')
      return response.redirect().back()
    }
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
    if (!slug)
      return response.badRequest({ error: 'Category name must contain letters or digits.' })
    if (await FinanceCategory.query().where('userId', user.id).where('slug', slug).first()) {
      return response.conflict({ error: 'A finance category with this name already exists.' })
    }
    await AuditContext.runRequest(ctx, 'finance_category.created', async (trx) => {
      await FinanceCategory.create(
        {
          userId: user.id,
          name,
          slug,
          categoryType: String(request.input('categoryType', 'expense')),
          costBucket: [
            'cogs',
            'shipping',
            'marketplace_fee',
            'marketing',
            'software',
            'operations',
            'manufacturing',
            'tax',
            'personal',
            'other_income',
            'sales_revenue',
          ].includes(String(request.input('costBucket', 'operations')))
            ? String(request.input('costBucket', 'operations'))
            : String(request.input('costBucket')) === 'taxes'
              ? 'tax'
              : 'operations',
          dataClassification: classification,
          isTaxDeductible:
            request.input('isTaxDeductible') === 'true' ||
            request.input('isTaxDeductible') === true,
          isActive: true,
        },
        { client: trx }
      )
    })
    session.flash('success', `Finance category "${name}" saved.`)
    return response.redirect().back()
  }

  async updateFinanceCategory(ctx: HttpContext) {
    const { auth, params, request, response, session } = ctx
    const user = auth.getUserOrFail()
    const category = await FinanceCategory.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()
    const classification = request.input('dataClassification', category.dataClassification)
    if (
      !(await this.checkClassification(ctx, 'update', category.dataClassification, classification))
    )
      return

    if (request.input('name')) category.name = String(request.input('name')).trim()
    if (request.input('categoryType')) category.categoryType = String(request.input('categoryType'))
    if (request.input('costBucket')) {
      const rawBucket = String(request.input('costBucket'))
      category.costBucket = [
        'cogs',
        'shipping',
        'marketplace_fee',
        'marketing',
        'software',
        'operations',
        'manufacturing',
        'tax',
        'personal',
        'other_income',
        'sales_revenue',
      ].includes(rawBucket)
        ? rawBucket
        : rawBucket === 'taxes'
          ? 'tax'
          : 'operations'
    }
    if (request.input('dataClassification')) category.dataClassification = classification
    if (request.input('isTaxDeductible') !== undefined) {
      category.isTaxDeductible =
        request.input('isTaxDeductible') === 'true' || request.input('isTaxDeductible') === true
    }
    await AuditContext.runRequest(ctx, 'finance_category.updated', async (trx) => {
      category.useTransaction(trx)
      await category.save()
    })
    session.flash('success', `Finance category "${category.name}" updated.`)
    return response.redirect().back()
  }

  async deleteFinanceCategory(ctx: HttpContext) {
    const { auth, params, response, session } = ctx
    const user = auth.getUserOrFail()
    const category = await FinanceCategory.query()
      .where('userId', user.id)
      .andWhere('id', params.id)
      .firstOrFail()
    if (!(await this.checkClassification(ctx, 'delete', category.dataClassification))) return
    await AuditContext.runRequest(ctx, 'finance_category.deleted', async (trx) => {
      category.useTransaction(trx)
      await category.delete()
    })
    session.flash('success', 'Finance category deleted.')
    return response.redirect().back()
  }
}
