import { z } from 'zod'
import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi'

extendZodWithOpenApi(z)

// ===== CREATE / UPDATE =====
export const CreateListSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    boardId: z.string().uuid('Invalid Board ID')
})

export const UpdateListSchema = z.object({
    title: z.string().min(1).optional(),
    isArchived: z.boolean().optional()
})

// ===== ADVANCED =====
export const ReorderListsSchema = z.object({
    beforeId: z.string().nullable().describe('ID của list đứng trước'),
    afterId: z.string().nullable().describe('ID của list đứng sau'),
    boardId: z.string().describe('ID của board hiện tại')
})

export const MoveListSchema = z.object({
    boardId: z.string().uuid().describe('ID của Board đích'),
    beforeId: z.string().nullable().optional().describe('ID của list đứng trước tại board đích'),
    afterId: z.string().nullable().optional().describe('ID của list đứng sau tại board đích')
})

export const DuplicateListSchema = z.object({
    boardId: z.string().uuid().describe('ID của Board đích'),
    title: z.string().optional().describe('Tên mới cho list')
})