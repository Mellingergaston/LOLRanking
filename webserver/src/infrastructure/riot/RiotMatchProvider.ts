import type {
  MatchListFilter,
  MatchParticipationData,
  MatchProvider,
} from '@/domain/repositories/MatchProvider';
import type { RiotApiClient } from './RiotApiClient';

interface MatchParticipantDto {
  puuid: string;
  riotIdGameName?: string;
  riotIdTagline?: string;
  kills: number;
  deaths: number;
  assists: number;
  totalDamageDealtToChampions: number;
  totalDamageTaken: number;
  visionScore: number;
  win: boolean;
  championId: number;
  championName: string;
  teamId: number;
  teamPosition: string;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
}

interface MatchDetailDto {
  info: {
    gameCreation: number; // epoch ms
    gameDuration: number; // segundos (partidas nuevas; ver nota abajo)
    queueId: number;
    participants: MatchParticipantDto[];
  };
}

export class RiotMatchProviderImpl implements MatchProvider {
  constructor(
    private readonly client: RiotApiClient,
    private readonly continent: 'americas' | 'europe' | 'asia'
  ) {}

  async listMatchIds(puuid: string, filter: MatchListFilter): Promise<string[]> {
    const startTime = Math.floor(filter.since.getTime() / 1000);
    const url =
      `https://${this.continent}.api.riotgames.com/lol/match/v5/matches/by-puuid/${puuid}/ids` +
      `?startTime=${startTime}&count=${filter.count}&start=${filter.start ?? 0}`;
    return this.client.get<string[]>(url);
  }

  async getParticipation(matchId: string, puuid: string): Promise<MatchParticipationData | null> {
    const url = `https://${this.continent}.api.riotgames.com/lol/match/v5/matches/${matchId}`;
    const match = await this.client.get<MatchDetailDto>(url);
    const participant = match.info.participants.find((p) => p.puuid === puuid);
    if (!participant) return null;

    return {
      matchId,
      puuid,
      gameCreation: new Date(match.info.gameCreation),
      queueId: match.info.queueId,
      win: participant.win,
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      damageDealt: participant.totalDamageDealtToChampions,
      damageTaken: participant.totalDamageTaken,
      visionScore: participant.visionScore,
      championId: participant.championId,
      championName: participant.championName,
      teamId: participant.teamId,
      teamPosition: participant.teamPosition ?? '',
      minionsKilled: participant.totalMinionsKilled,
      neutralMinionsKilled: participant.neutralMinionsKilled,
      gameDurationSeconds: match.info.gameDuration,
      encounters: match.info.participants
        .filter((p) => p.puuid && p.puuid !== puuid)
        .map((p) => ({
          matchId, puuid, otherPuuid: p.puuid,
          gameName: p.riotIdGameName ?? '', tagLine: p.riotIdTagline ?? '',
          championName: p.championName,
          gameCreation: new Date(match.info.gameCreation),
          isAlly: p.teamId === participant.teamId, win: participant.win,
        })),
    };
  }
}
