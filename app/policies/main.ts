/*
|--------------------------------------------------------------------------
| Policies registry — consumed by initialize_bouncer middleware
|--------------------------------------------------------------------------
| Register each policy under its key; lazy-import keeps boot cheap.
*/

export const policies = {
  UserPolicy: () => import('#policies/user_policy'),
  OrderPolicy: () => import('#policies/order_policy'),
  ProductPolicy: () => import('#policies/product_policy'),
}
