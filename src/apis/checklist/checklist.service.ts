import ChecklistRepository from './checklist.repository'
import CardRepository from '../card/card.repository'
import { Status } from '@/types/response'

export class ChecklistService {
    async createChecklist(userId: string, data: { title: string; cardId: string }) {
        const card = await CardRepository.findById(data.cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        const checklist = await ChecklistRepository.createChecklist(data.title, data.cardId)
        return { status: Status.CREATED, message: 'Checklist created', data: checklist }
    }

    async getChecklistsOnCard(userId: string, cardId: string) {
        const card = await CardRepository.findById(cardId)
        if (!card) throw { status: Status.NOT_FOUND, message: 'Card not found' }

        const checklists = await ChecklistRepository.findAllByCardId(cardId)
        return { status: Status.OK, message: 'Checklists retrieved', data: checklists }
    }

    async updateChecklist(userId: string, checklistId: string, title: string) {
        const checklist = await ChecklistRepository.findChecklistById(checklistId)
        if (!checklist) throw { status: Status.NOT_FOUND, message: 'Checklist not found' }

        const updated = await ChecklistRepository.updateChecklist(checklistId, title)
        return { status: Status.OK, message: 'Checklist updated', data: updated }
    }

    async deleteChecklist(userId: string, checklistId: string) {
        const checklist = await ChecklistRepository.findChecklistById(checklistId)
        if (!checklist) throw { status: Status.NOT_FOUND, message: 'Checklist not found' }

        await ChecklistRepository.deleteChecklist(checklistId)
        return { status: Status.OK, message: 'Checklist deleted' }
    }

    async createItem(userId: string, data: { content: string; checklistId: string }) {
        const checklist = await ChecklistRepository.findChecklistById(data.checklistId)
        if (!checklist) throw { status: Status.NOT_FOUND, message: 'Checklist not found' }

        const item = await ChecklistRepository.createItem(data.content, data.checklistId)
        return { status: Status.CREATED, message: 'Item created', data: item }
    }

    async updateItem(userId: string, itemId: string, data: { content?: string; isChecked?: boolean }) {
        const item = await ChecklistRepository.findItemById(itemId)
        if (!item) throw { status: Status.NOT_FOUND, message: 'Item not found' }

        const updated = await ChecklistRepository.updateItem(itemId, data)
        return { status: Status.OK, message: 'Item updated', data: updated }
    }

    async deleteItem(userId: string, itemId: string) {
        const item = await ChecklistRepository.findItemById(itemId)
        if (!item) throw { status: Status.NOT_FOUND, message: 'Item not found' }

        await ChecklistRepository.deleteItem(itemId)
        return { status: Status.OK, message: 'Item deleted' }
    }
}

export default new ChecklistService()
