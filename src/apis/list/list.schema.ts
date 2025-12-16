import { title } from "process";
import { z } from "zod";

export const ReorderListsSchema = z.object({
    beforeId: z.string('beforeId is required and can be null').nullable(),
    afterId: z.string('afterId is required and can be null').nullable(),
    boardId: z.string('boardId is required'),
})


export const MoveListSchema = z.object({
    boardId: z.string('targetBoardId is required'),
})

export const DuplicateListSchema = z.object({
    boardId: z.string('boardId is required'),
    title: z.string().optional(),
})