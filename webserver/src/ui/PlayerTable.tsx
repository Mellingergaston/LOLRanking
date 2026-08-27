import Image from 'next/image';
import Link from 'next/link';
import type { PlayerRow } from './types';
import { splitRiotId, winrateBarClass, avatarImgStyle } from './format';
import { tierColorStyle } from './tierColor';
import { LANE_SHORT_LABELS } from '@/domain/services/computeLaneStats';

interface PlayerTableProps {
  players: PlayerRow[];
  startPosition: number;
}

export function PlayerTable({ players, startPosition }: PlayerTableProps) {
  return (
    <div className="table">
      <div className="table__row-grid table__header">
        <div>POS</div>
        <div>JUGADOR</div>
        <div>TIER</div>
        <div>LP</div>
        <div>W / L</div>
        <div>WIN RATE</div>
        <div />
      </div>
      {players.map((player, i) => {
        const { name, tag } = splitRiotId(player.riotId);
        const colorStyle = tierColorStyle(player.tier);
        const wr = player.winRate;

        return (
          <Link
            key={player.riotId}
            href={`/players/${encodeURIComponent(player.riotId)}`}
            className="table__row-grid table__row"
          >
            <div className="table__pos">{startPosition + i}</div>
            <div className="table__player">
              <div className="table__avatar">
                {player.profileIconUrl && (
                  <Image src={player.profileIconUrl} alt="" fill style={avatarImgStyle} sizes="34px" />
                )}
              </div>
              <div>
                <div className="table__player-name">{name}</div>
                <div className="table__player-tag">
                  #{tag}
                  {player.mainLane && <span className="lane-badge">{LANE_SHORT_LABELS[player.mainLane]}</span>}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div className="tier-dot" style={colorStyle} />
              <div className="tier-label" style={{ ...colorStyle, fontSize: '.75rem' }}>
                {player.tier}
                {player.division ? ` ${player.division}` : ''}
              </div>
            </div>
            <div className="table__lp">{player.leaguePoints}</div>
            <div className="table__wl">
              {player.wins} / {player.losses}
            </div>
            <div className="table__wr">
              <div className="winrate-bar">
                <div className={`winrate-bar__fill ${winrateBarClass(wr)}`} style={{ width: `${wr}%` }} />
              </div>
              <div className="table__wr-value">{wr}%</div>
            </div>
            <div className="table__chevron">›</div>
          </Link>
        );
      })}
    </div>
  );
}
