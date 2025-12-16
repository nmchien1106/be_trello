import { boardRegistry } from './../board/board.swagger'
import { Request, Response, NextFunction } from 'express'
import { rebanlancePositions, calcPosition } from '@/utils/calcPosition'
import listRepository from '@/apis/list/list.repository'
import { be } from 'zod/locales'
import { Status } from '@/types/response'
import { successResponse } from '@/utils/response'
import { List } from '@/entities/list.entity'
import BoardRepository from './../board/board.repository'
import { Config } from '@/config/config'
import { checkBoardMember } from '@/middleware/authorization'

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

            const beforePosition: number | null = beforeList ? beforeList.position : null
            const afterPosition: number | null = afterList ? afterList.position : null

            if (beforePosition !== null && afterPosition !== null && beforePosition > afterPosition) {
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

            const hasRole = await checkBoardMember(['board_admin', 'board_member'], boardId, req.user?.id as string)
            const hashRoleSource = await checkBoardMember(['board_admin', 'board_member'], list.boardId, req.user?.id as string)
            if (!hasRole || !hashRoleSource) {
                return res.status(Status.FORBIDDEN).json(successResponse(Status.FORBIDDEN, 'Permission denied'))
            }

            if (list.boardId === boardId) {
                return res.status(Status.BAD_REQUEST)
                    .json(successResponse(Status.BAD_REQUEST, 'List is already in the target board'))
            }

            const highestPosition = await listRepository.getHighestPositionInBoard(boardId)
            const position = highestPosition !== null ? highestPosition + Config.defaultGap : Config.defaultGap

            await listRepository.updateList(listId, { boardId, position  })

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

            const sourceList = await listRepository.findListById(listId)

            if (!sourceList) {
                return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'List not found'))
            }

            if (sourceList.boardId !== boardId) {
                return res
                    .status(Status.BAD_REQUEST)
                    .json(successResponse(Status.BAD_REQUEST, 'Failed to duplicate list to the target board'))
            }

            const newList = await listRepository.duplicateList(listId, boardId, title)
            console.log(newList.board)

            return res.status(Status.OK).json(successResponse(Status.OK, 'List duplicated successfully', newList))
        } catch (error) {
            next(error)
        }
    }
}

export default new ListController()
