# Money Model & Omnichannel Orders

Reference for the two structural refactors that make Seller Core multi-currency and
marketplace-native. Schema truth lives in `database/schema.dbml`,
`database/supabase_schema.sql` (generated) and `database/migrations/`.

Regenerate the schema artifacts after any migration change:

```bash
pnpm db:schema:sync    # rewrite schema.dbml + supabase_schema.sql from the live DB
pnpm db:schema:check   # CI guard: fails when either artifact drifts
```

---

## 1. PriceMoney — every amount is self-contained

```jsonc
{ "currency_code": "USD", "amount": 12.34 }
```

- Validated in the database by `is_valid_price_money(value, allow_negative)`:
  object, `currency_code` matching `^[A-Z]{3}$`, numeric `amount`.
- There are **no standalone `currency_code` / `reporting_currency_code` columns** on
  business tables and **no EAV price tables** (`price_records` and the five `*_price`
  models were deleted; `PriceService` is gone in favour of `app/types/price.ts`).
- Signed amounts are allowed only on `net_proceeds`, `gross_profit`, `net_profit`,
  `variance_total`, `variance_amount`, `current_balance`.
- A record may mix currencies field-by-field (e.g. a USD order with INR COGS). P&L
  math only nets values sharing the primary currency and leaves foreign-currency
  values intact rather than silently converting them.

| Where                                                                                                                             | Shape                                                                                                                                                                          |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `orders`, `order_line_items`                                                                                                      | one PriceMoney column per money concept (`subtotal`, `tax_total`, `grand_total`, `cogs_total`, …)                                                                              |
| `products`, `product_variants`, `channel_listings`                                                                                | MedusaJS v2 price arrays `[{ currency_code, amount, min_quantity?, max_quantity? }]` validated by `is_valid_medusa_prices_array`; `channel_listings` also keeps `listed_price` |
| `catalog_items`                                                                                                                   | USD-only catalogue: `base_price_usd numeric(14,2)` + `price_tier` (`'01'`–`'03'`)                                                                                              |
| `financial_accounts`, `credit_cards`, `financial_transactions`, `manual_reconciliations`                                          | PriceMoney per money column                                                                                                                                                    |
| `shipments`, `shipping_invoices(+lines)`, `return_requests`, `refund_transactions`, `marketplace_claims`, `customers.total_spent` | PriceMoney per money column                                                                                                                                                    |

`app/types/price.ts` is the single money module: `money`, `normalizePriceMoney`,
`resolvePriceForCurrency`, `buildMultiCurrencyPriceArray`, `applyCurrencyOverrides`,
`addMoney/subtractMoney/multiplyMoney/sumMoney`, `roundMoney`,
`normalizeMoneyEntryArray`, `sumMoneyEntries`, plus `TaxLineEntry` / `AdjustmentEntry`.

Supported expansion currencies: USD, INR, EUR, GBP, CAD, MXN (per-currency overrides
allowed). `catalog_items` stays USD-only by design.

---

## 2. Omnichannel order compatibility

`orders` and `order_line_items` now model what Amazon SP-API, eBay Fulfillment,
Etsy Open API v3 and MedusaJS v2 actually send.

### `orders` additions

| Column                                                                                | Notes                                                                                                                             |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `external_display_id`                                                                 | Amazon `SellerOrderId`, eBay `legacyOrderId`, Etsy receipt number, Medusa `display_id`                                            |
| `fulfillment_channel`                                                                 | `MFN \| AFN \| FBA \| FBM \| 3PL \| direct` — `varchar(32)` + CHECK (no PG enum, so new channels ship without a migration)        |
| `marketplace_site_id`                                                                 | Amazon `MarketplaceId`, eBay `purchaseMarketplaceId`, Etsy `shop_id`, Medusa `region_id`                                          |
| `tax_collection_model`                                                                | `marketplace_facilitator \| seller \| none` — drives `marketplace_withheld_tax_total`                                             |
| `channel_metadata`                                                                    | JSONB channel facts (Prime, sales channel, tax collection, promotion ids) plus `platformGrandTotal` / `totalsMismatch` audit keys |
| `earliest_ship_at` / `latest_ship_at` / `earliest_delivery_at` / `latest_delivery_at` | Replaces `sla_ship_by_at` / `sla_deliver_by_at`; CHECKs enforce `latest >= earliest`                                              |

