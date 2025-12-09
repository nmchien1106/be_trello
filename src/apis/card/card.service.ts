import CardRepository from './card.repository';
import ListRepository from '../list/list.repository';
import BoardRepository from '../board/board.repository';
import { CreateCardDto } from './card.dto';
import { Status } from '@/types/response';
import { Permissions } from '@/enums/permissions.enum';

export class CardService {
    async createCard(data: CreateCardDto, userId: string) {
        const list = await ListRepository.findById(data.listId);
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' };

        const hasPerm = await BoardRepository.hasPermission(userId, list.board.id, Permissions.CREATE_CARD);
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'You do not have permission to create card' };

        try {
            const card = await CardRepository.createCard(data);
            return {
                status: Status.CREATED,
                message: 'Card created successfully',
                data: card
            };
        } catch (error: any) {
            throw { status: Status.BAD_REQUEST, message: error.message };
        }
    }

    async getCardsByList(listId: string, userId: string) {
        const list = await ListRepository.findById(listId);
        if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' };

        const hasPerm = await BoardRepository.hasPermission(userId, list.board.id, Permissions.READ_BOARD);
        if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'Permission denied' };

        const cards = await CardRepository.getCardsByListId(listId);
        return {
            status: Status.OK,
            message: 'Get cards successfully',
            data: cards
        };
    }
}