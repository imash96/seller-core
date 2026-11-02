import { DateTime } from 'luxon'
import User from '#models/user'
import { loginValidator } from '#validators/user'
import { RbacService } from '../services/rbac_service.js'
import { SessionRegistryService } from '../services/session_registry_service.js'
import { UserStatus } from '../enums/index.js'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store(ctx: HttpContext) {
    const { request, auth, response, session } = ctx
    const { email, password } = await request.validateUsing(loginValidator)

    const existingUser = await User.findBy('email', email)
    if (existingUser) {
      if (
        existingUser.status === UserStatus.LOCKED &&
        existingUser.lockedUntil &&
        existingUser.lockedUntil <= DateTime.now()
      ) {
        existingUser.status = UserStatus.ACTIVE
        existingUser.failedLoginAttempts = 0
        existingUser.lockedUntil = null
        await existingUser.save()
      }
      if (
        existingUser.lockedUntil &&
        existingUser.lockedUntil.toMillis() > DateTime.now().toMillis()
      ) {
        session.flash('error', 'Account is temporarily locked due to failed login attempts.')
        return response.redirect().back()
      }
      if (existingUser.status !== UserStatus.ACTIVE) {
        session.flash(
          'error',
          `Account status is "${existingUser.status}". Contact your system super administrator.`
        )
        return response.redirect().back()
      }
    }

    try {
      const user = await User.verifyCredentials(email, password)

      user.failedLoginAttempts = 0
      user.lockedUntil = null
      user.lastLoginAt = DateTime.now()
      user.lastLoginIp = request.ip()
      await user.save()

      await auth.use('web').login(user)
      // The guard regenerates the session id on login, so the registry is tagged
      // afterwards: the row that revocation and auditing act on is the very row the
      // browser's cookie points at.
      await SessionRegistryService.tag(ctx, user.id)

      await RbacService.recordAudit({
        actorUserId: user.id,
        userId: user.id,
        action: 'auth.login',
        entityType: 'users',
        entityId: user.id,
        requestId: request.id(),
        ipAddress: request.ip(),
        userAgent: request.header('user-agent') ?? null,
        afterState: { email: user.email, status: user.status },
      })

      session.flash('success', `Welcome back, ${user.fullName}`)
      return response.redirect().toRoute('dashboard')
    } catch (error) {
      if ((error as { code?: string }).code !== 'E_INVALID_CREDENTIALS') {
        await auth.use('web').logout()
        throw error
      }
      if (existingUser) {
        existingUser.failedLoginAttempts = (existingUser.failedLoginAttempts || 0) + 1
        if (existingUser.failedLoginAttempts >= 5) {
          existingUser.status = UserStatus.LOCKED
          existingUser.lockedUntil = DateTime.now().plus({ minutes: 30 })
        }
        await existingUser.save()
        const remaining = Math.max(0, 5 - existingUser.failedLoginAttempts)
        session.flash(
          'error',
          `Invalid email or password. ${remaining} attempts remaining before temporary lockout.`
        )
        return response.redirect().back()
      }
      session.flash(
        'error',
        'Invalid email or password. Please check your credentials and try again.'
      )
      return response.redirect().back()
    }
  }

  async destroy(ctx: HttpContext) {
    const { auth, request, response, session } = ctx
    const user = auth.user
    if (user) {
      // Kill the row the cookie points at, then drop the user tag.
      await SessionRegistryService.revoke(session.sessionId)
      await SessionRegistryService.untag(ctx, user.id)

      await RbacService.recordAudit({
        actorUserId: user.id,
        userId: user.id,
        action: 'auth.logout',
        entityType: 'users',
        entityId: user.id,
        requestId: request.id(),
        ipAddress: request.ip(),
      })
    }

    await auth.use('web').logout()
    session.flash('success', 'Signed out securely.')
    return response.redirect('/')
  }
}
