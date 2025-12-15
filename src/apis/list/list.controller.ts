import { boardRegistry } from './../board/board.swagger'
import { Request, Response, NextFunction } from 'express'
import { rebanlancePositions, calcPosition } from '@/utils/calcPosition'
import listRepository from '@/apis/list/list.repository'
import { be } from 'zod/locales'
import { Status } from '@/types/response'
import { successResponse } from '@/utils/response'
import { List } from '@/entities/list.entity'
import BoardRepository from './../board/board.repository'


class ListController {
    // POST /lists/:listId/reorder
    reorderLists = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const list = await listRepository.findListById(req.params.listId)
            if (!list) {
                return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'List not found'))
            }

            const { beforeId, afterId, boardId } = req.body

            const beforeList: List | null = beforeId ? await listRepository.findListById(beforeId) : null
            const afterList: List | null = afterId ? await listRepository.findListById(afterId) : null
            console.log({ beforeList, afterList })

            const beforePosition: number | null = beforeList ? beforeList.position : null
            const afterPosition: number | null = afterList ? afterList.position : null

            if (beforePosition > afterPosition) {
                return res.status(Status.BAD_REQUEST).json(successResponse(Status.BAD_REQUEST, 'Invalid positions'))
            }

            const newPosition = await calcPosition(beforePosition, afterPosition, boardId)

            await listRepository.updateList(req.params.listId, { position: newPosition })

            return res.status(Status.OK).json(successResponse(Status.OK, 'List reordered successfully'))
        } catch (error) {
            console.error(error)
            next(error)
        }
    }

    // POST /lists/:listId/move
    moveListToAnotherBoard = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.body
            const listId = req.params.listId

            const list = await listRepository.findListById(listId)
            if (!list) {
                return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'List not found'))
            }

            const targetBoard = await BoardRepository.getBoardById(boardId)
            if (!targetBoard) {
                return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'Target board not found'))
            }
            if (list.boardId === boardId) {
                return res.status(Status.BAD_REQUEST).json(successResponse(Status.BAD_REQUEST, 'List is already in the target board'))
            }

            await listRepository.updateList(listId, { boardId: boardId })

            return res.status(Status.OK).json(successResponse(Status.OK, 'List moved successfully'))

        } catch (error) {
            next(error)
        }
    }

    //POST /lists/:listId/duplicate
    duplicateList = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const listId = req.params.listId
            const { boardId, title } = req.body

            const newList = await listRepository.duplicateList(listId, boardId, title)
            if (!newList) {
                return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'List not found'))
            }
            return res.status(Status.OK).json(successResponse(Status.OK, 'List duplicated successfully', newList))
        } catch (error) {
            console.log(error)
            next(error)
        }
    }
}

export default new ListController()
