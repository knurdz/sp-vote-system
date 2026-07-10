import { z } from 'zod'

export const PROJECT_STATUSES = ['upcoming', 'voting', 'closed', 'assigned'] as const

const techStackTagSchema = z
  .string()
  .trim()
  .min(1)
  .max(30)
  .regex(/^[a-zA-Z0-9.-]+$/, 'Tags may only contain letters, numbers, hyphens, and dots')

export const projectSchema = z
  .object({
    title: z.string().trim().min(3, 'Title must be at least 3 characters').max(100),
    company: z.string().trim().min(2, 'Company must be at least 2 characters').max(80),
    description: z
      .string()
      .trim()
      .min(10, 'Description must be at least 10 characters')
      .max(2000),
    tech_stack: z.array(techStackTagSchema).max(10, 'Maximum 10 tech stack tags'),
    team_size: z.coerce.number().int().min(1).max(20),
    voting_deadline: z.string().min(1),
    status: z.enum(PROJECT_STATUSES),
    cv_required: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const deadline = new Date(data.voting_deadline)
    if (Number.isNaN(deadline.getTime())) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Invalid voting deadline',
        path: ['voting_deadline'],
      })
      return
    }
    const minDeadline = Date.now() + 60 * 60 * 1000
    if (deadline.getTime() < minDeadline) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Voting deadline must be at least 1 hour in the future',
        path: ['voting_deadline'],
      })
    }
  })

export type ProjectInput = z.infer<typeof projectSchema>

export const teamSchema = z.object({
  name: z.string().trim().min(2, 'Team name must be at least 2 characters').max(60),
  leader_email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Invalid email address'),
})

export type TeamInput = z.infer<typeof teamSchema>

const ZOOM_URL_PATTERN = /^https:\/\/([a-zA-Z0-9-]+\.)?zoom\.us\//

export const spinScheduleSchema = z
  .object({
    zoom_link: z.string().trim(),
    scheduled_at: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.zoom_link && !ZOOM_URL_PATTERN.test(data.zoom_link)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Zoom link must start with https://zoom.us/ or https://us0x.zoom.us/',
        path: ['zoom_link'],
      })
    }
    if (data.scheduled_at) {
      const scheduled = new Date(data.scheduled_at)
      if (Number.isNaN(scheduled.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Invalid scheduled date',
          path: ['scheduled_at'],
        })
      } else if (scheduled.getTime() <= Date.now()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Scheduled time must be in the future',
          path: ['scheduled_at'],
        })
      }
    }
  })

export function formatZodErrors(error: z.ZodError): string {
  return error.issues.map((issue) => issue.message).join('. ')
}
