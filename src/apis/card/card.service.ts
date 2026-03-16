import AppDataSource from '@/config/typeorm.config'
import CardRepository from './card.repository'
import ListRepository from '../list/list.repository'
import BoardRepository from '../board/board.repository'
import { EventBus } from '@/events/event-bus'
import { DomainEvent } from '@/events/interface'
import { EventType } from '@/enums/event-type.enum'
import crypto from 'crypto'
import { CreateCardDto } from './card.dto'
import { Status } from '@/types/response'
import { Permissions } from '@/enums/permissions.enum'
import { Card } from '@/entities/card.entity'
import { Config } from '@/config/config'
import { calcPosition } from '@/utils/calcPosition'
import { Attachment } from '@/entities/attachment.entity'
import cloudinary from '@/config/cloundinary'
import { DeepPartial } from 'typeorm'
import { Between, Like } from 'typeorm'
import cardRepository from './card.repository'
import boardRepository from '../board/board.repository'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'application/pdf']

const attachmentRepo = AppDataSource.getRepository(Attachment)
const cardRepo = AppDataSource.getRepository(Card)

export class CardService {
    private async checkPermission(userId: string, boardId: string, permission: string) {
        const hasPerm = await BoardRepository.hasPermission(userId, boardId, permission)
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: `Permission denied: ${permission}` }
    }

    async createCard(data: CreateCardDto, userId: string) {
        if (!userId) throw { status: Status.UNAUTHORIZED, message: 'User info missing' }

        const list = await ListRepository.findById(data.listId)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        await this.checkPermission(userId, list.board.id, Permissions.CREATE_CARD)

        try {
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

                const saved = await manager.save(newCard)
                return saved
            })

            // publish card created event
            const event: DomainEvent = {
                eventId: crypto.randomUUID(),
                type: EventType.CARD_CREATED,
                boardId: list.board.id,
                cardId: savedCard.id,
                actorId: userId,
                payload: { title: savedCard.title }
            }
            EventBus.publish(event)

            return savedCard
        } catch (error: any) {
            throw { status: error.status || Status.BAD_REQUEST, message: error.message || 'Create card failed' }
        }
    }

    async updateCard(cardId: string, data: any, userId: string) {
        const card = await cardRepo.findOne({
            where: { id: cardId },
            relations: ['list', 'list.board']
        })

        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }
        await this.checkPermission(userId, card.list.board.id, Permissions.UPDATE_CARD)
        if (data.title !== undefined) card.title = data.title
        if (data.description !== undefined) card.description = data.description
        if (data.dueDate !== undefined) {
            card.dueDate = data.dueDate ? new Date(data.dueDate) : (null as any)
        }
        if (data.labels !== undefined) {
            card.labels = data.labels
        }
        if (data.priority !== undefined) card.priority = data.priority
        if (data.isArchived !== undefined) card.isArchived = data.isArchived
        const updated = await cardRepo.save(card)

        const updateEvent: DomainEvent = {
            eventId: crypto.randomUUID(),
            type: EventType.CARD_UPDATED,
            boardId: card.list.board.id,
            cardId: cardId,
            actorId: userId,
            payload: { changes: data }
        }
        EventBus.publish(updateEvent)
        return updated
    }

    async deleteCard(cardId: string, userId: string) {
        const card = await CardRepository.findCardWithBoard(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        await this.checkPermission(userId, card.list.board.id, Permissions.DELETE_CARD)

        await CardRepository.deleteCard(cardId)
        return
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

        // publish archive/restore event
        const evt: DomainEvent = {
            eventId: crypto.randomUUID(),
            type: isArchived ? EventType.CARD_ARCHIVED : EventType.CARD_RESTORED,
            boardId: card.list.board.id,
            cardId: cardId,
            actorId: userId,
            payload: { isArchived }
        }
        EventBus.publish(evt)

        return {
            status: Status.OK,
            message: isArchived ? 'Card archived' : 'Card unarchived',
            data: updated
        }
    }

    async reorderCard(
        userId: string,
        cardId: string,
        data: { beforeId: string | null; afterId: string | null; targetListId: string }
    ) {
        const card = await CardRepository.findCardWithBoard(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        await this.checkPermission(userId, card.list.board.id, Permissions.UPDATE_BOARD)

        const targetList = await ListRepository.findById(data.targetListId)
        if (!targetList) throw { status: Status.NOT_FOUND, message: 'Target list not found' }

        if (targetList.board.id !== card.list.board.id) {
            throw {
                status: Status.BAD_REQUEST,
                message: 'Target list must be in the same board. Use move API instead.'
            }
        }

        const beforeCard = data.beforeId ? await CardRepository.getCardById(data.beforeId) : null
        const afterCard = data.afterId ? await CardRepository.getCardById(data.afterId) : null

        const newPosition = await calcPosition(
            beforeCard?.position ?? null,
            afterCard?.position ?? null,
            data.targetListId,
            'card'
        )

        const updated = await CardRepository.updateCard(cardId, {
            position: newPosition
        })

        // publish reorder event
        const reorderEvent: DomainEvent = {
            eventId: crypto.randomUUID(),
            type: EventType.CARD_REORDERED,
            boardId: card.list.board.id,
            cardId: cardId,
            actorId: userId,
            payload: { beforeId: data.beforeId ?? null, afterId: data.afterId ?? null }
        }
        EventBus.publish(reorderEvent)

        return { status: Status.OK, message: 'Card reordered successfully', data: updated }
    }

    async moveCardToAnotherList(
        userId: string,
        cardId: string,
        data: { targetListId: string; beforeId?: string | null; afterId?: string | null; targetBoardId?: string }
    ) {
        const card = await CardRepository.findCardWithBoard(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }
        const sourceBoardId = card.list.board.id

        const targetList = await ListRepository.findById(data.targetListId)
        if (!targetList) throw { status: Status.NOT_FOUND, message: 'Target list not found' }

        const realTargetBoardId = targetList.board.id

        if (data.targetBoardId && data.targetBoardId !== realTargetBoardId) {
            throw {
                status: Status.BAD_REQUEST,
                message: `Target List does not belong to Target Board`
            }
        }

        await this.checkPermission(userId, sourceBoardId, Permissions.UPDATE_CARD)

        if (sourceBoardId !== realTargetBoardId) {
            await this.checkPermission(userId, realTargetBoardId, Permissions.CREATE_CARD)
        }

        let newPosition: number

        if (data.beforeId !== undefined || data.afterId !== undefined) {
            const beforeCard = data.beforeId ? await CardRepository.getCardById(data.beforeId) : null
            const afterCard = data.afterId ? await CardRepository.getCardById(data.afterId) : null

            newPosition = await calcPosition(
                beforeCard?.position ?? null,
                afterCard?.position ?? null,
                targetList.id, // Context là List đích
                'card'
            )
        } else {
            const maxPos = await CardRepository.getHighestPositionInList(targetList.id)
            newPosition = (maxPos !== null ? maxPos : 0) + Config.defaultGap
        }

        const updatedCard = await CardRepository.updateCard(cardId, {
            list: { id: targetList.id },
            position: newPosition
        })

        // publish move event
        const moveEvent: DomainEvent = {
            eventId: crypto.randomUUID(),
            type: EventType.CARD_MOVED,
            boardId: sourceBoardId,
            cardId: cardId,
            actorId: userId,
            payload: {
                fromListId: card.list.id,
                toListId: targetList.id,
                fromBoardId: sourceBoardId,
                toBoardId: realTargetBoardId
            }
        }
        EventBus.publish(moveEvent)

        return {
            status: Status.OK,
            message: sourceBoardId !== realTargetBoardId ? 'Card moved to another board' : 'Card moved to another list',
            data: updatedCard
        }
    }

    async moveCardToBoard(
        userId: string,
        cardId: string,
        data: { targetBoardId: string; targetListId: string; beforeId?: string | null; afterId?: string | null }
    ) {
        return this.moveCardToAnotherList(userId, cardId, data)
    }

    async duplicateCard(userId: string, cardId: string, data: { targetListId?: string; title?: string }) {
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

    async uploadCardBackground(cardId: string, file: Express.Multer.File) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }
        if (!file?.buffer) {
            throw {
                status: Status.BAD_REQUEST,
                message: 'Invalid file payload. Please upload multipart/form-data file.'
            }
        }

        const timestamp = Date.now()
        const publicId = `card_${cardId}_background_${timestamp}`

        const uploadResult = await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject({ status: Status.GATEWAY_TIMEOUT, message: 'Background upload timed out. Please try again.' })
            }, 30000)

            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: 'card-backgrounds',
                    public_id: publicId,
                    resource_type: 'image',
                    transformation: [{ width: 1500, height: 500, crop: 'limit' }]
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

        if (card.backgroundPublicId) {
            await cloudinary.uploader.destroy(card.backgroundPublicId).catch(() => null)
        }

        card.backgroundUrl = uploadResult.secure_url || uploadResult.url
        card.backgroundPublicId = uploadResult.public_id
        return await CardRepository.updateCard(cardId, {
            backgroundUrl: card.backgroundUrl,
            backgroundPublicId: card.backgroundPublicId
        })
    }

    async generatePresignedUrl(
        fileName: string,
        fileType: string,
        fileSize: number
    ): Promise<{ signature: string; apiKey: string; cloudName: string; timestamp: number; folder: string }> {
        const size = Number(fileSize)
        if (isNaN(size)) throw { status: 400, message: 'fileSize must be a number' }
        if (size > MAX_FILE_SIZE) throw { status: 400, message: 'File size exceeds the maximum limit' }
        if (!ALLOWED_TYPES.includes(fileType)) throw { status: 400, message: 'File type is not allowed' }

        const timestamp = Math.floor(new Date().getTime() / 1000) // in seconds
        const folder = 'cards'

        const paramsToSign = {
            timestamp,
            folder,
            tags: 'card-attachment'
        }

        const signature = cloudinary.utils.api_sign_request(paramsToSign, Config.cloudinaryApiSecret)

        return {
            signature,
            cloudName: Config.cloudinaryName,
            apiKey: Config.cloudinaryApiKey,
            timestamp,
            folder
        }
    }

    async uploadAttachmentFromUrl(cardId: string, fileUrl: string, fileName: string, userId: string, publicId: string) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw new Error('Card not found')

        const attachment = attachmentRepo.create({
            fileName,
            fileUrl,
            card,
            uploadedBy: { id: userId } as any,
            publicId
        })

        return await attachmentRepo.save(attachment)
    }

    async getAttachmentsByCard(cardId: string) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw new Error('Card not found')
        const attachments = await attachmentRepo.find({
            where: { card: { id: cardId } }
        })
        return attachments
    }

    async getListOnCard(userId: string, cardId: string) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        const list = await CardRepository.getListByCardId(cardId)

        if (!list) {
            throw { status: Status.NOT_FOUND, message: 'List not found for this card' }
        }

        return {
            status: Status.OK,
            message: 'Get list of card successfully',
            data: list
        }
    }

    async deleteAttachment(attachmentId: string) {
        const attachment = await attachmentRepo.findOne({
            where: { id: attachmentId },
            relations: ['card']
        })

        if (!attachment) {
            throw { status: Status.NOT_FOUND, message: 'Attachment not found' }
        }

        if (attachment.publicId) {
            await cloudinary.uploader.destroy(attachment.publicId)
        }

        await attachmentRepo.remove(attachment)
        return
    }

    async getCardsDueSoon(userId: string) {
        const today = new Date()
        const nextWeek = new Date()
        nextWeek.setDate(today.getDate() + 7)

        return await cardRepo.find({
            where: {
                cardMembers: { user: { id: userId } },
                isArchived: false,
                dueDate: Between(today, nextWeek)
            },
            relations: ['list', 'list.board'],
            order: { dueDate: 'ASC' }
        })
    }

    async getAssignedCards(userId: string, query: any) {
        return await cardRepo.find({
            where: {
                cardMembers: { user: { id: userId } },
                isArchived: false
            },
            relations: ['list', 'list.board'],
            order: { createdAt: 'DESC' },
            take: 20
        })
    }

    async globalSearch(userId: string, keyword: string) {
        if (!keyword) return []
        return await cardRepo.find({
            where: [
                { title: Like(`%${keyword}%`), cardMembers: { user: { id: userId } }, isArchived: false },
                { description: Like(`%${keyword}%`), cardMembers: { user: { id: userId } }, isArchived: false }
            ],
            relations: ['list', 'list.board'],
            take: 10
        })
    }

    addMemberToCard = async (userId: string, cardId: string, memberId: string) => {
        const boardId: string = await cardRepository.getBoardIdFromCard(cardId)
        const isMemberOfBoard = await boardRepository.findMemberByUserId(boardId, memberId)

        if (!isMemberOfBoard) {
            throw { status: Status.BAD_REQUEST, message: 'User is not a member of the board' }
        }

        const result = await cardRepository.findMemberById(cardId, memberId)
        if (result) {
            throw { status: Status.BAD_REQUEST, message: 'Member already added to card' }
        }
        const newMember = await cardRepository.addMemberToCard(cardId, memberId)

        // EventBus
        const updateEvent: DomainEvent = {
            eventId: crypto.randomUUID(),
            type: EventType.CARD_MEMBER_ASSIGNED,
            boardId: boardId,
            cardId: cardId,
            actorId: userId,
            payload: { memberId: memberId }
        }
        EventBus.publish(updateEvent)

        return {
            status: Status.CREATED,
            message: 'Member added to card successfully',
            data: newMember
        }
    }

    getUnassignedMembers = async (cardId: string) => {
        const boardId: string = await cardRepository.getBoardIdFromCard(cardId)
        const members = await boardRepository.findMemberByBoardId(boardId)
        const cardMembers = await cardRepository.getMembersOfCard(cardId)
        const cardMemberIds = cardMembers.map((cm) => cm.user.id)
        const result = members
            .filter((m) => !cardMemberIds.includes(m.user.id))
            .map((m) => ({
                userId: m.user.id,
                username: m.user.username,
                email: m.user.email,
                avatarUrl: m.user.avatarUrl,
                role: m.role.name || 'card_member',
                fullName: m.user.fullName
            }))
        return result
    }
}

export default new CardService()
