import { Column, Entity, JoinTable, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { CardMembers } from './card-member.entity'
import { BoardMembers } from './board-member.entity'
import { Comment } from './comment.entity'
import { Notification } from './notification.entity'
import { WorkspaceMembers } from './workspace-member.entity'
import { Role } from './role.entity'
import { Board } from './board.entity'

@Entity('users')
export class User extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', unique: true, length: 255 })
    public email: string

    @Column({ type: 'varchar', length: 255, nullable: true, select: false })
    public password: string

    @Column({ type: 'varchar', length: 100, nullable: true })
    public username: string

    @Column({ type: 'text', nullable: true })
    public bio: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    public avatarUrl: string

    @Column({ type: 'varchar', length: 255, nullable: true })
    public googleID: string

    @Column({ type: 'bool', nullable: false, default: false })
    public isActive: boolean

    @OneToMany(() => WorkspaceMembers, (workspaceMember) => workspaceMember.user)
    public workspaceMembers: WorkspaceMembers[]

    @OneToMany(() => BoardMembers, (boardMember) => boardMember.user)
    public boardMembers: BoardMembers[]

    @OneToMany(() => CardMembers, (cardMember) => cardMember.user)
    public cardMembers: CardMembers[]

    @OneToMany(() => Comment, (comment) => comment.user)
    public comments: Comment[]

    @OneToMany(() => Board, (board) => board.owner)
    public boards: Board[]

    @OneToMany(() => Notification, (notification) => notification.user)
    public notifications: Notification[]
    @ManyToMany(() => Role, (role) => role.users)
    @JoinTable()
    public role: Role[]
}
