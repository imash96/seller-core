import db from '@adonisjs/lucid/services/db'
import type { HttpContext } from '@adonisjs/core/http'
import Customer from '#models/customer'
import { AuditContext } from '#services/audit_context'
import CustomerAddress from '#models/customer_address'
import { CleanAdd } from '../services/address_cleanup_service.js'
import { money } from '../types/price.js'

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
      const docxBuffer = CleanAdd.toDocxBuffer(addresses)
      const docxBase64 = docxBuffer.toString('base64')
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
        return response.json({ addresses, csv, docxBase64, stats })
      }

      session.flash(
        'success',
        `Cleaned ${addresses.length} address(es) with carrier compliance checks.`
      )
      return inertia.render('tools/address-cleanup', {
        sampleRawText: rawText,
        initialResult: { addresses, csv, docxBase64, stats },
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

  async process(ctx: HttpContext) {
    return this.clean(ctx)
  }

  /**
   * Direct binary `.docx` download endpoint (`POST /api/tools/address-clean/docx`)
   */
  async downloadDocx({ auth, request, response }: HttpContext) {
    auth.getUserOrFail()
    const rawText = String(request.input('rawText', '')).trim()
    const preCleaned = request.input('addresses')

    try {
      const cleaner = new CleanAdd()
      const addresses =
        Array.isArray(preCleaned) && preCleaned.length > 0 ? preCleaned : cleaner.main(rawText)

      if (!addresses || addresses.length === 0) {
        return response.status(422).json({ error: 'No addresses provided for DOCX generation.' })
      }

      const docxBuffer = CleanAdd.toDocxBuffer(addresses)
      response.header(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      )
      response.header('Content-Disposition', 'attachment; filename="DTDC Label.docx"')
      response.header('Content-Length', String(docxBuffer.length))
      return response.send(docxBuffer)
    } catch (err: any) {
      return response
        .status(400)
        .json({ error: err.message || 'Failed to generate DTDC Label DOCX' })
    }
  }

  async exportDocx(ctx: HttpContext) {
    return this.downloadDocx(ctx)
  }

  async saveToCustomer({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const name = String(request.input('name', '')).trim()
    const line1 = String(request.input('line1') || '').trim()
    const line2 = String(request.input('line2') || '').trim()
    const line3 = String(request.input('line3') || '').trim()
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

    const savedCustomer = await db.transaction(async (trx) => {
      await AuditContext.apply(trx, {
        actorUserId: user.id,
        requestId: request.id(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent') ?? null,
        reason: 'address_cleanup.saved_to_customer',
      })

      let record = customerId
        ? await Customer.query({ client: trx })
            .where('userId', user.id)
            .andWhere('id', customerId)
            .first()
        : null

      if (!record) {
        record = new Customer()
        record.useTransaction(trx)
        record.userId = user.id
        record.fullName = name
        record.phone = phone && phone !== '000-000-0000' ? phone : null
        record.riskLevel = 'low'
        record.ordersCount = 0
        record.totalSpent = money(0, user.defaultCurrency || 'USD')
        record.riskScore = 0
        record.metadata = { source: 'address_cleanup_tool' }
        await record.save()
      }

      await CustomerAddress.create(
        {
          userId: user.id,
          customerId: record.id,
          addressType: 'shipping',
          recipientName: name,
          companyName: request.input('companyName') || null,
          line1,
          line2: line2 && line2 !== '-' ? line2 : null,
          line3: line3 && line3 !== '-' ? line3 : null,
          city,
          stateProvince: stateProvince || null,
          postalCode,
          countryCode: countryCode || 'US',
          phone: phone && phone !== '000-000-0000' ? phone : null,
          isDefault: true,
          isVerified: true,
        },
        { client: trx }
      )

      return record
    })

    session.flash(
      'success',
      `Saved cleaned address for "${savedCustomer.fullName}" to Customer Addresses.`
    )
    return response.redirect().back()
  }
}
