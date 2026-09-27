function required(name: string): string {
	const value = process.env[name];

	if (!value) {
		throw new Error(`${name} is required`);
	}

	return value;
}

function url(name: string): string {
	const value = required(name);

	try {
		new URL(value);
	} catch {
		throw new Error(`${name} must be a valid URL`);
	}

	return value;
}

const port = Number(process.env.PORT ?? '4000');

if (!Number.isInteger(port) || port < 1 || port > 65_535) {
	throw new Error("PORT must be a valid number");
}

export const config = {
	env: process.env.NODE_ENV ?? 'development',
	port,
	cookieSecret: required("COOKIE_SECRET"),
	osu: {
		clientId: Number(required('OSU_CLIENT_ID')),
		clientSecret: required('OSU_CLIENT_SECRET'),
		redirectUri: url('OSU_REDIRECT_URI'),
	}
} as const;

if (!Number.isSafeInteger(config.osu.clientId) || config.osu.clientId < 1) {
	throw new Error('OSU_CLIENT_ID must be a positive integer');
}
