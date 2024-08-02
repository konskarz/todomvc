/*
Todo example with synceddb
https://github.com/darrachequesne/synceddb-todo-example
*/
'use strict'
import { createReadStream } from 'fs'
/** @param {import('fastify').FastifyInstance} app */
export default async function server(app, opts) {
  app.register(import('@platformatic/sql-mapper'), {
    connectionString: process.env.DATABASE_URL,
    onDatabaseLoad: async (db, sql) => {
      await db.query(sql`CREATE TABLE IF NOT EXISTS todo (
        id VARCHAR PRIMARY KEY NOT NULL,
        version INTEGER NOT NULL,
        title VARCHAR,
        completed BOOLEAN NOT NULL DEFAULT FALSE,
        createdAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
        updatedAt TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`)
    }
  })
  app.register(
    async function (app, opts) {
      const { todo: entity } = app.platformatic.entities
      app.get('/', async (request, reply) => {
        const res = await entity.find()
        return { data: res }
      })
      app.post('/', async (request, reply) => {
        const res = await entity.save({ input: { ...request.body, version: 1 } })
        return res
      })
      app.put('/:id', async (request, reply) => {
        const found = await entity.find({ where: { id: { eq: request.params.id } } })
        if (found.length === 0) return reply.callNotFound()
        if (request.body.version !== found[0].version + 1) return reply.code(409).send(found[0])
        const res = await entity.save({
          input: { id: request.params.id, ...request.body }
        })
        return res
      })
      app.delete('/:id', async (request, reply) => {
        const res = await entity.save({
          input: { id: request.params.id, version: -1, title: '', completed: false }
        })
        return res.length === 0 ? reply.callNotFound() : res[0]
      })
    },
    { prefix: '/api/todos' }
  )
  app.get('/', async (request, reply) => {
    const stream = createReadStream('synceddb-vue-client.html')
    return reply.type('text/html').send(stream)
  })
}
