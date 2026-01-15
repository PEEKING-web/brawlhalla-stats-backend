-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "steamId" TEXT NOT NULL,
    "displayName" TEXT,
    "avatar" TEXT,
    "brawlhallaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Favorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brawlhallaId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PlayerNote" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brawlhallaId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "category" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlayerNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TrackedPlayer" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brawlhallaId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "currentRank" INTEGER,
    "currentRating" INTEGER,
    "lastChecked" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TrackedPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RankHistory" (
    "id" TEXT NOT NULL,
    "trackedPlayerId" TEXT NOT NULL,
    "rank" INTEGER NOT NULL,
    "rating" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RankHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_steamId_key" ON "User"("steamId");

-- CreateIndex
CREATE INDEX "Favorite_userId_idx" ON "Favorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Favorite_userId_brawlhallaId_key" ON "Favorite"("userId", "brawlhallaId");

-- CreateIndex
CREATE INDEX "PlayerNote_userId_idx" ON "PlayerNote"("userId");

-- CreateIndex
CREATE INDEX "PlayerNote_userId_brawlhallaId_idx" ON "PlayerNote"("userId", "brawlhallaId");

-- CreateIndex
CREATE INDEX "TrackedPlayer_userId_idx" ON "TrackedPlayer"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TrackedPlayer_userId_brawlhallaId_key" ON "TrackedPlayer"("userId", "brawlhallaId");

-- CreateIndex
CREATE INDEX "RankHistory_trackedPlayerId_idx" ON "RankHistory"("trackedPlayerId");

-- CreateIndex
CREATE INDEX "RankHistory_recordedAt_idx" ON "RankHistory"("recordedAt");

-- AddForeignKey
ALTER TABLE "Favorite" ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PlayerNote" ADD CONSTRAINT "PlayerNote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrackedPlayer" ADD CONSTRAINT "TrackedPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RankHistory" ADD CONSTRAINT "RankHistory_trackedPlayerId_fkey" FOREIGN KEY ("trackedPlayerId") REFERENCES "TrackedPlayer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
