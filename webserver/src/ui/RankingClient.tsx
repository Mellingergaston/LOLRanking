'use client';

import { useMemo, useState } from 'react';
import type { RankingPageData } from '@/application/GetRankingPageDataUseCase';
import type { SortKey } from './Hero';
import { Header } from './Header';
import { Hero } from './Hero';
import { GroupRecords } from './GroupRecords';
import { LaneLeaders } from './LaneLeaders';
import { PodiumCard } from './PodiumCard';
import { PlayerTable } from './PlayerTable';
import { SkeletonState } from './states/SkeletonState';
import { ErrorState } from './states/ErrorState';
import { EmptyState } from './states/EmptyState';
import { sortPlayerRows } from './sortPlayerRows';

interface RankingClientProps {
  initialData: RankingPageData;
}

export function RankingClient({ initialData }: RankingClientProps) {
  const [data, setData] = useState<RankingPageData>(initialData);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('elo');
  const [searchQuery, setSearchQuery] = useState('');

  async function loadRanking(isRefresh: boolean) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/ranking');
      const json: RankingPageData = await res.json();
      setData(json);
    } catch {
      setData((prev) => ({ ...prev, error: 'No se pudo conectar con el servidor' }));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  async function handleSync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const summary = await res.json();
      const totalSynced = (summary.players ?? []).reduce(
        (sum: number, p: { matchesSynced: number }) => sum + p.matchesSynced,
        0
      );
      setSyncMessage(`Listo: ${totalSynced} partidas nuevas.`);
      await loadRanking(true);
    } catch {
      setSyncMessage('No se pudo sincronizar. Probá de nuevo.');
    } finally {
      setSyncing(false);
    }
  }

  const filteredSorted = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const filtered = q ? data.players.filter((p) => p.riotId.toLowerCase().includes(q)) : data.players;
    return sortPlayerRows(filtered, sortKey);
  }, [data.players, searchQuery, sortKey]);

  return (
    <>
      <Header
        playerCount={data.totalConfigured}
        lastUpdated={data.error ? null : new Date(data.lastUpdated)}
        refreshing={refreshing}
        hasError={!!data.error}
        onRefresh={() => loadRanking(true)}
      />

      <main className="main">
        {loading ? (
          <SkeletonState />
        ) : data.error ? (
          <ErrorState message={data.error} retrying={refreshing} onRetry={() => loadRanking(true)} />
        ) : data.totalConfigured === 0 ? (
          <EmptyState />
        ) : (
          <>
            <Hero
              totalPlayers={data.totalConfigured}
              sortKey={sortKey}
              searchQuery={searchQuery}
              onSortChange={setSortKey}
              onSearchChange={setSearchQuery}
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 2rem', marginTop: '1rem' }}>
              <button type="button" className="btn-secondary" disabled={syncing} onClick={handleSync}>
                {syncing ? 'SINCRONIZANDO…' : 'SINCRONIZAR PARTIDAS'}
              </button>
              {syncMessage && (
                <span style={{ marginLeft: 12, alignSelf: 'center', fontSize: '.8rem', color: 'var(--color-text-tertiary)' }}>
                  {syncMessage}
                </span>
              )}
            </div>

            <GroupRecords stats={data.players.map((p) => p.stats).filter((s): s is NonNullable<typeof s> => !!s)} />
            <LaneLeaders leaders={data.laneLeaderboard} />

            {filteredSorted.length === 0 ? (
              <div className="state-panel" style={{ paddingTop: 48 }}>
                <div className="state-panel__title" style={{ fontSize: '1.3rem' }}>
                  Sin resultados
                </div>
                <div className="state-panel__text">No encontramos jugadores para &quot;{searchQuery}&quot;.</div>
                <div className="state-panel__actions">
                  <button type="button" className="btn-secondary" onClick={() => setSearchQuery('')}>
                    LIMPIAR BÚSQUEDA
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="podium">
                  {filteredSorted.slice(0, 3).map((player, i) => (
                    <PodiumCard key={player.riotId} player={player} position={(i + 1) as 1 | 2 | 3} />
                  ))}
                </div>
                {filteredSorted.length > 3 && <PlayerTable players={filteredSorted.slice(3)} startPosition={4} />}
              </>
            )}
          </>
        )}
      </main>

      <footer className="footer">
        <div>Datos de la Riot Games API · cache local de partidas (SQLite)</div>
        <div>Escala de tiers: Hierro → Retador</div>
      </footer>
    </>
  );
}
