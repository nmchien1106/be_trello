export enum Permissions {
    // user
    CREATE_USER = 'user:create',
    READ_USER = 'user:read',
    UPDATE_USER = 'user:update',
    DELETE_USER = 'user:delete',

    // workspace
    CREATE_WORKSPACE = 'workspace:create',
    READ_WORKSPACE = 'workspace:read',
    UPDATE_WORKSPACE = 'workspace:update',
    DELETE_WORKSPACE = 'workspace:delete',
    ADD_MEMBER_TO_WORKSPACE = 'workspace:add_member',
    REMOVE_MEMBER_FROM_WORKSPACE = 'workspace:remove_member',
    CHANGE_MEMBER_ROLE = 'workspace:change_member_role',
    READ_WORKSPACE_MEMBERS = 'workspace:read_members',
    MANAGE_WORKSPACE_PERMISSIONS = 'workspace:manage',

    // boards
    CREATE_BOARD = 'board:create',
    READ_BOARD = 'board:read',
    UPDATE_BOARD = 'board:update',
    DELETE_BOARD = 'board:delete',
    ADD_MEMBER_TO_BOARD = 'board:add_member',
    REMOVE_MEMBER_FROM_BOARD = 'board:remove_member',
    CHANGE_BOARD_PERMISSION_LEVEL = 'board:change_permission_level',
    REVOKE_LINK = 'board:revoke_share_link',
    MANAGE_BOARD = 'board:manage',
    READ_BOARD_MEMBERS = 'board:read_members',
    UPDATE_BOARD_MEMBER_ROLE = 'board:update_member_role',

    //LIST
    CREATE_LIST = 'list:create',
    UPDATE_LIST = 'list:update',
    DELETE_LIST = 'list:delete',

    //CARD
    CREATE_CARD = 'card:create',
    READ_CARD = 'card:read',
    UPDATE_CARD = 'card:update',
    DELETE_CARD = 'card:delete'
}
