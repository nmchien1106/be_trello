import { NextFunction, Response } from 'express'
import { AuthRequest } from '@/types/auth-request'
import { successResponse, errorResponse } from '@/utils/response'
import listService from './list.service'
import listRepository from './list.repository'
import { List } from '@/entities/list.entity'
import { Status } from '@/types/response'
import BoardRepository from './../board/board.repository'
import { Config } from '@/config/config'
import { checkBoardMember } from '@/middleware/authorization'
import { calcPosition } from '@/utils/calcPosition'

class ListController {
    createList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await listService.createList(req.body, req.user.id)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.BAD_REQUEST, err.message || 'Bad request'))
        }
    }

    getListById = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await listService.getListById(req.params.id, req.user.id)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'))
        }
    }

    updateList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await listService.updateList(req.params.id, req.body, req.user.id)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'))
        }
    }

    archiveList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await listService.updateList(req.params.id, { isArchived: true }, req.user.id)
            return res
                .status(result.status)
                .json(successResponse(result.status, 'List archived successfully', result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'))
        }
    }

    unarchiveList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await listService.updateList(req.params.id, { isArchived: false }, req.user.id)
            return res
                .status(result.status)
                .json(successResponse(result.status, 'List unarchived successfully', result.data))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'))
        }
    }

    deleteList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await listService.deleteList(req.params.id, req.user.id)
            return res.status(result.status).json(successResponse(result.status, result.message))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'))
        }
    }

    reorderLists = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const list = await listRepository.findListById(req.params.listId)
            if (!list) return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'List not found'))

            const { beforeId, afterId, boardId } = req.body

            const beforeList = beforeId ? await listRepository.findListById(beforeId) : null
            const afterList = afterId ? await listRepository.findListById(afterId) : null

            const newPosition = await calcPosition(beforeList?.position ?? null, afterList?.position ?? null, boardId)

            const hasRole = await checkBoardMember(['board_admin', 'board_member'], boardId, req.user!.id)
            if (!hasRole)
                return res.status(Status.FORBIDDEN).json(successResponse(Status.FORBIDDEN, 'Permission denied'))

            await listRepository.updateList(req.params.listId, { position: newPosition })
            return res.status(Status.OK).json(successResponse(Status.OK, 'List reordered successfully'))
        } catch (err) {
            next(err)
        }
    }

    moveListToAnotherBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { boardId } = req.body
            const list = await listRepository.findListById(req.params.listId)
            if (!list) return res.status(Status.NOT_FOUND).json(successResponse(Status.NOT_FOUND, 'List not found'))

            const highestPosition = await listRepository.getHighestPositionInBoard(boardId)
            const position = highestPosition !== null ? highestPosition + Config.defaultGap : Config.defaultGap

            await listRepository.updateList(list.id, { boardId, position })
            return res.status(Status.OK).json(successResponse(Status.OK, 'List moved successfully'))
        } catch (err) {
            next(err)
        }
    }

    duplicateList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const newList = await listRepository.duplicateList(req.params.listId, req.body.boardId, req.body.title)
            return res.status(Status.OK).json(successResponse(Status.OK, 'List duplicated successfully', newList))
        } catch (err) {
            next(err)
        }
    }

    getAllCardsInList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await listRepository.getAllCardsInList(req.params.id, req.user.id)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Cards retrieved successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message || 'Server error'))
        }
    }
}

export default new ListController()
