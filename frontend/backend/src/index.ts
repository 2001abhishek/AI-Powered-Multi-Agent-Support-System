
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import auth from './routes/auth';
import chat from './routes/chat';
import agent from './routes/agent';
import { serve } from '@hono/node-server'

const app = new OpenAPIHono();

app.use('*', cors());
app.use('*', logger());
app.use('*', prettyJSON());

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date() }));

// Swagger UI
app.get('/ui', swaggerUI({ url: '/doc' }));
app.doc('/doc', {
    openapi: '3.0.0',
    info: {
        version: '1.0.0',
        title: 'Swades AI API',
    },
});

const routes = app
    .route('/api/auth', auth)
    .route('/api/chat', chat)
    .route('/api/agents', agent);

const port = 3000
console.log(`Server is running on port ${port}`)

serve({
    fetch: app.fetch,
    port
})

export default app;
export type AppType = typeof routes;
