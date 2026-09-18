// Browser QA data only. Never imported by the application.
import { createRoot } from 'react-dom/client';
import { RankingClient } from '../src/ui/RankingClient';
import { ProfileView } from '../src/ui/profile/ProfileView';
import type { RankingPageData } from '../src/application/GetRankingPageDataUseCase';
import type { PlayerProfileData } from '../src/application/GetPlayerProfileUseCase';

const names = ['Jig#jajs', 'Nahid#LAS', 'OrgulloPeleda#LAS', 'khuda#LAS', 'Jugador de gangplank#GP', 'PlayMaker#2536'];
const ranking: RankingPageData = {
  totalConfigured: names.length, error: null, lastUpdated: new Date().toISOString(),
  laneLeaderboard: [],
  players: names.map((riotId, i) => ({
    riotId, puuid: `player-${i}`, tier: i < 2 ? 'DIAMOND' : 'EMERALD', division: 'II',
    leaguePoints: 85 - i * 10, wins: 64 - i, losses: 40 + i, winRate: 61.5 - i,
    profileIconUrl: null, error: null, mainLane: 'MIDDLE',
    stats: { riotId, puuid: `player-${i}`, since: new Date(), gamesPlayed: 30, wins: 20, losses: 10,
      kills: 215 - i * 10, deaths: 110, assists: 160, damageDealt: 850000, damageTaken: 450000,
      visionScore: 600, csPerMinute: 7.3 - i * .1 },
  })),
};
const profile: PlayerProfileData = {
  ...ranking.players[0], riotId: names[0], name: 'Jig', tag: 'jajs', profileIconUrl: null,
  tier: 'DIAMOND', division: 'II', leaguePoints: 85, wins: 64, losses: 40, winRate: 61.5,
  error: null, gamesPlayed: 30, csPerMinute: 7.3, kda: { kills: 7.2, deaths: 3.7, assists: 5.3 },
  mainLane: 'MIDDLE', laneStats: [], topChampions: [], bestChampion: null, topMasteries: [],
  gameModeStats: [], recentForm: [], duoStats: [], opggUrl: 'https://op.gg',
  encounters: names.slice(1).map((riotId, i) => ({
    puuid: `other-${i}`, gameName: riotId.split('#')[0], tagLine: riotId.split('#')[1],
    championName: ['Ahri', 'Darius', 'Lux', 'Gangplank', 'Thresh'][i], total: 4 - i % 3,
    allies: i === 0 ? 0 : 1, enemies: 4 - i % 3 - (i === 0 ? 0 : 1), winsTogether: 0, winsAgainst: 1,
    firstSeen: '2026-08-01T00:00:00.000Z', lastSeen: '2026-09-18T00:00:00.000Z',
  })), encounterMatches: 30, pendingEncounterMatches: 0,
};

const mode = new URLSearchParams(location.search).get('view');
if (mode === 'many') profile.encounters = Array.from({ length: 25 }, (_, i) => ({ ...profile.encounters[i % 5], puuid: `many-${i}` }));
if (mode === 'empty') { profile.encounters = []; profile.encounterMatches = 0; profile.pendingEncounterMatches = 4; }
if (mode === 'error') ranking.error = 'No pudimos conectar con Riot Games.';
createRoot(document.getElementById('root')!).render(mode === 'profile' || mode === 'empty' || mode === 'many'
  ? <ProfileView profile={profile} /> : <RankingClient initialData={ranking} />);
