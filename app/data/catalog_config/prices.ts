import type { PriceTierCode } from '../../types/catalog_pipeline.js'
import { type PriceMoney, buildMultiCurrencyPriceArray } from '../../types/price.js'

export const LIST_PRICES: Record<PriceTierCode, number[]> = {
  '01': [229.99, 229.99, 229.99, 239.99, 239.99, 239.99, 239.99, 259.99, 269.99, 289.99, 259.99],
  '02': [269.99, 269.99, 269.99, 289.99, 289.99, 289.99, 289.99, 309.99, 329.99, 339.99, 309.99],
  '03': [239.99, 239.99, 239.99, 259.99, 259.99, 259.99, 259.99, 269.99, 289.99, 309.99, 269.99],
}

export function resolveTierPrice(priceTier: PriceTierCode = '01', sizeIndex: number = 3): number {
  const tierArr = LIST_PRICES[priceTier] ?? LIST_PRICES['01']
  const clampedIdx = Math.max(0, Math.min(sizeIndex, tierArr.length - 1))
  return tierArr[clampedIdx] ?? 239.99
}

/**
 * Resolves a full multi-currency price array (`USD`, `INR`, `EUR`, `GBP`, `CAD`, `MXN`)
 * for a given price tier (`01`, `02`, `03`) and size index.
 */
export function resolveTierMultiCurrencyPrices(
  priceTier: PriceTierCode = '01',
  sizeIndex: number = 3
): PriceMoney[] {
  const baseUsd = resolveTierPrice(priceTier, sizeIndex)
  return buildMultiCurrencyPriceArray(baseUsd)
}
