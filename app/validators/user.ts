import vine from '@vinejs/vine'

export const loginValidator = vine.create({
  email: vine.string().email().trim().toLowerCase(),
  password: vine.string().minLength(6),
})

export const createUserValidator = vine.create({
  email: vine.string().email().trim().toLowerCase(),
  fullName: vine.string().trim().minLength(2).maxLength(255),
  password: vine.string().minLength(8).maxLength(128),
  phone: vine.string().trim().optional().nullable(),
  defaultCurrency: vine.string().fixedLength(3).toUpperCase().optional(),
  timezone: vine.string().trim().optional(),
  isSuperAdmin: vine.boolean().optional(),
  roleSlugs: vine.array(vine.string()).optional(),
  enabledModules: vine.array(vine.string()).optional(),
})

export const updateUserStatusValidator = vine.create({
  status: vine.enum([
    'pending_activation',
    'active',
    'suspended',
    'locked',
    'deactivated',
  ] as const),
  reason: vine.string().trim().optional(),
})
