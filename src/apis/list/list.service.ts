import AppDataSource from '@/config/typeorm.config'
import ListRepository from './list.repository'
import BoardRepository from '../board/board.repository'
import { CreateListDto, UpdateListDto } from './list.dto'
import { Status } from '@/types/response'
import { Permissions } from '@/enums/permissions.enum'
import { List } from '@/entities/list.entity'
import { Config } from '@/config/config'
import { calcPosition } from '@/utils/calcPosition'

export class ListService {
    
    private async checkPermission(userId: string, boardId: string, permission: string) {
        const hasPerm = await BoardRepository.hasPermission(userId, boardId, permission)
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: `Permission denied: ${permission}` }
    }

    async createList(data: CreateListDto, userId: string) {
        if (!userId) throw { status: Status.UNAUTHORIZED, message: 'User info missing' }

        await this.checkPermission(userId, data.boardId, Permissions.CREATE_LIST)

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
                    position: newPosition,
                })

                const savedList = await manager.save(newList)
                
                return {
                    status: Status.CREATED,
                    message: 'List created successfully',
                    data: savedList
                }
                // --------------------
            })
        } catch (error: any) {
            throw { status: error.status || Status.BAD_REQUEST, message: error.message || 'Create list failed' }
        }
    }

    async getListById(id: string, userId: string) {
        const list = await ListRepository.findById(id)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }
        
        await this.checkPermission(userId, list.board.id, Permissions.READ_BOARD)

        return { status: Status.OK, message: 'Get list successfully', data: list }
    }

    async updateList(id: string, data: UpdateListDto, userId: string) {
        const list = await ListRepository.findById(id)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        await this.checkPermission(userId, list.board.id, Permissions.UPDATE_LIST)

        const updated = await ListRepository.updateList(id, data)
        return { status: Status.OK, message: 'List updated successfully', data: updated }
    }

    async deleteList(id: string, userId: string) {
        const list = await ListRepository.findById(id)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        await this.checkPermission(userId, list.board.id, Permissions.DELETE_LIST)

        await ListRepository.deleteList(id)
        return { status: Status.OK, message: 'List deleted permanently' }
    }

    async reorderList(userId: string, listId: string, data: { beforeId: string | null, afterId: string | null, boardId: string }) {
        const list = await ListRepository.findListById(listId)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }

        if (list.boardId !== data.boardId) {
             throw { status: Status.BAD_REQUEST, message: 'List does not belong to the specified board' }
        }

        await this.checkPermission(userId, data.boardId, Permissions.UPDATE_BOARD)

        const beforeList = data.beforeId ? await ListRepository.findListById(data.beforeId) : null
        const afterList = data.afterId ? await ListRepository.findListById(data.afterId) : null

        const newPosition = await calcPosition(
            beforeList?.position ?? null, 
            afterList?.position ?? null, 
            data.boardId,
            'list'
        )

        const updated = await ListRepository.updateList(listId, { position: newPosition })
        return { status: Status.OK, message: 'List reordered successfully', data: updated }
    }

    async moveListToAnotherBoard(
        userId: string, 
        listId: string, 
        data: { targetBoardId: string, beforeId?: string | null, afterId?: string | null }
    ) {
        const list = await ListRepository.findById(listId)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }
        const sourceBoardId = list.board.id

        await this.checkPermission(userId, sourceBoardId, Permissions.UPDATE_BOARD)

        if (sourceBoardId !== data.targetBoardId) {
            await this.checkPermission(userId, data.targetBoardId, Permissions.UPDATE_BOARD)
        }

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

        return { status: Status.OK, message: 'List moved successfully', data: updated }
    }

    async duplicateList(userId: string, listId: string, targetBoardId: string, title?: string) {
        const sourceList = await ListRepository.findById(listId)
        if (!sourceList) throw { status: Status.NOT_FOUND, message: 'Source list not found' }

        await this.checkPermission(userId, sourceList.board.id, Permissions.READ_BOARD)
        
        await this.checkPermission(userId, targetBoardId, Permissions.CREATE_LIST)

        const newList = await ListRepository.duplicateList(listId, targetBoardId, title, userId)

        return { status: Status.CREATED, message: 'List duplicated successfully', data: newList }
    }
}

export default new ListService()