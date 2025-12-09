import { z } from 'zod'
import { ZodRequestBody, extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

export const CreateBoardSchema = z
    .object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        backgroundUrl: z.string().optional(),
        workspaceId: z.string().uuid('Workspace ID is required'),
        permissionLevel: z.enum(['private', 'workspace', 'public']).default('workspace')
    })
    .openapi({
        example: {
            title: 'New Project',
            description: 'Project description',
            permissionLevel: 'workspace',
            workspaceId: 'cc7a10e2-df5e-4974-8a5c-df541cdc2a17',
            backgroundUrl: 'https://example.com/bg.jpg'
        }
    })

export const inviteByEmailSchema = z.object({
    email: z.string().email('Invalid email address').optional()
})

export const acceptInviteSchema = z.object({
    token: z.string()
})

export const joinViaShareLinkSchema = z.object({
    token: z.string().uuid()
})

export const revokeShareLinkSchema = z.object({
    token: z.string().uuid()
})

export const updateMemberRoleSchema = z.object({
    roleName: z.string().openapi({
        description: 'Name of the role to assign to the member',
        example: 'board_admin'
    })
})

export const UpdateBoardRequest = z
    .object({
        title: z.string().min(1).max(255).optional(),
        description: z.string().max(1000).nullable().optional(),
        permissionLevel: z.enum(['private', 'workspace', 'public']).optional()
    })
    .strict()

export const BoardResponseSchema = z.object({
    id: z.string().uuid(),
    title: z.string(),
    description: z.string().nullable().optional(),
    permissionLevel: z.enum(['private', 'workspace', 'public']),
    workspaceId: z.string().uuid(),
    createdAt: z.string(),
    updatedAt: z.string()
})

export const BoardMemberResponseSchema = z.object({
    userId: z.string().uuid(),
    fullName: z.string(),
    email: z.string().email(),
    avatar: z.string().nullable().optional(),
    role: z.number()
})


export const CreateBoardFromTemplateParamsSchema = z.object({
    id: z.string().uuid().describe("Template ID")
});

export const CreateBoardFromTemplateQuerySchema = z.object({
    copyCard: z.string().optional().describe("If 'true', copy cards from template. Default is false")
});


export const CreateBoardFromTemplateBodySchema = z.object({
    title: z.string().min(1).describe("Title of the new board"),
    workspaceId: z.string().uuid().describe("Workspace ID where the board will be created")
});

