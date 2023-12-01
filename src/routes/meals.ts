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
      .select()

    return { meal }
  })

  app.get(
    '/summary',
    { preHandler: [checkSessionIdExists] },
    async (request) => {
      const { sessionId } = request.cookies

      const mealsResponse = await knex('meals')
        .where('session_id', sessionId)
        .orderBy('datetime')
        .select()

      const meals = mealsResponse.length
      const onDiet = mealsResponse.filter((meal) => meal.diet === 'y').length
      const notOnDiet = meals - onDiet
      const bestSequence = mealsResponse.reduce(
        (result, obj) => {
          if (obj.diet === 'y') {
            result.currentCount++
            result.maxCount = Math.max(result.maxCount, result.currentCount)
          } else {
            result.currentCount = 0
          }
          return result
        },
        { currentCount: 0, maxCount: 0 },
      ).maxCount

      const summary = {
        meals,
        on_diet: onDiet,
        not_on_diet: notOnDiet,
        best_sequence: bestSequence,
      }

      return { summary }
    },
  )

  app.post('/', async (request, reply) => {
    const createMealBodySchema = z.object({
      name: z.string(),
      description: z.string(),
      datetime: z.string().datetime(),
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

    const inserted = await knex('meals')
      .insert({
        id: randomUUID(),
        name,
        description,
        session_id: sessionId,
        datetime,
        diet,
      })
      .returning('*')

    return reply.status(201).send(inserted)
  })

  app.put(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const updateMealBodySchema = z.object({
        name: z.string(),
        description: z.string(),
        datetime: z.string().datetime(),
        diet: z.enum(['y', 'n']),
      })

      const { name, description, datetime, diet } = updateMealBodySchema.parse(
        request.body,
      )

      const updateMealParamsSchema = z.object({
        id: z.string().uuid(),
      })

      const { id } = updateMealParamsSchema.parse(request.params)

      const sessionId = request.cookies.sessionId

      const updatedRows = await knex('meals')
        .update({
          name,
          description,
          session_id: sessionId,
          datetime,
          diet,
        })
        .where('id', id)
        .andWhere('session_id', sessionId)

      if (updatedRows > 0) {
        return reply.status(204).send()
      }
      return reply.status(404).send()
    },
  )

  app.delete(
    '/:id',
    { preHandler: [checkSessionIdExists] },
    async (request, reply) => {
      const getMealParamsSchema = z.object({
        id: z.string().uuid(),
      })
      const { sessionId } = request.cookies

      const { id } = getMealParamsSchema.parse(request.params)
      const deletedRows = await knex('meals')
        .where({
          session_id: sessionId,
          id,
        })
        .delete()

      if (deletedRows === 0) {
        return reply.code(404).send()
      }

      return reply.code(204).send()
    },
  )
}
