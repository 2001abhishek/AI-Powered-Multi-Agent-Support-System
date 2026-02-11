
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { authRouter } from './routes/auth.routes';
import { chatRouter } from './routes/chat.routes';
import { agentRouter } from './routes/agent.routes';

const app = new Hono();

app.use('/*', cors());

app.get('/', (c) => c.text('Swades AI Backend is Running!'));
app.get('/health', (c) => c.json({ status: 'ok', uptime: process.uptime() }));

app.onError((err, c) => {
    console.error(`${err}`);
    return c.json({ error: 'Internal Server Error', message: err.message }, 500);
});

// Mount Routes
const routes = app
    .route('/api/auth', authRouter)
    .route('/api/chat', chatRouter)
    .route('/api/agents', agentRouter);

// Swagger Documentation
app.get('/ui', swaggerUI({ url: '/doc' }));
app.get('/doc', (c) => {
    return c.json({
        openapi: '3.0.0',
        info: {
            title: 'Swades AI API',
            version: '1.0.0',
        },
        paths: {
            '/api/agents': {
                get: {
                    summary: 'List available agents',
                    responses: {
                        '200': {
                            description: 'Successful response',
                        },
                    },
                },
            },
            '/api/chat/conversations': {
                get: {
                    summary: 'List conversations',
                    responses: {
                        '200': {
                            description: 'Successful response',
                        },
                    },
                },
            },
            '/api/chat/messages': {
                post: {
                    summary: 'Send a message',
                    requestBody: {
                        content: {
                            'application/json': {
                                schema: {
                                    type: 'object',
                                    properties: {
                                        content: { type: 'string' },
                                        userId: { type: 'string' },
                                        conversationId: { type: 'string' }
                                    }
                                }
                            }
                        }
                    },
                    responses: {
                        '200': {
                            description: 'Successful response',
                        },
                    },
                },
            },
        },
    });
});

// Export type for RPC
export type AppType = typeof routes;

// Start server
const port = 3001;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});
