import { it, beforeAll, afterAll, describe, expect, beforeEach } from 'vitest'
import { execSync } from 'node:child_process'
import app from '../src/app'
import request from 'supertest'

describe('Meals routes', () => {
  beforeAll(async () => {
    execSync('npm run knex migrate:latest')
    await app.ready()
  })

  afterAll(() => {
    app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  it('should be able to register a meal', async () => {
    await request(app.server)
      .post('/meals')
      .send({
        name: 'Breakfast',
        description: 'Bacon and eggs',
        datetime: new Date().toISOString(),
        diet: 'y',
      })
      .expect(201)
  })

  it('should be able to list all meals of an user', async () => {
    const name = 'Breakfast'
    const datetime = new Date().toISOString()
    const description = 'Bacon and eggs'
    const diet = 'y'

    const createMealResponse = await request(app.server).post('/meals').send({
      name,
      description,
      datetime,
      diet,
    })

    const cookies = createMealResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name,
        description,
        datetime,
        diet,
      }),
    ])
  })

  it('should not be able to list meals of another users', async () => {
    let name = 'Breakfast'
    const datetime = new Date().toISOString()
    let description = 'Bacon and eggs'
    let diet = 'y'

    await request(app.server).post('/meals').send({
      name,
      description,
      datetime,
      diet,
    })

    name = 'Lunch'
    description = 'Spaghetti'
    diet = 'n'

    const createMealResponseUser2 = await request(app.server)
      .post('/meals')
      .send({
        name,
        description,
        datetime,
        diet,
      })

    const cookiesUser2 = createMealResponseUser2.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookiesUser2)
      .expect(200)

    expect(listMealsResponse.body.meals).toEqual([
      expect.objectContaining({
        name,
        description,
        datetime,
        diet,
      }),
    ])
  })

  it.todo('should be able to edit a meal', async () => {})

  it.todo('should not be able to edit another users meal', async () => {})

  it('should be able to delete a meal', async () => {
    const name = 'Breakfast'
    const datetime = new Date().toISOString()
    const description = 'Bacon and eggs'
    const diet = 'y'

    const createMealResponse = await request(app.server).post('/meals').send({
      name,
      description,
      datetime,
      diet,
    })

    const cookies = createMealResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const id = listMealsResponse.body.meals[0].id

    await request(app.server)
      .delete(`/meals/${id}`)
      .set('Cookie', cookies)
      .expect(204)
  })

  it('should not be able to delete another users meal', async () => {
    const name = 'Breakfast'
    const datetime = new Date().toISOString()
    const description = 'Bacon and eggs'
    const diet = 'y'

    const createMealResponse = await request(app.server).post('/meals').send({
      name,
      description,
      datetime,
      diet,
    })

    const cookies = createMealResponse.get('Set-Cookie')

    const listMealsResponse = await request(app.server)
      .get('/meals')
      .set('Cookie', cookies)
      .expect(200)

    const id = listMealsResponse.body.meals[0].id

    await request(app.server).delete(`/meals/${id}`).expect(401)
  })

  it('should be able to get a specific meal', async () => {
    const name = 'Breakfast'
    const datetime = new Date().toISOString()
    const description = 'Bacon and eggs'
    const diet = 'y'

    const createMealResponse = await request(app.server).post('/meals').send({
      name,
      description,
      datetime,
      diet,
    })

    const cookies = createMealResponse.get('Set-Cookie')
    const id = createMealResponse.body[0].id

    await request(app.server)
      .get(`/meals/${id}`)
      .set('Cookie', cookies)
      .expect(200)
  })

  it('should get the correct summary of the user', async () => {
    let name = 'Breakfast'
    let datetime = new Date(2023, 2, 2, 8).toISOString()
    let description = 'Bacon and eggs'
    let diet = 'y'

    const createMealResponse = await request(app.server)
      .post('/meals')
      .send({
        name,
        description,
        datetime,
        diet,
      })
      .expect(201)

    const cookies = createMealResponse.get('Set-Cookie')

    name = 'Lunch'
    description = 'Spaghetti'
    diet = 'n'
    datetime = new Date(2023, 2, 2, 12).toISOString()

    await request(app.server)
      .post('/meals')
      .send({
        name,
        description,
        datetime,
        diet,
      })
      .set('Cookie', cookies)
      .expect(201)

    name = 'Dinner'
    description = 'Turkey'
    diet = 'y'
    datetime = new Date(2023, 2, 2, 12).toISOString()

    await request(app.server)
      .post('/meals')
      .send({
        name,
        description,
        datetime,
        diet,
      })
      .set('Cookie', cookies)
      .expect(201)

    const summary = await request(app.server)
      .get('/meals/summary')
      .set('Cookie', cookies)
      .expect(200)

    expect(summary.body.summary.meals).toBe(3)
    expect(summary.body.summary.on_diet).toBe(2)
    expect(summary.body.summary.not_on_diet).toBe(1)
    expect(summary.body.summary.best_sequence).toBe(1)
  })
})
