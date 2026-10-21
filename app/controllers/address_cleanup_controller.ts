import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import { CleanAdd } from '../services/address_cleanup_service.js'
import { RbacService } from '../services/rbac_service.js'

export default class AddressCleanupController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [customers, recentAddresses] = await Promise.all([
      Customer.query().where('userId', user.id).orderBy('fullName', 'asc').limit(100),
      CustomerAddress.query().where('userId', user.id).orderBy('createdAt', 'desc').limit(30),
    ])

    return inertia.render('tools/address-cleanup', {
      customers: customers.map((c) => c.serialize()),
      recentAddresses: recentAddresses.map((a) => a.serialize()),
    })
  }

  async clean({ auth, request, response, session, inertia }: HttpContext) {
    auth.getUserOrFail()
    const rawText = String(request.input('rawText', '')).trim()

    if (!rawText) {
      if (request.accepts(['html', 'json']) === 'json' || request.url().startsWith('/api/')) {
        return response.status(422).json({ error: 'Please provide raw address text to clean.' })
      }
      session.flash('error', 'Please provide raw address text to clean.')
      return response.redirect().back()
    }

    try {
      const cleaner = new CleanAdd()
      const addresses = cleaner.main(rawText)
      const csv = CleanAdd.toCsv(addresses)
      const stats = {
        total: addresses.length,
        withWarnings: addresses.filter((a) => a.warnings.length > 0).length,
        signatureRequired: addresses.filter((a) => a.isSignatureRequired).length,
        international: addresses.filter((a) => a.countryCode !== 'US').length,
      }

      if (
        request.url().startsWith('/api/') ||
        request.header('accept')?.includes('application/json')
      ) {
        return response.json({ addresses, csv, stats })
      }

      session.flash('success', `Cleaned ${addresses.length} address(es) with carrier compliance checks.`)
      return inertia.render('tools/address-cleanup', {
        sampleRawText: rawText,
        initialResult: { addresses, csv, stats },
        customers: [],
        recentAddresses: [],
      })
    } catch (err: any) {
      if (
        request.url().startsWith('/api/') ||
        request.header('accept')?.includes('application/json')
      ) {
        return response.status(400).json({ error: err.message || 'Failed to clean addresses' })
      }
      session.flash('error', err.message || 'Failed to clean addresses')
      return response.redirect().back()
    }
  }

  async saveToCustomer({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    const line1 = String(request.input('line1') || request.input('add1') || '').trim()
    const line2 = String(request.input('line2') || request.input('add2') || '').trim()
    const city = String(request.input('city', '')).trim()
    const stateProvince = String(request.input('state', '')).trim()
    const postalCode = String(request.input('zipCode') || request.input('zipcode') || '')
      .replace(/^'/, '')
      .trim()
    const countryCode = String(request.input('countryCode', 'US')).trim().slice(0, 2).toUpperCase()
    const phone = String(request.input('phone', '')).trim()
    const customerId = String(request.input('customerId', '')).trim()

    if (!name || !line1 || !city || !postalCode) {
      session.flash('error', 'Name, street line 1, city, and postal code are required.')
      return response.redirect().back()
    }

    let customer = customerId
      ? await Customer.query().where('userId', user.id).andWhere('id', customerId).first()
      : null

    if (!customer) {
      customer = await Customer.create({
        userId: user.id,
        fullName: name,
        phone: phone && phone !== '000-000-0000' ? phone : null,
        preferredCurrency: user.defaultCurrency || 'USD',
        riskLevel: 'low',
        ordersCount: 0,
        totalSpent: '0.00',
        isRepeatCustomer: false,
        riskScore: 0,
        metadata: { source: 'address_cleanup_tool' },
      })
    }

    await CustomerAddress.create({
      userId: user.id,
      customerId: customer.id,
      addressType: 'shipping',
      recipientName: name,
      companyName: request.input('companyName') || null,
      line1,
      line2: line2 && line2 !== '-' ? line2 : null,
      city,
      stateProvince: stateProvince || null,
      postalCode,
      countryCode: countryCode || 'US',
      phone: phone && phone !== '000-000-0000' ? phone : null,
      isDefault: true,
      isVerified: true,
    })

    await RbacService.recordAudit({
      actorUserId: user.id,
      userId: user.id,
      action: 'address_cleanup.saved_to_customer',
      entityType: 'customer_addresses',
      entityId: customer.id,
      requestId: request.id(),
      afterState: { name, line1, city, stateProvince, postalCode, countryCode },
    }).catch(() => { })

    session.flash('success', `Saved cleaned address for "${customer.fullName}" to Customer Addresses.`)
    return response.redirect().back()
  }
}
