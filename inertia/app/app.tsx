import '../css/app.css'
import { client } from './client'
import { createRoot } from 'react-dom/client'
import { type ComponentType, type JSX } from 'react'
import { TuyauProvider } from '@adonisjs/inertia/react'
import { resolvePageComponent } from '@adonisjs/inertia/helpers'
import { createInertiaApp, type ResolvedComponent } from '@inertiajs/react'
import { LayerProvider } from '@astryxdesign/core/Layer'
import { ErrorBoundary } from '~/modules/common/error-boundary'
import { PUBLIC_PAGES } from '~/lib/constants'
import { ThemeModeProvider } from '~/hooks/use_theme_mode'
import AppLayout from '~/layouts/app'

const appName = import.meta.env.VITE_APP_NAME || 'Seller Core'

createInertiaApp({
  title: (title) => (title ? `${title} - ${appName}` : appName),
  resolve: async (name) => {
    const page = (await resolvePageComponent(
      `../pages/${name}.tsx`,
      import.meta.glob<{ default: ResolvedComponent }>('../pages/**/*.tsx')
    )) as {
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
    const initialTheme = (props?.initialPage?.props as any)?.preferences?.theme as 'light' | 'dark' | undefined
    createRoot(el).render(
      <ErrorBoundary>
        <TuyauProvider client={client}>
          <ThemeModeProvider initialTheme={initialTheme}>
            <LayerProvider toast={{ position: 'topEnd', maxVisible: 5 }}>
              <App {...props} />
            </LayerProvider>
          </ThemeModeProvider>
        </TuyauProvider>
      </ErrorBoundary>
    )
  },
  progress: {
    color: '#4f46e5',
  },
})
