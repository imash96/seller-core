/*
|--------------------------------------------------------------------------
| Event wiring — the SaaS event bus
|--------------------------------------------------------------------------
| All domain events flow through `emitter` (AdonisJS core + @adonisjs/events).
| Listeners are resolved via the IoC container lazily so they can use DI
| and avoid circular boot dependencies.
|
| To add a new domain event:
|   1. Create app/events/<name>.ts extending BaseEvent
|   2. Create app/listeners/<name>.ts with a `handle(event)` method
|   3. Register it below with emitter.on(EventClass, async () => import(...))
|
| Tests can use `emitter.fake()` to assert events without side effects.
*/

import emitter from '@adonisjs/core/services/emitter'
import OrderPlaced from '#events/order_placed'
import OrderStatusChanged from '#events/order_status_changed'
import ShipmentDispatched from '#events/shipment_dispatched'
import RiskSignalFlagged from '#events/risk_signal_flagged'
import PaymentReconciled from '#events/payment_reconciled'
import UserOnboarded from '#events/user_onboarded'

// Row-level auditing is done by the `trg_audit_capture` PostgreSQL trigger, so no
// listener writes audit rows: the bus only drives side effects (notification feed,
// downstream jobs). Every listener is idempotent and never throws into the caller.

// Orders — notification feed + fulfillment preparation
emitter.on(OrderPlaced, () => import('#listeners/create_notification'))
emitter.on(OrderPlaced, () => import('#listeners/queue_fulfillment'))

emitter.on(OrderStatusChanged, () => import('#listeners/create_notification'))

// Fulfillment — tracking notifications
emitter.on(ShipmentDispatched, () => import('#listeners/create_notification'))

// Risk — create the human review task
emitter.on(RiskSignalFlagged, () => import('#listeners/enqueue_risk_review'))

// Finance — reconciliation notification
emitter.on(PaymentReconciled, () => import('#listeners/create_notification'))

// Identity — welcome notification
emitter.on(UserOnboarded, () => import('#listeners/create_notification'))
