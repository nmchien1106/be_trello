import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { DateTimeEntity } from './base/DateTimeEntity'
import { Permission } from './permission.entity'
import { User } from './user.entity'
import { WorkspaceMembers } from './workspace-member.entity'
import { BoardMembers } from './board-member.entity'
import { CardMembers } from './card-member.entity'
@Entity('roles')
export class Role extends DateTimeEntity {
    @PrimaryGeneratedColumn('uuid')
    public id: string
    @Column({ type: 'varchar', unique: true, length: 100 })
    public name: string
    @Column({ type: 'text', nullable: true })
    public description: string
    @ManyToMany(() => User, (user) => user.role)
    public users: User[]
    @OneToMany(() => WorkspaceMembers, (workspaceMember) => workspaceMember.role)
    public workspaceMembers: WorkspaceMembers[]
    @OneToMany(() => BoardMembers, (boardMember) => boardMember.role)
    public boardMembers: BoardMembers[]
    @OneToMany(() => CardMembers, (cardMember) => cardMember.role)
    public cardMembers: CardMembers[]
    @ManyToMany(() => Permission, (permission) => permission.roles, {
        cascade: true
    })
    @JoinTable()
    public permissions: Permission[]
}
