import assert from 'node:assert/strict';
import { test } from 'node:test';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { computeEncounters, type EncounterRecord } from '../src/domain/services/computeEncounters';
import { PrismaMatchStatsRepository } from '../src/infrastructure/persistence/PrismaMatchStatsRepository';
import { RiotMatchProviderImpl } from '../src/infrastructure/riot/RiotMatchProvider';
import type { RiotApiClient } from '../src/infrastructure/riot/RiotApiClient';
import type { MatchParticipationData } from '../src/domain/repositories/MatchProvider';
import { SyncPlayerMatchesUseCase } from '../src/application/SyncPlayerMatchesUseCase';
import type { PlayerRepository } from '../src/domain/repositories/PlayerRepository';
import type { PuuidResolver } from '../src/application/PuuidResolver';
import type { MatchProvider } from '../src/domain/repositories/MatchProvider';
import type { MatchStatsRepository } from '../src/domain/repositories/MatchStatsRepository';

const encounter = (changes: Partial<EncounterRecord> = {}): EncounterRecord => ({
  matchId: 'LA2_1', puuid: 'self', otherPuuid: 'other', gameName: 'Nahid', tagLine: 'LAS',
  championName: 'Gangplank', gameCreation: new Date('2025-01-01'), isAlly: true, win: true, ...changes,
});

test('counts unique matches, separates teams and keeps the latest name across years', () => {
  const old = encounter();
  const recent = encounter({ matchId: 'LA2_2', isAlly: false, gameName: 'Nuevo nombre', gameCreation: new Date('2026-09-18') });
  const [result] = computeEncounters([recent, old, old, encounter({ otherPuuid: 'self' }), encounter({ otherPuuid: '' })]);
  assert.deepEqual(result, {
    puuid: 'other', gameName: 'Nuevo nombre', tagLine: 'LAS', championName: 'Gangplank',
    total: 2, allies: 1, enemies: 1, winsTogether: 1, winsAgainst: 1,
    firstSeen: '2025-01-01T00:00:00.000Z', lastSeen: '2026-09-18T00:00:00.000Z',
  });
});

test('same display names remain distinct and players sort by encounter count', () => {
  const result = computeEncounters([encounter(), encounter({ otherPuuid: 'different' }), encounter({ matchId: 'LA2_2' })]);
  assert.equal(result.length, 2);
  assert.equal(result[0].total, 2);
  assert.equal(result[1].total, 1);
  assert.deepEqual(computeEncounters([]), []);
});

test('missing Riot ID retains a known name and still counts the encounter', () => {
  const [result] = computeEncounters([encounter({ matchId: 'LA2_2', gameName: '', tagLine: '', gameCreation: new Date('2026-01-01') }), encounter()]);
  assert.equal(result.gameName, 'Nahid');
  assert.equal(result.total, 2);
});

test('Riot adapter maps all human participants and excludes self and empty identifiers', async () => {
  const calls: string[] = [];
  const client = { get: async (url: string) => {
    calls.push(url);
    if (url.includes('/ids')) return [];
    return { info: { gameCreation: 1000, gameDuration: 1500, queueId: 420, participants: [
      { puuid: 'self', teamId: 100, win: true },
      { puuid: 'ally', teamId: 100, riotIdGameName: 'Aliado', riotIdTagline: 'LAS', championName: 'Ahri' },
      { puuid: 'enemy', teamId: 200, championName: 'Gangplank' },
      { puuid: '', teamId: 200 },
    ] } };
  } } as unknown as RiotApiClient;
  const provider = new RiotMatchProviderImpl(client, 'americas');
  const result = await provider.getParticipation('LA2_1', 'self');
  assert.equal(result?.encounters?.length, 2);
  assert.equal(result?.encounters?.[0].isAlly, true);
  assert.equal(result?.encounters?.[1].isAlly, false);
  assert.equal(result?.encounters?.[1].gameName, '');
  await provider.listMatchIds('self', { since: new Date(0), count: 100, start: 100 });
  assert.match(calls.at(-1)!, /count=100&start=100/);
});

