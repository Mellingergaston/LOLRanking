const PLATFORM_TO_OPGG_REGION: Record<string, string> = {
  na1: 'na',
  euw1: 'euw',
  eun1: 'eune',
  kr: 'kr',
  jp1: 'jp',
  br1: 'br',
  la1: 'lan',
  la2: 'las',
  oc1: 'oce',
  tr1: 'tr',
  ru: 'ru',
};

export function buildOpggUrl(riotId: string, platform: string): string {
  const region = PLATFORM_TO_OPGG_REGION[platform.toLowerCase()] ?? 'na';
  return `https://op.gg/es/lol/summoners/search?q=${encodeURIComponent(riotId)}&region=${region}`;
}
