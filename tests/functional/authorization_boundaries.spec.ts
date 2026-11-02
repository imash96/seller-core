/* eslint-disable @unicorn/no-await-expression-member -- Response status assertions */
import { test } from '@japa/runner'
import User from '#models/user'
import Role from '#models/role'
import Permission from '#models/permission'
import RolePermission from '#models/role_permission'
import UserRole from '#models/user_role'
import ModuleEntitlement from '#models/module_entitlement'
import Brand from '#models/brand'
import TasksReminder from '#models/tasks_reminder'
import { DateTime } from 'luxon'
import Product from '#models/product'
import { OrderService } from '#services/order_service'

test.group('Authorization boundaries over HTTP', () => {
  test('enforces catalog, customer and integration routes and filters dashboard and lookups', async ({
    assert,
  }) => {
    const suffix = Date.now().toString()
    const user = await User.create({
      email: `access-${suffix}@example.com`,
      fullName: 'Limited user',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const order = await OrderService.createOrder({
      userId: user.id,
      orderNumber: `PRIVATE-${suffix}`,
      customer: { fullName: 'Private Buyer' },
      lines: [{ sku: 'secret-sku', title: 'Private item', quantityOrdered: 1, unitPrice: 50 }],
    })
    const brand = await Brand.create({
      userId: user.id,
      name: `Private Brand ${suffix}`,
      slug: `private-${suffix}`,
    })
    const role = await Role.create({
      name: `Scoped ${suffix}`,
      slug: `scoped-${suffix}`,
      isSystem: false,
    })
    await UserRole.create({ userId: user.id, roleId: role.id })
    const secretTask = await TasksReminder.create({
      userId: user.id,
      title: 'Private task detail',
      taskType: 'general',
      priority: 'medium',
      status: 'pending',
      dueAt: DateTime.now(),
    })
    const otherUser = await User.create({
      email: `other-${suffix}@example.com`,
      fullName: 'Other',
      password: 'Password123!',
      status: 'active',
      isSuperAdmin: false,
      defaultCurrency: 'USD',
      timezone: 'UTC',
    })
    const otherBrand = await Brand.create({
      userId: otherUser.id,
      name: `Cross-tenant brand ${suffix}`,
      slug: `cross-${suffix}`,
    })
    await Product.create({
      userId: user.id,
      brandId: otherBrand.id,
      title: 'Legacy mislinked product',
      slug: `mislinked-${suffix}`,
    })
    const jar = new Map<string, string>()
    let inertiaVersion = ''
    const send = async (path: string, body?: Record<string, unknown>, inertia = false) => {
      const token = jar.get('XSRF-TOKEN')
      const res = await fetch(`${process.env.APP_URL || 'http://localhost:3333'}${path}`, {
        method: body ? 'POST' : 'GET',
        redirect: 'manual',
        headers: {
          cookie: [...jar].map(([k, v]) => `${k}=${v}`).join('; '),
          ...(inertia
            ? {
              'x-inertia': 'true',
              'x-requested-with': 'XMLHttpRequest',
              'x-inertia-version': inertiaVersion,
            }
            : {}),
          ...(body
            ? {
              'content-type': 'application/json',
              'x-xsrf-token': decodeURIComponent(token ?? ''),
            }
            : {}),
        },
        ...(body ? { body: JSON.stringify(body) } : {}),
      })
      for (const cookie of res.headers.getSetCookie()) {
        const pair = cookie.split(';')[0]
        const i = pair.indexOf('=')
        jar.set(pair.slice(0, i), pair.slice(i + 1))
      }
      if (inertia && res.status === 409 && res.headers.get('x-inertia-version')) {
        inertiaVersion = res.headers.get('x-inertia-version')!
        return send(path, body, inertia)
      }
      return res
    }
    await send('/store/product-categories')
    const login = await send('/', { email: user.email, password: 'Password123!' })
    assert.include(login.headers.get('location') ?? '', 'dashboard')
    for (const path of [
      '/products',
      '/customers',
      '/seller-accounts',
      '/claims',
      '/orders',
      '/tasks',
      '/admin',
    ]) {
      const result = await send(path)
      assert.equal(result.status, 403, path)
    }
    for (const path of ['/brands', '/customers', '/seller-accounts', '/claims', '/tasks']) {
      const result = await send(path, {})
      assert.equal(result.status, 403, path)
    }
    const dashboard = await send('/dashboard', undefined, true)
    assert.equal(dashboard.status, 200)
    const hidden = ((await dashboard.json()) as any).props
    assert.deepEqual(hidden.orders, [])
    assert.deepEqual(hidden.brands, [])
    assert.deepEqual(hidden.customers, [])
    assert.deepEqual(hidden.creditCards, [])
    assert.notInclude(JSON.stringify(hidden), secretTask.title)
    assert.equal(
      (await send('/saved-views', { name: 'Blocked', moduleKey: 'finance' })).status,
      403
    )
    assert.isFalse(hidden.access.orders)
    assert.isFalse(JSON.stringify(hidden).includes(order.orderNumber))
    const grant = async (resource: string, action: string, effect: 'allow' | 'deny' = 'allow') => {
      const slug = action ? `${resource}.${action}` : resource
      const permission = await Permission.updateOrCreate(
        { slug },
        { slug, name: slug, resource, action: action || '*' }
      )
      await RolePermission.updateOrCreate(
        { roleId: role.id, permissionId: permission.id },
        { roleId: role.id, permissionId: permission.id, effect }
      )
      await ModuleEntitlement.updateOrCreate(
        { userId: user.id, moduleKey: resource },
        { userId: user.id, moduleKey: resource, isEnabled: true, planTier: 'enterprise' }
      )
    }
    await grant('orders', 'read')
    const permittedOrders = await send('/orders', undefined, true)
    assert.equal(permittedOrders.status, 200)
    const props = ((await permittedOrders.json()) as any).props
    assert.isTrue(JSON.stringify(props.orders).includes(order.orderNumber))
    assert.deepEqual(props.brands, [])
    assert.deepEqual(props.customers, [])
    assert.notInclude(JSON.stringify(props), 'Private Buyer')
    const ordersDashboard = await send('/dashboard', undefined, true)
    assert.notInclude(
      JSON.stringify(((await ordersDashboard.json()) as any).props),
      'Private Buyer'
    )
    await grant('catalog', 'read')
    const catalog = await send('/products', undefined, true)
    assert.equal(catalog.status, 200)
    const catalogProps = ((await catalog.json()) as any).props
    assert.isTrue(JSON.stringify(catalogProps.brands).includes(brand.name))
    assert.notInclude(JSON.stringify(catalogProps), otherBrand.name)
    const catalogDashboard = await send('/dashboard', undefined, true)
    assert.notInclude(
      JSON.stringify(((await catalogDashboard.json()) as any).props),
      otherBrand.name
    )
    await grant('orders', 'export')
    const csv = await send('/orders/bulk/export', {})
    assert.equal(csv.status, 200)
    assert.notInclude(await csv.text(), 'Private Buyer')
    await grant('tasks', 'read')
    assert.equal((await send('/tasks')).status, 200)
    assert.equal((await send('/tasks', { title: 'not allowed' })).status, 403)
    assert.equal((await send(`/tasks/${secretTask.id}/complete`, {})).status, 403)
    await grant('tasks', 'update')
    assert.equal((await send(`/tasks/${secretTask.id}/complete`, {})).status, 302)
    await secretTask.refresh()
    assert.equal(secretTask.status, 'completed')

    await grant('catalog', '', 'deny')
    const deniedCatalog = await send('/products')
    assert.equal(deniedCatalog.status, 403)
    const afterDeny = await send('/orders', undefined, true)
    assert.deepEqual(((await afterDeny.json()) as any).props.brands, [])
    await ModuleEntitlement.query()
      .where('userId', user.id)
      .where('moduleKey', 'orders')
      .update({ isEnabled: false })
    const disabledOrders = await send('/orders')
    assert.equal(disabledOrders.status, 403)
  })
})
