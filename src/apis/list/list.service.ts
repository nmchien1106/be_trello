import AppDataSource from '@/config/typeorm.config'
import ListRepository from './list.repository'
import BoardRepository from '../board/board.repository'
import { CreateListDto, UpdateListDto } from './list.dto'
import { Status } from '@/types/response'
import { List } from '@/entities/list.entity'
import { Config } from '@/config/config'
import { calcPosition } from '@/utils/calcPosition'

import { EventBus } from '@/events/event-bus'
import { DomainEvent } from '@/events/interface'
import { EventType } from '@/enums/event-type.enum'
import crypto from 'crypto'

export class ListService {
    async createList(data: CreateListDto, userId: string) {
        if (!userId) throw { status: Status.UNAUTHORIZED, message: 'User info missing' }

        try {
            return await AppDataSource.transaction(async (manager) => {
                const board = await BoardRepository.getBoardById(data.boardId)
                if (!board) throw { status: Status.NOT_FOUND, message: 'Board not found' }

                const lastList = await manager.findOne(List, {
                    where: { board: { id: data.boardId } },
                    order: { position: 'DESC' },
                    lock: { mode: 'pessimistic_write' }
                })

                const newPosition = lastList ? lastList.position + Config.defaultGap : Config.defaultGap

                const newList = manager.create(List, {
                    title: data.title,
                    board: board,
                    position: newPosition
                })

                const savedList = await manager.save(newList)

                const event: DomainEvent = {
                    eventId: crypto.randomUUID(),
                    type: EventType.LIST_CREATED,
                    boardId: board.id,
                    actorId: userId,
                    payload: { title: savedList.title }
                }
                EventBus.publish(event)

                return {
                    status: Status.CREATED,
                    message: 'List created successfully',
                    data: savedList
                }
            })
        } catch (error: any) {
            throw { status: error.status || Status.BAD_REQUEST, message: error.message || 'Create list failed' }
        }
    }

    async getListById(id: string, userId: string) {
        const list = await ListRepository.findById(id)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        return { status: Status.OK, message: 'Get list successfully', data: list }
    }

    async updateList(id: string, data: UpdateListDto, userId: string) {
        const list = await ListRepository.findById(id)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        const updated = await ListRepository.updateList(id, data)

        const event: DomainEvent = {
            eventId: crypto.randomUUID(),
            type: EventType.LIST_UPDATED,
            boardId: list.board.id,
            listId: id,
            actorId: userId,
            payload: { changes: data }
        }
        EventBus.publish(event)

        return { status: Status.OK, message: 'List updated successfully', data: updated }
    }

    async deleteList(id: string, userId: string) {
        const list = await ListRepository.findById(id)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        await ListRepository.deleteList(id)

        const event: DomainEvent = {
            eventId: crypto.randomUUID(),
            type: EventType.LIST_DELETED,
            boardId: list.board.id,
            listId: id,
            actorId: userId,
            payload: { title: list.title }
        }
        EventBus.publish(event)

        return { status: Status.OK, message: 'List deleted permanently' }
    }

    async reorderList(
        userId: string,
        listId: string,
        data: { beforeId: string | null; afterId: string | null; boardId: string }
    ) {
        const list = await ListRepository.findListById(listId)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        if (list.boardId !== data.boardId) {
            throw { status: Status.BAD_REQUEST, message: 'List does not belong to the specified board' }
        }

        const beforeList = data.beforeId ? await ListRepository.findListById(data.beforeId) : null
        const afterList = data.afterId ? await ListRepository.findListById(data.afterId) : null

        const newPosition = await calcPosition(
            beforeList?.position ?? null,
            afterList?.position ?? null,
            data.boardId,
            'list'
        )

        await ListRepository.updateList(listId, { position: newPosition })

        const event: DomainEvent = {
            eventId: crypto.randomUUID(),
            type: EventType.LIST_REORDERED,
            boardId: data.boardId,
            listId: listId,
            actorId: userId,
            payload: {
                beforeId: data.beforeId ?? null,
                afterId: data.afterId ?? null
            }
        }
        EventBus.publish(event)

        const updated = await ListRepository.getAllListsInBoard(data.boardId)

        return { status: Status.OK, message: 'List reordered successfully', data: updated }
    }

    async moveListToAnotherBoard(
        userId: string,
        listId: string,
        data: { targetBoardId: string; beforeId?: string | null; afterId?: string | null }
    ) {
        const list = await ListRepository.findById(listId)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        const sourceBoardId = list.board.id

        let newPosition: number

        if (data.beforeId !== undefined || data.afterId !== undefined) {
            const beforeList = data.beforeId ? await ListRepository.findListById(data.beforeId) : null
            const afterList = data.afterId ? await ListRepository.findListById(data.afterId) : null

            newPosition = await calcPosition(
                beforeList?.position ?? null,
                afterList?.position ?? null,
                data.targetBoardId,
                'list'
            )
        } else {
            const maxPos = await ListRepository.getHighestPositionInBoard(data.targetBoardId)
            newPosition = (maxPos !== null ? maxPos : 0) + Config.defaultGap
        }

        const updated = await ListRepository.updateList(listId, {
            boardId: data.targetBoardId,
            position: newPosition
        })

        const event: DomainEvent = {
            eventId: crypto.randomUUID(),
            type: EventType.LIST_MOVED,
            boardId: sourceBoardId,
            listId: listId,
            actorId: userId,
            payload: {
                fromBoardId: sourceBoardId,
                toBoardId: data.targetBoardId
            }
        }
        EventBus.publish(event)

        return { status: Status.OK, message: 'List moved successfully', data: updated }
    }

    async duplicateList(userId: string, listId: string, targetBoardId: string, title?: string) {
        const sourceList = await ListRepository.findById(listId)
        if (!sourceList) throw { status: Status.NOT_FOUND, message: 'Source list not found' }

        const newList = await ListRepository.duplicateList(listId, targetBoardId, title, userId)

        const event: DomainEvent = {
            eventId: crypto.randomUUID(),
            type: EventType.LIST_DUPLICATED,
            boardId: targetBoardId,
            listId: newList.id,
            actorId: userId,
            payload: { sourceListId: listId }
        }
        EventBus.publish(event)

        return { status: Status.CREATED, message: 'List duplicated successfully', data: newList }
    }
}

export default new ListService()