import type { MatchStatsRepository } from '@/domain/repositories/MatchStatsRepository';
import type { MatchParticipationData } from '@/domain/repositories/MatchProvider';
import { emptyMonthlyStats, type MonthlyStats } from '@/domain/entities/MonthlyStats';
import type { PrismaClient } from '@prisma/client';

export class PrismaMatchStatsRepository implements MatchStatsRepository {
  constructor(private readonly db: PrismaClient) {}

  async hasMatch(matchId: string, puuid: string): Promise<boolean> {
    const found = await this.db.matchParticipation.findUnique({
      where: { matchId_puuid: { matchId, puuid } },
      select: { championId: true },
    });
    // Filas guardadas antes de sumar columnas nuevas (championId, teamPosition,
    // etc.) quedan con championId null — se tratan como "no sincronizadas" para
    // que la próxima sincronización las vuelva a traer completas.
    return found !== null && found.championId !== null;
  }

  async saveParticipation(data: MatchParticipationData): Promise<void> {
    await this.db.matchParticipation.upsert({
      where: { matchId_puuid: { matchId: data.matchId, puuid: data.puuid } },
      create: data,
      update: data,
    });
  }

  async getStatsSince(puuid: string, riotId: string, since: Date): Promise<MonthlyStats> {
    const [aggregate, wins] = await Promise.all([
      this.db.matchParticipation.aggregate({
        where: { puuid, gameCreation: { gte: since } },
        _count: { _all: true },
        _sum: {
          kills: true,
          deaths: true,
          assists: true,
          damageDealt: true,
          damageTaken: true,
          visionScore: true,
          minionsKilled: true,
          neutralMinionsKilled: true,
          gameDurationSeconds: true,
        },
      }),
      this.db.matchParticipation.count({
        where: { puuid, gameCreation: { gte: since }, win: true },
      }),
    ]);

    const gamesPlayed = aggregate._count._all;
    if (gamesPlayed === 0) {
      return emptyMonthlyStats(puuid, riotId, since);
    }

    const totalCs = (aggregate._sum.minionsKilled ?? 0) + (aggregate._sum.neutralMinionsKilled ?? 0);
    const totalMinutes = (aggregate._sum.gameDurationSeconds ?? 0) / 60;
    const csPerMinute = totalMinutes === 0 ? 0 : Math.round((totalCs / totalMinutes) * 10) / 10;

    return {
      puuid,
      riotId,
      since,
      gamesPlayed,
      wins,
      losses: gamesPlayed - wins,
      kills: aggregate._sum.kills ?? 0,
      deaths: aggregate._sum.deaths ?? 0,
      assists: aggregate._sum.assists ?? 0,
      damageDealt: aggregate._sum.damageDealt ?? 0,
      damageTaken: aggregate._sum.damageTaken ?? 0,
      visionScore: aggregate._sum.visionScore ?? 0,
      csPerMinute,
    };
  }

  async getRecentMatches(puuid: string, since: Date): Promise<MatchParticipationData[]> {
    const rows = await this.db.matchParticipation.findMany({
      where: {
        puuid,
        gameCreation: { gte: since },
        // Filas de antes de agregar estas columnas quedan null; se re-completan
        // solo cuando se vuelve a sincronizar esa partida.
        championId: { not: null },
      },
      orderBy: { gameCreation: 'desc' },
    });

    return rows.map((row) => ({
      matchId: row.matchId,
      puuid: row.puuid,
      gameCreation: row.gameCreation,
      queueId: row.queueId,
      win: row.win,
      kills: row.kills,
      deaths: row.deaths,
      assists: row.assists,
      damageDealt: row.damageDealt,
      damageTaken: row.damageTaken,
      visionScore: row.visionScore,
      championId: row.championId!,
      championName: row.championName!,
      teamId: row.teamId!,
      teamPosition: row.teamPosition!,
      minionsKilled: row.minionsKilled!,
      neutralMinionsKilled: row.neutralMinionsKilled!,
      gameDurationSeconds: row.gameDurationSeconds!,
    }));
  }
}
