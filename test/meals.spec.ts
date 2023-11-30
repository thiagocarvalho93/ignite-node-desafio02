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
    await request(app)
      .post('/meals')
      .send({
        name: 'Breakfast',
        description: 'Bacon and eggs',
        datetime: Date.now,
        diet: 'y',
      })
      .expect(201)
  })

  it.todo('should be able to edit a meal', async () => {})

  it.todo('should not be able to edit another users meal', async () => {})

  it.todo('should be able to delete a meal', async () => {})

  it.todo('should not be able to delete another users meal', async () => {})

  it.todo('should be able to list all meals of an user', async () => {})

  it.todo('should not be able to list meals of another users', async () => {})

  it.todo('should be able to get a specific meal', async () => {})

  it.todo('should get the correct summary of the user', async () => {})
})
