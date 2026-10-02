-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "pool_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentMap" (
    "id" TEXT NOT NULL,
    "tournament_id" TEXT NOT NULL,
    "beatmap_id" INTEGER NOT NULL,
    "slot" TEXT,
    "pool_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TournamentMap_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TournamentSubmission" (
    "id" TEXT NOT NULL,
    "submitted_by_id" INTEGER NOT NULL,
    "beatmap_id" INTEGER NOT NULL,
    "tournament_name" TEXT NOT NULL,
    "tournament_url" TEXT NOT NULL,
    "slot" TEXT,
    "pool_url" TEXT,
    "reason" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" INTEGER,
    "review_reason" TEXT,
    "approved_tournament_map_id" TEXT,

    CONSTRAINT "TournamentSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "results_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestEntry" (
    "id" TEXT NOT NULL,
    "contest_id" TEXT NOT NULL,
    "beatmap_id" INTEGER NOT NULL,
    "placement" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContestEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContestSubmission" (
    "id" TEXT NOT NULL,
    "submitted_by_id" INTEGER NOT NULL,
    "beatmap_id" INTEGER NOT NULL,
    "contest_name" TEXT NOT NULL,
    "contest_url" TEXT NOT NULL,
    "placement" INTEGER,
    "results_url" TEXT,
    "reason" TEXT,
    "status" "SubmissionStatus" NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),
    "reviewed_by_id" INTEGER,
    "review_reason" TEXT,
    "approved_contest_entry_id" TEXT,

    CONSTRAINT "ContestSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Tournament_name_url_key" ON "Tournament"("name", "url");

-- CreateIndex
CREATE INDEX "TournamentMap_tournament_id_idx" ON "TournamentMap"("tournament_id");

-- CreateIndex
CREATE INDEX "TournamentMap_beatmap_id_idx" ON "TournamentMap"("beatmap_id");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentMap_tournament_id_beatmap_id_slot_key" ON "TournamentMap"("tournament_id", "beatmap_id", "slot");

-- CreateIndex
CREATE UNIQUE INDEX "TournamentSubmission_approved_tournament_map_id_key" ON "TournamentSubmission"("approved_tournament_map_id");

-- CreateIndex
CREATE INDEX "TournamentSubmission_submitted_by_id_idx" ON "TournamentSubmission"("submitted_by_id");

-- CreateIndex
CREATE INDEX "TournamentSubmission_beatmap_id_idx" ON "TournamentSubmission"("beatmap_id");

-- CreateIndex
CREATE INDEX "TournamentSubmission_status_submitted_at_idx" ON "TournamentSubmission"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "TournamentSubmission_reviewed_by_id_idx" ON "TournamentSubmission"("reviewed_by_id");

-- CreateIndex
CREATE UNIQUE INDEX "Contest_name_url_key" ON "Contest"("name", "url");

-- CreateIndex
CREATE INDEX "ContestEntry_contest_id_idx" ON "ContestEntry"("contest_id");

-- CreateIndex
CREATE INDEX "ContestEntry_beatmap_id_idx" ON "ContestEntry"("beatmap_id");

-- CreateIndex
CREATE INDEX "ContestEntry_placement_idx" ON "ContestEntry"("placement");

-- CreateIndex
CREATE UNIQUE INDEX "ContestEntry_contest_id_beatmap_id_key" ON "ContestEntry"("contest_id", "beatmap_id");

-- CreateIndex
CREATE UNIQUE INDEX "ContestSubmission_approved_contest_entry_id_key" ON "ContestSubmission"("approved_contest_entry_id");

-- CreateIndex
CREATE INDEX "ContestSubmission_submitted_by_id_idx" ON "ContestSubmission"("submitted_by_id");

-- CreateIndex
CREATE INDEX "ContestSubmission_beatmap_id_idx" ON "ContestSubmission"("beatmap_id");

-- CreateIndex
CREATE INDEX "ContestSubmission_status_submitted_at_idx" ON "ContestSubmission"("status", "submitted_at");

-- CreateIndex
CREATE INDEX "ContestSubmission_reviewed_by_id_idx" ON "ContestSubmission"("reviewed_by_id");

-- AddForeignKey
ALTER TABLE "TournamentMap" ADD CONSTRAINT "TournamentMap_tournament_id_fkey" FOREIGN KEY ("tournament_id") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentMap" ADD CONSTRAINT "TournamentMap_beatmap_id_fkey" FOREIGN KEY ("beatmap_id") REFERENCES "Beatmap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentSubmission" ADD CONSTRAINT "TournamentSubmission_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentSubmission" ADD CONSTRAINT "TournamentSubmission_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentSubmission" ADD CONSTRAINT "TournamentSubmission_beatmap_id_fkey" FOREIGN KEY ("beatmap_id") REFERENCES "Beatmap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TournamentSubmission" ADD CONSTRAINT "TournamentSubmission_approved_tournament_map_id_fkey" FOREIGN KEY ("approved_tournament_map_id") REFERENCES "TournamentMap"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestEntry" ADD CONSTRAINT "ContestEntry_contest_id_fkey" FOREIGN KEY ("contest_id") REFERENCES "Contest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestEntry" ADD CONSTRAINT "ContestEntry_beatmap_id_fkey" FOREIGN KEY ("beatmap_id") REFERENCES "Beatmap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_submitted_by_id_fkey" FOREIGN KEY ("submitted_by_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_reviewed_by_id_fkey" FOREIGN KEY ("reviewed_by_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_beatmap_id_fkey" FOREIGN KEY ("beatmap_id") REFERENCES "Beatmap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContestSubmission" ADD CONSTRAINT "ContestSubmission_approved_contest_entry_id_fkey" FOREIGN KEY ("approved_contest_entry_id") REFERENCES "ContestEntry"("id") ON DELETE SET NULL ON UPDATE CASCADE;
