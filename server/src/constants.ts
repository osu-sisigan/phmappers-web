import { config } from "./config.ts";
import type { CookieOptions } from "express";

export const OAUTH_COOKIE_OPTIONS: CookieOptions = {
	httpOnly: true,
	secure: config.env === "production",
	sameSite: "lax",
	signed: true,
	path: "/auth/osu",
};
