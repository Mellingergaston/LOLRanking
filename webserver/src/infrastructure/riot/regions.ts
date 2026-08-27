/**
 * Account-V1 y Match-V5 viven en el "continente" (cluster regional), no en la
 * plataforma. Mapeo de plataforma -> continente para no tener que pedirle
 * ambos valores al usuario.
 */
const PLATFORM_TO_CONTINENT: Record<string, 'americas' | 'europe' | 'asia'> = {
  na1: 'americas',
  br1: 'americas',
  la1: 'americas',
  la2: 'americas',
  oc1: 'americas',
  euw1: 'europe',
  eun1: 'europe',
  tr1: 'europe',
  ru: 'europe',
  kr: 'asia',
  jp1: 'asia',
};

export function getContinentForPlatform(platform: string): 'americas' | 'europe' | 'asia' {
  const continent = PLATFORM_TO_CONTINENT[platform.toLowerCase()];
  if (!continent) {
    throw new Error(`Plataforma de Riot desconocida: "${platform}"`);
  }
  return continent;
}