Money columns: `subtotal`, `discount_total`, `promotion_total`, `shipping_total`,
`shipping_discount_total`, `tax_total`, `shipping_tax_total`,
`marketplace_withheld_tax_total`, `grand_total` (plus the existing fee, cost and P&L
columns).

### `order_line_items` additions

`external_order_line_id`, `external_listing_id` (ASIN / eBay `legacyItemId` / Etsy
`listing_id` / Medusa `product_id`), `external_variant_id`, `tax_lines`, `adjustments`,
`custom_attributes`, per-line `fulfillment_channel`. The old `asin` column was removed —
ASIN now travels as `external_listing_id` with the original value preserved in
`custom_attributes.asin`.

- `tax_lines`: `[{ code, rate, description, total: PriceMoney }]`, validated by
  `is_valid_money_entry_array(tax_lines, 'total')`.
- `adjustments`: `[{ code, promotion_id, description, amount: PriceMoney }]`, validated
  by `is_valid_money_entry_array(adjustments, 'amount')`.
- Line `tax_total` / `promotion_total` fall back to the sums of those arrays when the
  payload omits an explicit total.

### Totals precedence

Marketplace totals are authoritative for what the buyer was paid/charged:

1. Explicit `subtotal` / `discountTotal` / `taxTotal` / `shippingTotal` /
   `grandTotal` from the platform are persisted verbatim.
2. Missing totals fall back to the line sums and
   `grand_total = subtotal − discount − promotion + shipping − shipping_discount + tax + shipping_tax`.
3. When a platform `grandTotal` disagrees with the formula, both are preserved —
   `channel_metadata.totalsMismatch` records the drift for audit instead of hiding it.

---

## 3. `OrderSyncNormalizerService`

`app/services/order_sync_normalizer_service.ts` — pure, deterministic functions that map
raw marketplace payloads onto `CreateOrderInput`:

| Function                                              | Source                                                                                                                                                                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `normalizeAmazonOrder(order, orderItemsPayload, ctx)` | SP-API `Orders` + `getOrderItems` (`FulfillmentChannel`, `Earliest/LatestShipDate`, `OrderTotal`, `ItemTax`, `ShippingPrice`, `ShippingTax`, `PromotionDiscount`, `ShippingDiscount`, `TaxCollection.Model`) |
| `normalizeEbayOrder(payload, ctx)`                    | Fulfillment API `getOrders` (`pricingSummary`, `lineItems`, `taxes`, `ebayCollectAndRemitTaxes`, `appliedPromotions`, `deliveryDiscount`)                                                                    |
| `normalizeEtsyReceipt(payload, ctx)`                  | Open API v3 `getShopReceipt` (integer amounts + `divisor`, `transactions`, `variations`, gift wrap, VAT, coupon discounts, `is_tax_collected_by_marketplace`)                                                |
| `normalizeMedusaOrder(payload, ctx)`                  | MedusaJS v2 order (`display_id`, `region_id`, `sales_channel_id`, `items[].adjustments/tax_lines`)                                                                                                           |

Also exported: `detectPayloadPlatform`, `normalizeOrderPayload`, `toCreateOrderInput`,
`toMedusaOrderPayload`, `fromCanonicalPayload`, `assertPayloadSize`,
`OrderSyncNormalizationError`.

Amazon is the one source that needs two calls: taxes, shipping and promotions live on
the order _items_, so `orderItemsPayload` is required and a missing `OrderItems` array
raises `OrderSyncNormalizationError` rather than importing an order with zero tax.

### Auto-detecting bulk import

`OrderService.importBulkOrders` accepts either canonical `orders` or raw `payloads`:

```ts
await OrderService.importBulkOrders({
  userId,
  idempotencyKey: 'amazon-sync-2026-11',
  payloads: [
    { payload: spApiOrderResponse, orderItemsPayload: spApiOrderItemsResponse },
    { payload: ebayOrderObject },
    { payload: etsyReceiptObject },
    { payload: medusaOrderObject },
  ],
})
```

