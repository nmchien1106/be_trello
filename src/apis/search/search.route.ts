import { Router } from 'express'
import searchController from './search.controller'
import { verifyAccessToken } from '@/utils/jwt'

const route = Router()

// @route GET /api/search?keyword=...
route.get('/', verifyAccessToken, searchController.globalSearch)

export default route
