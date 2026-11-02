import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import Order from '#models/order'
import ProductVariant from '#models/product_variant'
import TasksReminder from '#models/tasks_reminder'
import { AuditContext } from '../services/audit_context.js'
import { TaskPriority, TaskStatus, TaskType } from '../enums/index.js'
import { currencyOf, sumMoney } from '../types/price.js'

type Payload = {
  orderId: string
  userId: string
  requestId?: string | null
}

export interface FulfillmentPreparationResult {
  orderId: string
  status: 'skipped' | 'prepared'
  reason?: string
  taskCreated: boolean
  parcelWeightGrams: number
  suggestedCarrier: string | null
}

/**
 * Fulfillment preparation — the pick/pack work an order needs before a shipment
 * can be created.
 *
 * It does *not* create a shipment (quantities, packaging and carrier are human
 * decisions); it prepares the information the packer needs and puts it in front of
 * them as a task:
 *
 *  - resolves the sellable units of every unfulfilled line,
 *  - rolls up the estimated parcel weight from variant weights,
 *  - suggests a carrier from the channel (Amazon → AFN/DSP, marketplace → the
 *    account's default carrier, DTC → UPS Ground),
 *  - creates exactly one `confirm_shipment` task per order, due at the promised
 *    ship-by date (`latest_ship_at`, else +2 days).
 *
 * Idempotent by construction: the task is keyed on
 * (`related_entity_type` = `orders`, `related_entity_id` = order id, pending).
 */
export default class PrepareFulfillment extends Job<Payload> {
  static queue = 'fulfillment'
  static options = {
    maxRetries: 3,
    timeout: '60s',
  }

  async execute() {
    const { orderId, userId, requestId } = this.payload as Payload
    const result = await this.prepare({ orderId, userId, requestId })
    logger.info(result, '[job] fulfillment preparation finished')
  }

  async prepare(input: Payload): Promise<FulfillmentPreparationResult> {
    const order = await Order.query()
      .where('userId', input.userId)
      .andWhere('id', input.orderId)
      .preload('lineItems')
      .preload('sellerAccount', (query) => query.preload('salesChannel'))
      .first()
    if (!order) {
      throw new Error(`ORDER_NOT_FOUND: ${input.orderId} is not owned by this user.`)
    }

    const skip = (reason: string): FulfillmentPreparationResult => ({
      orderId: order.id,
      status: 'skipped',
      reason,
      taskCreated: false,
      parcelWeightGrams: 0,
      suggestedCarrier: null,
    })
    if (order.paymentStatus !== 'paid') return skip('order is not paid')
    if (['cancelled', 'returned'].includes(order.status)) return skip(`order is ${order.status}`)

    // Outstanding units come from the line items themselves (`quantity_fulfilled`
    // vs `quantity_ordered`), which is also what partial shipments update.
    const openLines = order.lineItems.filter(
      (line) => Number(line.quantityFulfilled ?? 0) < Number(line.quantityOrdered ?? 0)
    )
    if (openLines.length === 0) return skip('every line is already fulfilled')

    const variantIds = openLines
      .map((line) => line.productVariantId)
      .filter((id): id is string => Boolean(id))
    const weightByVariant = new Map<string, number>()
    if (variantIds.length > 0) {
      const variants = await ProductVariant.query().whereIn('id', variantIds)
      for (const variant of variants) {
        weightByVariant.set(variant.id, Number(variant.weightGrams ?? 0))
      }
    }
    const parcelWeightGrams = openLines.reduce((total, line) => {
      const outstanding = Number(line.quantityOrdered ?? 0) - Number(line.quantityFulfilled ?? 0)
      const unitWeight = line.productVariantId
        ? (weightByVariant.get(line.productVariantId) ?? 0)
        : 0
      // 0-weight variants fall back to a 250 g packed-unit estimate.
      return total + outstanding * (unitWeight > 0 ? unitWeight : 250)
    }, 0)
    const suggestedCarrier = this.suggestCarrier(order)

    const taskCreated = await AuditContext.run(
      {
        actorUserId: input.userId,
        requestId: input.requestId ?? null,
        reason: 'order.fulfillment_prepared',
      },
      async (trx) => {
        const existing = await TasksReminder.query({ client: trx })
          .where('userId', input.userId)
          .where('relatedEntityType', 'orders')
          .where('relatedEntityId', order.id)
          .where('taskType', TaskType.CONFIRM_SHIPMENT)
          .where('status', TaskStatus.PENDING)
          .first()
        if (existing) return false

        const units = openLines
          .map(
            (line) =>
              `${Number(line.quantityOrdered ?? 0) - Number(line.quantityFulfilled ?? 0)}x ${line.sku}`
          )
          .join(', ')
        const orderCurrency = currencyOf(sumMoney([order.grandTotal]))
        await TasksReminder.create(
          {
            userId: input.userId,
            relatedEntityType: 'orders',
            relatedEntityId: order.id,
            taskType: TaskType.CONFIRM_SHIPMENT,
            priority: order.latestShipAt
              ? order.latestShipAt.diff(DateTime.now(), 'days').days <= 1
                ? TaskPriority.URGENT
                : TaskPriority.HIGH
              : TaskPriority.MEDIUM,
            status: TaskStatus.PENDING,
            title: `Pack & dispatch ${order.orderNumber}`,
            description:
              `Units: ${units || 'n/a'}. Estimated parcel weight ${parcelWeightGrams} g. ` +
              `Suggested carrier: ${suggestedCarrier ?? 'manual selection'}. ` +
              `Order total ${order.grandTotal.amount.toFixed(2)} ${orderCurrency}.`,
            dueAt: order.latestShipAt ?? DateTime.now().plus({ days: 2 }),
          },
          { client: trx }
        )
        return true
      }
    )

    return {
      orderId: order.id,
      status: 'prepared',
      taskCreated,
      parcelWeightGrams,
      suggestedCarrier,
    }
  }

  /** Carrier suggestion derived from the sales channel, never from a random guess. */
  private suggestCarrier(order: Order): string | null {
    const channel = (order.sellerAccount?.salesChannel?.code ?? '').toLowerCase()
    if (order.fulfillmentChannel === 'AFN' || channel === 'amazon') return 'amazon_mfn'
    if (channel === 'ebay' || channel === 'etsy') return 'usps'
    if (channel === 'website') return 'ups'
    return null
  }
}
