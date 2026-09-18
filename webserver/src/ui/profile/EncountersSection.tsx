'use client';

import { useState } from 'react';
import type { EncounterSummary } from '@/domain/services/computeEncounters';

type Filter = 'total' | 'allies' | 'enemies';
const labels: Record<Filter, string> = { total: 'Todos', allies: 'Aliados', enemies: 'Rivales' };
const dateLabel = (date: string) => new Date(date).toLocaleDateString('es-AR', { timeZone: 'UTC' });

export function EncountersSection({ encounters, matches, pending }: {
  encounters: EncounterSummary[]; matches: number; pending: number;
}) {
  const [filter, setFilter] = useState<Filter>('total');
  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(10);
  const players = encounters.filter((p) => p[filter] > 0 &&
    `${p.gameName}#${p.tagLine} ${p.championName}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))
    .sort((a, b) => b[filter] - a[filter] || b.lastSeen.localeCompare(a.lastSeen));
  return (
    <section className="encounters panel" id="encuentros" aria-labelledby="encounters-title">
      <div className="section-heading">
        <div><span className="eyebrow">EL MUNDO ES UN PAÑUELO</span><h2 id="encounters-title">Nos volvemos a encontrar.</h2>
          <p>Jugadores con los que compartiste la partida, de tu lado o enfrente.</p></div>
        <span className="count-badge">{encounters.length} jugadores</span>
      </div>
      <div className="encounter-overview">
        <div><strong>{matches}</strong><span>partidas registradas</span></div>
        <div><strong>{encounters.filter((p) => p.total > 1).length}</strong><span>caras conocidas</span></div>
        <div><strong>Histórico</strong><span>se acumula con cada sincronización</span></div>
      </div>
      <div className="encounter-controls">
        <div className="sort-tabs" aria-label="Tipo de encuentro">
          {(Object.keys(labels) as Filter[]).map((key) => <button key={key} type="button" className="sort-tab"
            aria-pressed={filter === key} onClick={() => { setFilter(key); setLimit(10); }}>{labels[key]}</button>)}
        </div>
        <label className="search"><span className="search__icon" aria-hidden="true" />
          <input className="search__input" aria-label="Buscar encuentros" placeholder="Jugador o campeón…" value={query}
            onChange={(event) => { setQuery(event.target.value); setLimit(10); }} /></label>
      </div>
      {pending > 0 && <p className="encounter-notice">Hay {pending} partidas guardadas pendientes de completar. Sincronizá desde el ranking para recuperar sus encuentros.</p>}
      {players.length === 0 ? <div className="encounter-empty">
        <span className="encounter-empty__symbol" aria-hidden="true">◎</span>
        <h3>{encounters.length ? 'No encontramos coincidencias' : 'Cada partida deja una conexión'}</h3>
        <p>{encounters.length ? 'Probá otro nombre o cambiá el filtro.' : 'Sincronizá las partidas desde el ranking para empezar a descubrir jugadores recurrentes.'}</p>
      </div> : <>
        <div className="encounter-table-wrap"><table className="encounter-table">
          <thead><tr><th>Jugador</th><th>{labels[filter] === 'Todos' ? 'Encuentros' : labels[filter]}</th><th>Aliados</th><th>Rivales</th><th>Último encuentro</th></tr></thead>
          <tbody>{players.slice(0, limit).map((player) => <tr key={player.puuid}>
            <td><div className="encounter-player"><span className="encounter-avatar" aria-hidden="true">{(player.gameName || player.championName || '?').slice(0, 2).toUpperCase()}</span>
              <div><strong>{player.gameName || `Jugador de ${player.championName || 'LoL'}`}</strong>{player.tagLine && <span className="encounter-tag">#{player.tagLine}</span>}
                <small>Último campeón: {player.championName || 'Desconocido'}</small></div></div></td>
            <td><span className="encounter-total">{player[filter]} <small>{player[filter] === 1 ? 'vez' : 'veces'}</small></span></td>
            <td><span className="ally-text">{player.allies}</span></td><td><span className="enemy-text">{player.enemies}</span></td>
            <td><time dateTime={player.lastSeen}>{dateLabel(player.lastSeen)}</time><small>Desde {dateLabel(player.firstSeen)}</small></td>
          </tr>)}</tbody>
        </table></div>
        <div className="encounter-bottom"><span role="status">Mostrando {Math.min(limit, players.length)} de {players.length} jugadores</span>
          {limit < players.length && <button className="btn-secondary" onClick={() => setLimit(limit + 20)}>Ver más jugadores ↓</button>}</div>
      </>}
      <p className="data-note">Cada partida cuenta una vez por jugador. Incluye todos los modos sincronizados; el historial se conserva más allá de los últimos 30 días.</p>
    </section>
  );
}
