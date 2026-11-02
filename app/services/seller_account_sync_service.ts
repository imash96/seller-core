import { DateTime } from 'luxon'
import SellerAccount from '#models/seller_account'
import TasksReminder from '#models/tasks_reminder'
import { AuditContext } from './audit_context.js'
import {
  HealthStatus,
  SellerAccountStatus,
  TaskPriority,
  TaskStatus,
  TaskType,
} from '../enums/index.js'

/**
 * Credential sets each marketplace accepts. An account is "ready" when at least
 * one set is complete for its channel; `apiKey`/`apiSecret` is the generic pair.
 */
const CREDENTIAL_REQUIREMENTS: Record<string, string[][]> = {
  amazon: [
    ['lwaClientId', 'refreshToken'],
    ['apiKey', 'apiSecret'],
  ],
  ebay: [['ebayOAuthToken'], ['apiKey', 'apiSecret']],
  etsy: [
    ['etsyKeystring', 'etsyOAuthToken'],
    ['apiKey', 'apiSecret'],
  ],
  website: [['webhookSecret'], ['apiKey', 'apiSecret']],
}

/** Generic pair every channel accepts when no marketplace-specific set applies. */
const GENERIC_REQUIREMENT = ['apiKey', 'apiSecret']

export interface SellerAccountSyncResult {
  sellerAccountId: string
  healthStatus: string
  credentialsReady: boolean
  missingCredentials: string[]
  taskCreated: boolean
}

/**
 * Marketplace account sync — the bounded, deterministic part of an integration
 * that needs no outbound network call.
 *
 * It answers the operational question *is this account able to transact right
 * now?*: it verifies tenant ownership, decrypts the stored credentials, checks a
 * complete set exists for the channel, folds that together with the account's own
 * status into `health_status`, stamps `last_synced_at` and records the last error
 * in `sync_config.last_error` (the schema has no dedicated error column), all
 * inside one audited transaction. When the account cannot transact it raises a
 * single review task.
 *
 * Idempotent: re-running only refreshes the health fields and never duplicates
 * the review task (`related_entity_type` + `related_entity_id` + pending status).
 */
export class SellerAccountSyncService {
  static async sync(input: {
    userId: string
    sellerAccountId: string
    requestId?: string | null
    actorUserId?: string | null
  }): Promise<SellerAccountSyncResult> {
    const account = await SellerAccount.query()
      .where('userId', input.userId)
      .andWhere('id', input.sellerAccountId)
      .preload('salesChannel')
      .first()
    if (!account) {
      throw new Error(
        `SELLER_ACCOUNT_NOT_FOUND: ${input.sellerAccountId} is not owned by this user.`
      )
    }

    const channelCode = (account.salesChannel?.code ?? '').toLowerCase()
    const requirements = CREDENTIAL_REQUIREMENTS[channelCode] ?? [GENERIC_REQUIREMENT]
    const credentials = (account.getDecryptedCredentials<Record<string, string>>() ?? {}) as Record<
      string,
      string
    >
    const satisfied = requirements.some((keys) => keys.every((key) => Boolean(credentials[key])))
    const missingCredentials = satisfied ? [] : (requirements[0] ?? GENERIC_REQUIREMENT)
    const credentialsReady = satisfied || Boolean(account.credentialVaultRef)

    const healthStatus = this.resolveHealthStatus(account.status, credentialsReady)
    const lastError = credentialsReady
      ? null
      : `Missing credentials: ${missingCredentials.join(', ')}`

    return await AuditContext.run(
      {
        actorUserId: input.actorUserId ?? input.userId,
        requestId: input.requestId ?? null,
        reason: 'seller_account.synced',
      },
      async (trx): Promise<SellerAccountSyncResult> => {
        account.useTransaction(trx)
        account.healthStatus = healthStatus
        account.syncConfig = {
          ...(account.syncConfig ?? {}),
          last_error: lastError,
          last_synced_at: DateTime.now().toISO(),
          credentials_ready: credentialsReady,
        }
        account.lastSyncedAt = DateTime.now()
        await account.save()

        let taskCreated = false
        if (healthStatus !== HealthStatus.HEALTHY) {
          const existing = await TasksReminder.query({ client: trx })
            .where('userId', input.userId)
            .where('relatedEntityType', 'seller_accounts')
            .where('relatedEntityId', account.id)
            .where('status', TaskStatus.PENDING)
            .first()
          if (!existing) {
            await TasksReminder.create(
              {
                userId: input.userId,
                relatedEntityType: 'seller_accounts',
                relatedEntityId: account.id,
                taskType: TaskType.GENERAL,
                priority:
                  healthStatus === HealthStatus.CRITICAL ? TaskPriority.URGENT : TaskPriority.HIGH,
                status: TaskStatus.PENDING,
                title: `Reconnect ${account.accountName}`,
                description:
                  lastError ?? `Account status is "${account.status}"; sync cannot proceed.`,
                dueAt: DateTime.now().plus({ days: 2 }),
              },
              { client: trx }
            )
            taskCreated = true
          }
        }

        return {
          sellerAccountId: account.id,
          healthStatus,
          credentialsReady,
          missingCredentials,
          taskCreated,
        }
      }
    )
  }

  /** Folds the account status and credential readiness into one health value. */
  private static resolveHealthStatus(accountStatus: string, credentialsReady: boolean): string {
    if (accountStatus === SellerAccountStatus.SUSPENDED) return HealthStatus.CRITICAL
    if (accountStatus === SellerAccountStatus.AUTH_EXPIRED) return HealthStatus.CRITICAL
    if (accountStatus === SellerAccountStatus.DISCONNECTED) return HealthStatus.CRITICAL
    if (!credentialsReady) return HealthStatus.WARNING
    if (accountStatus === SellerAccountStatus.RATE_LIMITED) return HealthStatus.WARNING
    if (accountStatus === SellerAccountStatus.ACTIVE) return HealthStatus.HEALTHY
    return HealthStatus.UNKNOWN
  }
}
