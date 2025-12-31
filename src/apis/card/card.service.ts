import AppDataSource from '@/config/typeorm.config'
import CardRepository from './card.repository'
import ListRepository from '../list/list.repository'
import BoardRepository from '../board/board.repository'
import { CreateCardDto } from './card.dto'
import { Status } from '@/types/response'
import { Permissions } from '@/enums/permissions.enum'
import { Card } from '@/entities/card.entity'
import { List } from '@/entities/list.entity'
import { Config } from '@/config/config'
import { calcPosition } from '@/utils/calcPosition'
import { Express } from 'express'
import { User } from '@/entities/user.entity'
import { Attachment } from '@/entities/attachment.entity'
import  cloudinary  from '@/config/cloundinary'

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf'];

const attachmentRepo = AppDataSource.getRepository(Attachment)
export class CardService {
    async createCard(data: CreateCardDto, userId: string) {
        if (!userId) throw { status: Status.UNAUTHORIZED, message: 'User info missing' }

        const list = await ListRepository.findById(data.listId)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        try {
            return await AppDataSource.transaction(async (manager) => {
                const lastCard = await manager.findOne(Card, {
                    where: { list: { id: data.listId } },
                    order: { position: 'DESC' },
                    lock: { mode: 'pessimistic_write' }
                })

                const newPosition = lastCard ? lastCard.position + Config.defaultGap : Config.defaultGap

                const newCard = manager.create(Card, {
                    title: data.title,
                    list: { id: data.listId } as any,
                    position: newPosition,
                    description: data.description || null,
                    coverUrl: data.coverUrl || null,
                    priority: data.priority || 'medium',
                    dueDate: data.dueDate ? new Date(data.dueDate) : null
                })

                const savedCard = await manager.save(newCard)

                return savedCard
            })
        } catch (error: any) {
            throw { status: error.status || Status.BAD_REQUEST, message: error.message || 'Create card failed' }
        }
    }

