import './css/app.css'
import { client } from './client'
import { createRoot } from 'react-dom/client'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { Theme } from '@astryxdesign/core'
import { themes, defaultThemeSlug } from './astryx_themes'
import { Toaster } from 'sonner'

const appName = import.meta.env.VITE_APP_NAME || 'Seller Core'

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: async (name) => {
    const page = await resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx')
    )
    return page.default
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <TuyauProvider client={client}>
        <Theme theme={themes[defaultThemeSlug]}>
          <App {...props} />
          <Toaster richColors closeButton position="top-right" expand={false} />
        </Theme>
      </TuyauProvider>
    )
  },
  progress: {
    color: '#0866ff',
  },
})
