import { List } from '@/entities/list.entity';
import { Card } from '@/entities/card.entity';
import AppDataSource from '@/config/typeorm.config';
import { Board } from '@/entities/board.entity';

class ListRepository {
  private repo = AppDataSource.getRepository(List);

  async findById(id: string) {
    return await this.repo.findOne({
      where: { id },
      relations: ['board'],
      select: {
        id: true,
        title: true,
        position: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        board: {
          id: true,
        },
      },
    });
  }

  async createList(data: { title: string; boardId: string }) {
    return await AppDataSource.transaction(async (manager) => {
      const board = await manager.findOne(Board, { where: { id: data.boardId } });
      if (!board) {
        const e: any = new Error('Board not found');
        e.status = 404;
        throw e;
      }

      const lastList = await manager.findOne(List, {
        where: { board: { id: data.boardId } },
        order: { position: 'DESC' },
      });

      const lastPos = lastList && typeof lastList.position === 'number' ? lastList.position : -1;
      const newPosition = lastPos + 1;

      const newList = manager.create(List, {
        title: data.title,
        position: newPosition,
        board: board,
      });

      return await manager.save(newList);
    });
  }

  async updateList(id: string, data: Partial<List>) {
    await this.repo.update(id, data);
    return await this.findById(id);
  }

  async getListDetail(id: string) {
    return await this.repo.findOne({
      where: { id },
      relations: ['cards', 'board'],
      order: { cards: { position: 'ASC' } },
      select: {
        id: true,
        title: true,
        position: true,
        isArchived: true,
        createdAt: true,
        updatedAt: true,
        board: {
          id: true,
        },
        cards: {
            id: true,
            title: true,
            position: true,
            coverUrl: true,
            priority: true,
            dueDate: true,
            description: true,
            isArchived: true
        } as any
      },
    });
  }

  async deleteList(id: string) {
    return await AppDataSource.transaction(async (manager) => {
      await manager.delete(Card, { list: { id } });
      await manager.delete(List, { id });
      return true;
    });
  }
}

export default new ListRepository();