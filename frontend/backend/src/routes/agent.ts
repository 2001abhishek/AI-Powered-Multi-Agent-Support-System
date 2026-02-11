
import { Hono } from 'hono';

const agent = new Hono();

agent.get('/', (c) => {
    return c.json({
        agents: [
            { id: 'router', name: 'Router Agent', type: 'system', status: 'active' },
            { id: 'support', name: 'Support Agent', type: 'support', status: 'active' },
            { id: 'order', name: 'Order Agent', type: 'fulfillment', status: 'active' },
            { id: 'billing', name: 'Billing Agent', type: 'finance', status: 'active' },
        ]
    });
});

agent.get('/:type/capabilities', (c) => {
    const type = c.req.param('type');
    // Mock capabilities
    const capabilities = {
        router: ['intent_classification', 'delegation'],
        support: ['faq', 'general_inquiry'],
        order: ['order_status', 'shipping_updates'],
        billing: ['invoice_retrieval', 'refund_processing'],
    };

    return c.json({
        type,
        capabilities: capabilities[type as keyof typeof capabilities] || []
    });
});

export default agent;
