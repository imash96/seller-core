import Customer from '#models/customer'
import CustomerAddress from '#models/customer_address'
import CustomerRiskSignal from '#models/customer_risk_signal'
import Order from '#models/order'
import { AuditContext } from './audit_context.js'
import {
  DEFAULT_CURRENCY_RATES,
  amountOf,
  currencyOf,
  exchangeRateBetween,
  money,
  normalizeCurrencyCode,
  normalizePriceMoney,
  roundMoney,
} from '../types/price.js'

export class CustomerMergeError extends Error {
  constructor(
    message: string,
    readonly status: number = 422
  ) {
    super(message)
    this.name = 'CustomerMergeError'
  }
}

export interface MergeCustomersInput {
  userId: string
  sourceCustomerId: string
  targetCustomerId: string
  /** Explicit FX overrides quoted against USD, e.g. `{ INR: 84.1 }`. */
  exchangeRates?: Record<string, number>
  actorUserId?: string
  requestId?: string | null
}

export interface MergeCustomersResult {
  source: Customer
  target: Customer
  ordersMoved: number
  addressesMoved: number
  riskSignalsMoved: number
}

/**
 * Merges a duplicate customer into a surviving one with zero data loss.
 *
 * Concurrency: both customer rows are locked with `FOR UPDATE` in a deterministic
 * (id-sorted) order before anything is read, so two simultaneous merges of the same
 * pair cannot both move the same orders or double-count `orders_count`. Sorting the
 * ids is what stops a `A→B` merge racing a `B→A` merge into a deadlock.
 *
 * Money: `total_spent` is a self-contained PriceMoney. The source balance is *converted*
 * into the target's currency with an explicit FX rate — never relabelled — so an INR
 * customer merged into a USD customer cannot inflate lifetime spend by 83×.
 */
export class CustomerService {
  static async mergeCustomers(input: MergeCustomersInput): Promise<MergeCustomersResult> {
    if (!input.sourceCustomerId || !input.targetCustomerId) {
      throw new CustomerMergeError('Select two distinct customers to merge.')
    }
    if (input.sourceCustomerId === input.targetCustomerId) {
      throw new CustomerMergeError('Select two distinct customers to merge.')
    }

    const [firstId, secondId] = [input.sourceCustomerId, input.targetCustomerId].sort()

    return await AuditContext.run(
      { actorUserId: input.actorUserId ?? input.userId, requestId: input.requestId ?? null },
      async (trx) => {
        // Deterministic lock order, then read: both rows are stable for the merge.
        const locked = await Customer.query({ client: trx })
          .where('userId', input.userId)
          .whereIn('id', [firstId, secondId])
          .orderBy('id')
          .forUpdate()
        const source = locked.find((row) => row.id === input.sourceCustomerId)
        const target = locked.find((row) => row.id === input.targetCustomerId)
        if (!source || !target) {
          throw new CustomerMergeError('Merge failed — source or target customer not found.', 404)
        }
        if (source.mergedIntoCustomerId) {
          throw new CustomerMergeError(
            `Customer "${source.fullName}" was already merged into another record.`,
            409
          )
        }
        if (target.mergedIntoCustomerId) {
          throw new CustomerMergeError(
            `The target customer "${target.fullName}" was itself merged elsewhere; pick the surviving record.`,
            409
          )
        }

        const sourceId = source.id
        const targetId = target.id

        // Re-point every child record. Orders, addresses and risk signals all carry
        // `customer_id`; return requests and shipments are reached through the order.
        const movedOrders = await Order.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('customerId', sourceId)
          .update({ customerId: targetId })
        const movedAddresses = await CustomerAddress.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('customerId', sourceId)
          .update({ customerId: targetId, isDefault: false })
        const movedSignals = await CustomerRiskSignal.query({ client: trx })
          .where('userId', input.userId)
          .andWhere('customerId', sourceId)
          .update({ customerId: targetId })

        const targetCurrency = normalizeCurrencyCode(currencyOf(target.totalSpent))
        const rates = { ...DEFAULT_CURRENCY_RATES, ...(input.exchangeRates ?? {}) }
        const targetSpent = normalizePriceMoney(target.totalSpent, targetCurrency)
        const sourceSpent = normalizePriceMoney(source.totalSpent, currencyOf(source.totalSpent))
        const rate = exchangeRateBetween(sourceSpent.currency_code, targetCurrency, rates)
        if (!(rate > 0)) {
          throw new CustomerMergeError(
            `No ${sourceSpent.currency_code}->${targetCurrency} exchange rate is available to merge lifetime spend.`,
            422
          )
        }
        const convertedSourceSpent = roundMoney(amountOf(sourceSpent) * rate)

        target.useTransaction(trx)
        target.ordersCount = Number(target.ordersCount || 0) + Number(source.ordersCount || 0)
        target.totalSpent = money(
          roundMoney(amountOf(targetSpent) + convertedSourceSpent),
          targetCurrency
        )
        await target.save()

        // The duplicate keeps its own historical figures for audit; only the link and
        // the order counter change, so nothing is destroyed by a merge.
        source.useTransaction(trx)
        source.mergedIntoCustomerId = targetId
        source.ordersCount = 0
        await source.save()

        return {
          source,
          target,
          ordersMoved: Number(movedOrders ?? 0),
          addressesMoved: Number(movedAddresses ?? 0),
          riskSignalsMoved: Number(movedSignals ?? 0),
        }
      }
    )
  }
}
