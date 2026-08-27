import Image from 'next/image';
import Link from 'next/link';
import type { PlayerRow } from './types';
import { splitRiotId, avatarImgStyle } from './format';
import { tierColorStyle } from './tierColor';
import { LANE_SHORT_LABELS } from '@/domain/services/computeLaneStats';

interface PodiumCardProps {
  player: PlayerRow;
  position: 1 | 2 | 3;
}

export function PodiumCard({ player, position }: PodiumCardProps) {
  const { name, tag } = splitRiotId(player.riotId);
  const colorStyle = tierColorStyle(player.tier);

  return (
    <Link href={`/players/${encodeURIComponent(player.riotId)}`} className={`podium-card podium-card--${position}`}>
      <div className="podium-card__top">
        <div className="podium-avatar">
          {player.profileIconUrl && (
            <Image src={player.profileIconUrl} alt="" fill style={avatarImgStyle} sizes="76px" />
          )}
          <div className="podium-avatar__badge">#{position}</div>
        </div>
        <div className="podium-card__info">
          <div className="podium-card__name">{name}</div>
          <div className="podium-card__tag">
            #{tag}
            {player.mainLane && <span className="lane-badge">{LANE_SHORT_LABELS[player.mainLane]}</span>}
          </div>
          <div className="podium-card__rank">
            <div className="tier-dot" style={colorStyle} />
            <div className="tier-label" style={colorStyle}>
              {player.tier}
              {player.division ? ` ${player.division}` : ''}
            </div>
            <div className="podium-card__lp">
              {player.leaguePoints}
              <small>LP</small>
            </div>
          </div>
        </div>
      </div>
      <div className="podium-card__stats">
        <div>
          <div className="podium-card__stat-label">W / L</div>
          <div className="podium-card__stat-value">
            {player.wins} / {player.losses}
          </div>
        </div>
        <div>
          <div className="podium-card__stat-label">WIN RATE</div>
          <div className="podium-card__stat-value podium-card__stat-value--wr">{player.winRate}%</div>
        </div>
      </div>
    </Link>
  );
}
