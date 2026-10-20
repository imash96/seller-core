import app from '@adonisjs/core/services/app'
import { type HttpContext, ExceptionHandler } from '@adonisjs/core/http'
import type { StatusPageRange, StatusPageRenderer } from '@adonisjs/core/types/http'
import { errors as bouncerErrors } from '@adonisjs/bouncer'

export default class HttpExceptionHandler extends ExceptionHandler {
  /**
   * In debug mode, the exception handler will display verbose errors
   * with pretty printed stack traces.
   */
  protected debug = !app.inProduction

  /**
   * Status pages are used to display a custom HTML pages for certain error
   * codes. You might want to enable them in production only, but feel
   * free to enable them in development as well.
   */
  protected renderStatusPages = app.inProduction

  /**
   * Status pages is a collection of error code range and a callback
   * to return the HTML contents to send as a response.
   */
  protected statusPages: Record<StatusPageRange, StatusPageRenderer> = {
    '404': (_, { inertia }) => inertia.render('errors/not_found', {}),
    '500..599': (_, { inertia }) => inertia.render('errors/server_error', {}),
  }

  /**
   * The method is used for handling errors and returning
   * response to the client
   */
  async handle(error: unknown, ctx: HttpContext) {
    if (error instanceof bouncerErrors.E_AUTHORIZATION_FAILURE) {
      const msg: string = (error as any).message || 'Not authorized'
      const status: number = (error as any).status ?? 403

      const session: any = (ctx as any).session
      if (session && typeof session.flash === 'function') {
        session.flash('error', msg)
      }

      const wantsJson = ctx.request.header('accept')?.includes('application/json')
      if (wantsJson) {
        return ctx.response.status(status).send({ message: msg })
      }

      const referer = ctx.request.header('referer')
      const isInertia =
        typeof (ctx.request as any).isInertiaRequest === 'function'
          ? (ctx.request as any).isInertiaRequest()
          : !!ctx.request.header('x-inertia')
      if (referer && isInertia) {
        return ctx.response.redirect().back()
      }

      if (!app.inProduction) {
        return ctx.response.status(status).send(`Forbidden: ${msg}`)
      }

      return super.handle(error, ctx)
    }

    return super.handle(error, ctx)
  }

  /**
   * The method is used to report error to the logging service or
   * the a third party error monitoring service.
   *
   * @note You should not attempt to send a response from this method.
   */
  async report(error: unknown, ctx: HttpContext) {
    return super.report(error, ctx)
  }
}
