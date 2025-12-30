import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

const optionalNullableString = z.string().min(1).optional().nullable()

export const CreateCardSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    listId: z.string().uuid('Invalid List ID'),
    description: optionalNullableString,
    coverUrl: z.string().url('Invalid URL').optional().nullable(),
    dueDate: z
        .string()
        .optional()
        .nullable()
        .refine(
            (val) => {
                if (val === undefined || val === null || val === '') return true
                const t = Date.parse(val)
                return !Number.isNaN(t)
            },
            { message: 'Invalid date format (use ISO string)' }
        ),
    priority: z.enum(['low', 'medium', 'high']).optional().default('medium')
})

export const CreateAttachmentParamsSchema = z.object({
    id: z.string().uuid('Invalid card ID')
})


export const CreateAttachmentBodySchema = z.object({
    fileUrl: z.string().url(),
    fileName: z.string(),
    publicId: z.string().optional()
})


export const AttachmentSchema = z.object({
    id: z.string().uuid(),
    fileName: z.string(),
    fileUrl: z.string().url(),
    createdAt: z.string().datetime(),
    uploadedBy: z.object({
        id: z.string().uuid(),
        email: z.string().email().optional()
    })
})
export const ReorderCardSchema = z.object({
    beforeId: z.string().nullable().describe('ID của card đứng trước (nếu có)'),
    afterId: z.string().nullable().describe('ID của card đứng sau (nếu có)'),
    targetListId: z.string().uuid().describe('ID của List đích (nếu kéo sang list khác cùng board)')
})

export const MoveCardToBoardSchema = z.object({
    targetBoardId: z.string().uuid().describe('ID của Board đích'),
    targetListId: z.string().uuid().describe('ID của List đích thuộc Board đích')
})

export const DuplicateCardSchema = z.object({
    targetListId: z.string().uuid().optional().describe('ID của List đích (mặc định list hiện tại)'),
    title: z.string().min(1).optional().describe('Tên thẻ mới (nếu muốn đổi)')
})