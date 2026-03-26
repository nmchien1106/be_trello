import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { Permission } from './permission.entity'
import { WorkspaceMembers } from './workspace-member.entity'
import { BoardMembers } from './board-member.entity'
import { User } from './user.entity'
@Entity('roles')
export class Role extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string

    @Column({ type: 'varchar', unique: true, length: 100 })
    public name: string

    @Column({ type: 'text', nullable: true })
    public description: string

    @OneToMany(() => WorkspaceMembers, (workspaceMember) => workspaceMember.role)
    public workspaceMembers: WorkspaceMembers[]

    @OneToMany(() => BoardMembers, (boardMember) => boardMember.role)
    public boardMembers: BoardMembers[]

    @ManyToMany(() => Permission, (permission) => permission.roles, {
        cascade: true
    })
    @JoinTable()
    public permissions: Permission[]

    @ManyToMany(() => User, (user) => user.roles)
    public users: User[]
}
