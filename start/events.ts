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

// Orders — audit trail + notifications + downstream jobs
emitter.on(OrderPlaced, () => import('#listeners/write_audit_trail'))
emitter.on(OrderPlaced, () => import('#listeners/notify_slack'))
emitter.on(OrderPlaced, () => import('#listeners/queue_fulfillment'))

emitter.on(OrderStatusChanged, () => import('#listeners/write_audit_trail'))
emitter.on(OrderStatusChanged, () => import('#listeners/notify_slack'))

// Fulfillment — tracking notifications
emitter.on(ShipmentDispatched, () => import('#listeners/write_audit_trail'))
emitter.on(ShipmentDispatched, () => import('#listeners/notify_slack'))

// Risk — create review tasks
emitter.on(RiskSignalFlagged, () => import('#listeners/write_audit_trail'))
emitter.on(RiskSignalFlagged, () => import('#listeners/enqueue_risk_review'))

// Finance — reconcile + metrics
emitter.on(PaymentReconciled, () => import('#listeners/write_audit_trail'))
emitter.on(PaymentReconciled, () => import('#listeners/update_seller_metrics'))

// Identity — welcome + audit
emitter.on(UserOnboarded as any, () => import('#listeners/write_audit_trail') as any)
emitter.on(UserOnboarded as any, () => import('#listeners/notify_slack') as any)
