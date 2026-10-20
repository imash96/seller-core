/**
 * Base class for domain events. All events extend BaseEvent so dispatching is
 * type-safe, traceable, and automatically wired to the Adonis emitter.
 *
 * Usage:
 *   import OrderPlaced from '#events/order_placed'
 *   await OrderPlaced.dispatch({ orderId, userId })
 */
export { BaseEvent } from '@adonisjs/core/events'
export { BaseEvent as default } from '@adonisjs/core/events'