test('SQLite migration preserves old rows; repeated and concurrent saves do not inflate counts', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'lolranking-encounters-'));
  const db = new PrismaClient({ datasources: { db: { url: `file:${join(directory, 'test.db').replaceAll('\\', '/')}` } } });
  try {
    for (const migration of ['20260827001307_init', '20260827011600_add_match_detail_fields', '20260918160000_player_encounters']) {
      const sql = await readFile(new URL(`../prisma/migrations/${migration}/migration.sql`, import.meta.url), 'utf8');
      for (const statement of sql.split(';').filter((s) => s.trim())) await db.$executeRawUnsafe(statement);
      if (migration === '20260827011600_add_match_detail_fields') {
        await db.$executeRawUnsafe(`INSERT INTO MatchParticipation
          (matchId, puuid, gameCreation, queueId, win, kills, deaths, assists, damageDealt, damageTaken, visionScore)
          VALUES ('legacy', 'legacy-player', 1704067200000, 420, true, 9, 1, 8, 12000, 8000, 20)`);
      }
    }
    const repository = new PrismaMatchStatsRepository(db);
    const participation: MatchParticipationData = {
      matchId: 'LA2_1', puuid: 'self', gameCreation: new Date('2025-01-01'), queueId: 420,
      win: true, kills: 3, deaths: 2, assists: 8, damageDealt: 10000, damageTaken: 5000,
      visionScore: 10, championId: 1, championName: 'Annie', teamId: 100, teamPosition: 'MIDDLE',
      minionsKilled: 100, neutralMinionsKilled: 0, gameDurationSeconds: 1200,
    };
    await repository.saveParticipation(participation);
    assert.equal(await repository.hasMatch('LA2_1', 'self'), false);
    assert.deepEqual(await repository.getMatchesMissingEncounters('self'), ['LA2_1']);
    participation.encounters = [encounter()];
    await repository.saveParticipation(participation);
    await Promise.all([repository.saveParticipation(participation), repository.saveParticipation(participation)]);
    assert.equal(await repository.hasMatch('LA2_1', 'self'), true);
    assert.equal((await repository.getEncounters('self')).length, 1);
    assert.equal((await repository.getEncounters('someone-else')).length, 0);
    assert.deepEqual(await repository.getMatchesMissingEncounters('self'), []);
    assert.equal(await db.matchParticipation.count(), 2);
    assert.deepEqual(await repository.getMatchesMissingEncounters('legacy-player'), ['legacy']);
    assert.equal((await db.matchParticipation.findUnique({ where: { matchId_puuid: { matchId: 'legacy', puuid: 'legacy-player' } } }))?.kills, 9);
    assert.equal((await repository.getRecentMatches('self', new Date(0)))[0].kills, 3);
    const invalidEncounter = { ...encounter(), gameName: undefined } as unknown as EncounterRecord;
    await assert.rejects(repository.saveParticipation({ ...participation, kills: 999, encounters: [invalidEncounter] }));
    assert.equal((await repository.getRecentMatches('self', new Date(0)))[0].kills, 3);
    assert.equal((await repository.getEncounters('self')).length, 1);
  } finally {
    await db.$disconnect();
    await rm(directory, { recursive: true, force: true });
  }
});

test('sync paginates beyond 100 matches and continues backfilling after an unavailable old match', async () => {
  const starts: number[] = [];
  const saved: string[] = [];
  const fetched: string[] = [];
  const players: PlayerRepository = { getTrackedPlayers: () => [{ riotId: 'Jig#LAS', gameName: 'Jig', tagLine: 'LAS' }] };
  const resolver = { resolve: async () => 'self' } as unknown as PuuidResolver;
  const provider: MatchProvider = {
    listMatchIds: async (_puuid, filter) => {
      starts.push(filter.start ?? 0);
      return filter.start === 0 ? Array.from({ length: 100 }, (_, i) => `cached-${i}`) : ['new'];
    },
    getParticipation: async (matchId) => {
      fetched.push(matchId);
      if (matchId === 'expired') throw Object.assign(new Error('Gone'), { status: 404 });
      return { matchId } as MatchParticipationData;
    },
  };
  const repository = {
    hasMatch: async (id: string) => id.startsWith('cached-'),
    getMatchesMissingEncounters: async () => ['expired', 'old'],
    saveParticipation: async (p: MatchParticipationData) => { saved.push(p.matchId); },
  } as unknown as MatchStatsRepository;
  const result = await new SyncPlayerMatchesUseCase(players, resolver, provider, repository).execute();
  assert.deepEqual(starts, [0, 100]);
  assert.deepEqual(fetched, ['new', 'expired', 'old']);
  assert.deepEqual(saved, ['new', 'old']);
  assert.equal(result.players[0].matchesSeen, 103);
  assert.equal(result.players[0].matchesSynced, 2);
  assert.match(result.players[0].error!, /1 partidas/);
});
