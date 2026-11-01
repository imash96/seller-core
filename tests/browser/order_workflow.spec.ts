import { test } from '@japa/runner'
import User from '#models/user'
import Order from '#models/order'

test.group('Order entry in a browser', () => {
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1440, height: 900 },
  ]) {
    test(`sign in and create an order at ${viewport.width}px`, async ({
      browserContext,
      assert,
    }) => {
      const nonce = `${viewport.width}-${Date.now()}`
      const user = await User.create({
        email: `browser-${nonce}@example.com`,
        fullName: 'Browser operator',
        password: 'Password123!',
        status: 'active',
        isSuperAdmin: true,
        defaultCurrency: 'USD',
        timezone: 'UTC',
      })
      const page = await browserContext.newPage()
      await page.setViewportSize(viewport)
      await page.goto('http://localhost:3333/')
      await page.locator('#field-email').fill(user.email)
      await page.locator('#field-password').fill('Password123!')
      await page.getByRole('button', { name: 'Sign in to Workspace' }).click()
      await page.waitForURL('**/dashboard')
      await page.goto('http://localhost:3333/orders')
      await page.getByRole('button', { name: '+ Create Order' }).first().click()
      const modal = page.getByRole('dialog')
      await modal.locator('#field-orderNumber').fill(`BROWSER-${nonce}`)
      await modal.locator('#field-customerFullName').fill('Browser Buyer')
      await modal.locator('#field-sku').fill(`SKU-${nonce}`)
      await modal.locator('#field-itemTitle').fill('Browser Item')
      await modal.locator('#field-unitPrice').fill('42')
      await modal.getByRole('button', { name: 'Create Order', exact: true }).click()
      await page
        .getByText(`#BROWSER-${nonce}`, { exact: true })
        .first()
        .waitFor({ state: 'visible', timeout: 15000 })
      const order = await Order.query()
        .where('userId', user.id)
        .where('orderNumber', `BROWSER-${nonce}`)
        .firstOrFail()
      assert.equal(Number(order.totalAmount), 42)
    })
  }
})
