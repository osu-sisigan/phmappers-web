import type { AuthService } from "./auth.service.ts";
import type { Request, Response } from "express";
import { OAUTH_COOKIE_OPTIONS } from "../../constants.ts";

export class AuthController {
	private readonly service: AuthService

	constructor(service: AuthService) {
		this.service = service;
	}

	startOAuth = (req: Request, res: Response): void => {
		//if (user) return to main dashboard or something

		try {
			const { url, state } = this.service.beginOAuth();

			res.cookie("oauth_state", state, {
				...OAUTH_COOKIE_OPTIONS,
				maxAge: 10 * 60 * 1000,
			});

			res.redirect(url);
		} catch (error) {
			console.error("Failed to start OAuth", error);

			res.status(500).json({
				error: "Failed to start OAuth",
			});
		}
	};

	completeOAuth = async (req: Request, res: Response): Promise<void> => {
		const code = getQueryString(req.query.code);
		const returnedState = getQueryString(req.query.state)

		const storedState =
			typeof req.signedCookies.oauth_state === "string"
				? req.signedCookies.oauth_state
				: undefined;

		res.clearCookie("oauth_state", OAUTH_COOKIE_OPTIONS);

		if (!code || !returnedState || !storedState) {
			res.status(400).json({
				error: "Invalid OAuth callback",
			});
			return;
		}

		if (returnedState !== storedState) {
			res.status(400).json({
				error: "Invalid OAuth state",
			});
			return;
		}

		try {
			const { user } = await this.service.completeOAuth(code);

			// will remove once sessions are implemented
			res.status(200).json({
				id: user.id,
				username: user.username,
				previous: user.previous_usernames,
				badges: user.badges,
				ranked: user.ranked_beatmapset_count,
				loved: user.loved_beatmapset_count,
				graveyard: user.graveyard_beatmapset_count,
				gd: user.guest_beatmapset_count,
				pending: user.pending_beatmapset_count,
				title: user.title,
				country: user.country,
                country_code: user.country_code,
			});

			//find or create local user and establish session (once db is made)
		} catch (error) {
			console.error("Failed to complete OAuth", error);

			res.status(500).json({
				error: "Failed to complete OAuth",
			});
		}
	};
}

function getQueryString(value: unknown): string | undefined {
	return typeof value === "string" ? value : undefined;
}
