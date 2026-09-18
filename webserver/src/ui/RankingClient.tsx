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
      if (!res.ok) throw new Error('No se pudo actualizar el ranking');
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
      if (!res.ok) throw new Error(summary.error || 'No se pudo sincronizar');
      const totalSynced = (summary.players ?? []).reduce(
        (sum: number, p: { matchesSynced: number }) => sum + p.matchesSynced,
        0
      );
      const failed = (summary.players ?? []).filter((p: { error: string | null }) => p.error).length;
      setSyncMessage(`${totalSynced} partidas actualizadas.${failed ? ` ${failed} jugadores no pudieron completarse; volvé a intentarlo.` : ' Encuentros actualizados.'}`);
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

            <div className="ranking-toolbar" id="ranking">
              <div><span className="eyebrow">EL GRUPO, EN NÚMEROS</span><h2>Tabla de posiciones <span className="count-badge">{data.players.length}</span></h2></div>
              <button type="button" className="btn-secondary" disabled={syncing} onClick={handleSync}>
                {syncing ? 'Sincronizando…' : '↻ Sincronizar partidas'}
              </button>
              {syncMessage && (
                <span className="sync-message" role="status">
                  {syncMessage}
                </span>
              )}
            </div>

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
                <PlayerTable players={filteredSorted} startPosition={1} />
              </>
            )}
            <section className="group-insights" id="estadisticas">
              <div className="section-heading"><div><span className="eyebrow">ÚLTIMOS 30 DÍAS</span><h2>Más allá del elo</h2><p>Los protagonistas del grupo, en cada aspecto del juego.</p></div><span className="count-badge">Estadísticas del grupo</span></div>
              <GroupRecords stats={data.players.map((p) => p.stats).filter((s): s is NonNullable<typeof s> => !!s)} />
              <LaneLeaders leaders={data.laneLeaderboard} />
              {!data.players.some((p) => p.stats?.gamesPlayed) && <p className="data-note">Sincronizá las partidas para descubrir los récords y líderes del grupo.</p>}
            </section>
            <div className="encounters-banner"><div className="encounters-banner__icon" aria-hidden="true">◎</div><div><span className="eyebrow">NUEVO · ENCUENTROS</span><h2>¿Otra vez vos?</h2><p>Entrá al perfil de un jugador y descubrí sus aliados habituales y rivales recurrentes.</p></div><span className="encounters-banner__arrow" aria-hidden="true">↗</span></div>
          </>
        )}
      </main>

      <footer className="footer">
        <div><strong>lolranking</strong> · La competencia queda entre amigos.</div>
        <div>Datos de Riot Games · No afiliado a Riot Games.</div>
      </footer>
    </>
  );
}
