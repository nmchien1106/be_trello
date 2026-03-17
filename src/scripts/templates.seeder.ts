import { DataSource } from 'typeorm'
import { Board } from '../entities/board.entity'
import { List } from '../entities/list.entity'
import { Card } from '../entities/card.entity'
import { User } from '../entities/user.entity'

export class SeedTemplates {
    constructor(private dataSource: DataSource) {}

    async init() {
        const boardRepo = this.dataSource.getRepository(Board)
        const listRepo = this.dataSource.getRepository(List)
        const cardRepo = this.dataSource.getRepository(Card)
        const userRepo = this.dataSource.getRepository(User)

        const admin = await userRepo.findOne({ where: {} })
        if (!admin) {
            console.warn('No users found. Cannot seed templates.')
            return
        }

        const templates = [
            {
                title: 'Project Management',
                description: 'Manage any project from start to finish with this template.',
                category: 'Project Management',
                backgroundPath: 'https://images.unsplash.com/photo-1454165833767-02a6e901f014?q=80&w=2070&auto=format&fit=crop',
                lists: [
                    { title: 'Resources', cards: ['Project Brief', 'Meeting Notes', 'Brand Guidelines'] },
                    { title: 'To Do', cards: ['Task 1', 'Task 2', 'Task 3'] },
                    { title: 'Doing', cards: ['Task 4'] },
                    { title: 'Done', cards: ['Task 5'] }
                ]
            },
            {
                title: 'Agile Board',
                description: 'A classic agile workflow for software development teams.',
                category: 'Engineering',
                backgroundPath: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=2069&auto=format&fit=crop',
                lists: [
                    { title: 'Backlog', cards: ['Bug: Login fix', 'Feature: User roles', 'Refactor: API'] },
                    { title: 'Sprint Backlog', cards: ['UI: Dashboard redesign'] },
                    { title: 'In Progress', cards: ['Auth: JWT implementation'] },
                    { title: 'Review', cards: [] },
                    { title: 'Done', cards: ['Database: Schema setup'] }
                ]
            },
            {
                title: 'Marketing Plan',
                description: 'Launch your next marketing campaign with ease.',
                category: 'Marketing',
                backgroundPath: 'https://images.unsplash.com/photo-1533750349088-cd871a723591?q=80&w=2070&auto=format&fit=crop',
                lists: [
                    { title: 'Strategy', cards: ['Target Audience', 'Competitor Analysis'] },
                    { title: 'Content', cards: ['Social Media Posts', 'Blog Articles'] },
                    { title: 'Channels', cards: ['Email', 'Ads', 'Events'] }
                ]
            }
        ]

        for (const t of templates) {
            let board = await boardRepo.findOne({ where: { title: t.title, isTemplate: true } })
            if (!board) {
                board = boardRepo.create({
                    title: t.title,
                    description: t.description,
                    category: t.category,
                    isTemplate: true,
                    permissionLevel: 'public',
                    backgroundPath: t.backgroundPath,
                    owner: admin
                })
                board = await boardRepo.save(board)
                console.log('Created Template:', t.title)

                for (let i = 0; i < t.lists.length; i++) {
                    const l = t.lists[i]
                    const list = await listRepo.save(listRepo.create({
                        title: l.title,
                        position: (i + 1) * 1000,
                        board: board,
                        createdBy: admin
                    }))

                    for (let j = 0; j < l.cards.length; j++) {
                        const cTitle = l.cards[j]
                        await cardRepo.save(cardRepo.create({
                            title: cTitle,
                            position: (j + 1) * 1000,
                            list: list,
                            createdBy: admin
                        }))
                    }
                }
            }
        }
        console.log('Template seeding completed.')
    }
}
