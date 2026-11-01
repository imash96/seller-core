import type { HttpContext } from '@adonisjs/core/http'
import { OrganizationError, OrganizationService } from '#services/organization_service'

export default class OrganizationsController {
  async index({ auth, inertia }: HttpContext) {
    return inertia.render('organizations', {
      organizations: await OrganizationService.list(auth.getUserOrFail()),
    })
  }

  private failure(ctx: HttpContext, error: unknown) {
    if (!(error instanceof OrganizationError)) throw error
    if (ctx.request.header('x-inertia')) {
      ctx.session.flash('error', error.message)
      return ctx.response.redirect().back()
    }
    return ctx.response.status(error.status).send({ error: error.message })
  }

  async store(ctx: HttpContext) {
    try {
      await OrganizationService.create(
        ctx.auth.getUserOrFail(),
        ctx.request.input('name'),
        ctx.request.id()
      )
      ctx.session.flash(
        'success',
        'Organization created. Shared operational access is not yet enabled.'
      )
      return ctx.response.redirect().back()
    } catch (error) {
      return this.failure(ctx, error)
    }
  }

  async upsertMember(ctx: HttpContext) {
    try {
      await OrganizationService.upsertMember(
        ctx.auth.getUserOrFail(),
        ctx.params.id,
        {
          email: ctx.request.input('email'),
          roleId: ctx.request.input('roleId'),
          isAdmin: ctx.request.input('isAdmin'),
        },
        ctx.request.id()
      )
      ctx.session.flash(
        'success',
        'Membership saved. Roles do not yet grant shared operational access.'
      )
      return ctx.response.redirect().back()
    } catch (error) {
      return this.failure(ctx, error)
    }
  }

  async removeMember(ctx: HttpContext) {
    try {
      await OrganizationService.removeMember(
        ctx.auth.getUserOrFail(),
        ctx.params.id,
        ctx.params.membershipId,
        ctx.request.id()
      )
      ctx.session.flash('success', 'Member removed.')
      return ctx.response.redirect().back()
    } catch (error) {
      return this.failure(ctx, error)
    }
  }
}
