import { NextFunction, Response } from 'express'
import { AuthRequest } from '@/types/auth-request'
import { successResponse, errorResponse } from '@/utils/response'
import cardService from './card.service'
import { Status } from '@/types/response'
import cardRepository from './card.repository'
import boardRepository from '../board/board.repository'
import { UserDTOForRelation } from '../users/user.dto'
import notificationService from '../notification/notification.service'
import { User } from '@/entities/user.entity'
import { EntityType, NotificationType } from '@/enums/notification.enum'

class CardController {
    private getCardId(req: AuthRequest): string | undefined {
        return req.params.cardId || req.params.id
    }

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
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const result = await cardRepository.getCardById(cardId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card retrieved successfully', result))
        } catch (err) {
            next(err)
        }
    }

    updateCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const result = await cardService.updateCard(cardId, req.body, req.user.id)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card updated successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    deleteCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            await cardService.deleteCard(cardId, req.user.id)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card deleted successfully'))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    addMemberToCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))

            let memberId = req.body.memberId
            if (!memberId || memberId === '') {
                memberId = req.user?.id
            }

            if (!memberId) {
                return next(
                    errorResponse(Status.BAD_REQUEST, 'Không lấy được ID người dùng từ Token. Hãy đăng nhập lại!')
                )
            }

            const boardId: string = await cardRepository.getBoardIdFromCard(cardId)
            if (!boardId) {
                return res
                    .status(Status.NOT_FOUND)
                    .json(errorResponse(Status.NOT_FOUND, 'Board not found for this card'))
            }
            const board = await boardRepository.getBoardById(boardId)
            const isMemberOfBoard = await boardRepository.findMemberByUserId(boardId, memberId)

            if (!isMemberOfBoard) {
                return res
                    .status(Status.BAD_REQUEST)
                    .json(errorResponse(Status.BAD_REQUEST, 'User is not a member of the board'))
            }

            const result = await cardRepository.findMemberById(cardId, memberId)
            console.log(result)
            if (result) {
                return res
                    .status(Status.BAD_REQUEST)
                    .json(errorResponse(Status.BAD_REQUEST, 'Member already added to card'))
            }

            const newMember = await cardService.addMemberToCard(req.user!.id, cardId, memberId)

            return res
                .status(Status.CREATED)
                .json(successResponse(Status.CREATED, 'Member added to card successfully', newMember))
        } catch (err: any) {
            next(err)
        }
    }

    getMembersOfCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const members = await cardRepository.getMembersOfCard(cardId)
            const result = members.map((m) => {
                return {
                    userId: m.user.id,
                    username: m.user.username,
                    avatarUrl: m.user.avatarUrl,
                    fullName: m.user.fullName,
                    email: m.user.email
                }
            })
            return res.status(Status.OK).json(successResponse(Status.OK, 'Get card members successfully', result))
        } catch (err: any) {
            next(err)
        }
    }

    removeMemberOfCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const memberId = req.body?.memberId

            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            if (!memberId) return next(errorResponse(Status.BAD_REQUEST, 'memberId is required'))

            const existingMember = await cardRepository.findMemberById(cardId, memberId)
            if (!existingMember) {
                return res
                    .status(Status.NOT_FOUND)
                    .json(errorResponse(Status.NOT_FOUND, 'User is not member of the card'))
            }
            await cardService.removeMemberFromCard(req.user.id, cardId, memberId)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Member removed from card successfully'))
        } catch (err: any) {
            console.log(err)
            next(err)
        }
    }

    archiveCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const result = await cardService.toggleArchiveCard(req.user.id, cardId, true)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card archived successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    unarchiveCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const result = await cardService.toggleArchiveCard(req.user.id, cardId, false)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card unarchived successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    duplicateCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const result = await cardService.duplicateCard(req.user.id, cardId, req.body)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card duplicated successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    reorderCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const result = await cardService.reorderCard(req.user.id, cardId, req.body)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card reordered successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    reorderCardList = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const result = await cardService.moveCardToAnotherList(req.user.id, cardId, req.body)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card moved successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    moveCardToBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const { targetBoardId, targetListId, beforeId, afterId } = req.body
            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const result = await cardService.moveCardToBoard(req.user.id, cardId, {
                targetBoardId,
                targetListId,
                beforeId,
                afterId
            })
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card moved successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    uploadCardBackground = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cardId = req.params.cardId || req.params.id
            if (!cardId) {
                return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            }
            if (!req.file) {
                return next(errorResponse(Status.BAD_REQUEST, 'No file uploaded'))
            }
            const updatedCard = await cardService.uploadCardBackground(cardId, req.file as Express.Multer.File)
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Card background updated successfully',
                data: updatedCard
            })
        } catch (err) {
            const status = (err as any)?.status || Status.INTERNAL_SERVER_ERROR
            const message = (err as any)?.message || 'Failed to upload card background'
            next(errorResponse(status, message, err))
        }
    }

    getPresignedUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { fileName, fileType, fileSize } = req.body
            if (!fileName || !fileType || !fileSize) {
                return next(errorResponse(Status.BAD_REQUEST, 'Missing required fields'))
            }
            const presignedUrl = await cardService.generatePresignedUrl(fileName, fileType, fileSize)
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Presigned URL generated successfully',
                data: presignedUrl
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to generate presigned URL', err))
        }
    }

    createAttachment = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { cardId } = req.params
            const { fileUrl, fileName, publicId } = req.body
            if (!fileUrl || !fileName) {
                return next(errorResponse(Status.BAD_REQUEST, 'Missing required fields'))
            }
            const attachment = await cardService.uploadAttachmentFromUrl(
                cardId,
                fileUrl,
                fileName,
                req.user!.id,
                publicId
            )
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Attachment uploaded successfully',
                data: {
                    id: attachment.id,
                    fileName: attachment.fileName,
                    fileUrl: attachment.fileUrl,
                    cardId: attachment.card.id,
                    uploadedBy: attachment.uploadedBy.id,
                    createdAt: attachment.createdAt
                }
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to upload attachment', err))
        }
    }

    getAttachmentsByCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { cardId } = req.params
            const attachments = await cardService.getAttachmentsByCard(cardId)
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Get attachments successfully',
                data: attachments
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to get attachments', err))
        }
    }

    deleteAttachment = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params
            if (!req.user?.id) throw { status: Status.UNAUTHORIZED, message: 'User info required' }
            await cardService.deleteAttachment(id, req.user.id)
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Attachment deleted successfully'
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to get attachments', err))
        }
    }

    getListOnCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.getListOnCard(req.user.id, req.params.id)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Get card list successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message))
        }
    }

    getCardsDueSoon = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.getCardsDueSoon(req.user.id)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Get due soon cards successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    getAssignedCards = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.getAssignedCards(req.user.id, req.query)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Get assigned cards successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    globalSearch = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const keyword = req.query.keyword as string
            const result = await cardService.globalSearch(req.user.id, keyword)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Search cards successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    getUnassignedMembers = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))

            const cardId = this.getCardId(req)
            if (!cardId) return next(errorResponse(Status.BAD_REQUEST, 'Card ID is required'))
            const result = await cardService.getUnassignedMembers(cardId)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Get unassigned members successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || Status.INTERNAL_SERVER_ERROR, err.message))
        }
    }

    getCardsInBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.getCardsInBoard(req.user.id, req.params.boardId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Get cards in board successfully', result))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }
}

export default new CardController()
