export function splitRiotId(riotId: string): { name: string; tag: string } {
  const idx = riotId.lastIndexOf('#');
  if (idx === -1) return { name: riotId, tag: '' };
  return { name: riotId.slice(0, idx), tag: riotId.slice(idx + 1) };
}

export function formatRelativeTime(date: Date): string {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60000);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  if (diffMin < 1) return `hace unos segundos · ${hh}:${mm}`;
  if (diffMin === 1) return `hace 1 min · ${hh}:${mm}`;
  if (diffMin < 60) return `hace ${diffMin} min · ${hh}:${mm}`;
  return `hace ${Math.floor(diffMin / 60)} h · ${hh}:${mm}`;
}

/** Estilo compartido para que el <img> del ícono llene su contenedor cuadrado. */
export const avatarImgStyle = { width: '100%', height: '100%', objectFit: 'cover' } as const;

export function winrateBarClass(winRatePercent: number): string {
  if (winRatePercent >= 51) return '';
  if (winRatePercent === 50) return 'winrate-bar__fill--mid';
  return 'winrate-bar__fill--low';
}
