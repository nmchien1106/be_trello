import { Router } from 'express'


import UserRoute from '@/apis/users/users.route'
import AuthRoute from '@/apis/auth/auth.route'
import WorkspaceRoute from '@/apis/workspace/workspace.route'
import HealthCheck from '@/apis/healthcheck'
import BoardRoute from '@/apis/board/board.route'
import RoleRoute from '@/apis/role/role.route'
import ListRoute from '@/apis/list/list.route'
import CardRoute from '@/apis/card/card.route'
import ChecklistRoute from '@/apis/checklist/checklist.route'
import CommentRoute from '@/apis/comment/comment.route'
import LabelRoute from '@/apis/label/label.route'

const route = Router()

route.use('/users', UserRoute)
route.use('/auth', AuthRoute)
route.use('/workspaces', WorkspaceRoute)
route.use('/roles', RoleRoute)
route.use('/health', HealthCheck)
route.use('/boards', BoardRoute)
route.use('/lists', ListRoute)
route.use('/cards', CardRoute)
route.use('/checklists', ChecklistRoute)
route.use('/comments', CommentRoute)
route.use('/labels', LabelRoute)

export default route
