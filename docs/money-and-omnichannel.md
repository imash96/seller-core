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
