import { Card } from '@/entities/card.entity';
import { List } from '@/entities/list.entity';
import AppDataSource from '@/config/typeorm.config';

class CardRepository {
  private repo = AppDataSource.getRepository(Card);

  async createCard(data: { title: string; listId: string; description?: string | null; coverUrl?: string | null; dueDate?: string | null; priority?: 'low' | 'medium' | 'high' }) {
    return await AppDataSource.transaction(async (manager) => {
      const list = await manager.findOne(List, { where: { id: data.listId } });
      if (!list) {
        const e: any = new Error('List not found');
        e.status = 404;
        throw e;
      }

      const lastCard = await manager.findOne(Card, {
        where: { list: { id: data.listId } },
        order: { position: 'DESC' }
      });

      const lastPos = lastCard && typeof lastCard.position === 'number' ? lastCard.position : -1;
      const newPosition = lastPos + 1;

      const dueDateVal = data.dueDate ? new Date(data.dueDate) : null;

      const newCard = manager.create(Card, {
        title: data.title,
        position: newPosition,
        list: list,
        description: data.description ?? null,
        coverUrl: data.coverUrl ?? null,
        dueDate: dueDateVal,
        priority: data.priority ?? 'medium'
      });

      return await manager.save(newCard);
    });
  }

  async getCardsByListId(listId: string) {
    return await this.repo.find({
      where: { list: { id: listId } },
      order: { position: 'ASC' }
    });
  }

  async deleteCardsByListId(listId: string, manager?: any) {
    if (manager) {
      await manager.delete(Card, { list: { id: listId } });
    } else {
      await AppDataSource.getRepository(Card).delete({ list: { id: listId } });
    }
  }

  async findById(id: string) {
    return await this.repo.findOne({
        where: { id },
        relations: ['list', 'list.board']
    });
}

  async updateCard(id: string, data: any) {
    await this.repo.update(id, data);
    return this.repo.findOneBy({ id });
}

  async deleteCard(id: string) {
    await this.repo.delete(id);
}
}

export default new CardRepository();
