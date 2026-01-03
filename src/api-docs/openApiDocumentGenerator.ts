import { OpenApiGeneratorV3, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi'
import { authRegistry } from '@/apis/auth/auth.swagger'
import { userRegistry } from '@/apis/users/users.swagger'
import { workspaceRegister } from '@/apis/workspace/workspace.swagger'
import { boardRegistry } from '@/apis/board/board.swagger'
import { roleRegistry } from '@/apis/role/role.swagger'
import { listRegistry, listsRegisterPath, ListRegisterPaths } from '@/apis/list/list.swagger'
import { cardRegistry, cardsRegisterPath } from '@/apis/card/card.swagger'
import { checklistRegistry, checklistRegisterPath } from '@/apis/checklist/checklist.swagger'
import { commentRegistry, CommentRegisterPaths } from '@/apis/comment/comment.swagger'
import { labelRegistry, labelsRegisterPath } from '@/apis/label/label.swagger'

export function generateOpenAPIDocument() {
  listsRegisterPath()
  ListRegisterPaths()
  cardsRegisterPath()
  checklistRegisterPath()
  CommentRegisterPaths()
  labelsRegisterPath()

  const registry = new OpenAPIRegistry([
    userRegistry,
    authRegistry,
    roleRegistry,
    workspaceRegister,
    boardRegistry,
    listRegistry,
    cardRegistry,
    checklistRegistry,
    commentRegistry,
    labelRegistry
  ])

  registry.registerComponent('securitySchemes', 'bearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT'
  })

  const generator = new OpenApiGeneratorV3(registry.definitions)

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Swagger API',
      version: '1.0.0'
    }
  })
}
