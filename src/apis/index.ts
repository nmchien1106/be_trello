import UserRoute from '@/apis/users/users.route'
import AuthRoute from '@/apis/auth/auth.route'
import WorkspaceRoute from '@/apis/workspace/workspace.route'
import HealthCheck from '@/apis/healthcheck/index'
import BoardRoute from '@/apis/board/board.route'
import RoleRoute from '@/apis/role/role.route'
import ListRoute from '@/apis/list/list.route'
import { Router } from 'express'
import ListRoute from '@/apis/list/list.route'
import CardRoute from '@/apis/card/card.route'

const route = Router()

route.use('/users', UserRoute)
route.use('/auth', AuthRoute)
route.use('/workspaces', WorkspaceRoute)
route.use('/roles', RoleRoute)
route.use('/health', HealthCheck)
route.use('/boards', BoardRoute)
<<<<<<< HEAD
route.use('/lists', ListRoute)
=======
route.use('/', BoardRoute)
route.use('/lists', ListRoute)
route.use('/cards', CardRoute)
>>>>>>> 22b57b1 (list card)
export default route
