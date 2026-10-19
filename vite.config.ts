import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import adonisjs from '@adonisjs/vite/client'
import { transformSync } from '@babel/core'

/**
 * StyleX compile step. @stylexjs ships only a Babel plugin (no Vite plugin),
 * and @vitejs/plugin-react v6 is oxc-based without a Babel hook — so run
 * @stylexjs/babel-plugin as a standalone pre-transform over TSX sources.
 */
function stylexPlugin(): Plugin {
  return {
    name: 'stylex-babel',
    enforce: 'pre',
    transform(code, id) {
      const [file] = id.split('?')
      if (!file.endsWith('.tsx') || file.includes('node_modules')) return null
      const out = transformSync(code, {
        filename: file,
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['typescript', 'jsx'] },
        plugins: [
          [
            '@stylexjs/babel-plugin',
            {
              dev: process.env.NODE_ENV !== 'production',
              runtimeInjection: false,
              treeshakeCompensation: true,
              genConditionalClasses: true,
            },
          ],
        ],
      })
      if (!out || typeof out.code !== 'string') return null
      return { code: out.code, map: out.map }
    },
  }
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    stylexPlugin(),
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
