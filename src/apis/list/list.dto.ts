export class ListDto {
  id: string
  title: string
  position: number
  boardId: string
  createdAt: Date
  updatedAt: Date

  constructor(
      id: string,
      title: string,
      position: number,
      boardId: string,
      createdAt: Date,
      updatedAt: Date
  ) {
      this.id = id
      this.title = title
      this.position = position
      this.boardId = boardId
      this.createdAt = createdAt
      this.updatedAt = updatedAt
  }
}

export class ListDTOwithRelations {
  id: string
  title: string

  constructor(id: string, title: string) {
      this.id = id
      this.title = title
  }
}

export class CreateListDto {
  title!: string
  boardId!: string
}

export class UpdateListDto {
  title?: string
  isArchived?: boolean
}
