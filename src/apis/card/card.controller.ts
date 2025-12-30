import { NextFunction, Response } from 'express'
import { AuthRequest } from '@/types/auth-request'
import { successResponse, errorResponse } from '@/utils/response'
import cardService from './card.service'
import { Status } from '@/types/response'
import cardRepository from './card.repository'
import boardRepository from '../board/board.repository'
import { UserDTOForRelation, UserDTO } from '../users/user.dto'
import { da } from 'zod/v4/locales'

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
            const result = await cardRepository.getCardById(cardId)
            return res.status(Status.OK).json(successResponse(Status.OK, 'Card retrieved successfully', result))
        } catch (err) {
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
                return res
                    .status(Status.BAD_REQUEST)
                    .json(errorResponse(Status.BAD_REQUEST, 'User is not a member of the board'))
            }

            const result = await cardRepository.findMemberById(cardId, memberId)

            if (result) {
                return res.status(Status.CONFLICT).json(errorResponse(Status.CONFLICT, 'Member already added to card'))
            }

            const newMember = await cardRepository.addMemberToCard(cardId, memberId)

            return res
                .status(Status.CREATED)
                .json(successResponse(Status.CREATED, 'Member added to card successfully', newMember))
        } catch (err: any) {
            next(err)
        }
    }

    getMembersOfCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cardId = req.params.id
            const members = await cardRepository.getMembersOfCard(cardId)

            const result = members.map((m) => {
                {
                    const userDto = new UserDTOForRelation({
                        id: m.user.id,
                        name: m.user.username,
                        email: m.user.email
                    })
                    return userDto
                }
            })

            return res.status(Status.OK).json(successResponse(Status.OK, 'Get card members successfully', result))
        } catch (err: any) {
            next(err)
        }
    }

    // remove and leave member from card
    removeMemberOfCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const cardId = req.params.id
            const memberId = req.body?.memberId
            const existingMember = await cardRepository.findMemberById(cardId, memberId)
            console.log('existingMember', existingMember)
            if (!existingMember) {
                return res
                    .status(Status.NOT_FOUND)
                    .json(errorResponse(Status.NOT_FOUND, 'User is not member of the card'))
            }

            await cardRepository.removeMemberFromCard(cardId, memberId)

            return res.status(Status.OK).json(successResponse(Status.OK, 'Member removed from card successfully'))
        } catch (err: any) {
            next(err)
        }
    }

    archiveCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.toggleArchiveCard(req.user.id, req.params.id, true)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    unarchiveCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.toggleArchiveCard(req.user.id, req.params.id, false)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    reorderCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.reorderCard(req.user.id, req.params.id, req.body)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    duplicateCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.duplicateCard(req.user.id, req.params.id, req.body)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    moveCardToBoard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user?.id) return next(errorResponse(Status.UNAUTHORIZED, 'User info missing'))
            const result = await cardService.moveCardToBoard(req.user.id, req.params.id, req.body)
            return res.status(result.status).json(successResponse(result.status, result.message, result.data))
        } catch (err: any) {
            next(errorResponse(err.status || 500, err.message))
        }
    }

    uploadCardBackground = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try{
            const { id } = req.params;
            if(!req.file){
                return next(errorResponse(Status.BAD_REQUEST, 'No file uploaded'));
            }

            const updatedCard = await cardService.uploadCardBackground(id, req.file)
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Card background updated successfully',
                data: updatedCard

            })
        }catch(err){
            next(errorResponse(Status.INTERNAL_SERVER_ERROR,'Failed to upload card background',err))
        }
    }

    createAttachmentByFile = async (req: AuthRequest, res: Response, next: NextFunction) => {
         try {
            const { id } = req.params

            if (!req.file) {
                return next(errorResponse(Status.BAD_REQUEST, 'No file uploaded'))
            }
            const attachment = await cardService.uploadAttachmentFromFile(id, req.file, req.user!);
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Attachment uploaded successfully',
                data: {
                    id: attachment.id,
                    fileName: attachment.fileName,
                    fileUrl: attachment.fileUrl,
                    public_id: attachment.publicId,
                    cardId: attachment.card.id,
                    uploadedBy: attachment.uploadedBy.id,
                    createdAt: attachment.createdAt
                }
            })
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR,'Failed to upload attachment',err))
        }
    }

    createAttachmentByUrl = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try{
            const { id } = req.params
            const { fileUrl } = req.body
            const fileName = req.body.fileName
            if(!fileUrl){
                return next(errorResponse(Status.BAD_REQUEST, 'No URL provided'))
            }
            const attachment = await cardService.uploadAttachmentFromUrl(id, fileUrl, fileName, req.user!)
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
        }catch(err){
            next(errorResponse(Status.INTERNAL_SERVER_ERROR,'Failed to upload attachment',err))
        }
    }

    getAttachmentsByCard = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { cardId } = req.params;
            const attachments = await cardService.getAttachmentsByCard(cardId);
            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Get attachments successfully',
                data: attachments
            });
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to get attachments', err));
        }
    };

    deleteAttachment = async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const { id } = req.params;
            if (!req.user?.id) throw { status: Status.UNAUTHORIZED, message: 'User info required' };

            await cardService.deleteAttachment(id);

            return res.status(Status.OK).json({
                status: Status.OK,
                message: 'Attachment deleted successfully'
            });
        } catch (err) {
            next(errorResponse(Status.INTERNAL_SERVER_ERROR, 'Failed to get attachments', err));
        }
    }
}

export default new CardController()
