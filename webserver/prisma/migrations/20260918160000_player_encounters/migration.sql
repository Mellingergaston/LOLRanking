ALTER TABLE "MatchParticipation" ADD COLUMN "encountersSynced" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "PlayerEncounter" (
  "matchId" TEXT NOT NULL,
  "puuid" TEXT NOT NULL,
  "otherPuuid" TEXT NOT NULL,
  "gameName" TEXT NOT NULL,
  "tagLine" TEXT NOT NULL,
  "championName" TEXT NOT NULL,
  "gameCreation" DATETIME NOT NULL,
  "isAlly" BOOLEAN NOT NULL,
  "win" BOOLEAN NOT NULL,
  PRIMARY KEY ("matchId", "puuid", "otherPuuid")
);
CREATE INDEX "PlayerEncounter_puuid_gameCreation_idx" ON "PlayerEncounter"("puuid", "gameCreation");
