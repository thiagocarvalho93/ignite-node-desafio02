// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Knex } from 'knex'

declare module 'knex/types/tables' {
  export interface Tables {
    meals: {
      id: string
      session_id?: string
      name: string
      description: string
      datetime: date
      diet: string
    }
  }
}
