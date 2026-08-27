import { getTierValue } from '@/domain/services/rankOrdering';
import type { SortKey } from './Hero';
import type { PlayerRow } from './types';

export function sortPlayerRows(players: PlayerRow[], key: SortKey): PlayerRow[] {
  const rows = [...players];

  if (key === 'winrate') {
    return rows.sort((a, b) => b.winRate - a.winRate);
  }

  if (key === 'tier') {
    return rows.sort(
      (a, b) => getTierValue(b.tier, b.division) - getTierValue(a.tier, a.division) || b.leaguePoints - a.leaguePoints
    );
  }

  return rows.sort((a, b) => {
    const aValue = getTierValue(a.tier, a.division) + a.leaguePoints / 100;
    const bValue = getTierValue(b.tier, b.division) + b.leaguePoints / 100;
    return bValue - aValue;
  });
}
