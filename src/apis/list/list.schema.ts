import { z } from "zod";

export const ReorderListsSchema = z.object({
    beforeId: z.string().nullable(),
    afterId: z.string().nullable(),
    boardId: z.string(),
})