Detection is structural (never a caller hint): Amazon (`payload.Orders[]`), eBay
(`orders[].orderId` / `pricingSummary`), Etsy (`receipt_id` / `transactions[]`), Medusa
(`display_id` / `region_id` / `items[].variant_id`), and canonical Seller Core JSON
(`orderNumber` + `lines[]`). Per-record failures are written to `sync_job_errors` with
`UNSUPPORTED_PLATFORM` / `INVALID_MARKETPLACE_PAYLOAD` codes and the batch continues;
the job ends `completed_with_errors`. Re-running the same `idempotencyKey` returns the
original job, and duplicate `(seller_account_id, external_order_id)` pairs are skipped.

---

## 4. UI surface

- Order cards show the marketplace channel, fulfilment channel, a
  “Tax: Marketplace” chip for facilitator-tax orders, the external display id and the
  ship-by deadline.
- The create-order modal captures `externalDisplayId`, `marketplaceSiteId`,
  `fulfillmentChannel`, `taxCollectionModel`, `latestShipAt`, `latestDeliveryAt`.
- The bulk-import modal accepts raw marketplace payloads (auto-detected) as well as
  canonical JSON; the “load sample” preset contains one raw Amazon SP-API payload plus
  one canonical order.
- CSV export includes the omnichannel identity and money breakdown columns.

---

## 5. Phase 5 — typed models, validators and seed data

The money layer described in §1 is enforced at three levels. Application code never
hand-assembles JSONB money objects, never writes a derived column, and never omits a
currency code.

### 5.1 Models — `app/models/json_helpers.ts`

| Export                                                     | Purpose                                                                                                     |
| :--------------------------------------------------------- | :---------------------------------------------------------------------------------------------------------- |
| `moneyColumn({ columnName })` / `nullableMoneyColumn(...)` | Lucid `@column` decorator with `prepare`/`consume` for a single `PriceMoney` JSONB column                   |
| `priceArrayColumn(...)`                                    | MedusaJS v2 price array (`prices` on `products`, `product_variants`, `channel_listings`)                    |
| `moneyEntryArrayColumn({ columnName, amountKey })`         | Breakdown arrays whose money property is `total` (`order_line_items.tax_lines`) or `amount` (`adjustments`) |
| `generatedColumn({ columnName, consume })`                 | Read-only STORED generated column — never emitted in `INSERT`/`UPDATE`                                      |
| `moneyKindOf(definition)`                                  | Introspection used by tests/audits to assert the column kind                                                |

`AppBaseModel` (`app/models/base_model.ts`) owns the id contract (`static idPrefix`,
`@beforeCreate generateId`) and `@beforeSave discardGeneratedColumnWrites()`, which drops
any accidental write to a generated column so PostgreSQL never rejects the statement.
Read-only columns: `product_variants.stock_available`, `customers.is_repeat_customer`,
`shipments.volumetric_weight_grams`, `shipments.billed_weight_grams`.

`catalog_items` stays USD-only: it serializes `basePrice` as `{currency_code: 'USD', amount: base_price_usd}`
and `prices` as `[basePrice]` so the UI can render it with the same components without
persisting a multi-currency array.

### 5.2 Validators — `app/validators/helpers.ts`

```ts
priceMoneySchema({ min? })     // PriceMoney object | bare number (USD implied by the caller)
medusaPricesArraySchema()      // MedusaJS v2 array | JSON string | bare number
normalizeMoneyInput(value, fallback = 'USD')
objectId()
```

Form input may arrive in the flat `{ amount, currencyCode }` shape. `canonicalMoneyObject()`
runs inside `vine.object().parse()` (Vine objects have no `.transform()`), rewriting
`currencyCode → currency_code` (and `compareAtAmount/minQuantity/maxQuantity` to their
snake_case equivalents) **before** validation, so the validator's output type stays a
single canonical `PriceMoney` and no consumer sees two shapes.

### 5.3 Seeder — `database/seeders/main_seeder.ts`

- Every price is written as an explicit object. Product/variant/listing prices are
  MedusaJS v2 arrays built with `priceArray({ USD, CAD, EUR, GBP, INR, MXN })` — no FX
  derivation, so the seed doubles as a fixture for the price-array contract.
  eBay Canada lists in `CAD` only (`listedPrice: {currency_code: 'CAD', amount: 489}`),
  while the DTC storefront carries the full multi-currency array per listing.
