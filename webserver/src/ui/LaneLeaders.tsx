import Link from 'next/link';
import type { LaneLeaderEntry } from '@/domain/services/computeLaneLeaderboard';
import { ALL_LANES, LANE_LABELS } from '@/domain/services/computeLaneStats';
import { splitRiotId } from './format';

export function LaneLeaders({ leaders }: { leaders: LaneLeaderEntry[] }) {
  if (leaders.length === 0) return null;

  const byLane = new Map(leaders.map((l) => [l.lane, l]));

  return (
    <div className="lane-leaders">
      <div className="lane-leaders__title">MEJOR DE CADA LÍNEA</div>
      <div className="lane-leaders__grid">
        {ALL_LANES.map((lane) => {
          const leader = byLane.get(lane);
          return (
            <div className="lane-leader-card" key={lane}>
              <div className="lane-leader-card__lane">{LANE_LABELS[lane].toUpperCase()}</div>
              {leader ? (
                <Link href={`/players/${encodeURIComponent(leader.riotId)}`} className="lane-leader-card__link">
                  <div className="lane-leader-card__player">{splitRiotId(leader.riotId).name}</div>
                  <div className="lane-leader-card__value">
                    {leader.winRate}% <span>· {leader.games} partidas</span>
                  </div>
                </Link>
              ) : (
                <div className="lane-leader-card__empty">Sin datos suficientes</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
