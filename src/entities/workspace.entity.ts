import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { Board } from './board.entity'
import { WorkspaceMembers } from './workspace-member.entity'
import { User } from './user.entity'

@Entity('workspaces')
export class Workspace extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', length: 255 })
    public title: string

    @Column({ type: 'varchar', nullable: true })
    public description: string

    @Column({ type: 'boolean', default: false })
    public isArchived: boolean

    @OneToMany(() => WorkspaceMembers, (workspaceMember) => workspaceMember.workspace)
    public workspaceMembers: WorkspaceMembers[]

    @ManyToOne(() => User, (user) => user.ownedWorkspaces, { nullable: false })
    public owner: User

    @OneToMany(() => Board, (board) => board.workspace)
    boards: Board[]
}
