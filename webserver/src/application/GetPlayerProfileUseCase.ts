import { parseRiotId } from '@/domain/entities/Player';
import type { Tier, Division } from '@/domain/entities/RankedStanding';
import type { RankedStandingProvider } from '@/domain/repositories/RankedStandingProvider';
import type { MatchStatsRepository } from '@/domain/repositories/MatchStatsRepository';
import type { PlayerRepository } from '@/domain/repositories/PlayerRepository';
import type { DataDragonClient } from '@/infrastructure/riot/DataDragonClient';
import { computeCsPerMinute } from '@/domain/services/computeCsPerMinute';
import { computeLaneStats, computeMainLane, type Lane, type LaneStat } from '@/domain/services/computeLaneStats';
import {
  computeBestChampionByWinrate,
  computeTopChampionsByGames,
  type ChampionStat,
} from '@/domain/services/computeChampionStats';
import { computeGameModeBreakdown, type GameModeStat } from '@/domain/services/computeGameModeBreakdown';
import { computeRecentForm, type RecentMatchSummary } from '@/domain/services/computeRecentForm';
import { computeDuoWinrates, type DuoStat } from '@/domain/services/computeDuoWinrates';
import type { PuuidResolver } from './PuuidResolver';
import type { ProfileIconResolver } from './ProfileIconResolver';
import { ChampionMasteryResolver, type ChampionMasteryView } from './ChampionMasteryResolver';
import { buildOpggUrl } from './buildOpggUrl';

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const MIN_GAMES_FOR_CHAMPION_OR_LANE = 3;

export interface ChampionStatView extends ChampionStat {
  championIconUrl: string | null;
}

export interface RecentMatchView extends RecentMatchSummary {
  championIconUrl: string | null;
}

export interface PlayerProfileData {
  riotId: string;
  name: string;
  tag: string;
  profileIconUrl: string | null;
  tier: Tier;
  division: Division | null;
  leaguePoints: number;
  wins: number;
  losses: number;
  winRate: number;
  error: string | null;
  gamesPlayed: number;
  csPerMinute: number;
  kda: { kills: number; deaths: number; assists: number };
  mainLane: Lane | null;
  laneStats: LaneStat[];
  topChampions: ChampionStatView[];
  bestChampion: ChampionStatView | null;
  topMasteries: ChampionMasteryView[];
  gameModeStats: GameModeStat[];
  recentForm: RecentMatchView[];
  duoStats: DuoStat[];
  opggUrl: string;
}

export class GetPlayerProfileUseCase {
  constructor(
    private readonly playerRepository: PlayerRepository,
    private readonly puuidResolver: PuuidResolver,
    private readonly standingProvider: RankedStandingProvider,
    private readonly profileIconResolver: ProfileIconResolver,
    private readonly championMasteryResolver: ChampionMasteryResolver,
    private readonly matchStatsRepository: MatchStatsRepository,
    private readonly dataDragon: DataDragonClient,
    private readonly riotPlatform: string
  ) {}

