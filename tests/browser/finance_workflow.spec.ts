import { test } from '@japa/runner'
import User from '#models/user'
import FinanceCategory from '#models/finance_category'
import FinancialTransaction from '#models/financial_transaction'

test.group('Finance entry in a browser', () => {
  test('create a category and record a classified ledger entry on mobile', async ({
    browserContext,
    assert,
  }) => {
    const nonce = Date.now().toString()
    const user = await User.create({
      email: `finance-browser-${nonce}@example.com`,
      fullName: 'Browser operator',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: true,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const page = await browserContext.newPage()
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('http://localhost:3333/')
    await page.locator('#field-email').fill(user.email)
    await page.locator('#field-password').fill('Password123!')
    await page.getByRole('button', { name: 'Sign in to Workspace' }).click()
    await page.waitForURL('**/dashboard')
    await page.goto('http://localhost:3333/finance')
    await page.getByRole('button', { name: 'Category', exact: true }).click()
    let modal = page.getByRole('dialog')
    await modal.locator('#field-name').fill(`Office ${nonce}`)
    await modal.getByRole('button', { name: 'Save Category' }).click()
    await page
      .getByText(`Office ${nonce}`, { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
    const category = await FinanceCategory.query()
      .where('userId', user.id)
      .where('name', `Office ${nonce}`)
      .firstOrFail()
    await page.getByRole('button', { name: 'Record Transaction', exact: true }).first().click()
    modal = page.getByRole('dialog')
    await modal.locator('#field-referenceNumber').fill(`TX-${nonce}`)
    await modal.locator('#field-transactionType').selectOption('expense')
    await modal.locator('#field-originalAmount').fill('42')
    await modal.locator('#field-transactionDate').fill('2026-01-02')
    await modal.locator('#field-financeCategoryId').selectOption(category.id)
    await modal.locator('#field-dataClassification').selectOption('household_personal')
    assert.equal(await modal.locator('#field-financeCategoryId').inputValue(), '')
    assert.equal(
      await modal
        .locator('#field-financeCategoryId')
        .locator(`option[value="${category.id}"]`)
        .count(),
      0
    )
    await modal.locator('#field-dataClassification').selectOption('business')
    await modal.locator('#field-financeCategoryId').selectOption(category.id)
    await modal.locator('#field-description').fill('Office supplies')
    await modal.getByRole('button', { name: 'Record Transaction', exact: true }).click()
    await page
      .getByText(`TX-${nonce}`, { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 15000 })
    const transaction = await FinancialTransaction.query()
      .where('userId', user.id)
      .where('referenceNumber', `TX-${nonce}`)
      .firstOrFail()
    assert.equal(transaction.financeCategoryId, category.id)
    assert.equal(transaction.status, 'posted')
    await page.getByRole('button', { name: 'Match', exact: true }).click()
    modal = page.getByRole('dialog')
    assert.equal(await modal.locator('#field-observedAmount').inputValue(), '42.00')
    await modal.locator('#field-sourceReference').fill(`statement-${nonce}`)
    await modal.getByRole('button', { name: 'Record manual match' }).click()
    await page
      .getByRole('button', { name: 'Reverse match' })
      .waitFor({ state: 'visible', timeout: 15000 })
    await transaction.refresh()
    assert.equal(transaction.status, 'reconciled')
    await page.getByRole('button', { name: 'Reverse match' }).click()
    modal = page.getByRole('dialog')
    await modal.locator('#field-reason').fill('Correcting the entry')
    await modal.getByRole('button', { name: 'Reverse match', exact: true }).click()
    await page
      .getByRole('button', { name: 'Match', exact: true })
      .waitFor({ state: 'visible', timeout: 15000 })
    await transaction.refresh()
    assert.equal(transaction.status, 'posted')
  })
})
