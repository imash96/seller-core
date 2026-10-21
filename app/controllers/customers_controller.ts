import { DateTime } from 'luxon'
import type { HttpContext } from '@adonisjs/core/http'
import db from '@adonisjs/lucid/services/db'
import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import CustomerRiskSignal from '#models/customer_risk_signal'
import Order from '#models/order'
import ReturnRequest from '#models/return_request'
import { RbacService } from '../services/rbac_service.js'
import { WorkspaceLookupService } from '../services/workspace_lookup_service.js'
import { createCustomerValidator, updateCustomerValidator } from '#validators/operations'
import { RiskReviewStatus } from '../enums/index.js'

export default class CustomersController {
  async index({ auth, inertia }: HttpContext) {
    const user = auth.getUserOrFail()
    const [customers, riskSignals, savedViews] = await Promise.all([
      Customer.query()
        .where('userId', user.id)
        .preload('addresses')
        .preload('riskSignals')
        .orderBy('createdAt', 'desc')
        .limit(100),
      CustomerRiskSignal.query()
        .where('userId', user.id)
        .preload('customer')
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
      preferredCurrency: payload.preferredCurrency || 'USD',
      riskLevel: payload.riskLevel || 'low',
      ordersCount: 0,
      totalSpent: '0.00',
      isRepeatCustomer: false,
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
        isVerified: true,
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
      customer.merge(payload)
      await customer.save()
      if (payload.riskLevel && payload.riskLevel !== beforeRisk) {
        await RbacService.recordAudit({
          actorUserId: user.id,
          userId: user.id,
          action: 'customer.risk_level_changed',
          entityType: 'customers',
          entityId: customer.id,
          requestId: request.id(),
          beforeState: { riskLevel: beforeRisk },
          afterState: { riskLevel: payload.riskLevel },
        }).catch(() => {})
      }
      session.flash('success', `Customer "${customer.fullName}" updated.`)
    } catch (err: any) {
      session.flash('error', err.message || 'Failed to update customer')
    }
    return response.redirect().back()
  }

  async deleteCustomer({ auth, params, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
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

      target.useTransaction(trx)
      target.ordersCount = Number(target.ordersCount || 0) + Number(source.ordersCount || 0)
      target.totalSpent = (Number(target.totalSpent || 0) + Number(source.totalSpent || 0)).toFixed(
        2
      )
      target.isRepeatCustomer = target.ordersCount > 1
      await target.save()

      source.useTransaction(trx)
      source.mergedIntoCustomerId = target.id
      source.ordersCount = 0
      await source.save()
    })

    await RbacService.recordAudit({
      actorUserId: user.id,
      userId: user.id,
      action: 'customer.merged',
      entityType: 'customers',
      entityId: target.id,
      requestId: request.id(),
      beforeState: { sourceCustomerId: source.id, sourceName: source.fullName },
      afterState: { targetCustomerId: target.id, targetName: target.fullName },
    })

    session.flash(
      'success',
      `Merged duplicate customer "${source.fullName}" into "${target.fullName}" with zero data loss.`
    )
    return response.redirect().back()
  }

  async reviewRiskSignal({ auth, params, request, response, session }: HttpContext) {
    const user = auth.getUserOrFail()
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
    return response.redirect().back()
  }
}
