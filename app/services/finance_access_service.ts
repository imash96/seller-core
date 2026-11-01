import type User from '#models/user'
import { RbacService } from '#services/rbac_service'

export type FinanceClassification = 'business' | 'household_personal'
export type FinanceAction = 'read' | 'create' | 'update' | 'delete'

/** Household access is an additional permission and entitlement, not a substitute
 * for the normal finance or credit-card permission on the route. */
export class FinanceAccessService {
  static isClassification(value: unknown): value is FinanceClassification {
    return value === 'business' || value === 'household_personal'
  }

  static async permissions(user: User) {
    const effective = await RbacService.getEffectivePermissions(user)
    const can = (action: FinanceAction) =>
      RbacService.allows(user, effective, `household_finance.${action}`, 'household_finance')
    const read = can('read')
    return {
      read,
      // Mutations must also be visible to the operator, including success messages.
      create: read && can('create'),
      update: read && can('update'),
      delete: read && can('delete'),
    }
  }

  static canUse(
    classification: string,
    action: FinanceAction,
    permissions: Awaited<ReturnType<typeof FinanceAccessService.permissions>>
  ) {
    return (
      classification === 'business' ||
      (classification === 'household_personal' && permissions[action])
    )
  }
}
