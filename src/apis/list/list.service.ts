import AppDataSource from '@/config/typeorm.config'
import ListRepository from './list.repository'
import BoardRepository from '../board/board.repository'
import { CreateListDto, UpdateListDto } from './list.dto'
import { Status } from '@/types/response'
import { Permissions } from '@/enums/permissions.enum'
import { List } from '@/entities/list.entity'
import { Config } from '@/config/config'

export class ListService {
    private validateUser(userId: string) {
        if (!userId) throw { status: Status.UNAUTHORIZED, message: 'User info missing' }
    }

    private async getListAndCheckPermission(listId: string, userId: string, permission: string) {
        const list = await ListRepository.findById(listId)
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' }
        if (!list.board)
            throw { status: Status.INTERNAL_SERVER_ERROR, message: 'Data integrity error: List has no board' }

        const hasPerm = await BoardRepository.hasPermission(userId, list.board.id, permission)
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'Permission denied' }

        return list
    }

    async createList(data: CreateListDto, userId: string) {
        this.validateUser(userId)

        const hasPerm = await BoardRepository.hasPermission(userId, data.boardId, Permissions.CREATE_LIST)
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'You do not have permission to create list' }

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

                return {
                    status: Status.CREATED,
                    message: 'List created successfully',
                    data: {
                        id: savedList.id,
                        title: savedList.title,
                        position: savedList.position,
                        isArchived: savedList.isArchived,
                        createdAt: savedList.createdAt,
                        updatedAt: savedList.updatedAt,
                        board: {
                            id: savedList.board.id
                        },
                        owner: {
                            id: userId
                        }
                    }
                }
            })
        } catch (error: any) {
            throw { status: error.status || Status.BAD_REQUEST, message: error.message || 'Create list failed' }
        }
    }

    async getListById(id: string, userId: string) {
        this.validateUser(userId)
        const list = await this.getListAndCheckPermission(id, userId, Permissions.READ_BOARD)

        return {
            status: Status.OK,
            message: 'Get list successfully',
            data: list
        }
    }

    async updateList(id: string, data: UpdateListDto, userId: string) {
        this.validateUser(userId)
        await this.getListAndCheckPermission(id, userId, Permissions.UPDATE_LIST)

        const updated = await ListRepository.updateList(id, data)
        return {
            status: Status.OK,
            message: 'List updated successfully',
            data: updated
        }
    }

    async deleteList(id: string, userId: string) {
        this.validateUser(userId)
        await this.getListAndCheckPermission(id, userId, Permissions.DELETE_LIST)

        await ListRepository.deleteList(id)
        return {
            status: Status.OK,
            message: 'List deleted permanently'
        }
    }
}

export default new ListService()
