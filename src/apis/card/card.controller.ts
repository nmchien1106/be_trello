import { NextFunction, Response } from 'express'
import { AuthRequest } from '@/types/auth-request'
import { successResponse, errorResponse } from '@/utils/response'
import cardService from './card.service'
import { Status } from '@/types/response'
import cardRepository from './card.repository'
import boardRepository from '../board/board.repository'
class CardController {
    createCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.createCard(req.body, req.user.id)

            return res.status(Status.CREATED).json(successResponse(Status.CREATED, 'Card created successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || Status.BAD_REQUEST, err.message || 'Bad request'))
        }
    }

    getCardById = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cardId = req.params.id
            const result = await cardRepository.getCardById(cardId);
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card retrieved successfully', result))
        }
        catch(err){
            next(err)
        }
    }

    updateCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.updateCard(req.params.id, req.body, req.user.id)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Card updated successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    deleteCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            await cardService.deleteCard(req.params.id, req.user.id)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card deleted successfully'))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    addMemberToCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cardId = req.params.id
            const memberId = req.body.memberId

            const boardId: string = await cardRepository.getBoardIdFromCard(cardId)
            console.log('boardId', boardId)
            const isMemberOfBoard = await boardRepository.findMemberByUserId(boardId, memberId)

            if (!isMemberOfBoard) {
                return res.status(Status.BAD_REQUEST).json(errorResponse(Status.BAD_REQUEST, 'User is not a member of the board'))
            }

            const result = await cardRepository.findMemberById(cardId, memberId)

            if (result) {
                return res.status(Status.CONFLICT).json(errorResponse(Status.CONFLICT, 'Member already added to card'))
            }

            const newMember = await cardRepository.addMemberToCard(cardId, memberId)

            return res.status(Status.CREATED).json(successResponse(Status.CREATED, 'Member added to card successfully', newMember))
        } catch (err: any) {
            next(err)
        }

    }

}

export default new CardController()
