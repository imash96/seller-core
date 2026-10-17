import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import adonisjs from '@adonisjs/vite/client'

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    adonisjs({ entryPoints: ['inertia/app.tsx'], reload: ['resources/views/**/*.edge'] }),
  ],

  resolve: {
    alias: {
      '~/': `${import.meta.dirname}/inertia/`,
      '@generated': `${import.meta.dirname}/.adonisjs/client/`,
    },
  },

  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    watch: {
      ignored: ['**/storage/**', '**/tmp/**'],
    },
  },
})
