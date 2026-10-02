import { Router } from "express";
import { authController } from "./auth.container.ts";

const router = Router();

router.get('/osu', authController.startOAuth);
router.get("/osu/callback", authController.completeOAuth);

export default router;
