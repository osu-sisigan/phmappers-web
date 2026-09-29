import "dotenv/config";
import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import { PrismaPg } from "@prisma/adapter-pg";
import * as osu from "osu-api-v2-js";
import { PrismaClient } from "../src/generated/prisma/client.ts";

// ALL YOU HAVE TO KNOW IS THAT THIS WORKS (MAYBE)

type Mapper = {
	id: number;
	username: string;
	avatar_url: string;
	country_code: string;
	ranked_count: number;
	loved_count: number;
	guest_count: number;
};
type SeedUser = Mapper & { is_mapper: boolean };
type SeedData = {
	version: 1;
	generated_at: string;
	users: SeedUser[];
	beatmapsets: {
		id: number;
		artist: string;
		title: string;
		host_id: number;
		cover_url: string | null;
		ranked_date: string | null;
		status: "RANKED" | "LOVED";
		spotlight: boolean;
	}[];
	beatmaps: {
		id: number;
		beatmapset_id: number;
		creator_user_id: number;
		version: string;
		star_rating: number;
		drain_length: number;
		total_length: number;
		mode: "OSU" | "MANIA" | "TAIKO" | "FRUITS";
		status: "RANKED" | "LOVED";
	}[];
	beatmap_owners: { beatmap_id: number; user_id: number }[];
};
type UserBeatmapset = Awaited<ReturnType<osu.API["getUserBeatmaps"]>>[number];
type DetailedBeatmap = Awaited<ReturnType<osu.API["getBeatmaps"]>>[number];
type SeedBeatmapSource = UserBeatmapset["beatmaps"][number] | DetailedBeatmap;

const mapperIdsFile = new URL("../phtools/phTools.py", import.meta.url);
const outputFile = new URL("./filipino-mappers.json", import.meta.url);
const requestIntervalMs = 1_050;
const mapperBatchSize = 10;

function required(name: string): string {
	const value = process.env[name];
	if (!value) throw new Error(`${name} is required`);
	return value;
}

function chunks<T>(items: T[], size: number): T[][] {
	return Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, (i + 1) * size));
}

function parseMapperIds(source: string): number[] {
	const block = source.match(/EMBEDDED_USER_IDS\s*=\s*\[([\s\S]*?)\]/)?.[1];
	if (!block) throw new Error("EMBEDDED_USER_IDS was not found in server/phtools/phTools.py");
	return [...new Set((block.match(/\d+/g) ?? []).map(Number))];
}

function isIncludedStatus(value: string): boolean {
	return value === "ranked" || value === "loved";
}

function status(value: string): "RANKED" | "LOVED" {
	if (value === "ranked") return "RANKED";
	if (value === "loved") return "LOVED";
	throw new Error(`Unsupported beatmap status: ${value}`);
}

function ruleset(value: string): "OSU" | "MANIA" | "TAIKO" | "FRUITS" {
	if (value === "osu") return "OSU";
	if (value === "mania") return "MANIA";
	if (value === "taiko") return "TAIKO";
	if (value === "fruits") return "FRUITS";
	throw new Error(`Unsupported ruleset: ${value}`);
}

function retryDelay(statusCode: number | undefined, attempt: number): number | undefined {
	if (statusCode === 429) return Math.min(30_000 * 2 ** (attempt - 1), 300_000);
	if (statusCode !== undefined && statusCode < 500) return undefined;
	return attempt < 3 ? 5_000 : undefined;
}

assert.deepEqual(
	[
		parseMapperIds("EMBEDDED_USER_IDS = [1, 2, 1]"),
		chunks([1, 2, 3], 2),
		isIncludedStatus("ranked"),
		isIncludedStatus("approved"),
		isIncludedStatus("loved"),
		status("ranked"),
		status("loved"),
		ruleset("osu"),
		retryDelay(429, 1),
		retryDelay(404, 1),
		retryDelay(500, 3),
	],
	[[1, 2], [[1, 2], [3]], true, false, true, "RANKED", "LOVED", "OSU", 30_000, undefined, undefined],
);

