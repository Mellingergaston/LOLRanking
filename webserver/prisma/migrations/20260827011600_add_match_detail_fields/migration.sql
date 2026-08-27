-- AlterTable
ALTER TABLE "MatchParticipation" ADD COLUMN "championId" INTEGER;
ALTER TABLE "MatchParticipation" ADD COLUMN "championName" TEXT;
ALTER TABLE "MatchParticipation" ADD COLUMN "gameDurationSeconds" INTEGER;
ALTER TABLE "MatchParticipation" ADD COLUMN "minionsKilled" INTEGER;
ALTER TABLE "MatchParticipation" ADD COLUMN "neutralMinionsKilled" INTEGER;
ALTER TABLE "MatchParticipation" ADD COLUMN "teamId" INTEGER;
ALTER TABLE "MatchParticipation" ADD COLUMN "teamPosition" TEXT;
