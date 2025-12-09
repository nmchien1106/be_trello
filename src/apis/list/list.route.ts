import ListRepository from "./list.controller";
import express from "express";
import { validateHandle } from "@/middleware/validate-handle";
import { ReorderListsSchema } from "./list.schema";

const router = express.Router();

// Reorder lists
router.post('/:listId/reorder', validateHandle(ReorderListsSchema), ListRepository.reorderLists);

// Move list to another board
router.post('/:listId/move', ListRepository.moveListToAnotherBoard);

// Duplicate list
router.post('/:listId/duplicate', ListRepository.duplicateList);

export default router;