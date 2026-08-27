import { RiotApiClient } from './riot/RiotApiClient';
import { RiotAccountProviderImpl } from './riot/RiotAccountProvider';
import { RiotRankedStandingProviderImpl } from './riot/RiotRankedStandingProvider';
import { RiotSummonerInfoProviderImpl } from './riot/RiotSummonerInfoProvider';
import { RiotMatchProviderImpl } from './riot/RiotMatchProvider';
import { RiotChampionMasteryProviderImpl } from './riot/RiotChampionMasteryProvider';
import { DataDragonClient } from './riot/DataDragonClient';
import { getContinentForPlatform } from './riot/regions';
import { prisma } from './persistence/prisma';
import { PrismaMatchStatsRepository } from './persistence/PrismaMatchStatsRepository';
import { PrismaSummonerRepository } from './persistence/PrismaSummonerRepository';
import { StaticPlayerRepository } from './config/trackedPlayers';
import { PuuidResolver } from '@/application/PuuidResolver';
import { ProfileIconResolver } from '@/application/ProfileIconResolver';
import { ChampionMasteryResolver } from '@/application/ChampionMasteryResolver';
import { GetGroupRankingUseCase } from '@/application/GetGroupRankingUseCase';
import { GetMonthlyStatsUseCase } from '@/application/GetMonthlyStatsUseCase';
import { GetRankingPageDataUseCase } from '@/application/GetRankingPageDataUseCase';
import { GetPlayerProfileUseCase } from '@/application/GetPlayerProfileUseCase';
import { SyncPlayerMatchesUseCase } from '@/application/SyncPlayerMatchesUseCase';

const RIOT_API_KEY = process.env.RIOT_API_KEY ?? '';
const RIOT_PLATFORM = process.env.RIOT_PLATFORM ?? 'la2';
const continent = getContinentForPlatform(RIOT_PLATFORM);

// Cliente "rápido" para las llamadas en vivo de cada carga de página: pocos
// reintentos para no colgar el request si Riot está rate-limiteando.
const riotClient = new RiotApiClient(RIOT_API_KEY);
// Cliente "paciente" solo para la sincronización de partidas en bloque: es una
// acción de fondo que puede tardar, así que absorbe varios resets del bucket
// de 100 req/2min de Riot en vez de tirar error apenas lo pisa.
const riotSyncClient = new RiotApiClient(RIOT_API_KEY, 8000, 4, 2000);

const platformBaseUrl = `https://${RIOT_PLATFORM}.api.riotgames.com`;
const accountProvider = new RiotAccountProviderImpl(riotClient, continent);
const standingProvider = new RiotRankedStandingProviderImpl(riotClient, platformBaseUrl);
const summonerInfoProvider = new RiotSummonerInfoProviderImpl(riotClient, platformBaseUrl);
const matchProvider = new RiotMatchProviderImpl(riotSyncClient, continent);
const championMasteryProvider = new RiotChampionMasteryProviderImpl(riotClient, platformBaseUrl);
const dataDragonClient = new DataDragonClient();

const matchStatsRepository = new PrismaMatchStatsRepository(prisma);
const summonerRepository = new PrismaSummonerRepository(prisma);
const playerRepository = new StaticPlayerRepository();

const puuidResolver = new PuuidResolver(accountProvider, summonerRepository);
const profileIconResolver = new ProfileIconResolver(summonerInfoProvider, dataDragonClient);
const championMasteryResolver = new ChampionMasteryResolver(championMasteryProvider, dataDragonClient);

export const getGroupRankingUseCase = new GetGroupRankingUseCase(
  playerRepository,
  puuidResolver,
  standingProvider,
  profileIconResolver
);
export const getMonthlyStatsUseCase = new GetMonthlyStatsUseCase(matchStatsRepository);
export const getRankingPageDataUseCase = new GetRankingPageDataUseCase(
  getGroupRankingUseCase,
  getMonthlyStatsUseCase,
  matchStatsRepository
);
export const syncPlayerMatchesUseCase = new SyncPlayerMatchesUseCase(
  playerRepository,
  puuidResolver,
  matchProvider,
  matchStatsRepository
);
export const getPlayerProfileUseCase = new GetPlayerProfileUseCase(
  playerRepository,
  puuidResolver,
  standingProvider,
  profileIconResolver,
  championMasteryResolver,
  matchStatsRepository,
  dataDragonClient,
  RIOT_PLATFORM
);
