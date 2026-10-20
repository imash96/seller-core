import '@adonisjs/inertia/types'

import type React from 'react'
import type { Prettify } from '@adonisjs/core/types/common'

type ExtractProps<T> =
  T extends React.FC<infer Props>
    ? Prettify<Omit<Props, 'children'>>
    : T extends React.Component<infer Props>
      ? Prettify<Omit<Props, 'children'>>
      : never

declare module '@adonisjs/inertia/types' {
  export interface InertiaPages {
    'accounts': ExtractProps<(typeof import('../../inertia/pages/accounts.tsx'))['default']>
    'admin': ExtractProps<(typeof import('../../inertia/pages/admin.tsx'))['default']>
    'audit': ExtractProps<(typeof import('../../inertia/pages/audit.tsx'))['default']>
    'auth/login': ExtractProps<(typeof import('../../inertia/pages/auth/login.tsx'))['default']>
    'auth/signup': ExtractProps<(typeof import('../../inertia/pages/auth/signup.tsx'))['default']>
    'claims': ExtractProps<(typeof import('../../inertia/pages/claims.tsx'))['default']>
    'customers': ExtractProps<(typeof import('../../inertia/pages/customers.tsx'))['default']>
    'dashboard': ExtractProps<(typeof import('../../inertia/pages/dashboard.tsx'))['default']>
    'errors/not_found': ExtractProps<(typeof import('../../inertia/pages/errors/not_found.tsx'))['default']>
    'errors/server_error': ExtractProps<(typeof import('../../inertia/pages/errors/server_error.tsx'))['default']>
    'finance': ExtractProps<(typeof import('../../inertia/pages/finance.tsx'))['default']>
    'home': ExtractProps<(typeof import('../../inertia/pages/home.tsx'))['default']>
    'import': ExtractProps<(typeof import('../../inertia/pages/import.tsx'))['default']>
    'orders': ExtractProps<(typeof import('../../inertia/pages/orders.tsx'))['default']>
    'products': ExtractProps<(typeof import('../../inertia/pages/products.tsx'))['default']>
    'returns': ExtractProps<(typeof import('../../inertia/pages/returns.tsx'))['default']>
    'shipments': ExtractProps<(typeof import('../../inertia/pages/shipments.tsx'))['default']>
    'tasks': ExtractProps<(typeof import('../../inertia/pages/tasks.tsx'))['default']>
  }
}
