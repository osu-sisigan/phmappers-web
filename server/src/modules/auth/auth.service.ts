import { randomBytes } from "node:crypto";
import * as osu from "osu-api-v2-js";
import { config } from "../../config.ts";

export class AuthService {
	beginOAuth() {
		const state = randomBytes(32).toString("base64url");

		const url = new URL("https://osu.ppy.sh/oauth/authorize");
		url.search = new URLSearchParams({
			client_id: config.osu.clientId.toString(),
			redirect_uri: config.osu.redirectUri,
			response_type: "code",
			scope: "public identify",
			state,
		}).toString();

		return {
			url: url.toString(),
			state
		}
	}

	async completeOAuth(code: string) {
		const api = await osu.API.createAsync(
			config.osu.clientId,
			config.osu.clientSecret,
			{
				redirect_uri: config.osu.redirectUri,
				code,
			}
		);

		const user = await api.getResourceOwner();
		return { user }
	}
}
