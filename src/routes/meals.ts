import { FastifyInstance } from 'fastify'
import { knex } from '../database'
import { z } from 'zod'
import { randomUUID } from 'crypto'
import { checkSessionIdExists } from '../middlewares/check-sesssion-id-exists'

export async function mealsRoutes(app: FastifyInstance) {
  app.addHook('preHandler', async (request) => {
    console.log(`[${request.method}] ${request.url}`)
  })

  app.get('/', { preHandler: [checkSessionIdExists] }, async (request) => {
    const { sessionId } = request.cookies

    const meals = await knex('meals').where('session_id', sessionId).select()

    return { meals }
  })

  app.get('/:id', { preHandler: [checkSessionIdExists] }, async (request) => {
    const getMealParamsSchema = z.object({
      id: z.string().uuid(),
    })
    const { sessionId } = request.cookies

    const { id } = getMealParamsSchema.parse(request.params)
    const meal = await knex('meals')
      .where({
        session_id: sessionId,
        id,
      })
      .first()

    return { meal }
  })

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies

      const summary = await knex('meals')
        .where('session_id', sessionId)
        // .sum('', { as: '' })
        .first()

      return { summary }
    },
  )

  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      datetime: z.coerce.date(),
      diet: z.enum(['y', 'n']),
    })

    const { name, description, datetime, diet } = createMealBodySchema.parse(
      request.body,
    )

    let sessionId = request.cookies.sessionId

    if (!sessionId) {
      sessionId = randomUUID()

      reply.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      })
    }

    await knex('meals').insert({
      id: randomUUID(),
      name,
      description,
      session_id: sessionId,
      datetime,
      diet,
    })

    return reply.status(201).send()
  })

  // TODO: PUT
  // TODO: DELETE
}