- Orders are omnichannel and mixed-currency: Amazon US (USD), Medusa storefront (USD),
  eBay Canada (CAD), Amazon India (INR) — with `unitCost` booked in the sourcing currency.
- Two `catalog_items` drafts are seeded through `CatalogService.saveCatalogJsonToDb` to
  exercise the USD-only catalogue (`base_price_usd` + `price_tier`).
- Re-running `node ace db:seed` is a no-op: the seeder exits early once the demo super
  admin exists, leaving row counts unchanged.

### 5.4 Verification

| Check                                   | Result                                         |
| :-------------------------------------- | :--------------------------------------------- |
| `tsc --noEmit` (+ `inertia/tsconfig`)   | 0 errors                                       |
| `eslint .`                              | 0 errors, 0 warnings                           |
| `node ace test`                         | 148 passed (148)                               |
| `node ace migration:run` → `db:seed` ×2 | seeded once, second run a no-op; counts stable |
| `pnpm db:schema:check`                  | both artifacts in sync                         |

## 6. Phase 6 — services, controllers, jobs and events

### 6.1 Money and FX in `OrderService`

- `createOrder` no longer assumes `1:1` when a marketplace omits its settlement rate:
  `input.exchangeRate ?? exchangeRateBetween(currency, reportingCurrency, rates)` derives
  the reporting rate from `DEFAULT_CURRENCY_RATES`, overridable per call through
  `exchangeRates` (`{ INR: 84.1 }`). No rate at all is a hard error, never a silent parity.
- The P&L block is expressed in the order currency. Money booked in another currency
  (INR warehouse cost on a USD order, CAD COGS on a USD order) is FX-converted by
  `toOrderCurrency()` and the applied rates are recorded on the order as
  `channelMetadata.fxConversions` for auditability. `cogsTotal` and
  `marketplaceFeesTotal` use `sumMoneyConverted()` for the same reason.
- `app/types/price.ts` gains the additive FX helpers `exchangeRateBetween`,
  `convertMoney`, `sumMoneyConverted` and `ensureCurrencyCoverage` (USD-base, explicit
  prices always win over derived ones). Source-currency columns (`grandTotal`,
  `subtotal`, `cogsTotal`) keep their own currency; only `reportingTotal` converts.

### 6.2 Inventory and cancellation

Inventory used to be reserved on order creation and never released. Now every transition
that moves physical units keeps `stock_on_hand` and the reservation in step, so the
generated `stock_available` column stays truthful:

| Transition                                          | `stock_reserved` | `stock_on_hand` |
| :-------------------------------------------------- | :--------------- | :-------------- |
| `createOrder` (reservation)                         | `+qty`           | —               |
| `createShipment` (units dispatched)                 | `-qty`           | `-qty`          |
| `updateShipmentStatuses → returned_to_sender`       | —                | `+qty`          |
| `receiveReturn` (RMA received, `restock_inventory`) | —                | `+qty` (delta)  |
| `cancelOrder` (unshipped units)                     | `-qty`           | —               |

`OrderService.cancelOrder()` is the single cancellation path used by
`OrdersController.updateOrderStatus` and `deleteOrder`: it locks the order, releases the
reservation of every still-cancellable line, stamps `quantity_cancelled`, sets
`cancelled_at` and is idempotent (a second call releases `0`). Units already shipped are
never released — they come back through an RMA.

`FulfillmentAndReturnsService.receiveReturn()` restocks only the **delta** between the
previously received and the newly received quantity, clamps to `quantity_approved`, and
skips restocking when `restock_inventory = false` (damaged goods). Returning the same
quantity twice restocks nothing.

### 6.3 Transactional outbox

`order.created` and `shipment.delivered.notify_customer` are written in the same
transaction as their aggregate change. `OutboxService.drain()` is the other half:

- **Claim** — `UPDATE … FROM (SELECT … FOR UPDATE SKIP LOCKED)` moves due `pending` /
  `failed` rows (`next_retry_at` elapsed) plus stale `processing` rows (worker died) to
  `processing`, so concurrent workers never publish the same event twice.
