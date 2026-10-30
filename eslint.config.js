import { configApp } from '@adonisjs/eslint-config'
import { react } from '@adonisjs/eslint-config/react'

export default configApp(...react, {
  ignores: ['build/**', 'node_modules/**', 'public/**'],
  rules: {
    'react-hooks/immutability': 'off',
    'react-hooks/purity': 'off',
    'react-hooks/set-state-in-effect': 'off',
    '@unicorn/filename-case': [
      'error',
      {
        cases: {
          snakeCase: true,
          kebabCase: true,
        },
      },
    ],
  },
})
