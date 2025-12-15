import CardRepository from './card.repository';
import ListRepository from '../list/list.repository';
import BoardRepository from '../board/board.repository';
import { CreateCardDto } from './card.dto';
import { Status } from '@/types/response';
import { Permissions } from '@/enums/permissions.enum';

export class CardService {
  async createCard(data: CreateCardDto, userId: string) {
    if (!userId) throw { status: Status.UNAUTHORIZED, message: 'User info missing' };

    const list = await ListRepository.findById(data.listId);
    if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' };

    const hasPerm = await BoardRepository.hasPermission(userId, list.board.id, Permissions.CREATE_CARD);
    if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'You do not have permission to create card' };

    try {
      const card = await CardRepository.createCard(data as any);
      return { status: Status.CREATED, message: 'Card created successfully', data: card };
    } catch (error: any) {
      throw { status: error.status || Status.BAD_REQUEST, message: error.message || 'Create card failed' };
    }
  }

  async getCardsByList(listId: string, userId: string) {
    if (!userId) throw { status: Status.UNAUTHORIZED, message: 'User info missing' };

    const list = await ListRepository.findById(listId);
    if (!list) throw { status: Status.NOT_FOUND, message: 'List not found' };

    const hasPerm = await BoardRepository.hasPermission(userId, list.board.id, Permissions.READ_BOARD);
    if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'Permission denied' };

    const cards = await CardRepository.getCardsByListId(listId);
    return { status: Status.OK, message: 'Get cards successfully', data: cards };
  }

  async updateCard(cardId: string, data: any, userId: string) {
    const card = await CardRepository.findById(cardId);
    if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' };

    const hasPerm = await BoardRepository.hasPermission(userId, card.list.board.id, Permissions.UPDATE_CARD);
    if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'Permission denied' };

    const updated = await CardRepository.updateCard(cardId, data);
    return {
        status: Status.OK,
        message: 'Card updated successfully',
        data: updated
    };
}

  async deleteCard(cardId: string, userId: string) {
    const card = await CardRepository.findById(cardId);
    if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' };

    const hasPerm = await BoardRepository.hasPermission(userId, card.list.board.id, Permissions.DELETE_CARD);
    if (!hasPerm) throw { status: Status.FORBIDDEN, message: 'Only Admin can delete card' };

    await CardRepository.deleteCard(cardId);
    return {
        status: Status.OK,
        message: 'Card deleted permanently'
    };
}
}


export default new CardService();