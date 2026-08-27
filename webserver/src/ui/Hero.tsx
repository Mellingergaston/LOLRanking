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
        <div className="hero__season">TEMPORADA 2026 · SPLIT 2</div>
        <div className="hero__title">Clasificación del grupo</div>
        <div className="hero__subtitle">
          {totalPlayers} jugadores seguidos · ordenados por {SORT_LABELS[sortKey]}
        </div>
      </div>
      <div className="hero__controls">
        <div className="search">
          <div className="search__icon" />
          <input
            className="search__input"
            type="text"
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
