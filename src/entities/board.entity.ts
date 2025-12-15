import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { List } from './list.entity'
import { Workspace } from './workspace.entity'
import { BoardMembers } from './board-member.entity'
import { User } from './user.entity'

@Entity('boards')
export class Board extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', length: 255 })
    public title: string

    @Column({ type: 'text', nullable: true })
    public description: string

    @Column({ type: 'varchar', length: 20, default: 'public' })
    public permissionLevel: 'private' | 'workspace' | 'public'

    @Column({ type: 'boolean', default: false })
    public isArchived: boolean

    @Column({ type: 'varchar', length: 255, nullable: true })
    public backgroundPath: string

    @Column({ type: 'boolean', default: false })
    public isTemplate: boolean

    // TODO : owner relation
    @ManyToOne(() => User, (user) => user.boards, { onDelete: 'SET NULL' })
    @JoinColumn({ name: 'ownerId' })
    public owner: User

    @Column({ type: 'varchar', length: 255, nullable: true })
    public backgroundPublicId: string

    @OneToMany(() => BoardMembers, (boardMember) => boardMember.board)
    public boardMembers: BoardMembers[]

    @ManyToOne(() => Workspace, (workspace) => workspace.boards, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workspaceId' })
    public workspace: Workspace

    @OneToMany(() => List, (list) => list.board)
    lists: List[]
}
