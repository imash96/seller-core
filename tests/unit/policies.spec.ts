import { test } from '@japa/runner'
import OrderPolicy from '../../app/policies/order_policy.js'
import ProductPolicy from '../../app/policies/product_policy.js'
import UserPolicy from '../../app/policies/user_policy.js'
import User from '../../app/models/user.js'

test.group('Bouncer Authorization Policies', () => {
  function createUser(id: string, isSuperAdmin: boolean = false) {
    const user = new User()
    user.id = id
    user.isSuperAdmin = isSuperAdmin
    user.email = `${id}@example.com`
    return user
  }

  test('UserPolicy: regular user can view and update self, but cannot delete, toggle status, or assign roles', async ({
    assert,
  }) => {
    const policy = new UserPolicy()
    const regularUser = createUser('usr_regular_01', false)
    const otherUser = createUser('usr_regular_02', false)

    // Regular user can view
    const canView = await policy.view(regularUser)
    assert.isTrue(Boolean(canView))

    // Regular user CANNOT create new users (only super admin)
    const canCreate = await policy.create(regularUser)
    assert.isFalse(Boolean(canCreate))

    // Regular user CAN update self
    const canUpdateSelf = await policy.update(regularUser, regularUser)
    assert.isTrue(Boolean(canUpdateSelf))

    // Regular user CANNOT update another user
    const canUpdateOther = await policy.update(regularUser, otherUser)
    assert.isFalse(Boolean(canUpdateOther))

    // Regular user CANNOT delete self or others
    const canDeleteSelf = await policy.delete(regularUser, regularUser)
    assert.isFalse(Boolean(canDeleteSelf))
    const canDeleteOther = await policy.delete(regularUser, otherUser)
    assert.isFalse(Boolean(canDeleteOther))

    // Regular user CANNOT toggle status, assign roles, or manage entitlements
    assert.isFalse(Boolean(await policy.toggleStatus(regularUser)))
    assert.isFalse(Boolean(await policy.assignRole(regularUser)))
    assert.isFalse(Boolean(await policy.manageEntitlements(regularUser)))
  })

  test('UserPolicy: super administrator has full administrative rights except deleting self', async ({
    assert,
  }) => {
    const policy = new UserPolicy()
    const superAdmin = createUser('usr_super_01', true)
    const targetUser = createUser('usr_target_02', false)

    // Super admin can view, create, toggle status, assign roles, manage entitlements
    assert.isTrue(Boolean(await policy.view(superAdmin)))
    assert.isTrue(Boolean(await policy.create(superAdmin)))
    assert.isTrue(Boolean(await policy.toggleStatus(superAdmin)))
    assert.isTrue(Boolean(await policy.assignRole(superAdmin)))
    assert.isTrue(Boolean(await policy.manageEntitlements(superAdmin)))

    // Super admin can update self and target users
    assert.isTrue(Boolean(await policy.update(superAdmin, superAdmin)))
    assert.isTrue(Boolean(await policy.update(superAdmin, targetUser)))

    // Super admin CAN delete another user
    assert.isTrue(Boolean(await policy.delete(superAdmin, targetUser)))

    // Super admin CANNOT delete self (safeguard against accidental lockout)
    assert.isFalse(Boolean(await policy.delete(superAdmin, superAdmin)))
  })

  test('OrderPolicy: enforces strict tenant ownership for regular users and bypass for super admin', async ({
    assert,
  }) => {
    const policy = new OrderPolicy()
    const owner = createUser('usr_owner_01', false)
    const nonOwner = createUser('usr_stranger_02', false)
    const superAdmin = createUser('usr_admin_03', true)

    const ownedOrder = { userId: owner.id }

    // Owner can view their own order
    assert.isTrue(Boolean(await policy.view(owner, ownedOrder)))

    // Stranger cannot view another tenant's order
    assert.isFalse(Boolean(await policy.view(nonOwner, ownedOrder)))

    // Super admin can view any order
    assert.isTrue(Boolean(await policy.view(superAdmin, ownedOrder)))

    // Stranger cannot update status or delete an order they do not own
    assert.isFalse(Boolean(await policy.updateStatus(nonOwner, ownedOrder)))
    assert.isFalse(Boolean(await policy.delete(nonOwner, ownedOrder)))

    // Strict multi-tenant isolation: cannot delete an order owned by another tenant
    assert.isFalse(Boolean(await policy.delete(superAdmin, ownedOrder)))

    // Super admin can delete an order owned by themselves
    const adminOrder = { userId: superAdmin.id }
    assert.isTrue(Boolean(await policy.delete(superAdmin, adminOrder)))

    // Super admin can create and bulk import
    assert.isTrue(Boolean(await policy.create(superAdmin)))
    assert.isTrue(Boolean(await policy.bulkImport(superAdmin)))
  })

  test('ProductPolicy: enforces tenant ownership on product operations', async ({ assert }) => {
    const policy = new ProductPolicy()
    const owner = createUser('usr_product_owner', false)
    const nonOwner = createUser('usr_product_intruder', false)
    const superAdmin = createUser('usr_product_admin', true)

    const product = { userId: owner.id }

    // Owner can view product
    assert.isTrue(Boolean(await policy.view(owner, product)))

    // Intruder cannot view, update, delete, or manage variants of product
    assert.isFalse(Boolean(await policy.view(nonOwner, product)))
    assert.isFalse(Boolean(await policy.update(nonOwner, product)))
    assert.isFalse(Boolean(await policy.delete(nonOwner, product)))
    assert.isFalse(Boolean(await policy.manageVariants(nonOwner, product)))

    // Super admin can view any product
    assert.isTrue(Boolean(await policy.view(superAdmin, product)))

    // Multi-tenant isolation: super admin cannot update/delete products owned by another tenant
    assert.isFalse(Boolean(await policy.update(superAdmin, product)))
    assert.isFalse(Boolean(await policy.delete(superAdmin, product)))

    // Super admin can update and delete their own products
    const adminProduct = { userId: superAdmin.id }
    assert.isTrue(Boolean(await policy.update(superAdmin, adminProduct)))
    assert.isTrue(Boolean(await policy.delete(superAdmin, adminProduct)))
    assert.isTrue(Boolean(await policy.create(superAdmin)))
  })
})
