export class CreateListDto {
    title!: string;
    boardId!: string;
  }
  
  export class UpdateListDto {
    title?: string;
    isArchived?: boolean;
  }
  