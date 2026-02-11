
import { serve } from "@hono/node-server";
import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { cors } from "hono/cors";
import authRoutes from "./routes/auth";
import "dotenv/config";

const app = new OpenAPIHono();

app.use("/*", cors());

// Routes
app.route("/api/auth", authRoutes);

// Swagger Documentation
app.doc("/doc", {
    openapi: "3.0.0",
    info: {
        version: "1.0.0",
        title: "Swades AI Support API",
    },
    security: [
        {
            BearerAuth: [],
        },
    ],
} as any);

app.openAPIRegistry.registerComponent('securitySchemes', 'BearerAuth', {
    type: 'http',
    scheme: 'bearer',
    bearerFormat: 'JWT',
})

app.get("/docs", swaggerUI({ url: "/doc" }));

app.get("/", (c) => {
    return c.text("Hello Hono!");
});

const port = 8000;
console.log(`Server is running on port ${port}`);

serve({
    fetch: app.fetch,
    port,
});