    async updateCard(cardId: string, data: any, userId: string) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        const updated = await CardRepository.updateCard(cardId, data)
        return updated
    }

    async deleteCard(cardId: string, userId: string) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        await CardRepository.deleteCard(cardId)
        return;
    }

    private async checkPermission(userId: string, boardId: string, permission: string) {
        const hasPerm = await BoardRepository.hasPermission(userId, boardId, permission)
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'Permission denied' }
    }

    async toggleArchiveCard(userId: string, cardId: string, isArchived: boolean) {
        const card = await CardRepository.findCardWithBoard(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        await this.checkPermission(userId, card.list.board.id, Permissions.UPDATE_CARD)

        let updateData: any = { isArchived }

        if (isArchived === false) {
            const maxPos = await CardRepository.getHighestPositionInList(card.list.id)
            updateData.position = (maxPos !== null ? maxPos : 0) + Config.defaultGap
        }

        const updated = await CardRepository.updateCard(cardId, updateData)
        return {
            status: Status.OK,
            message: isArchived ? 'Card archived' : 'Card unarchived',
            data: updated
        }
    }

    async reorderCard(userId: string, cardId: string, data: { beforeId: string | null, afterId: string | null, targetListId: string }) {
        const card = await CardRepository.findCardWithBoard(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        await this.checkPermission(userId, card.list.board.id, Permissions.UPDATE_BOARD)

        const targetList = await ListRepository.findById(data.targetListId)
        if (!targetList) throw { status: Status.NOT_FOUND, message: 'Target list not found' }

        if (targetList.board.id !== card.list.board.id) {
             throw { status: Status.BAD_REQUEST, message: 'Target list must be in the same board. Use move API instead.' }
        }

        const beforeCard = data.beforeId ? await CardRepository.getCardById(data.beforeId) : null
        const afterCard = data.afterId ? await CardRepository.getCardById(data.afterId) : null

        const newPosition = await calcPosition(
            beforeCard?.position ?? null,
            afterCard?.position ?? null,
            data.targetListId
        )

        const updated = await CardRepository.updateCard(cardId, {
            list: { id: data.targetListId },
            position: newPosition
        })

        return { status: Status.OK, message: 'Card reordered successfully', data: updated }
    }

    async moveCardToBoard(userId: string, cardId: string, data: { targetListId: string, targetBoardId: string }) {
        const card = await CardRepository.findCardWithBoard(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        await this.checkPermission(userId, card.list.board.id, Permissions.UPDATE_CARD)
        await this.checkPermission(userId, data.targetBoardId, Permissions.CREATE_CARD)

        const targetList = await ListRepository.findById(data.targetListId)
        if (!targetList || targetList.board.id !== data.targetBoardId) {
            throw { status: Status.BAD_REQUEST, message: 'Target list invalid or does not belong to target board' }
        }

        const maxPos = await CardRepository.getHighestPositionInList(data.targetListId)
        const newPosition = (maxPos !== null ? maxPos : 0) + Config.defaultGap

        const updated = await CardRepository.updateCard(cardId, {
            list: { id: data.targetListId },
            position: newPosition
        })

        return { status: Status.OK, message: 'Card moved successfully', data: updated }
    }

    async duplicateCard(userId: string, cardId: string, data: { targetListId?: string, title?: string }) {
        const sourceCard = await CardRepository.findCardForDuplicate(cardId)
        if (!sourceCard) throw { status: Status.NOT_FOUND, message: 'Source card not found' }

        await this.checkPermission(userId, sourceCard.list.board.id, Permissions.READ_BOARD)

        const listId = data.targetListId || sourceCard.list.id

        const targetList = await ListRepository.findById(listId)
        if (!targetList) throw { status: Status.NOT_FOUND, message: 'Target list not found' }
        await this.checkPermission(userId, targetList.board.id, Permissions.CREATE_CARD)

        const newCard = await CardRepository.duplicateCard(sourceCard, listId, data.title)

        return { status: Status.CREATED, message: 'Card duplicated successfully', data: newCard }
    }

    async uploadCardBackground(cardId: string, file: Express.Multer.File){
        const card = await CardRepository.findById(cardId);
        if(!card) throw new Error('Card not found');
        const cloudFile = file as any;
        card.backgroundUrl = cloudFile.path;
        card.backgroundPublicId = cloudFile.filename;
        return await CardRepository.updateCard(cardId, { backgroundUrl: card.backgroundUrl, backgroundPublicId: card.backgroundPublicId });
    }

    async generatePresignedUrl(fileName: string, fileType: string, fileSize: number): Promise<{signature: string, apiKey: string, cloudName: string, timestamp: number, folder: string}> {
        const size = Number(fileSize);
        if (isNaN(size)) throw { status: 400, message: 'fileSize must be a number' };
        if (size > MAX_FILE_SIZE) throw { status: 400, message: 'File size exceeds the maximum limit' };
        if (!ALLOWED_TYPES.includes(fileType)) throw { status: 400, message: 'File type is not allowed' };

        const timestamp = Math.floor(new Date().getTime() / 1000); // in seconds
        const folder = 'cards';

         const paramsToSign = {
            timestamp,
            folder,
            tags: "card-attachment",
        };

        const signature = cloudinary.utils.api_sign_request(
            paramsToSign,
            Config.cloudinaryApiSecret,
        );

        return {
            signature,
            cloudName: Config.cloundinaryName,
            apiKey: Config.cloudinaryApiKey,
            timestamp,
            folder
        };
    }

    async uploadAttachmentFromUrl(cardId: string, fileUrl: string, fileName: string, user: User, publicId: string) {
        const card = await CardRepository.findById(cardId);
        if (!card) throw new Error('Card not found');

        const attachment = attachmentRepo.create({
            fileName: fileName,
            fileUrl: fileUrl,
            card,
            uploadedBy: user,
            publicId: publicId
        });

        return await attachmentRepo.save(attachment);
    }


    async getAttachmentsByCard(cardId: string){
        const card = await CardRepository.findById(cardId);
        if(!card) throw new Error('Card not found');
        const attachments = await attachmentRepo.find({
            where: { card: { id: cardId }}
        })
        return attachments;
    }

}

export default new CardService()
