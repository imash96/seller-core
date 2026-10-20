import { configApp } from '@adonisjs/eslint-config'
import { react } from '@adonisjs/eslint-config/react'

export default configApp(...react, {
  ignores: ['build/**', 'node_modules/**'],
  rules: {
    'react-hooks/immutability': 'off',
    'react-hooks/purity': 'off',
    'react-hooks/set-state-in-effect': 'off',
  },
})
