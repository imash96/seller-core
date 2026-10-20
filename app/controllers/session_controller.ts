import crypto from 'node:crypto'
import { DateTime } from 'luxon'
import User from '#models/user'
import UserSession from '#models/user_session'
import { loginValidator } from '#validators/user'
import { RbacService } from '../services/rbac_service.js'
import { UserStatus } from '../enums/index.js'
import type { HttpContext } from '@adonisjs/core/http'

export default class SessionController {
  async create({ inertia }: HttpContext) {
    return inertia.render('auth/login', {})
  }

  async store({ request, auth, response, session }: HttpContext) {
    const { email, password } = await request.validateUsing(loginValidator)

    const existingUser = await User.findBy('email', email)
    if (existingUser) {
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

      const rawToken = `${user.id}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex')
      await UserSession.create({
        userId: user.id,
        sessionTokenHash: tokenHash,
        ipAddress: request.ip(),
        userAgent: request.header('user-agent') ?? null,
        isRevoked: false,
        expiresAt: DateTime.now().plus({ hours: 2 }),
        lastActiveAt: DateTime.now(),
      })

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

  async destroy({ auth, request, response, session }: HttpContext) {
    const user = auth.user
    if (user) {
      await UserSession.query().where('userId', user.id).andWhere('isRevoked', false).update({
        isRevoked: true,
        revokedAt: DateTime.now().toSQL(),
      })

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
    return response.redirect().toRoute('session.create')
  }
}
