import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'
extendZodWithOpenApi(z)

const optionalNullableString = z.string().min(1).optional().nullable()

export const CreateCardSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    listId: z.string().min(1, 'Invalid List ID'),
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

export const UpdateCardSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title must be less than 100 characters").optional(),
    description: z.string().optional()
})

export const CreateAttachmentParamsSchema = z.object({
    id: z.string().min(1, 'Invalid card ID')
})


export const CreateAttachmentBodySchema = z.object({
    fileUrl: z.string().url(),
    fileName: z.string(),
    publicId: z.string().optional()
})

export const CreateAttachmentSchema = z.object({
    params: z.object({
        cardId: z.string().min(1, 'Invalid card ID')
    })
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
    beforeId: z.string().nullable().optional().describe('ID của card đứng trước (nếu có, null nếu ở đầu list)'),
    afterId: z.string().nullable().optional().describe('ID của card đứng sau (nếu có, null nếu ở cuối list)'),
    listId: z.string().uuid().describe('ID của List đích (bắt buộc để xác định context)')
})

export const MoveCardToBoardSchema = z.object({
    targetBoardId: z.string().min(1).describe('ID của Board đích'),
    targetListId: z.string().min(1).describe('ID của List đích thuộc Board đích'),
    beforeId: z.string().nullable().optional().describe('ID card đứng trước (để tính vị trí)'),
    afterId: z.string().nullable().optional().describe('ID card đứng sau (để tính vị trí)')
})

export const DuplicateCardSchema = z.object({
    targetListId: z.string().min(1).optional().describe('ID của List đích (mặc định list hiện tại)'),
    title: z.string().min(1).optional().describe('Tên thẻ mới (nếu muốn đổi)')
})

export const AddMemberToCard = z.object({
    memberId: z.string().min(1).or(z.literal('')).optional().describe('ID của thành viên cần thêm vào thẻ')
})

export const GetAssignedCardsSchema = z.object({
    boardId: z.string().min(1).or(z.literal('')).optional(),
    status: z.enum(['active', 'archived', 'all']).optional().default('active'),
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).optional().default(10)
})
