import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import CustomerRiskSignal from '#models/customer_risk_signal'
import Order from '#models/order'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createCustomerValidator, updateCustomerValidator } from '#validators/operations'
import { RiskReviewStatus } from '../enums/index.js'
import { money } from '../types/price.js'
import { AuditContext } from '#services/audit_context'
import { CustomerMergeError, CustomerService } from '#services/customer_service'

export default class CustomersController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [customers, riskSignals, savedViews] = await Promise.all([
      Customer.query()
        .where('userId', user.id)
        .preload('addresses', (q) => q.where('userId', user.id))
        .preload('riskSignals', (q) => q.where('userId', user.id))
        .orderBy('createdAt', 'desc')
        .limit(100),
      CustomerRiskSignal.query()
        .where('userId', user.id)
        .preload('customer', (q) => q.where('userId', user.id))
        .orderBy('createdAt', 'desc')
        .limit(50),
      WorkspaceLookupService.savedViewsFor(user.id, 'customers'),
    ])
    return inertia.render('customers', {
      customers: customers.map((c) => c.serialize()),
      riskSignals: riskSignals.map((r) => r.serialize()),
      savedViews,
    })
  }

  async storeCustomer({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(createCustomerValidator)

    const customer = await AuditContext.runRequest(
      { auth, request },
      'customer.created',
      async (trx): Promise<Customer> => {
        const created = await Customer.create(
          {
            userId: user.id,
            fullName: payload.fullName,
            email: payload.email ?? null,
            proxyEmail: payload.proxyEmail ?? null,
            phone: payload.phone ?? null,
            riskLevel: payload.riskLevel || 'low',
            ordersCount: 0,
            totalSpent: money(0, user.defaultCurrency || 'USD'),
            riskScore: 0,
            metadata: {},
          },
          { client: trx }
        )

        if (payload.line1 && payload.city && payload.postalCode) {
          await CustomerAddress.create(
            {
              userId: user.id,
              customerId: created.id,
              addressType: 'both',
              recipientName: payload.fullName,
              line1: payload.line1,
              city: payload.city,
              stateProvince: payload.stateProvince ?? null,
              postalCode: payload.postalCode,
              countryCode: payload.countryCode || 'US',
              phone: payload.phone ?? null,
              isDefault: true,
              isVerified: false,
            },
            { client: trx }
          )
        }
        return created
      }
    )

    session.flash('success', `Customer ${customer.fullName} saved.`)
    return response.redirect().back()
  }

  async updateCustomer({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const payload = await request.validateUsing(updateCustomerValidator)
      const customer = await Customer.query()
        .where('id', params.id)
        .andWhere('userId', user.id)
        .first()
      if (!customer) {
        session.flash('error', 'Customer not found. Please refresh the list.')
        return response.redirect().back()
      }
      const beforeRisk = customer.riskLevel
      await db.transaction(async (trx) => {
        await AuditContext.apply(trx, {
          actorUserId: user.id,
          requestId: request.id(),
          ipAddress: request.ip(),
          reason:
            payload.riskLevel && payload.riskLevel !== beforeRisk
              ? 'customer.risk_level_changed'
              : 'customer.updated',
        })
        customer.useTransaction(trx)
        customer.merge(payload)
        await customer.save()
      })
      session.flash('success', `Customer "${customer.fullName}" updated.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to update customer')
    }
    return response.redirect().back()
  }

  async deleteCustomer({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const customer = await Customer.query()
        .where('userId', user.id)
        .andWhere('id', params.id)
        .firstOrFail()

      const orderCount = await Order.query()
        .where('userId', user.id)
        .andWhere('customerId', customer.id)
        .count('* as total')
      if (Number(orderCount[0].$extras.total) > 0) {
        session.flash(
          'error',
          `Cannot delete customer "${customer.fullName}" because they have historical orders. Use Merge instead.`
        )
        return response.redirect().back()
      }

      await AuditContext.runRequest({ auth, request }, 'customer.deleted', async (trx) => {
        customer.useTransaction(trx)
        await customer.delete()
      })
      session.flash('success', `Customer "${customer.fullName}" removed.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to delete customer.')
    }
    return response.redirect().back()
  }

  async mergeCustomers({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      // The service owns the row locks, the FX conversion of lifetime spend and the
      // child-record re-pointing; the controller only maps the outcome to a flash.
      const result = await CustomerService.mergeCustomers({
        userId: user.id,
        actorUserId: user.id,
        requestId: request.id() ?? null,
        sourceCustomerId: String(request.input('sourceCustomerId', '')).trim(),
        targetCustomerId: String(request.input('targetCustomerId', '')).trim(),
      })
      session.flash(
        'success',
        `Merged duplicate customer "${result.source.fullName}" into "${result.target.fullName}": ` +
          `${result.ordersMoved} orders, ${result.addressesMoved} addresses and ` +
          `${result.riskSignalsMoved} risk signals moved.`
      )
    } catch (error) {
      if (!(error instanceof CustomerMergeError)) throw error
      session.flash('error', error.message)
    }
    return response.redirect().back()
  }

  async reviewRiskSignal({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    try {
      const signal = await CustomerRiskSignal.query()
        .where('userId', user.id)
        .andWhere('id', params.id)
        .firstOrFail()

      const reviewStatus = request.input('reviewStatus', RiskReviewStatus.RESOLVED)
      const reviewNotes = request.input('reviewNotes', 'Reviewed by operations team.')

      await AuditContext.runRequest(
        { auth, request },
        'customer_risk_signal.reviewed',
        async (trx) => {
          signal.useTransaction(trx)
          signal.reviewStatus = reviewStatus
          signal.reviewNotes = reviewNotes
          signal.reviewedByUserId = user.id
          signal.reviewedAt = DateTime.now()
          await signal.save()
        }
      )

      session.flash('success', `Risk signal marked as ${reviewStatus}.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to review risk signal.')
    }
    return response.redirect().back()
  }
}