  async execute(riotId: string): Promise<PlayerProfileData> {
    const player = parseRiotId(riotId);
    const name = player.gameName;
    const tag = player.tagLine;
    const opggUrl = buildOpggUrl(riotId, this.riotPlatform);

    let puuid: string;
    try {
      puuid = await this.puuidResolver.resolve(player);
    } catch (error) {
      return this.buildErrorProfile(riotId, name, tag, opggUrl, error);
    }

    const since = new Date(Date.now() - THIRTY_DAYS_MS);

    const [standingResult, profileIconUrl, records, topMasteries] = await Promise.all([
      this.standingProvider.getSoloQueueStanding(puuid).catch(() => null),
      this.profileIconResolver.resolve(puuid),
      this.matchStatsRepository.getRecentMatches(puuid, since),
      this.championMasteryResolver.resolveTop(puuid, 3),
    ]);

    const others = await this.getOtherPlayersRecords(riotId, since);
    const duoStats = computeDuoWinrates(records, others);

    const topChampions = await this.attachChampionIcons(computeTopChampionsByGames(records, 3));
    const bestChampionRaw = computeBestChampionByWinrate(records, MIN_GAMES_FOR_CHAMPION_OR_LANE);
    const bestChampion = bestChampionRaw ? (await this.attachChampionIcons([bestChampionRaw]))[0] : null;
    const recentForm = await this.attachRecentFormIcons(computeRecentForm(records, 10));

    const gamesPlayed = records.length;
    const totalKills = records.reduce((sum, r) => sum + r.kills, 0);
    const totalDeaths = records.reduce((sum, r) => sum + r.deaths, 0);
    const totalAssists = records.reduce((sum, r) => sum + r.assists, 0);

    return {
      riotId,
      name,
      tag,
      profileIconUrl,
      tier: standingResult?.tier ?? 'UNRANKED',
      division: standingResult?.division ?? null,
      leaguePoints: standingResult?.leaguePoints ?? 0,
      wins: standingResult?.wins ?? 0,
      losses: standingResult?.losses ?? 0,
      winRate:
        standingResult && standingResult.wins + standingResult.losses > 0
          ? Math.round((standingResult.wins / (standingResult.wins + standingResult.losses)) * 1000) / 10
          : 0,
      error: null,
      gamesPlayed,
      csPerMinute: computeCsPerMinute(records),
      kda: {
        kills: gamesPlayed === 0 ? 0 : Math.round((totalKills / gamesPlayed) * 10) / 10,
        deaths: gamesPlayed === 0 ? 0 : Math.round((totalDeaths / gamesPlayed) * 10) / 10,
        assists: gamesPlayed === 0 ? 0 : Math.round((totalAssists / gamesPlayed) * 10) / 10,
      },
      mainLane: computeMainLane(records),
      laneStats: computeLaneStats(records),
      topChampions,
      bestChampion,
      topMasteries,
      gameModeStats: computeGameModeBreakdown(records),
      recentForm,
      duoStats,
      opggUrl,
    };
  }

  private async getOtherPlayersRecords(
    excludeRiotId: string,
    since: Date
  ): Promise<{ riotId: string; records: Awaited<ReturnType<MatchStatsRepository['getRecentMatches']>> }[]> {
    const trackedPlayers = this.playerRepository.getTrackedPlayers().filter((p) => p.riotId !== excludeRiotId);

    return Promise.all(
      trackedPlayers.map(async (p) => {
        try {
          const puuid = await this.puuidResolver.resolve(p);
          const records = await this.matchStatsRepository.getRecentMatches(puuid, since);
          return { riotId: p.riotId, records };
        } catch {
          return { riotId: p.riotId, records: [] };
        }
      })
    );
  }

  private async attachChampionIcons(champions: ChampionStat[]): Promise<ChampionStatView[]> {
    return Promise.all(
      champions.map(async (c) => ({ ...c, championIconUrl: await this.dataDragon.getChampionIconUrl(c.championId) }))
    );
  }

  private async attachRecentFormIcons(matches: RecentMatchSummary[]): Promise<RecentMatchView[]> {
    return Promise.all(
      matches.map(async (m) => ({ ...m, championIconUrl: await this.dataDragon.getChampionIconUrl(m.championId) }))
    );
  }

  private buildErrorProfile(
    riotId: string,
    name: string,
    tag: string,
    opggUrl: string,
    error: unknown
  ): PlayerProfileData {
    return {
      riotId,
      name,
      tag,
      profileIconUrl: null,
      tier: 'UNRANKED',
      division: null,
      leaguePoints: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      error: error instanceof Error ? error.message : 'Error desconocido',
      gamesPlayed: 0,
      csPerMinute: 0,
      kda: { kills: 0, deaths: 0, assists: 0 },
      mainLane: null,
      laneStats: [],
      topChampions: [],
      bestChampion: null,
      topMasteries: [],
      gameModeStats: [],
      recentForm: [],
      duoStats: [],
      opggUrl,
    };
  }
}
