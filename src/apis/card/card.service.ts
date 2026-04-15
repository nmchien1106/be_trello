import AppDataSource from '@/config/typeorm.config'
import CardRepository from './card.repository'
import ListRepository from '../list/list.repository'
import { EventBus } from '@/events/event-bus'
import { DomainEvent } from '@/events/interface'
import { EventType } from '@/enums/event-type.enum'
import crypto from 'crypto'
import { CreateCardDto } from './card.dto'
import { Status } from '@/types/response'
import { Card } from '@/entities/card.entity'
import { Config } from '@/config/config'
import { calcPosition } from '@/utils/calcPosition'
import { Attachment } from '@/entities/attachment.entity'
import cloudinary from '@/config/cloundinary'
import { DeepPartial } from 'typeorm'
import cardRepository from './card.repository'
import BoardRepository from '../board/board.repository'

const attachmentRepo = AppDataSource.getRepository(Attachment)
const cardRepo = AppDataSource.getRepository(Card)

export class CardService {
    async createCard(data: CreateCardDto, userId: string) {
        if (!userId) throw { status: Status.UNAUTHORIZED, message: 'User info missing' }

        const list = await ListRepository.findById(data.listId)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        const savedCard = await AppDataSource.transaction(async (manager) => {
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
                backgroundUrl: data.coverUrl || null,
                priority: data.priority || 'medium',
                dueDate: data.dueDate ? new Date(data.dueDate) : null
            } as DeepPartial<Card>)

            return await manager.save(newCard)
        })

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_CREATED,
            boardId: list.board.id,
            cardId: savedCard.id,
            actorId: userId,
            payload: { title: savedCard.title, listName: list.title }
        })

        return savedCard
    }

    async updateCard(cardId: string, data: any, userId: string) {
        const card = await cardRepo.findOne({
            where: { id: cardId },
            relations: ['list', 'list.board']
        })

        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        Object.assign(card, {
            title: data.title ?? card.title,
            description: data.description ?? card.description,
            dueDate: data.dueDate === undefined ? card.dueDate : data.dueDate === null ? null : new Date(data.dueDate),
            labels: data.labels ?? card.labels,
            priority: data.priority ?? card.priority,
            isArchived: data.isArchived ?? card.isArchived
        })

        const updated = await cardRepo.save(card)

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_UPDATED,
            boardId: card.list.board.id,
            cardId,
            actorId: userId,
            payload: {
                title: card.title,
                updatedFields: Object.keys(data)
            }
        })

        return updated
    }

    async deleteCard(cardId: string, userId: string) {
        console.log('deleteCard called with:', { cardId, userId })

        const card = await CardRepository.findCardWithBoard(cardId)
        console.log('Found card:', card ? 'exists' : 'not found')

        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        console.log('Deleting card from repository...')
        await CardRepository.deleteCard(cardId)

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_DELETED,
            boardId: card.list.board.id,
            cardId,
            actorId: userId,
            payload: { title: card.title, listName: card.list.title }
        })
    }

    async toggleArchiveCard(userId: string, cardId: string, isArchived: boolean) {
        const card = await CardRepository.findCardWithBoard(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        const updated = await CardRepository.updateCard(cardId, { isArchived })

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: isArchived ? EventType.CARD_ARCHIVED : EventType.CARD_RESTORED,
            boardId: card.list.board.id,
            cardId,
            actorId: userId,
            payload: { title: card.title, listName: card.list.title }
        })

        return updated
    }

    async reorderCard(userId: string, cardId: string, data: any) {
        const card = await CardRepository.findCardWithBoard(cardId)
        if (!card) throw { status: Status.NOT_FOUND }

        const before = data.beforeId ? await CardRepository.getCardById(data.beforeId) : null
        const after = data.afterId ? await CardRepository.getCardById(data.afterId) : null

        const newPosition = await calcPosition(before?.position ?? null, after?.position ?? null, data.listId, 'card')

        const updated = await CardRepository.updateCard(cardId, { position: newPosition })

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_REORDERED,
            boardId: card.list.board.id,
            cardId,
            actorId: userId,
            payload: { cardTitle: card.title, listName: card.list.title }
        })

        return updated
    }

    async moveCardToAnotherList(userId: string, cardId: string, data: any) {
        const card = await CardRepository.findCardWithBoard(cardId)
        if (!card) throw { status: Status.NOT_FOUND }

        const targetList = await ListRepository.findById(data.targetListId)
        if (!targetList) throw { status: Status.NOT_FOUND }

        // Calculate position based on beforeId and afterId
        const before = data.beforeId ? await CardRepository.getCardById(data.beforeId) : null
        const after = data.afterId ? await CardRepository.getCardById(data.afterId) : null

        const newPosition = await calcPosition(
            before?.position ?? null,
            after?.position ?? null,
            data.targetListId,
            'card'
        )

        const updated = await CardRepository.updateCard(cardId, {
            list: { id: targetList.id },
            position: newPosition
        })

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_MOVED,
            boardId: card.list.board.id,
            cardId,
            actorId: userId,
            payload: {
                fromListId: card.list.id,
                toListId: targetList.id,
                cardTitle: card.title,
                listName: targetList.title
            }
        })

        return updated
    }

    async moveCardToBoard(userId: string, cardId: string, data: any) {
        if (!data?.targetListId) {
            throw { status: Status.BAD_REQUEST, message: 'targetListId is required' }
        }

        return this.moveCardToAnotherList(userId, cardId, data)
    }

    async uploadCardBackground(cardId: string, file: Express.Multer.File) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        if (!file?.buffer) {
            throw { status: Status.BAD_REQUEST, message: 'Invalid file upload' }
        }

        const uploadResult = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject({ status: Status.GATEWAY_TIMEOUT, message: 'Card background upload timed out' })
            }, 30000)

            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'cards',
                    public_id: `card_${cardId}_background`,
                    resource_type: 'image',
                    transformation: [{ width: 1600, height: 900, crop: 'limit' }]
                },
                (error, result) => {
                    clearTimeout(timeout)
                    if (error) {
                        return reject(error)
                    }
                    resolve(result)
                }
            )

            stream.end(file.buffer)
        })

        const backgroundUrl = uploadResult.secure_url || uploadResult.url
        if (!backgroundUrl) {
            throw { status: Status.INTERNAL_SERVER_ERROR, message: 'Failed to upload card background' }
        }

        return CardRepository.updateCard(cardId, {
            backgroundUrl,
            backgroundPublicId: uploadResult.public_id || `card_${cardId}_background`
        })
    }

    async generatePresignedUrl(fileName: string, fileType: string, fileSize: number) {
        const timestamp = Math.floor(Date.now() / 1000)
        const folder = 'attachments'
        const signature = (cloudinary as any).utils.api_sign_request(
            {
                folder,
                tags: 'card-attachment',
                timestamp
            },
            Config.cloudinaryApiSecret
        )

        return {
            signature,
            apiKey: Config.cloudinaryApiKey,
            cloudName: Config.cloudinaryName,
            timestamp,
            folder,
            fileName,
            fileType,
            fileSize
        }
    }

    async getAttachmentsByCard(cardId: string) {
        return attachmentRepo.find({
            where: { card: { id: cardId } },
            relations: ['uploadedBy'],
            order: { createdAt: 'DESC' }
        })
    }

    async duplicateCard(userId: string, cardId: string, data: any) {
        const sourceCard = await CardRepository.findCardForDuplicate(cardId)
        if (!sourceCard) throw { status: Status.NOT_FOUND }

        const newCard = await CardRepository.duplicateCard(sourceCard, data.targetListId, data.title)

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_DUPLICATED,
            boardId: sourceCard.list.board.id,
            cardId: newCard.id,
            actorId: userId,
            payload: { title: newCard.title, sourceCardTitle: sourceCard.title, listName: sourceCard.list.title }
        })

        return newCard
    }

    async uploadAttachmentFromUrl(cardId: string, fileUrl: string, fileName: string, userId: string, publicId: string) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw new Error('Card not found')

        const attachment = await attachmentRepo.save({
            fileName,
            fileUrl,
            card,
            uploadedBy: { id: userId } as any,
            publicId
        })

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_ATTACHMENT_ADDED,
            boardId: card.list.board.id,
            cardId,
            actorId: userId,
            payload: { fileName, cardTitle: card.title, listName: card.list.title }
        })

        return attachment
    }

    async deleteAttachment(attachmentId: string, userId: string) {
        const attachment = await attachmentRepo.findOne({
            where: { id: attachmentId },
            relations: ['card', 'card.list', 'card.list.board']
        })

        if (!attachment) throw { status: Status.NOT_FOUND }

        await attachmentRepo.remove(attachment)

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_ATTACHMENT_REMOVED,
            boardId: attachment.card.list.board.id,
            cardId: attachment.card.id,
            actorId: userId,
            payload: {
                fileName: attachment.fileName,
                cardTitle: attachment.card.title,
                listName: attachment.card.list.title
            }
        })
    }

    async getListOnCard(userId: string, cardId: string) {
        const list = await CardRepository.getListByCardId(cardId)
        if (!list) {
            throw { status: Status.NOT_FOUND, message: 'Card not found' }
        }

        return list
    }

    async getCardsDueSoon(userId: string) {
        const now = new Date()
        const dueSoon = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

        return cardRepo
            .createQueryBuilder('card')
            .leftJoinAndSelect('card.list', 'list')
            .leftJoinAndSelect('list.board', 'board')
            .leftJoin('board.boardMembers', 'boardMember')
            .where('(board.ownerId = :userId OR boardMember.userId = :userId)', { userId })
            .andWhere('card.isArchived = :isArchived', { isArchived: false })
            .andWhere('card.dueDate IS NOT NULL')
            .andWhere('card.dueDate BETWEEN :now AND :dueSoon', { now, dueSoon })
            .orderBy('card.dueDate', 'ASC')
            .getMany()
    }

    async getAssignedCards(userId: string, query: any) {
        const page = Math.max(1, Number(query?.page) || 1)
        const limit = Math.max(1, Number(query?.limit) || 10)
        const boardId = query?.boardId as string | undefined
        const status = (query?.status as string | undefined) || 'active'

        const qb = cardRepo
            .createQueryBuilder('card')
            .leftJoinAndSelect('card.list', 'list')
            .leftJoinAndSelect('list.board', 'board')
            .innerJoin('card.cardMembers', 'cardMember')
            .innerJoin('cardMember.user', 'assignedUser', 'assignedUser.id = :userId', { userId })

        if (boardId) {
            qb.andWhere('board.id = :boardId', { boardId })
        }

        if (status === 'archived') {
            qb.andWhere('card.isArchived = :isArchived', { isArchived: true })
        } else if (status === 'active') {
            qb.andWhere('card.isArchived = :isArchived', { isArchived: false })
        }

        return qb
            .orderBy('card.updatedAt', 'DESC')
            .skip((page - 1) * limit)
            .take(limit)
            .getMany()
    }

    async globalSearch(userId: string, keyword: string) {
        if (!keyword) {
            return []
        }

        const wildKeyword = `%${keyword}%`

        return cardRepo
            .createQueryBuilder('card')
            .leftJoinAndSelect('card.list', 'list')
            .leftJoinAndSelect('list.board', 'board')
            .leftJoin('board.boardMembers', 'boardMember')
            .where('(board.ownerId = :userId OR boardMember.userId = :userId)', { userId })
            .andWhere('card.isArchived = :isArchived', { isArchived: false })
            .andWhere('(card.title ILIKE :keyword OR card.description ILIKE :keyword)', {
                keyword: wildKeyword
            })
            .orderBy('card.updatedAt', 'DESC')
            .take(10)
            .getMany()
    }

    async getUnassignedMembers(cardId: string) {
        const card = await cardRepo.findOne({
            where: { id: cardId },
            relations: ['list', 'list.board', 'cardMembers', 'cardMembers.user']
        })

        if (!card?.list?.board?.id) {
            throw { status: Status.NOT_FOUND, message: 'Card not found' }
        }

        const boardMembers = await BoardRepository.findMemberByBoardId(card.list.board.id)
        const assignedMemberIds = new Set((card.cardMembers || []).map((member) => member.user.id))

        return boardMembers
            .filter((member) => !assignedMemberIds.has(member.user.id))
            .map((member) => ({
                userId: member.user.id,
                username: member.user.username,
                avatarUrl: member.user.avatarUrl,
                fullName: member.user.fullName,
                email: member.user.email,
                role: member.role?.name || 'board_member'
            }))
    }

    async getCardsInBoard(userId: string, boardId: string) {
        return CardRepository.getCardsByBoardId(boardId)
    }

    async addMemberToCard(userId: string, cardId: string, memberId: string) {
        const boardId = await cardRepository.getBoardIdFromCard(cardId)

        const newMember = await cardRepository.addMemberToCard(cardId, memberId)
        const card = await CardRepository.findById(cardId)

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_MEMBER_ASSIGNED,
            boardId,
            cardId,
            actorId: userId,
            payload: {
                memberId,
                listName: card?.list?.title,
                cardTitle: card?.title
            }
        })

        return newMember
    }

    async removeMemberFromCard(userId: string, cardId: string, memberId: string) {
        const boardId = await cardRepository.getBoardIdFromCard(cardId)

        await cardRepository.removeMemberFromCard(cardId, memberId)

        const card = await CardRepository.findById(cardId)
        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_MEMBER_REMOVED,
            boardId,
            cardId,
            actorId: userId,
            payload: {
                memberId,
                listName: card?.list?.title,
                cardTitle: card?.title
            }
        })
    }
}

export default new CardService()
