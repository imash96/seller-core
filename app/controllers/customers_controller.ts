import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import CustomerRiskSignal from '#models/customer_risk_signal'
import Order from '#models/order'
import ReturnRequest from '#models/return_request'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createCustomerValidator, updateCustomerValidator } from '#validators/operations'
import { RiskReviewStatus } from '../enums/index.js'
import { amountOf, money, normalizePriceMoney } from '../types/price.js'
import { AuditContext } from '#services/audit_context'

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

    const customer = await Customer.create({
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
    })

    if (payload.line1 && payload.city && payload.postalCode) {
      await customer.related('addresses').create({
        userId: user.id,
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
      })
    }

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

  async deleteCustomer({ auth, params, response, session }: HttpContext) {
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

      await customer.delete()
      session.flash('success', `Customer "${customer.fullName}" removed.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to delete customer.')
    }
    return response.redirect().back()
  }

  async mergeCustomers({ auth, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
    const sourceCustomerId = String(request.input('sourceCustomerId', '')).trim()
    const targetCustomerId = String(request.input('targetCustomerId', '')).trim()

    if (!sourceCustomerId || !targetCustomerId || sourceCustomerId === targetCustomerId) {
      session.flash('error', 'Select two distinct customers to merge.')
      return response.redirect().back()
    }

    const [source, target] = await Promise.all([
      Customer.query().where('userId', user.id).andWhere('id', sourceCustomerId).first(),
      Customer.query().where('userId', user.id).andWhere('id', targetCustomerId).first(),
    ])
    if (!source || !target) {
      session.flash('error', 'Merge failed — source or target customer not found.')
      return response.redirect().back()
    }

    await db.transaction(async (trx) => {
      await Order.query({ client: trx })
        .where('userId', user.id)
        .andWhere('customerId', source.id)
        .update({ customerId: target.id })

      await CustomerAddress.query({ client: trx })
        .where('userId', user.id)
        .andWhere('customerId', source.id)
        .update({ customerId: target.id, isDefault: false })

      await CustomerRiskSignal.query({ client: trx })
        .where('userId', user.id)
        .andWhere('customerId', source.id)
        .update({ customerId: target.id })

      await ReturnRequest.query({ client: trx })
        .where('userId', user.id)
        .andWhere('customerId', source.id)
        .update({ customerId: target.id })

      await AuditContext.apply(trx, {
        actorUserId: user.id,
        requestId: request.id(),
        ipAddress: request.ip(),
        reason: 'customer.merged',
      })
      target.useTransaction(trx)
      target.ordersCount = Number(target.ordersCount || 0) + Number(source.ordersCount || 0)
      // Lifetime spend is a self-contained PriceMoney; merge into the target's currency.
      const targetCurrency = target.totalSpent?.currency_code || user.defaultCurrency || 'USD'
      target.totalSpent = money(
        amountOf(normalizePriceMoney(target.totalSpent, targetCurrency)) +
          amountOf(normalizePriceMoney(source.totalSpent, targetCurrency)),
        targetCurrency
      )
      await target.save()

      source.useTransaction(trx)
      source.mergedIntoCustomerId = target.id
      source.ordersCount = 0
      await source.save()
    })

    session.flash(
      'success',
      `Merged duplicate customer "${source.fullName}" into "${target.fullName}" with zero data loss.`
    )
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

      signal.reviewStatus = reviewStatus
      signal.reviewNotes = reviewNotes
      signal.reviewedByUserId = user.id
      signal.reviewedAt = DateTime.now()
      await signal.save()

      session.flash('success', `Risk signal marked as ${reviewStatus}.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to review risk signal.')
    }
    return response.redirect().back()
  }
}
