import { AuthController } from "./auth.controller.ts";
import { AuthService } from "./auth.service.ts";

const authService = new AuthService();
export const authController = new AuthController(authService);