- **Publish** — `order.created` ensures the seller's `order.placed` feed entry exists;
  `shipment.delivered.notify_customer` writes the delivery notification and flips
  `shipments.delivery_notification_sent`. Publishers dedupe on
  (`user_id`, `type`, `entity_type`, `entity_id`), so a re-claimed row cannot fan out twice.
- **Settle** — success sets `published` + `processed_at`; failure increments `retry_count`
  and schedules `next_retry_at` with 30 s → 1 h exponential backoff; `max_retries`
  exhaustion (or an event type with no publisher) moves the row to `dead_letter` with the
  error preserved.

`app/jobs/drain_outbox.ts` is the queue entry point (queue `outbox`, one attempt per run —
the service owns retry policy).

### 6.4 Events, listeners and jobs

- `ShipmentDispatched`, `PaymentReconciled` and `UserOnboarded` are now actually
  dispatched (shipment creation, manual reconciliation commit, super-admin user
  provisioning), so none of the wired listeners is dead code.
- `CreateNotification` exposes `notificationFor()` — a pure event → feed-entry mapping
  (`order.placed`, `order.status_changed`, `shipment.dispatched`, `payment.reconciled`,
  `user.onboarded`), unit-tested without touching the database.
- `QueueFulfillment` drops events with no order/user identity instead of poisoning the
  queue; `PrepareFulfillment` creates one idempotent pick/pack task per order.
- `SendNotification` writes a fully typed `notifications` row inside an audited
  transaction (no `as any`, no non-existent columns); `webhook` is normalized to the
  constraint-allowed `in_app` channel with the callback URL as the recipient address.
- `ProcessMarketplaceImport` uses static imports and logs per-order event dispatch
  failures instead of swallowing them; `CleanupExpiredSessions` logs a failed
  `queue_jobs` prune instead of hiding it.

### 6.5 Verification

| Check                 | Result                                         |
| :-------------------- | :--------------------------------------------- |
| `tsc --noEmit`        | 0 errors                                       |
| `eslint app tests`    | 0 errors, 0 warnings                           |
| `node ace test`       | 162 passed (162)                               |
| `node ace db:seed` ×2 | seeded once, second run a no-op; counts stable |

## 7. Phase 7 — serialization contract and UI

Money columns are typed `PriceMoney` on the model, in the database and over the wire.
What the UI needed was the _currency_ next to the amount, which previously came from a
dropped `currency_code` column.

`AppBaseModel` now declares `static readonly currencyAttribute`, the money attribute that
identifies a row's currency. `serialize()` appends a derived, read-only `currencyCode`
field from that money object:

| Model                  | `currencyAttribute`                      |
| :--------------------- | :--------------------------------------- |
| `Order`                | `grandTotal` (existing bespoke override) |
| `OrderLineItem`        | `unitPrice` (existing)                   |
| `FinancialAccount`     | `currentBalance`                         |
| `FinancialTransaction` | `originalAmount`                         |
| `CreditCard`           | `creditLimit`                            |
| `Customer`             | `totalSpent`                             |
| `ManualReconciliation` | `observedAmount`                         |
| `MarketplaceClaim`     | `disputedAmount`                         |
| `RefundTransaction`    | `grandRefundTotal`                       |
| `ReturnRequest`        | `refundTotal`                            |
| `Shipment`             | `estimatedShippingCost`                  |
| `ShippingInvoice`      | `totalAmount`                            |
| `ShippingInvoiceLine`  | `billedAmount`                           |

Consequences:

- A CAD account renders `1,240.50 CAD`, an EUR customer balance renders `320.25 EUR` —
  never the user's default currency, and no `currency_code` column is reintroduced.
- `ProductVariant.serialize()`/`ChannelListing.serialize()` expose the full MedusaJS v2
  array as both `prices` and the `price` alias, and `ProductVariant` adds
  `inventoryValue` (`costPrice × stockOnHand`) as `PriceMoney`.
- The UI reads currency arrays through `MultiCurrencyPriceStack` (display) and
  `MultiCurrencyPriceInput` (form) and amounts through `col.money(field, label, currency)`,
  so no page multiplies or formats a bare number.

Verified by `tests/unit/serialization.spec.ts` (4 cases: non-USD account, EUR customer,
variant price array + inventory value, shipment cost currency).
