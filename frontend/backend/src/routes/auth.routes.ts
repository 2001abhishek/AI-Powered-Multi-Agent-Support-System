
import { Hono } from "hono";
import { authController } from "../controllers/auth.controller";

export const authRouter = new Hono();

authRouter.post("/login", authController.login);
authRouter.post("/signup", authController.signup);
