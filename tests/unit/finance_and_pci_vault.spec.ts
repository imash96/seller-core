import { test } from '@japa/runner'
import {
  DataClassification,
  FinanceCategoryType,
  FinanceCostBucket,
} from '../../app/enums/index.js'

test.group('Finance & PCI Vault Security Engine', () => {
  function roundMoney(value: number): number {
    return Math.round((value + Number.EPSILON) * 100) / 100
  }

  test('multi-currency journal ledger computes reportingAmount without floating point drift', ({
    assert,
  }) => {
    function computeReportingAmount(originalAmount: number, exchangeRate: number): number {
      if (originalAmount < 0) {
        throw new Error('INVALID_AMOUNT: Transaction amount cannot be negative.')
      }
      if (exchangeRate <= 0) {
        throw new Error('INVALID_EXCHANGE_RATE: Exchange rate must be strictly positive.')
      }
      return roundMoney(originalAmount * exchangeRate)
    }

    // Standard conversion: 100 EUR at 1.085 USD/EUR = 108.50 USD
    assert.equal(computeReportingAmount(100.0, 1.085), 108.5)

    // JPY to USD: 15450 JPY at 0.0065 = 100.425 -> 100.43 USD
    assert.equal(computeReportingAmount(15450, 0.0065), 100.43)

    // Reject negative amount or zero exchange rate
    assert.throws(
      () => computeReportingAmount(-50, 1.0),
      /INVALID_AMOUNT: Transaction amount cannot be negative/
    )
    assert.throws(
      () => computeReportingAmount(100, 0),
      /INVALID_EXCHANGE_RATE: Exchange rate must be strictly positive/
    )
  })

  test('cost buckets classify income and expenses accurately according to GAAP taxonomy', ({
    assert,
  }) => {
    const validBuckets = Object.values(FinanceCostBucket)
    assert.includeMembers(validBuckets, [
      'cogs',
      'shipping',
      'marketplace_fee',
      'marketing',
      'software',
      'operations',
      'manufacturing',
      'tax',
      'personal',
      'other_income',
      'sales_revenue',
    ])

    function classifyCostBucket(bucket: string): {
      type: string
      deductibleBusinessExpense: boolean
    } {
      switch (bucket) {
        case FinanceCostBucket.SALES_REVENUE:
        case FinanceCostBucket.OTHER_INCOME:
          return { type: FinanceCategoryType.INCOME, deductibleBusinessExpense: false }
        case FinanceCostBucket.PERSONAL:
          return { type: FinanceCategoryType.EXPENSE, deductibleBusinessExpense: false }
        case FinanceCostBucket.COGS:
        case FinanceCostBucket.SHIPPING:
        case FinanceCostBucket.MARKETPLACE_FEE:
        case FinanceCostBucket.MARKETING:
        case FinanceCostBucket.SOFTWARE:
        case FinanceCostBucket.OPERATIONS:
        case FinanceCostBucket.MANUFACTURING:
        case FinanceCostBucket.TAX:
          return { type: FinanceCategoryType.EXPENSE, deductibleBusinessExpense: true }
        default:
          throw new Error(`UNKNOWN_BUCKET: ${bucket} is not recognized`)
      }
    }

    assert.deepEqual(classifyCostBucket(FinanceCostBucket.SALES_REVENUE), {
      type: 'income',
      deductibleBusinessExpense: false,
    })

    assert.deepEqual(classifyCostBucket(FinanceCostBucket.COGS), {
      type: 'expense',
      deductibleBusinessExpense: true,
    })

    assert.deepEqual(classifyCostBucket(FinanceCostBucket.SHIPPING), {
      type: 'expense',
      deductibleBusinessExpense: true,
    })

    assert.deepEqual(classifyCostBucket(FinanceCostBucket.PERSONAL), {
      type: 'expense',
      deductibleBusinessExpense: false,
    })
  })

  test('data classification enforces strict boundary between business and household finances', ({
    assert,
  }) => {
    function filterBusinessExpenses(
      transactions: Array<{
        id: string
        amount: number
        classification: string
        bucket: string
      }>
    ) {
      return transactions.filter(
        (t) =>
          t.classification === DataClassification.BUSINESS &&
          t.bucket !== FinanceCostBucket.PERSONAL
      )
    }

    const txs = [
      { id: 'tx_01', amount: 500, classification: DataClassification.BUSINESS, bucket: 'cogs' },
      { id: 'tx_02', amount: 120, classification: DataClassification.BUSINESS, bucket: 'shipping' },
      {
        id: 'tx_03',
        amount: 85,
        classification: DataClassification.HOUSEHOLD_PERSONAL,
        bucket: 'personal',
      },
      {
        id: 'tx_04',
        amount: 45,
        classification: DataClassification.HOUSEHOLD_PERSONAL,
        bucket: 'software',
      },
    ]

    const businessTx = filterBusinessExpenses(txs)
    assert.equal(businessTx.length, 2)
    assert.equal(businessTx[0].id, 'tx_01')
    assert.equal(businessTx[1].id, 'tx_02')
  })

  test('PCI vaulting enforces strict tokenization, rejecting raw PAN and CVV storage', ({
    assert,
  }) => {
    function validatePciVaultPayload(card: {
      cardholderName: string
      last4Digits: string
      expMonth: number
      expYear: number
      vaultTokenReference: string
      pan?: string
      cvv?: string
    }) {
      // Rule 1: Raw Primary Account Number (PAN) is strictly forbidden
      if ('pan' in card && card.pan) {
        throw new Error('PCI_SECURITY_VIOLATION: Full PAN cannot be stored in database.')
      }

      // Rule 2: CVV is strictly forbidden
      if ('cvv' in card && card.cvv) {
        throw new Error('PCI_SECURITY_VIOLATION: Card CVV/CVC cannot be stored in database.')
      }

      // Rule 3: last4Digits must be exactly 4 digits
      if (!/^\d{4}$/.test(card.last4Digits)) {
        throw new Error('INVALID_LAST4: last4Digits must be exactly 4 numeric characters.')
      }

      // Rule 4: Expiration Month must be between 1 and 12
      if (card.expMonth < 1 || card.expMonth > 12) {
        throw new Error('INVALID_EXP_MONTH: expMonth must be between 1 and 12.')
      }

      // Rule 5: Expiration Year must be between 2025 and 2045
      if (card.expYear < 2025 || card.expYear > 2045) {
        throw new Error('INVALID_EXP_YEAR: expYear must be between 2025 and 2045.')
      }

      // Rule 6: Vault token reference must be a valid token reference
      if (!card.vaultTokenReference || !card.vaultTokenReference.startsWith('tok_')) {
        throw new Error('INVALID_VAULT_TOKEN: vaultTokenReference must start with "tok_".')
      }

      return true
    }

    // Violation: Attempting to store raw 16-digit PAN
    assert.throws(
      () =>
        validatePciVaultPayload({
          cardholderName: 'Jane Doe',
          last4Digits: '4242',
          expMonth: 10,
          expYear: 2028,
          vaultTokenReference: 'tok_01K5ZQ7T9V0M8ZK5',
          pan: '4242424242424242',
        }),
      /PCI_SECURITY_VIOLATION: Full PAN cannot be stored in database/
    )

    // Violation: Attempting to store CVV
    assert.throws(
      () =>
        validatePciVaultPayload({
          cardholderName: 'Jane Doe',
          last4Digits: '4242',
          expMonth: 10,
          expYear: 2028,
          vaultTokenReference: 'tok_01K5ZQ7T9V0M8ZK5',
          cvv: '123',
        }),
      /PCI_SECURITY_VIOLATION: Card CVV\/CVC cannot be stored in database/
    )

    // Violation: Invalid last4
    assert.throws(
      () =>
        validatePciVaultPayload({
          cardholderName: 'Jane Doe',
          last4Digits: '42A4',
          expMonth: 10,
          expYear: 2028,
          vaultTokenReference: 'tok_01K5ZQ7T9V0M8ZK5',
        }),
      /INVALID_LAST4: last4Digits must be exactly 4 numeric characters/
    )

    // Valid tokenized credit card record
    const valid = validatePciVaultPayload({
      cardholderName: 'Jane Doe',
      last4Digits: '4242',
      expMonth: 10,
      expYear: 2028,
      vaultTokenReference: 'tok_01K5ZQ7T9V0M8ZK5N7YQ2W4X6B',
    })
    assert.isTrue(valid)
  })

  test('card brand detection accurately identifies major credit card networks from BIN prefix', ({
    assert,
  }) => {
    function detectCardBrand(prefixOrPan: string): string {
      const clean = prefixOrPan.replace(/\D/g, '')
      if (/^4/.test(clean)) return 'Visa'
      if (/^(5[1-5]|2[2-7])/.test(clean)) return 'Mastercard'
      if (/^3[47]/.test(clean)) return 'American Express'
      if (/^(6011|65|64[4-9])/.test(clean)) return 'Discover'
      return 'Unknown'
    }

    // Visa
    assert.equal(detectCardBrand('4242'), 'Visa')
    assert.equal(detectCardBrand('4000 1234'), 'Visa')

    // Mastercard (traditional 51-55 or 2-series 2221-2720)
    assert.equal(detectCardBrand('5100'), 'Mastercard')
    assert.equal(detectCardBrand('5523'), 'Mastercard')
    assert.equal(detectCardBrand('2221'), 'Mastercard')

    // American Express (34 or 37)
    assert.equal(detectCardBrand('3782'), 'American Express')
    assert.equal(detectCardBrand('3400'), 'American Express')

    // Discover (6011, 65, 644-649)
    assert.equal(detectCardBrand('6011'), 'Discover')
    assert.equal(detectCardBrand('6543'), 'Discover')

    // Unknown
    assert.equal(detectCardBrand('9999'), 'Unknown')
  })
})
