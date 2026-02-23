import { DataSource } from 'typeorm'
import bcrypt from 'bcryptjs'
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
import { NotificationType, EntityType } from '../src/enums/notification.enum'

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
                fullName: 'Admin',
                password: hashedPassword,
                isActive: true,
                bio: 'I am the first test user',
                avatarUrl: 'https://ui-avatars.com/api/?name=Test+User+One'
            },
            {
                email: 'user@gmail.com',
                username: 'user',
                fullName: 'User',
                password: hashedPassword,
                isActive: true,
                bio: 'I am the second test user',
                avatarUrl: 'https://ui-avatars.com/api/?name=Test+User+Two'
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

        const [user1, user2] = users

        // 3. Create Workspace
        let workspace = await workspaceRepository.findOneBy({ title: 'Test Workspace' })
        if (!workspace) {
            workspace = workspaceRepository.create({
                title: 'Test Workspace',
                description: 'Workspace for testing notifications',
                owner: user1
            })
            await workspaceRepository.save(workspace)
            console.log('Created workspace: Test Workspace')
        }

        // 4. Add Workspace Members
        const wsMembers = [
            { user: user1, workspace, role: workspaceAdminRole || adminRole, status: 'accepted' as const },
            { user: user2, workspace, role: userRole, status: 'accepted' as const }
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
        let board = await boardRepository.findOneBy({ title: 'Main Project Board', workspace: { id: workspace.id } })
        if (!board) {
            board = boardRepository.create({
                title: 'Main Project Board',
                description: 'A board to track project progress',
                permissionLevel: 'workspace',
                owner: user1,
                workspace: workspace
            })
            await boardRepository.save(board)
            console.log('Created board: Main Project Board')
        }

        // 6. Add Board Members
        const bMembers = [
            { user: user1, board, role: boardAdminRole || adminRole },
            { user: user2, board, role: boardMemberRole || userRole }
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
            { title: 'In Progress', position: 2, board },
            { title: 'Review', position: 3, board },
            { title: 'Done', position: 4, board }
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
            { title: 'Setup Notification SSE', description: 'Implement SSE for real-time notifications', position: 1, list: lists[0], priority: 'high' },
            { title: 'Design Seed Data Script', description: 'Create a script to seed test data', position: 2, list: lists[1], priority: 'medium' },
            { title: 'UI for Notifications', description: 'Build the notification dropdown UI', position: 1, list: lists[1], priority: 'medium' },
            { title: 'Backend API for Marks as Read', description: 'Create endpoint to mark notifications as read', position: 1, list: lists[3], priority: 'low' }
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
            { card: cards[0], user: user1 },
            { card: cards[0], user: user2 },
            { card: cards[1], user: user1 },
            { card: cards[2], user: user2 }
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
            { content: 'I started working on this!', card: cards[0], user: user1 },
            { content: 'Great, let me know if you need help.', card: cards[0], user: user2 }
        ]

        const comments: Comment[] = []
        for (const comData of commentsData) {
            const exists = await commentRepository.findOneBy({
                content: comData.content,
                card: { id: comData.card.id },
                user: { id: comData.user.id }
            })
            if (!exists) {
                const comment = commentRepository.create(comData)
                await commentRepository.save(comment)
                console.log(`Added comment to card ${comData.card.title}`)
                comments.push(comment)
            }
        }

        // 11. Create Notifications
        const notificationsData = [
            {
                user: user1,
                actor: user2,
                actorId: user2.id,
                type: NotificationType.CARD_ASSIGNED,
                entityType: EntityType.CARD,
                entityId: cards[0].id,
                message: `${user2.fullName} assigned you to the card: ${cards[0].title}`,
                isRead: false,
                data: { boardId: board.id, workspaceId: workspace.id }
            },
            {
                user: user1,
                actor: user2,
                actorId: user2.id,
                type: NotificationType.CARD_COMMENT,
                entityType: EntityType.COMMENT,
                entityId: (comments.length > 1 ? comments[1].id : cards[0].id),
                message: `${user2.fullName} commented on card: ${cards[0].title}`,
                isRead: false,
                data: { cardId: cards[0].id, boardId: board.id }
            },
            {
                user: user2,
                actor: user1,
                actorId: user1.id,
                type: NotificationType.BOARD_INVITE,
                entityType: EntityType.BOARD,
                entityId: board.id,
                message: `${user1.fullName} invited you to board: ${board.title}`,
                isRead: true,
                data: { workspaceId: workspace.id }
            }
        ]

        for (const notifData of notificationsData) {
            const exists = await notificationRepository.findOneBy({
                user: { id: notifData.user.id },
                actorId: notifData.actorId,
                type: notifData.type,
                entityId: notifData.entityId
            })
            if (!exists) {
                const notification = notificationRepository.create(notifData)
                await notificationRepository.save(notification)
                console.log(`Created notification for ${notifData.user.email}`)
            }
        }

        console.log('✅ Data seeding completed successfully!')
    }
}
