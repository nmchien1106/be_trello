export class BoardDTO {
    id: string
    title: string
    description?: string
    background?: string
    isArchived: boolean
    workspaceId: string
    createdAt: Date
    updatedAt: Date

    constructor(partial: Partial<BoardDTO>) {
        Object.assign(this, partial)
    }
}

export class BoardMemberDTO {
    userId: string
    username: string
    role: 'board_admin' | 'board_member'
}
export class CreateBoardDto {
    title: string
    description?: string
    backgroundUrl?: string
    workspaceId: string
    permissionLevel?: 'private' | 'public' | 'workspace'
}

export class UpdateBoardDto {
    title?: string
    description?: string
    backgroundUrl?: string
    permissionLevel?: 'private' | 'public' | 'workspace'
}
