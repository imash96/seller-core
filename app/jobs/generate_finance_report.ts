import { Job } from '@boringnode/queue'
import logger from '@adonisjs/core/services/logger'
import { DateTime } from 'luxon'
import FinancialTransaction from '#models/financial_transaction'
import Notification from '#models/notification'
import { AuditContext } from '../services/audit_context.js'
import { FinancialTransactionType } from '../enums/index.js'
import { money } from '../types/price.js'

type Payload = {
  userId: string
  /** ISO date; defaults to the last 30 days. */
  periodStart?: string
  periodEnd?: string
  requestId?: string | null
}

export interface FinanceReportLine {
  currencyCode: string
  income: number
  expense: number
  net: number
}

export interface FinanceReport {
  userId: string
  periodStart: string
  periodEnd: string
  currencies: FinanceReportLine[]
  transactions: number
}

/**
 * Sign convention of the ledger: settlements and income are inflow, expenses and
 * refund payouts are outflow, transfers and card payments move money between the
 * user's own accounts and therefore net to zero in a P&L report.
 */
const INCOME_TYPES: string[] = [
  FinancialTransactionType.INCOME,
  FinancialTransactionType.MARKETPLACE_SETTLEMENT,
]
const EXPENSE_TYPES: string[] = [
  FinancialTransactionType.EXPENSE,
  FinancialTransactionType.REFUND_PAYOUT,
]

/**
 * Finance report generation — aggregates the ledger off the hot path.
 *
 * Amounts are grouped by the currency each entry carries (never converted), so a
 * report can honestly contain a USD block and an INR block side by side. The
 * result is persisted as an in-app notification so the operator who requested it
 * finds the summary in their feed, and returned for tests/callers.
 */
export default class GenerateFinanceReport extends Job<Payload> {
  static queue = 'reports'
  static options = {
    maxRetries: 1,
    timeout: '60s',
  }

  async execute() {
    const report = await this.generate(this.payload as Payload)
    logger.info(
      { userId: report.userId, transactions: report.transactions },
      '[job] finance report complete'
    )
  }

  async generate(payload: Payload): Promise<FinanceReport> {
    const start = payload.periodStart
      ? DateTime.fromISO(payload.periodStart)
      : DateTime.now().minus({ days: 30 })
    const end = payload.periodEnd ? DateTime.fromISO(payload.periodEnd) : DateTime.now()
    if (!start.isValid || !end.isValid || start > end) {
      throw new Error('VALIDATION_ERROR: the report period must be a valid, ordered date range.')
    }

    const transactions = await FinancialTransaction.query()
      .where('userId', payload.userId)
      .whereNot('status', 'voided')
      .whereBetween('transactionDate', [start.toSQL()!, end.toSQL()!])

    const totals = new Map<string, FinanceReportLine>()
    for (const tx of transactions) {
      const currency = tx.originalAmount.currency_code
      const line = totals.get(currency) ?? {
        currencyCode: currency,
        income: 0,
        expense: 0,
        net: 0,
      }
      const amount = Number(tx.originalAmount.amount)
      if (INCOME_TYPES.includes(tx.transactionType)) line.income += amount
      else if (EXPENSE_TYPES.includes(tx.transactionType)) line.expense += amount
      totals.set(currency, line)
    }
    const currencies = [...totals.values()]
      .map((line) => ({
        ...line,
        income: Number(money(line.income, line.currencyCode).amount),
        expense: Number(money(line.expense, line.currencyCode).amount),
        net: Number(money(line.income - line.expense, line.currencyCode).amount),
      }))
      .sort((a, b) => a.currencyCode.localeCompare(b.currencyCode))

    const report: FinanceReport = {
      userId: payload.userId,
      periodStart: start.toISODate()!,
      periodEnd: end.toISODate()!,
      currencies,
      transactions: transactions.length,
    }

    await AuditContext.run(
      {
        actorUserId: payload.userId,
        requestId: payload.requestId ?? null,
        reason: 'finance_report.generated',
      },
      async (trx) => {
        await Notification.create(
          {
            userId: payload.userId,
            type: 'finance.report_ready',
            title: `Finance report ${report.periodStart} → ${report.periodEnd}`,
            body:
              currencies.length === 0
                ? 'No ledger entries in this period.'
                : currencies
                    .map(
                      (line) =>
                        `${line.currencyCode}: +${line.income.toFixed(2)} / -${line.expense.toFixed(2)} = ${line.net.toFixed(2)}`
                    )
                    .join(' · '),
            entityType: 'financial_transactions',
            entityId: null,
            channel: 'in_app',
            recipientAddress: null,
            isRead: false,
            sentAt: DateTime.now(),
          },
          { client: trx }
        )
      }
    )

    return report
  }
}
