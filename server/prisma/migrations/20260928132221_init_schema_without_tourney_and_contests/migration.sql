-- CreateEnum
CREATE TYPE "BeatmapStatus" AS ENUM ('GRAVEYARD', 'WIP', 'PENDING', 'QUALIFIED', 'APPROVED', 'LOVED');

-- CreateEnum
CREATE TYPE "Ruleset" AS ENUM ('OSU', 'MANIA', 'TAIKO', 'FRUITS');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "avatar_url" TEXT,
    "country_code" CHAR(2) NOT NULL,
    "has_authenticated" BOOLEAN NOT NULL DEFAULT false,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "last_login_at" TIMESTAMP(3),
    "is_mapper" BOOLEAN NOT NULL DEFAULT false,
    "ranked_count" INTEGER NOT NULL DEFAULT 0,
    "loved_count" INTEGER NOT NULL DEFAULT 0,
    "guest_count" INTEGER NOT NULL DEFAULT 0,
    "tournament_count" INTEGER NOT NULL DEFAULT 0,
    "contest_count" INTEGER NOT NULL DEFAULT 0,
    "leaderboard_score" DECIMAL(12,4) NOT NULL DEFAULT 0,
    "leaderboard_updated_at" TIMESTAMP(3),
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" TEXT NOT NULL,
    "last_used_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beatmapset" (
    "id" INTEGER NOT NULL,
    "artist" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "host_id" INTEGER NOT NULL,
    "cover_url" TEXT,
    "ranked_date" TIMESTAMP(3),
    "status" "BeatmapStatus" NOT NULL,
    "spotlight" BOOLEAN NOT NULL DEFAULT false,
    "last_synced_at" TIMESTAMP(3),
    "next_status_check_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beatmapset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Beatmap" (
    "id" INTEGER NOT NULL,
    "beatmapset_id" INTEGER NOT NULL,
    "creator_user_id" INTEGER NOT NULL,
    "version" TEXT NOT NULL,
    "star_rating" DOUBLE PRECISION NOT NULL,
    "drain_length" INTEGER NOT NULL,
    "total_length" INTEGER NOT NULL,
    "mode" "Ruleset" NOT NULL,
    "status" "BeatmapStatus" NOT NULL,
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Beatmap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BeatmapOwner" (
    "beatmap_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,

    CONSTRAINT "BeatmapOwner_pkey" PRIMARY KEY ("beatmap_id","user_id")
);

-- CreateIndex
CREATE INDEX "User_country_code_idx" ON "User"("country_code");

-- CreateIndex
CREATE INDEX "User_is_mapper_idx" ON "User"("is_mapper");

-- CreateIndex
CREATE INDEX "User_is_mapper_country_code_leaderboard_score_idx" ON "User"("is_mapper", "country_code", "leaderboard_score");

-- CreateIndex
CREATE INDEX "User_ranked_count_idx" ON "User"("ranked_count");

-- CreateIndex
CREATE INDEX "User_loved_count_idx" ON "User"("loved_count");

-- CreateIndex
CREATE INDEX "User_guest_count_idx" ON "User"("guest_count");

-- CreateIndex
CREATE INDEX "User_tournament_count_idx" ON "User"("tournament_count");

-- CreateIndex
CREATE INDEX "User_contest_count_idx" ON "User"("contest_count");

-- CreateIndex
CREATE INDEX "User_last_synced_at_idx" ON "User"("last_synced_at");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_hash_key" ON "Session"("token_hash");

-- CreateIndex
CREATE INDEX "Session_user_id_idx" ON "Session"("user_id");

-- CreateIndex
CREATE INDEX "Session_expires_at_idx" ON "Session"("expires_at");

-- CreateIndex
CREATE INDEX "Beatmapset_host_id_idx" ON "Beatmapset"("host_id");

-- CreateIndex
CREATE INDEX "Beatmapset_status_idx" ON "Beatmapset"("status");

-- CreateIndex
CREATE INDEX "Beatmapset_ranked_date_idx" ON "Beatmapset"("ranked_date");

-- CreateIndex
CREATE INDEX "Beatmapset_status_ranked_date_idx" ON "Beatmapset"("status", "ranked_date");

-- CreateIndex
CREATE INDEX "Beatmapset_status_next_status_check_at_idx" ON "Beatmapset"("status", "next_status_check_at");

-- CreateIndex
CREATE INDEX "Beatmapset_artist_idx" ON "Beatmapset"("artist");

-- CreateIndex
CREATE INDEX "Beatmapset_title_idx" ON "Beatmapset"("title");

-- CreateIndex
CREATE INDEX "Beatmap_beatmapset_id_idx" ON "Beatmap"("beatmapset_id");

-- CreateIndex
CREATE INDEX "Beatmap_creator_user_id_idx" ON "Beatmap"("creator_user_id");

-- CreateIndex
CREATE INDEX "Beatmap_status_idx" ON "Beatmap"("status");

-- CreateIndex
CREATE INDEX "Beatmap_mode_idx" ON "Beatmap"("mode");

-- CreateIndex
CREATE INDEX "Beatmap_star_rating_idx" ON "Beatmap"("star_rating");

-- CreateIndex
CREATE INDEX "BeatmapOwner_user_id_idx" ON "BeatmapOwner"("user_id");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beatmapset" ADD CONSTRAINT "Beatmapset_host_id_fkey" FOREIGN KEY ("host_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beatmap" ADD CONSTRAINT "Beatmap_beatmapset_id_fkey" FOREIGN KEY ("beatmapset_id") REFERENCES "Beatmapset"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Beatmap" ADD CONSTRAINT "Beatmap_creator_user_id_fkey" FOREIGN KEY ("creator_user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeatmapOwner" ADD CONSTRAINT "BeatmapOwner_beatmap_id_fkey" FOREIGN KEY ("beatmap_id") REFERENCES "Beatmap"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BeatmapOwner" ADD CONSTRAINT "BeatmapOwner_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