async function retry<T>(operation: () => Promise<T>): Promise<T> {
	for (let attempt = 1; ; attempt++) {
		try {
			return await operation();
		} catch (error) {
			const statusCode = error instanceof osu.APIError ? error.response?.status_code : undefined;
			const delay = retryDelay(statusCode, attempt);
			if (delay === undefined) throw error;
			console.warn(`${statusCode === 429 ? "Rate limited" : "Request failed"}; retrying in ${delay / 1_000}s`);
			await sleep(delay);
		}
	}
}

function limitRequests(api: osu.API): void {
	const request = api.request.bind(api);
	let nextRequestAt = Date.now() + requestIntervalMs;

	api.request = async (...args: Parameters<typeof request>) => {
		await sleep(Math.max(0, nextRequestAt - Date.now()));
		try {
			return await request(...args);
		} finally {
			nextRequestAt = Date.now() + requestIntervalMs;
		}
	};
}

async function getFilipinoMappers(api: osu.API, candidateIds: number[]): Promise<Mapper[]> {
	const mappers: Mapper[] = [];

	for (const ids of chunks(candidateIds, 50)) {
		const users = await retry(() => api.getUsers(ids));
		for (const compactUser of users.filter((user) => user.country_code === "PH")) {
			let user: Awaited<ReturnType<osu.API["getUser"]>>;
			try {
				user = await retry(() => api.getUser(compactUser.id));
			} catch (error) {
				if (error instanceof osu.APIError && error.response?.status_code === 404) {
					console.warn(`Skipping mapper ${compactUser.id}: profile not found`);
					continue;
				}
				throw error;
			}
			if (user.ranked_beatmapset_count + user.loved_beatmapset_count + user.guest_beatmapset_count === 0) continue;
			mappers.push({
				id: user.id,
				username: user.username,
				avatar_url: user.avatar_url,
				country_code: user.country_code,
				ranked_count: user.ranked_beatmapset_count,
				loved_count: user.loved_beatmapset_count,
				guest_count: user.guest_beatmapset_count,
			});
		}
		console.log(`Profiles: ${mappers.length} Filipino mappers found`);
	}

	return mappers;
}

async function getAllUserBeatmapsets(api: osu.API, userId: number, type: "ranked" | "loved" | "guest"): Promise<UserBeatmapset[]> {
	const sets: UserBeatmapset[] = [];
	for (let offset = 0; ; offset += 50) {
		const page = await retry(() => api.getUserBeatmaps(userId, type, { limit: 50, offset }));
		sets.push(...page);
		if (page.length < 50) return sets;
	}
}

