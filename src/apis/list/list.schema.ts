import { z } from "zod";

export const ReorderListsSchema = z.object({
    beforeId: z.string('beforeId must be a string or null').nullable(),
    afterId: z.string('afterId must be a string or null').nullable(),
    boardId: z.string('boardId is required'),
})


export const MoveListSchema = z.object({
    boardId: z.string('boardId is required'),
})

export const DuplicateListSchema = z.object({
    boardId: z.string('boardId is required'),
    title: z.string().optional(),
})