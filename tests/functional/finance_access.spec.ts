import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import RolePermission from '#models/role_permission'
import UserRole from '#models/user_role'
import ModuleEntitlement from '#models/module_entitlement'
import FinancialAccount from '#models/financial_account'
import FinanceCategory from '#models/finance_category'
import CreditCard from '#models/credit_card'
import FinancialTransaction from '#models/financial_transaction'
import { money } from '../../app/types/price.js'

test.group('Household finance access over HTTP', () => {
  test('filters reads, enforces classification for mutations and validates ledger links', async ({
    assert,
  }) => {
    const nonce = Date.now().toString()
    const user = await User.create({
      email: `finance-${nonce}@example.com`,
      fullName: 'Finance operator',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const role = await Role.create({
      name: `Finance ${nonce}`,
      slug: `finance-${nonce}`,
      isSystem: false,
    })
    await UserRole.create({ userId: user.id, roleId: role.id })
    const grant = async (resource: string, action: string, effect: 'allow' | 'deny' = 'allow') => {
      const slug = `${resource}.${action}`
      const permission = await Permission.updateOrCreate(
        { slug },
        { slug, name: slug, resource, action }
      )
      await RolePermission.updateOrCreate(
        { roleId: role.id, permissionId: permission.id },
        { roleId: role.id, permissionId: permission.id, effect }
      )
      await ModuleEntitlement.updateOrCreate(
        { userId: user.id, moduleKey: resource },
        { userId: user.id, moduleKey: resource, isEnabled: true, planTier: 'enterprise' }
      )
    }
    for (const resource of ['finance', 'credit_cards'])
      for (const action of ['read', 'create', 'update', 'delete']) await grant(resource, action)
    const account = await FinancialAccount.create({
      userId: user.id,
      accountName: `Secret Household ${nonce}`,
      accountType: 'bank_checking',
      dataClassification: 'household_personal',
    })
    const category = await FinanceCategory.create({
      userId: user.id,
      name: `Private Home ${nonce}`,
      slug: `private-home-${nonce}`,
      categoryType: 'expense',
      costBucket: 'personal',
      dataClassification: 'household_personal',
    })
    const card = await CreditCard.create({
      userId: user.id,
      cardLabel: `Secret Card ${nonce}`,
      brandName: 'Visa',
      cardholderName: 'Operator',
      last4Digits: '1234',
      expMonth: 1,
      expYear: 2030,
      dataClassification: 'household_personal',
    })
    const householdTx = await FinancialTransaction.create({
      userId: user.id,
      referenceNumber: `PRIVATE-${nonce}`,
      transactionType: 'expense',
      dataClassification: 'household_personal',
      description: 'Private transaction',
      originalAmount: money(10, 'USD'),
      reportingAmount: money(10, 'USD'),
      transactionDate: DateTime.fromISO('2026-01-01'),
    })
    // Existing records can have inconsistent references; nested preloads must not leak them.
    await FinancialTransaction.create({
      userId: user.id,
      referenceNumber: `LEGACY-${nonce}`,
      transactionType: 'expense',
      dataClassification: 'business',
      description: 'Legacy mismatch',
      originalAmount: money(10, 'USD'),
      reportingAmount: money(10, 'USD'),
      transactionDate: DateTime.fromISO('2026-01-01'),
      financialAccountId: account.id,
      financeCategoryId: category.id,
    })
    await FinancialTransaction.create({
      userId: user.id,
      referenceNumber: `EUR-${nonce}`,
      transactionType: 'expense',
      dataClassification: 'business',
      description: 'Euro expense',
      originalAmount: money(90, 'EUR'),
      reportingAmount: money(90, 'EUR'),
      transactionDate: DateTime.fromISO('2026-01-01'),
    })
    await FinancialTransaction.create({
      userId: user.id,
      referenceNumber: `VOID-${nonce}`,
      transactionType: 'expense',
      dataClassification: 'business',
      description: 'Voided expense',
      originalAmount: money(50, 'USD'),
      reportingAmount: money(50, 'USD'),
      status: 'voided',
      transactionDate: DateTime.fromISO('2026-01-01'),
    })
    const jar = new Map<string, string>()
    let version = ''
    const send = async (
      path: string,
      body?: Record<string, unknown>,
      inertia = false
    ): Promise<Response> => {
      const token = jar.get('XSRF-TOKEN')
      const res = await fetch(`http://localhost:3333${path}`, {
        method: body ? 'POST' : 'GET',
        redirect: 'manual',
        headers: {
          cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
          ...(inertia
            ? {
                'x-inertia': 'true',
                'x-requested-with': 'XMLHttpRequest',
                'x-inertia-version': version,
              }
            : {}),
          ...(body
            ? {
                'content-type': 'application/json',
                'x-xsrf-token': decodeURIComponent(token ?? ''),
              }
            : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      for (const cookie of res.headers.getSetCookie()) {
        const pair = cookie.split(';')[0]
        const i = pair.indexOf('=')
        jar.set(pair.slice(0, i), pair.slice(i + 1))
      }
      if (inertia && res.status === 409 && res.headers.get('x-inertia-version')) {
        version = res.headers.get('x-inertia-version')!
        return send(path, body, inertia)
      }
      return res
    }
    const status = async (path: string, body: Record<string, unknown>) => {
      const res = await send(path, body)
      return res.status
    }
    await send('/store/product-categories')
    await send('/', { email: user.email, password: 'Password123!' })
    for (const path of ['/dashboard', '/finance']) {
      const res = await send(path, undefined, true)
      assert.equal(res.status, 200)
      const props = ((await res.json()) as any).props
      if (path === '/dashboard') assert.equal(props.kpis.businessOperatingExpenses, '10.00')
      const body = JSON.stringify(props)
      for (const secret of [
        account.accountName,
        category.name,
        card.cardLabel,
        householdTx.referenceNumber,
      ])
        assert.notInclude(body, secret, `${path}: ${secret}`)
    }
    const householdWrite = {
      accountName: 'Blocked personal account',
      dataClassification: 'household_personal',
    }
    assert.equal(await status('/financial-accounts', householdWrite), 403)
    assert.equal(
      await status('/finance-categories', {
        name: 'Blocked household category',
        dataClassification: 'household_personal',
      }),
      403
    )
    assert.equal(
      await status('/credit-cards', {
        cardLabel: 'Blocked card',
        brandName: 'Visa',
        cardholderName: 'Operator',
        last4Digits: '1234',
        expMonth: 1,
        expYear: 2030,
        dataClassification: 'household_personal',
      }),
      403
    )

    assert.equal(await status(`/financial-accounts/${account.id}`, { accountName: 'Changed' }), 403)
    assert.equal(await status(`/financial-accounts/${account.id}/delete`, {}), 403)
    assert.equal(await status(`/credit-cards/${card.id}`, { cardLabel: 'Changed' }), 403)
    assert.equal(await status(`/credit-cards/${card.id}/delete`, {}), 403)
    assert.equal(await status(`/finance-categories/${category.id}`, { name: 'Changed' }), 403)
    assert.equal(await status(`/finance-categories/${category.id}/delete`, {}), 403)
    assert.equal(await status(`/financial-transactions/${householdTx.id}/void`, {}), 403)
    const evidence = {
      sourceReference: 'manual-evidence',
      observedAmount: '10.00',
      currencyCode: 'USD',
    }
    assert.equal(await status(`/financial-transactions/${householdTx.id}/reconcile`, evidence), 403)
    const businessTx = await FinancialTransaction.create({
      userId: user.id,
      referenceNumber: `MATCH-${nonce}`,
      transactionType: 'expense',
      dataClassification: 'business',
      description: 'Matchable',
      originalAmount: money(10, 'USD'),
      reportingAmount: money(10, 'USD'),
      status: 'posted',
      transactionDate: DateTime.fromISO('2026-01-01'),
    })
    assert.equal(
      await status(`/financial-transactions/${businessTx.id}/reconcile`, {
        ...evidence,
        observedAmount: '9.99',
      }),
      422
    )
    assert.equal(await status(`/financial-transactions/${businessTx.id}/reconcile`, evidence), 302)
    assert.equal(await status(`/financial-transactions/${businessTx.id}/void`, {}), 409)
    assert.equal(
      await status(`/financial-transactions/${businessTx.id}/reconciliation/reverse`, {
        reason: 'Correction',
      }),
      302
    )
    await businessTx.refresh()
    assert.equal(businessTx.status, 'posted')
    const duplicate = await send('/finance-categories', {
      name: category.name,
      dataClassification: 'business',
    })
    assert.equal(duplicate.status, 409)
    await category.refresh()
    assert.equal(category.dataClassification, 'household_personal')
    const tx = {
      referenceNumber: `TX-${nonce}`,
      transactionType: 'expense',
      description: 'Business expense',
      originalAmount: 10,
      transactionDate: '2026-01-01',
    }
    assert.equal(
      await status('/financial-transactions', { ...tx, financialAccountId: account.id }),
      400
    )
    assert.equal(
      await status('/financial-transactions', { ...tx, financeCategoryId: category.id }),
      400
    )
    await grant('household_finance', 'read')
    const unlocked = await send('/finance', undefined, true)
    assert.include(JSON.stringify(((await unlocked.json()) as any).props), account.accountName)
    assert.equal(await status('/financial-accounts', householdWrite), 403)
    await grant('household_finance', 'create')
    const created = await send('/financial-transactions', {
      ...tx,
      dataClassification: 'household_personal',
      financialAccountId: account.id,
      financeCategoryId: category.id,
      creditCardId: card.id,
    })
    assert.equal(created.status, 302)
    const saved = await FinancialTransaction.query()
      .where('referenceNumber', tx.referenceNumber)
      .firstOrFail()
    assert.equal(saved.financeCategoryId, category.id)
    assert.equal(saved.status, 'posted')
    assert.isNull(saved.reconciledAt)
    const newCard = await send('/credit-cards', {
      cardLabel: `New ${nonce}`,
      brandName: 'Visa',
      cardholderName: 'Operator',
      last4Digits: '4321',
      expMonth: 6,
      expYear: 2030,
      dataClassification: 'household_personal',
    })
    assert.equal(newCard.status, 302)
    const savedCard = await CreditCard.query()
      .where('userId', user.id)
      .where('cardLabel', `New ${nonce}`)
      .firstOrFail()
    assert.isNull(savedCard.vaultTokenReference)
    // Credit limits are self-contained PriceMoney objects with their own currency.
    assert.equal(savedCard.creditLimit.amount, 0)
    assert.equal(savedCard.creditLimit.currency_code, 'USD')
    assert.isNull(savedCard.nextPaymentDueDate)
    await grant('household_finance', 'update')
    assert.equal(await status(`/financial-transactions/${householdTx.id}/void`, {}), 302)
    await householdTx.refresh()
    assert.equal(householdTx.status, 'voided')
    await grant('household_finance', 'read', 'deny')
    assert.equal(await status('/financial-accounts', householdWrite), 403)
    const denied = await send('/finance', undefined, true)
    assert.notInclude(JSON.stringify(((await denied.json()) as any).props), account.accountName)
  })
})