async function collectMapperData(api: osu.API, mappers: Mapper[], generatedAt: string): Promise<SeedData> {
	const sets = new Map<number, UserBeatmapset>();

	for (const [index, mapper] of mappers.entries()) {
		const types: ("ranked" | "loved" | "guest")[] = [];
		if (mapper.ranked_count) types.push("ranked");
		if (mapper.loved_count) types.push("loved");
		if (mapper.guest_count) types.push("guest");
		for (const type of types) {
			for (const set of await getAllUserBeatmapsets(api, mapper.id, type)) {
				if (isIncludedStatus(set.status)) sets.set(set.id, set);
			}
		}
		console.log(`Beatmapsets: ${index + 1}/${mappers.length} mappers, ${sets.size} unique sets`);
	}

	const beatmaps = new Map<number, SeedBeatmapSource>();
	for (const set of sets.values()) {
		set.beatmaps.filter((beatmap) => isIncludedStatus(beatmap.status)).forEach((beatmap) => beatmaps.set(beatmap.id, beatmap));
	}
	const beatmapIds = [...beatmaps.keys()];
	for (const [index, ids] of chunks(beatmapIds, 50).entries()) {
		for (const beatmap of await retry(() => api.getBeatmaps(ids))) {
			if (isIncludedStatus(beatmap.status)) beatmaps.set(beatmap.id, beatmap);
			else beatmaps.delete(beatmap.id);
		}
		console.log(`Beatmaps: ${Math.min((index + 1) * 50, beatmapIds.length)}/${beatmapIds.length} checked`);
	}

	const userNames = new Map<number, string>();
	for (const set of sets.values()) userNames.set(set.user_id, set.creator);
	for (const beatmap of beatmaps.values()) {
		const owners = "owners" in beatmap ? beatmap.owners : [];
		userNames.set(beatmap.user_id, owners.find((owner) => owner.id === beatmap.user_id)?.username ?? userNames.get(beatmap.user_id) ?? `[user ${beatmap.user_id}]`);
		owners.forEach((owner) => userNames.set(owner.id, owner.username));
	}

	const compactUsers = new Map<number, Awaited<ReturnType<osu.API["getUsers"]>>[number]>();
	for (const ids of chunks([...userNames.keys()], 50)) {
		for (const user of await retry(() => api.getUsers(ids))) compactUsers.set(user.id, user);
	}

	const users = new Map<number, SeedUser>();
	for (const [id, username] of userNames) {
		const user = compactUsers.get(id);
		users.set(id, {
			id,
			username: user?.username ?? username,
			avatar_url: user?.avatar_url ?? `https://a.ppy.sh/${id}`,
			country_code: user?.country_code ?? "XX",
			is_mapper: false,
			ranked_count: 0,
			loved_count: 0,
			guest_count: 0,
		});
	}
	for (const mapper of mappers) users.set(mapper.id, { ...mapper, is_mapper: true });

	const beatmapOwners = new Map<string, { beatmap_id: number; user_id: number }>();
	for (const beatmap of beatmaps.values()) {
		const owners = "owners" in beatmap ? beatmap.owners : [];
		for (const userId of new Set([beatmap.user_id, ...owners.map((owner) => owner.id)])) {
			beatmapOwners.set(`${beatmap.id}:${userId}`, { beatmap_id: beatmap.id, user_id: userId });
		}
	}

	return {
		version: 1,
		generated_at: generatedAt,
		users: [...users.values()],
		beatmapsets: [...sets.values()].map((set) => ({
			id: set.id,
			artist: set.artist,
			title: set.title,
			host_id: set.user_id,
			cover_url: set.covers.cover,
			ranked_date: set.ranked_date?.toISOString() ?? null,
			status: status(set.status),
			spotlight: set.spotlight,
		})),
		beatmaps: [...beatmaps.values()].map((beatmap) => ({
			id: beatmap.id,
			beatmapset_id: beatmap.beatmapset_id,
			creator_user_id: beatmap.user_id,
			version: beatmap.version,
			star_rating: beatmap.difficulty_rating,
			drain_length: beatmap.drain,
			total_length: beatmap.total_length,
			mode: ruleset(beatmap.mode),
			status: status(beatmap.status),
		})),
		beatmap_owners: [...beatmapOwners.values()],
	};
}

async function collectSeedData(api: osu.API, candidateIds: number[], writeBatch?: (data: SeedData) => Promise<void>): Promise<SeedData> {
	const generatedAt = new Date().toISOString();
	const users = new Map<number, SeedUser>();
	const beatmapsets = new Map<number, SeedData["beatmapsets"][number]>();
	const beatmaps = new Map<number, SeedData["beatmaps"][number]>();
	const beatmapOwners = new Map<string, SeedData["beatmap_owners"][number]>();
	const candidateBatches = chunks(candidateIds, mapperBatchSize);

	for (const [index, candidateBatch] of candidateBatches.entries()) {
		console.log(`Collecting batch ${index + 1}/${candidateBatches.length} (${candidateBatch.length} candidates)`);
		const mappers = await getFilipinoMappers(api, candidateBatch);
		if (!mappers.length) continue;
		const data = await collectMapperData(api, mappers, generatedAt);
		for (const user of data.users) {
			const existing = users.get(user.id);
			if (!existing?.is_mapper || user.is_mapper) users.set(user.id, user);
		}
		for (const set of data.beatmapsets) beatmapsets.set(set.id, set);
		for (const beatmap of data.beatmaps) beatmaps.set(beatmap.id, beatmap);
		for (const owner of data.beatmap_owners) beatmapOwners.set(`${owner.beatmap_id}:${owner.user_id}`, owner);
		if (writeBatch) await writeBatch(data);
	}

	return {
		version: 1,
		generated_at: generatedAt,
		users: [...users.values()],
		beatmapsets: [...beatmapsets.values()],
		beatmaps: [...beatmaps.values()],
		beatmap_owners: [...beatmapOwners.values()],
	};
}

