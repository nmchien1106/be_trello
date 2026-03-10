import { DataSource } from 'typeorm'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { User } from '../src/entities/user.entity'
import { Workspace } from '../src/entities/workspace.entity'
import { WorkspaceMembers } from '../src/entities/workspace-member.entity'
import { Board } from '../src/entities/board.entity'
import { BoardMembers } from '../src/entities/board-member.entity'
import { List } from '../src/entities/list.entity'
import { Card } from '../src/entities/card.entity'
import { CardMembers } from '../src/entities/card-member.entity'
import { Notification } from '../src/entities/notification.entity'
import { Role } from '../src/entities/role.entity'
import { Comment } from '../src/entities/comment.entity'
import { Activity } from '../src/entities/activity.entity'
import { EventType } from '../src/enums/event-type.enum'
import { EntityType } from '../src/enums/notification.enum'

export class SeedData {
    constructor(private dataSource: DataSource) { }

    async init() {
        const userRepository = this.dataSource.getRepository(User)
        const workspaceRepository = this.dataSource.getRepository(Workspace)
        const workspaceMemberRepository = this.dataSource.getRepository(WorkspaceMembers)
        const boardRepository = this.dataSource.getRepository(Board)
        const boardMemberRepository = this.dataSource.getRepository(BoardMembers)
        const listRepository = this.dataSource.getRepository(List)
        const cardRepository = this.dataSource.getRepository(Card)
        const cardMemberRepository = this.dataSource.getRepository(CardMembers)
        const notificationRepository = this.dataSource.getRepository(Notification)
        const roleRepository = this.dataSource.getRepository(Role)
        const commentRepository = this.dataSource.getRepository(Comment)
        const activityRepository = this.dataSource.getRepository(Activity)

        console.log('🌱 Starting data seeding...')

        // 1. Get Roles
        const adminRole = await roleRepository.findOneBy({ name: 'admin' })
        const userRole = await roleRepository.findOneBy({ name: 'user' })
        const workspaceAdminRole = await roleRepository.findOneBy({ name: 'workspace_admin' })
        const boardAdminRole = await roleRepository.findOneBy({ name: 'board_admin' })
        const boardMemberRole = await roleRepository.findOneBy({ name: 'board_member' })

        if (!adminRole || !userRole) {
            throw new Error('Roles not found. Please run authorization seeder first.')
        }

        // 2. Create Users
        const hashedPassword = await bcrypt.hash('Password123!', 10)

        const usersData = [
            {
                email: 'admin@gmail.com',
                username: 'admin',
                fullName: 'Admin User',
                password: hashedPassword,
                isActive: true,
                bio: 'Lead project administrator',
                avatarUrl: 'https://ui-avatars.com/api/?name=Admin+User&background=random'
            },
            {
                email: 'member@gmail.com',
                username: 'member',
                fullName: 'Team Member',
                password: hashedPassword,
                isActive: true,
                bio: 'Regular project developer',
                avatarUrl: 'https://ui-avatars.com/api/?name=Team+Member&background=random'
            }
        ]

        const users: User[] = []
        for (const data of usersData) {
            let user = await userRepository.findOneBy({ email: data.email })
            if (!user) {
                user = userRepository.create(data)
                await userRepository.save(user)
                console.log(`Created user: ${data.email}`)
            }
            users.push(user)
        }

        const [adminUser, memberUser] = users

        // 3. Create Workspace
        let workspace = await workspaceRepository.findOneBy({ title: 'Main Project Workspace' })
        if (!workspace) {
            workspace = workspaceRepository.create({
                title: 'Main Project Workspace',
                description: 'Workspace for high-priority Trello clone development',
                owner: adminUser
            })
            await workspaceRepository.save(workspace)
            console.log('Created workspace: Main Project Workspace')
        }

        // 4. Add Workspace Members
        const wsMembers = [
            { user: adminUser, workspace, role: workspaceAdminRole || adminRole, status: 'accepted' as const },
            { user: memberUser, workspace, role: userRole, status: 'accepted' as const }
        ]

        for (const wsMem of wsMembers) {
            const exists = await workspaceMemberRepository.findOneBy({
                user: { id: wsMem.user.id },
                workspace: { id: wsMem.workspace.id }
            })
            if (!exists) {
                const member = workspaceMemberRepository.create(wsMem)
                await workspaceMemberRepository.save(member)
                console.log(`Added user ${wsMem.user.email} to workspace`)
            }
        }

        // 5. Create Board
        let board = await boardRepository.findOneBy({ title: 'Fullstack Trello Development', workspace: { id: workspace.id } })
        if (!board) {
            board = boardRepository.create({
                title: 'Fullstack Trello Development',
                description: 'Development board for Trello project',
                permissionLevel: 'workspace',
                owner: adminUser,
                workspace: workspace
            })
            await boardRepository.save(board)
            console.log('Created board: Fullstack Trello Development')
        }

        // 6. Add Board Members
        const bMembers = [
            { user: adminUser, board, role: boardAdminRole || adminRole },
            { user: memberUser, board, role: boardMemberRole || userRole }
        ]

        for (const bMem of bMembers) {
            const exists = await boardMemberRepository.findOneBy({
                user: { id: bMem.user.id },
                board: { id: bMem.board.id }
            })
            if (!exists) {
                const member = boardMemberRepository.create(bMem)
                await boardMemberRepository.save(member)
                console.log(`Added user ${bMem.user.email} to board`)
            }
        }

        // 7. Create Lists
        const listsData = [
            { title: 'To Do', position: 1, board },
            { title: 'Doing', position: 2, board },
            { title: 'Done', position: 3, board }
        ]

        const lists: List[] = []
        for (const lData of listsData) {
            let list = await listRepository.findOneBy({ title: lData.title, board: { id: board.id } })
            if (!list) {
                list = listRepository.create(lData)
                await listRepository.save(list)
                console.log(`Created list: ${lData.title}`)
            }
            lists.push(list)
        }

        // 8. Create Cards
        const cardsData = [
            { title: 'Setup Redis Config', description: 'Fix Redis connection issues on Windows', position: 1, list: lists[0], priority: 'high' },
            { title: 'Implement SSE', description: 'Real-time notification system', position: 2, list: lists[0], priority: 'medium' },
            { title: 'Database Optimization', description: 'Optimize PostgreSQL queries', position: 1, list: lists[1], priority: 'medium' }
        ]

        const cards: Card[] = []
        for (const cData of cardsData) {
            let card = await cardRepository.findOneBy({ title: cData.title, list: { id: cData.list.id } })
            if (!card) {
                card = cardRepository.create(cData)
                await cardRepository.save(card)
                console.log(`Created card: ${cData.title}`)
            }
            cards.push(card)
        }

        // 9. Assign Users to Cards
        const cardAssignments = [
            { card: cards[0], user: adminUser },
            { card: cards[1], user: memberUser }
        ]

        for (const assign of cardAssignments) {
            const exists = await cardMemberRepository.findOneBy({
                card: { id: assign.card.id },
                user: { id: assign.user.id }
            })
            if (!exists) {
                const member = cardMemberRepository.create(assign)
                await cardMemberRepository.save(member)
                console.log(`Assigned ${assign.user.email} to card ${assign.card.title}`)
            }
        }

        // 10. Create Comments
        const commentsData = [
            { content: 'Redis is finally working properly!', card: cards[0], user: adminUser },
            { content: 'I will handle the SSE implementation tomorrow.', card: cards[1], user: memberUser }
        ]

        const comments: Comment[] = []
        for (const comData of commentsData) {
            let comment = await commentRepository.findOneBy({
                content: comData.content,
                card: { id: comData.card.id },
                user: { id: comData.user.id }
            })
            if (!comment) {
                comment = commentRepository.create(comData)
                await commentRepository.save(comment)
                console.log(`Added comment to card ${comData.card.title}`)
            }
            comments.push(comment)
        }

        // 11. Create Notifications
        const notificationsData = [
            {
                user: adminUser,
                actor: memberUser,
                type: EventType.COMMENT_CREATED as any,
                entityType: EntityType.COMMENT,
                entityId: comments[1].id,
                message: `${memberUser.fullName} commented on card: ${cards[1].title}`,
                isRead: false,
                payload: { cardId: cards[1].id, content: comments[1].content },
                actionUrl: `/boards/${board.id}/cards/${cards[1].id}`
            },
            {
                user: memberUser,
                actor: adminUser,
                type: EventType.CARD_MEMBER_ASSIGNED as any,
                entityType: EntityType.CARD,
                entityId: cards[1].id,
                message: `${adminUser.fullName} assigned you to card: ${cards[1].title}`,
                isRead: false,
                payload: { cardId: cards[1].id },
                actionUrl: `/boards/${board.id}/cards/${cards[1].id}`
            }
        ]

        for (const notifData of notificationsData) {
            const exists = await notificationRepository.findOneBy({
                user: { id: notifData.user.id },
                actor: { id: notifData.actor.id },
                type: notifData.type,
                entityId: notifData.entityId
            })
            if (!exists) {
                const notification = notificationRepository.create(notifData)
                await notificationRepository.save(notification)
                console.log(`Created notification for ${notifData.user.email}`)
            }
        }

        // 12. Create Activities
        const activitiesData = [
            {
                eventId: crypto.randomUUID(),
                boardId: board.id,
                cardId: cards[0].id,
                actorId: adminUser.id,
                type: EventType.CARD_CREATED as any,
                message: `Admin created card "${cards[0].title}"`,
                payload: { title: cards[0].title }
            },
            {
                eventId: crypto.randomUUID(),
                boardId: board.id,
                cardId: cards[1].id,
                actorId: memberUser.id,
                type: EventType.COMMENT_CREATED as any,
                message: `Member commented on "${cards[1].title}"`,
                payload: { content: comments[1].content }
            }
        ]

        for (const actData of activitiesData) {
            const exists = await activityRepository.findOneBy({
                eventId: actData.eventId
            })
            if (!exists) {
                const activity = activityRepository.create(actData)
                await activityRepository.save(activity)
                console.log(`Created activity for event: ${actData.type}`)
            }
        }

        console.log('✅ Data seeding completed successfully!')
    }
}
