-- CreateTable
CREATE TABLE "Summoner" (
    "puuid" TEXT NOT NULL PRIMARY KEY,
    "riotId" TEXT NOT NULL,
    "gameName" TEXT NOT NULL,
    "tagLine" TEXT NOT NULL,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MatchParticipation" (
    "matchId" TEXT NOT NULL,
    "puuid" TEXT NOT NULL,
    "gameCreation" DATETIME NOT NULL,
    "queueId" INTEGER NOT NULL,
    "win" BOOLEAN NOT NULL,
    "kills" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "damageDealt" INTEGER NOT NULL,
    "damageTaken" INTEGER NOT NULL,
    "visionScore" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("matchId", "puuid")
);

-- CreateIndex
CREATE UNIQUE INDEX "Summoner_riotId_key" ON "Summoner"("riotId");

-- CreateIndex
CREATE INDEX "MatchParticipation_puuid_gameCreation_idx" ON "MatchParticipation"("puuid", "gameCreation");