function parseSeedData(json: string): SeedData {
	const data = JSON.parse(json) as SeedData;
	if (data.version !== 1 || !Array.isArray(data.users) || !Array.isArray(data.beatmapsets) || !Array.isArray(data.beatmaps) || !Array.isArray(data.beatmap_owners)) {
		throw new Error("Invalid seed JSON; run the collection step again");
	}
	return data;
}

async function importSeedData(data: SeedData, databaseUrl: string): Promise<void> {
	const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
	const syncedAt = new Date(data.generated_at);

	try {
		for (const batch of chunks(data.users, 100)) {
			await prisma.$transaction(batch.map((user) => prisma.user.upsert({
				where: { id: user.id },
				create: { ...user, last_synced_at: syncedAt },
				update: {
					username: user.username,
					avatar_url: user.avatar_url,
					country_code: user.country_code,
					last_synced_at: syncedAt,
					...(user.is_mapper ? {
						is_mapper: true,
						ranked_count: user.ranked_count,
						loved_count: user.loved_count,
						guest_count: user.guest_count,
					} : {}),
				},
			})));
		}

		for (const batch of chunks(data.beatmapsets, 100)) {
			await prisma.$transaction(batch.map((set) => prisma.beatmapset.upsert({
				where: { id: set.id },
				create: { ...set, ranked_date: set.ranked_date ? new Date(set.ranked_date) : null, last_synced_at: syncedAt },
				update: { ...set, ranked_date: set.ranked_date ? new Date(set.ranked_date) : null, last_synced_at: syncedAt },
			})));
		}

		for (const batch of chunks(data.beatmaps, 100)) {
			await prisma.$transaction(batch.map((beatmap) => prisma.beatmap.upsert({
				where: { id: beatmap.id },
				create: { ...beatmap, last_synced_at: syncedAt },
				update: { ...beatmap, last_synced_at: syncedAt },
			})));
		}

		for (const batch of chunks(data.beatmaps.map((beatmap) => beatmap.id), 500)) {
			await prisma.beatmapOwner.deleteMany({ where: { beatmap_id: { in: batch } } });
		}
		for (const batch of chunks(data.beatmap_owners, 1_000)) {
			await prisma.beatmapOwner.createMany({ data: batch, skipDuplicates: true });
		}
	} finally {
		await prisma.$disconnect();
	}

	console.log(`Imported ${data.users.length} users, ${data.beatmapsets.length} beatmapsets, and ${data.beatmaps.length} beatmaps.`);
}

async function main(): Promise<void> {
	const importOnly = process.argv.includes("--import");
	const collectOnly = process.argv.includes("--collect-only");
	if (importOnly && collectOnly) throw new Error("Choose either --import or --collect-only");

	if (importOnly) {
		await importSeedData(parseSeedData(await readFile(outputFile, "utf8")), required("DATABASE_URL"));
		return;
	}

	const clientId = Number(required("OSU_CLIENT_ID"));
	if (!Number.isSafeInteger(clientId) || clientId < 1) throw new Error("OSU_CLIENT_ID must be a positive integer");
	const candidateIds = parseMapperIds(await readFile(mapperIdsFile, "utf8"));
	if (candidateIds.length !== 191) throw new Error(`Expected 191 mapper IDs, found ${candidateIds.length}`);

	const api = await osu.API.createAsync(clientId, required("OSU_CLIENT_SECRET"), undefined, { retry_maximum_amount: 0 });
	limitRequests(api);
	const databaseUrl = collectOnly ? undefined : required("DATABASE_URL");
	const data = await collectSeedData(api, candidateIds, databaseUrl ? (batch) => importSeedData(batch, databaseUrl) : undefined);
	await writeFile(outputFile, `${JSON.stringify(data, null, 2)}\n`);
	console.log(`Wrote seed data to ${outputFile.pathname}`);
}

await main();
