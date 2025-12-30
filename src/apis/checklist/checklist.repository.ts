import { Checklist } from '@/entities/checklist.entity'
import { ChecklistItem } from '@/entities/checklist-item.entity'
import { Card } from '@/entities/card.entity'
import AppDataSource from '@/config/typeorm.config'

class ChecklistRepository {
    private checklistRepo = AppDataSource.getRepository(Checklist)
    private itemRepo = AppDataSource.getRepository(ChecklistItem)
    private cardRepo = AppDataSource.getRepository(Card)

    async createChecklist(title: string, cardId: string) {
        const card = await this.cardRepo.findOneBy({ id: cardId })
        if (!card) throw new Error('Card not found')

        const checklist = this.checklistRepo.create({ title, card })
        return await this.checklistRepo.save(checklist)
    }

    async findAllByCardId(cardId: string) {
        return await this.checklistRepo.find({
            where: { card: { id: cardId } },
            relations: ['items'],
            order: { createdAt: 'ASC', items: { position: 'ASC' } }
        })
    }

    async findChecklistById(id: string) {
        return await this.checklistRepo.findOne({
            where: { id },
            relations: ['card', 'card.list', 'card.list.board'] // Load relations để check quyền
        })
    }

    async updateChecklist(id: string, title: string) {
        await this.checklistRepo.update(id, { title })
        return this.findChecklistById(id)
    }

    async deleteChecklist(id: string) {
        await this.checklistRepo.delete(id)
    }

    async createItem(content: string, checklistId: string) {
        const checklist = await this.findChecklistById(checklistId)
        if (!checklist) throw new Error('Checklist not found')

        const lastItem = await this.itemRepo.findOne({
            where: { checklist: { id: checklistId } },
            order: { position: 'DESC' }
        })
        const position = lastItem ? lastItem.position + 1 : 1

        const item = this.itemRepo.create({ content, checklist, position })
        return await this.itemRepo.save(item)
    }

    async findItemById(id: string) {
        return await this.itemRepo.findOne({
            where: { id },
            relations: ['checklist', 'checklist.card', 'checklist.card.list', 'checklist.card.list.board']
        })
    }

    async updateItem(id: string, data: { content?: string; isChecked?: boolean }) {
        await this.itemRepo.update(id, data)
        return this.findItemById(id)
    }

    async deleteItem(id: string) {
        await this.itemRepo.delete(id)
    }
}

export default new ChecklistRepository()