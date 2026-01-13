import { WorkspaceMembers } from '@/entities/workspace-member.entity';
import { Workspace } from '../../entities/workspace.entity'
import { User } from '@/entities/user.entity'
import { Role } from '@/entities/role.entity'
import AppDataSource from '@/config/typeorm.config'
import { Board } from '@/entities/board.entity';

export class WorkspaceRepository {
    private workspaceRepo = AppDataSource.getRepository(Workspace)
    private workspaceMemberRepo = AppDataSource.getRepository(WorkspaceMembers)
    private userRepo = AppDataSource.getRepository(User)
    private roleRepo = AppDataSource.getRepository(Role)

    async findAll(): Promise<Workspace[]> {
        return this.workspaceRepo.find({ relations: ['workspaceMembers', 'workspaceMembers.user'] })
    }

    async findAllByUserId(userId: string): Promise<Workspace[]> {
        const memberships = await this.workspaceMemberRepo.find({
            where: { user: { id: userId }, status: 'accepted' },
            relations: ['workspace']
        })
        return memberships.map(membership => membership.workspace)
    }

    async findById(id: string): Promise<Workspace | null> {
        return this.workspaceRepo.findOne({ where: { id }, relations : ["workspaceMembers"] })
    }

    async findWithMembersById(id: string): Promise<Workspace | null> {
        return this.workspaceRepo.findOne({
            where: { id },
            relations: ['workspaceMembers', 'workspaceMembers.user', 'workspaceMembers.role']
        })
    }

    async createWorkspace(data: Partial<Workspace>, ownerId: string): Promise<Workspace> {
        const workspace = this.workspaceRepo.create(data)
        const owner = await this.userRepo.findOne({ where: { id: ownerId }, select: ['id', 'email', 'username'] })
        if (!owner) {
            throw new Error('Owner not found')
        }
        workspace.owner = owner
        return this.workspaceRepo.save(workspace)
    }

    async updateWorkspace(id: string, data: Partial<Workspace>): Promise<Workspace | null> {
        await this.workspaceRepo.update(id, data)
        return this.findById(id)
    }

    async deleteWorkspace(id: string): Promise<void> {
        await this.workspaceRepo.delete(id)
    }

    async archiveWorkspace(id: string): Promise<void> {
        await this.workspaceRepo.update(id, { isArchived: true })
    }

    async reopenWorkspace(id: string): Promise<void> {
        await this.workspaceRepo.update(id, { isArchived: false })
    }

    async findWorkspaceBy(query: Partial<Workspace>) {
        return this.workspaceRepo.findOneBy(query)
    }

    async addMemberToWorkspace(
        userId: string,
        workspaceId: string,
        roleName: string,
        status: 'accepted' | 'pending' | 'rejected' = 'pending'
    ): Promise<void> {
        const user: User | null = await this.userRepo.findOne({ where: { id: userId } })
        const workspace: Workspace | null = await this.workspaceRepo.findOne({ where: { id: workspaceId } })
        const role: Role | null = await this.roleRepo.findOne({ where: { name: roleName } })

        if (!user || !workspace || !role) {
            throw new Error('Invalid user, workspace or role')
        }

        const workspaceMember = this.workspaceMemberRepo.create({
            user: user!,
            workspace: workspace!,
            role: role!,
            status: status
        })
        await this.workspaceMemberRepo.save(workspaceMember)
    }

    async removeMemberFromWorkspace(userId: string, workspaceId: string): Promise<void> {
        await this.workspaceMemberRepo.delete({ user: { id: userId }, workspace: { id: workspaceId } })
    }

    async changeMemberRole(memberId: string, workspaceId: string, roleId: string): Promise<void> {
        await this.workspaceMemberRepo.update(
            { user: { id: memberId }, workspace: { id: workspaceId } },
            { role: { id: roleId } }
        )
    }

    async findAllInvitationsForUser(userId: string): Promise<WorkspaceMembers[]> {
        const result = await this.workspaceMemberRepo.find({
            where: { user: { id: userId }, status: 'pending' },
            relations: ['workspace'],
            select : {
                id: true,
                workspace: { id: true, title: true},
                createdAt: true,
                updatedAt: true,
                status: true,
            }
        })
        return result
    }

    async updateInvitationStatus(invitation: WorkspaceMembers): Promise<void> {
        await this.workspaceMemberRepo.update(
            { user: { id: invitation.user.id }, workspace: { id: invitation.workspace.id } },
            { status: invitation.status }
        )
    }

    async getBoardsInWorkspace(workspaceId: string): Promise<Board[]> {
        const workspace = await this.workspaceRepo.findOne({
            where: { id: workspaceId },
            relations: ['boards']
        })
        if (!workspace) {
            throw new Error('Workspace not found')
        }
        return workspace.boards
    }
}
