import { formatRelativeTime } from './format';

interface HeaderProps {
  playerCount: number;
  lastUpdated: Date | null;
  refreshing: boolean;
  hasError: boolean;
  onRefresh: () => void;
}

export function Header({ playerCount, lastUpdated, refreshing, hasError, onRefresh }: HeaderProps) {
  return (
    <header className="header">
      <div className="header__brand">
        <div className="header__mark" />
        <div className="header__titles">
          <div className="header__title">ELO RANKING</div>
          <div className="header__tagline">LOLRANKING · AMIGOS</div>
        </div>
      </div>

      {hasError ? (
        <div className="header__badge header__badge--error">
          <span className="header__badge-dot" />
          SIN CONEXIÓN
        </div>
      ) : playerCount === 0 ? (
        <div className="header__count">0 JUGADORES</div>
      ) : (
        <div className="header__status">
          <div className="header__updated">
            <div className="header__updated-label">ÚLTIMA ACTUALIZACIÓN</div>
            <div className="header__updated-value">{lastUpdated ? formatRelativeTime(lastUpdated) : '—'}</div>
          </div>
          <button type="button" className="btn-refresh" disabled={refreshing} onClick={onRefresh}>
            <span className={`btn-refresh__icon${refreshing ? ' spin' : ''}`} />
            {refreshing ? 'ACTUALIZANDO' : 'ACTUALIZAR'}
          </button>
        </div>
      )}
    </header>
  );
}
