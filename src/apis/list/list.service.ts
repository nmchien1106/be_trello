import ListRepository from './list.repository';
import BoardRepository from '../board/board.repository'; 
import { CreateListDto, UpdateListDto } from './list.dto';
import { Status } from '@/types/response';
import { Permissions } from '@/enums/permissions.enum';

export class ListService {
    async createList(data: CreateListDto, userId: string) {
        const hasPerm = await BoardRepository.hasPermission(userId, data.boardId, Permissions.CREATE_LIST);
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'You do not have permission to create list' };

        try {
            const list = await ListRepository.createList(data);
            return {
                status: Status.CREATED,
                message: 'List created successfully',
                data: list
            };
        } catch (error: any) {
            throw { status: Status.BAD_REQUEST, message: error.message };
        }
    }

    async getListById(id: string, userId: string) {
        const list = await ListRepository.getListDetail(id);
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' };

        const hasPerm = await BoardRepository.hasPermission(userId, list.board.id, Permissions.READ_BOARD);
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'Permission denied' };

        return {
            status: Status.OK,
            message: 'Get list successfully',
            data: list
        };
    }

    async updateList(id: string, data: UpdateListDto, userId: string) {
        const list = await ListRepository.findById(id);
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' };

        const hasPerm = await BoardRepository.hasPermission(userId, list.board.id, Permissions.UPDATE_LIST);
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'Permission denied' };

        const updated = await ListRepository.updateList(id, data);
        return {
            status: Status.OK,
            message: 'List updated successfully',
            data: updated
        };
    }

    async deleteList(id: string, userId: string) {
        const list = await ListRepository.findById(id);
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' };

        const hasPerm = await BoardRepository.hasPermission(userId, list.board.id, Permissions.DELETE_LIST);
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'Only Admin can delete list' };

        await ListRepository.deleteList(id);
        return {
            status: Status.OK,
            message: 'List deleted permanently'
        };
    }
}