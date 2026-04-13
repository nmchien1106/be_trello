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
            dueDate: data.dueDate ? new Date(data.dueDate) : card.dueDate,
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
        const card = await CardRepository.findCardWithBoard(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

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

        const newPosition = await calcPosition(before?.position ?? null, after?.position ?? null, data.targetListId, 'card')

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

        const updated = await CardRepository.updateCard(cardId, {
            list: { id: targetList.id }
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
            payload: { fileName: attachment.fileName, cardTitle: attachment.card.title, listName: attachment.card.list.title }
        })
    }

    async addMemberToCard(userId: string, cardId: string, memberId: string) {
        const boardId = await cardRepository.getBoardIdFromCard(cardId)

        const newMember = await cardRepository.addMemberToCard(cardId, memberId)

        EventBus.publish({
            eventId: crypto.randomUUID(),
            type: EventType.CARD_MEMBER_ASSIGNED,
            boardId,
            cardId,
            actorId: userId,
            payload: { memberId, listName: newMember.card.list.title, cardTitle: newMember.card.title }
        })

        return newMember
    }
}

export default new CardService()