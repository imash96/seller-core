import crypto from 'node:crypto'
import type { HttpContext } from '@adonisjs/core/http'
import type { NextFn } from '@adonisjs/core/types/http'
import UserSession from '#models/user_session'
import { UserStatus } from '../enums/index.js'

/** Validate the session registry on every authenticated request, including guest routes. */
export default class SilentAuthMiddleware {
  async handle(ctx: HttpContext, next: NextFn) {
    const authenticated = await ctx.auth.check()
    if (authenticated) {
      const user = ctx.auth.getUserOrFail()
      const token = ctx.session.get('sessionRegistryToken')
      const tokenHash =
        typeof token === 'string' ? crypto.createHash('sha256').update(token).digest('hex') : null
      const activeSession =
        tokenHash && user.status === UserStatus.ACTIVE
          ? await UserSession.query()
              .where('userId', user.id)
              .andWhere('sessionTokenHash', tokenHash)
              .andWhere('isRevoked', false)
              .andWhere('expiresAt', '>', new Date())
              .first()
          : null
      if (!activeSession) {
        await ctx.auth.use('web').logout()
        ctx.session.forget('sessionRegistryToken')
      }
    }
    return next()
  }
}
