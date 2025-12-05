const fastify = require('fastify')({ logger: true });
const fp = require('fastify-plugin');
const { Client } = require('pg');
const { MongoClient, ObjectId } = require('mongodb');

const resourceBodySchema = {
  type: 'object',
  required: ['name', 'description'],
  properties: {
    name: { type: 'string' },
    description: { type: 'string' },
  },
};

const resourceIdParamSchema = (type) => ({
    type: 'object',
    required: ['id'],
    properties: {
      id: { type },
    },
  });

// PostgreSQL Plugin
async function pgPlugin(fastify, options) {
  const client = new Client({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB,
  });

  await client.connect();
  fastify.decorate('pg', client);

  fastify.addHook('onClose', async (instance) => {
    await instance.pg.end();
  });
}

// MongoDB Plugin
async function mongoPlugin(fastify, options) {
    const url = `mongodb://${process.env.MONGO_HOST}:${process.env.MONGO_PORT}`;
    const client = new MongoClient(url);
  
    await client.connect();
    const db = client.db(process.env.MONGO_DB);
    fastify.decorate('mongo', db);
  
    fastify.addHook('onClose', async (instance) => {
      await client.close();
    });
  }

fastify.register(fp(pgPlugin));
fastify.register(fp(mongoPlugin));

// PostgreSQL Routes
fastify.after(() => {
    // GET /api/pg/resources
    fastify.get('/api/pg/resources', async (request, reply) => {
        const { rows } = await fastify.pg.query('SELECT * FROM resources');
        return rows;
    });

    // GET /api/pg/resources/:id
    fastify.get('/api/pg/resources/:id', { schema: { params: resourceIdParamSchema('integer') } }, async (request, reply) => {
        const { id } = request.params;
        const { rows } = await fastify.pg.query('SELECT * FROM resources WHERE id = $1', [id]);
        if (rows.length === 0) {
            return reply.status(404).send({ error: 'Resource not found' });
        }
        return rows[0];
    });

    // POST /api/pg/resources
    fastify.post('/api/pg/resources', { schema: { body: resourceBodySchema } }, async (request, reply) => {
        const { name, description } = request.body;
        const { rows } = await fastify.pg.query(
            'INSERT INTO resources (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        return reply.status(201).send(rows[0]);
    });

    // PUT /api/pg/resources/:id
    fastify.put('/api/pg/resources/:id', { schema: { params: resourceIdParamSchema('integer'), body: resourceBodySchema } }, async (request, reply) => {
        const { id } = request.params;
        const { name, description } = request.body;
        const { rows } = await fastify.pg.query(
            'UPDATE resources SET name = $1, description = $2 WHERE id = $3 RETURNING *',
            [name, description, id]
        );
        if (rows.length === 0) {
            return reply.status(404).send({ error: 'Resource not found' });
        }
        return rows[0];
    });

    // DELETE /api/pg/resources/:id
    fastify.delete('/api/pg/resources/:id', { schema: { params: resourceIdParamSchema('integer') } }, async (request, reply) => {
        const { id } = request.params;
        const { rowCount } = await fastify.pg.query('DELETE FROM resources WHERE id = $1', [id]);
        if (rowCount === 0) {
            return reply.status(404).send({ error: 'Resource not found' });
        }
        return reply.status(204).send();
    });
});

// MongoDB Routes
fastify.after(() => {
    const resources = fastify.mongo.collection('resources');

    // GET /api/mongo/resources
    fastify.get('/api/mongo/resources', async (request, reply) => {
        const result = await resources.find().toArray();
        return result;
    });

    // GET /api/mongo/resources/:id
    fastify.get('/api/mongo/resources/:id', { schema: { params: resourceIdParamSchema('string') } }, async (request, reply) => {
        const { id } = request.params;
        if (!ObjectId.isValid(id)) {
            return reply.status(400).send({ error: 'Invalid ID format' });
        }
        const resource = await resources.findOne({ _id: new ObjectId(id) });
        if (!resource) {
            return reply.status(404).send({ error: 'Resource not found' });
        }
        return resource;
    });

    // POST /api/mongo/resources
    fastify.post('/api/mongo/resources', { schema: { body: resourceBodySchema } }, async (request, reply) => {
        const { name, description } = request.body;
        const result = await resources.insertOne({ name, description });
        const newResource = { _id: result.insertedId, name, description };
        return reply.status(201).send(newResource);
    });

    // PUT /api/mongo/resources/:id
    fastify.put('/api/mongo/resources/:id', { schema: { params: resourceIdParamSchema('string'), body: resourceBodySchema } }, async (request, reply) => {
        const { id } = request.params;
        if (!ObjectId.isValid(id)) {
            return reply.status(400).send({ error: 'Invalid ID format' });
        }
        const { name, description } = request.body;
        const result = await resources.findOneAndUpdate(
            { _id: new ObjectId(id) },
            { $set: { name, description } },
            { returnDocument: 'after' }
        );
        if (!result) {
            return reply.status(404).send({ error: 'Resource not found' });
        }
        return result;
    });

    // DELETE /api/mongo/resources/:id
    fastify.delete('/api/mongo/resources/:id', { schema: { params: resourceIdParamSchema('string') } }, async (request, reply) => {
        const { id } = request.params;
        if (!ObjectId.isValid(id)) {
            return reply.status(400).send({ error: 'Invalid ID format' });
        }
        const result = await resources.deleteOne({ _id: new ObjectId(id) });
        if (result.deletedCount === 0) {
            return reply.status(404).send({ error: 'Resource not found' });
        }
        return reply.status(204).send();
    });
});


const start = async () => {
    try {
        await fastify.ready();
        
        await fastify.pg.query(`
            CREATE TABLE IF NOT EXISTS resources (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT
            )
        `);

        await fastify.listen({ port: 3020, host: '0.0.0.0' });
        fastify.log.info(`Fastify server listening on port ${fastify.server.address().port}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
