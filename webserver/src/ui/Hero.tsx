export type SortKey = 'elo' | 'winrate' | 'tier';

const SORT_LABELS: Record<SortKey, string> = { elo: 'LP', winrate: 'winrate', tier: 'tier' };

interface HeroProps {
  totalPlayers: number;
  sortKey: SortKey;
  searchQuery: string;
  onSortChange: (key: SortKey) => void;
  onSearchChange: (query: string) => void;
}

export function Hero({ totalPlayers, sortKey, searchQuery, onSortChange, onSearchChange }: HeroProps) {
  return (
    <section className="hero">
      <div>
        <div className="hero__season"><span className="live-dot" /> LEAGUE OF LEGENDS · SOLO / DÚO</div>
        <h1 className="hero__title">La misma grieta.<br /><span>Tu propia competencia.</span></h1>
        <div className="hero__subtitle">
          Cada partida cuenta. Seguí a tus amigos, compará el progreso<br className="desktop-break" /> y descubrí con quién te volvés a cruzar.
        </div>
      </div>
      <div className="hero__controls">
        <div className="hero__group"><strong>{totalPlayers.toString().padStart(2, '0')}</strong><span>JUGADORES<br />UN SOLO GRUPO</span></div>
        <div className="search">
          <div className="search__icon" />
          <input
            className="search__input"
            type="text"
            aria-label="Buscar jugador en el ranking"
            placeholder="Buscar Riot ID…"
            autoComplete="off"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <div className="sort-tabs">
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <button
              key={key}
              type="button"
              className="sort-tab"
              aria-pressed={sortKey === key}
              onClick={() => onSortChange(key)}
            >
              {SORT_LABELS[key].toUpperCase()}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
