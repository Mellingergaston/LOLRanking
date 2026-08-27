export interface Player {
  riotId: string; // "GameName#TAG"
  gameName: string;
  tagLine: string;
}

export function parseRiotId(riotId: string): Player {
  const [gameName, tagLine] = riotId.split('#');
  if (!gameName || !tagLine) {
    throw new Error(`Riot ID inválido: "${riotId}". Formato esperado: Nombre#TAG`);
  }
  return { riotId, gameName, tagLine };
}
