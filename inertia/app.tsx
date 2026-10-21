import './css/app.css'
import { client } from './client'
import { createRoot } from 'react-dom/client'
import { type ComponentType, type JSX } from 'react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { Theme } from '@astryxdesign/core'
import { LayerProvider } from '@astryxdesign/core/Layer'
import { themes, defaultThemeSlug } from './astryx_themes'
import { ErrorBoundary } from '~/components/error-boundary'
import { PUBLIC_PAGES } from '~/lib/constants'
import AppLayout from '~/layouts/app'

const appName = import.meta.env.VITE_APP_NAME || 'Seller Core'

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: async (name) => {
    const page = await resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob<{ default: ResolvedComponent }>('./pages/**/*.tsx')
    ) as {
      default: ComponentType & {
        layout?: ((page: JSX.Element) => JSX.Element) | undefined
      }
    }

    // Auto-assign AppLayout to authenticated pages that don't define their own
    const isPublicPage = PUBLIC_PAGES.some((p) => name === p)
    if (!isPublicPage && !page.default.layout) {
      page.default.layout = (pageEl) => <AppLayout>{pageEl}</AppLayout>
    }

    return page.default
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      <ErrorBoundary>
        <TuyauProvider client={client}>
          <Theme theme={themes[defaultThemeSlug]}>
            <LayerProvider toast={{ position: 'topEnd', maxVisible: 5 }}>
              <App {...props} />
            </LayerProvider>
          </Theme>
        </TuyauProvider>
      </ErrorBoundary>
    )
  },
  progress: {
    color: '#0866ff',
  },
})
