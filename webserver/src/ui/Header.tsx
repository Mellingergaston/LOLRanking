import { formatRelativeTime } from './format';
import Link from 'next/link';

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
      <Link href="/" className="header__brand" aria-label="LOLRanking, inicio">
        <div className="header__mark">L<span>R</span></div>
        <div className="header__titles">
          <div className="header__title">lol<span>ranking</span></div>
          <div className="header__tagline">TU GRUPO. TU COMPETENCIA.</div>
        </div>
      </Link>
      <nav className="header__nav" aria-label="Navegación principal"><Link href="/#ranking">Ranking</Link><Link href="/#estadisticas">Estadísticas</Link><span className="header__community">{playerCount} jugadores</span></nav>

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
