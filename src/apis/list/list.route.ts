import ListRepository from './list.controller'
import express from 'express'
import { validateHandle } from '@/middleware/validate-handle'
import { ReorderListsSchema } from './list.schema'
import { ListRegisterPaths } from './list.swagger'
import { verifyAccessToken } from '@/utils/jwt'

const router = express.Router()

// Reorder lists
router.post('/:listId/reorder', verifyAccessToken, validateHandle(ReorderListsSchema), ListRepository.reorderLists)

// Move list to another board
router.post('/:listId/move', verifyAccessToken, ListRepository.moveListToAnotherBoard)

// Duplicate list
router.post('/:listId/duplicate', verifyAccessToken, ListRepository.duplicateList)

export default router
