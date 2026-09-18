export interface EncounterRecord {
  matchId: string;
  puuid: string;
  otherPuuid: string;
  gameName: string;
  tagLine: string;
  championName: string;
  gameCreation: Date;
  isAlly: boolean;
  win: boolean;
}

export interface EncounterSummary {
  puuid: string;
  gameName: string;
  tagLine: string;
  championName: string;
  total: number;
  allies: number;
  enemies: number;
  winsTogether: number;
  winsAgainst: number;
  firstSeen: string;
  lastSeen: string;
}

/** Identity is the PUUID: name changes do not split a player's history. */
export function computeEncounters(records: EncounterRecord[]): EncounterSummary[] {
  const players = new Map<string, EncounterSummary>();
  const seen = new Set<string>();
  const namedAt = new Map<string, string>();
  for (const record of records) {
    if (!record.otherPuuid || record.otherPuuid === record.puuid) continue;
    const key = `${record.matchId}:${record.otherPuuid}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const date = record.gameCreation.toISOString();
    let player = players.get(record.otherPuuid);
    if (!player) {
      player = { puuid: record.otherPuuid, gameName: record.gameName, tagLine: record.tagLine,
        championName: record.championName, total: 0, allies: 0, enemies: 0,
        winsTogether: 0, winsAgainst: 0, firstSeen: date, lastSeen: date };
      players.set(record.otherPuuid, player);
    }
    player.total++;
    if (record.isAlly) { player.allies++; if (record.win) player.winsTogether++; }
    else { player.enemies++; if (record.win) player.winsAgainst++; }
    if (date < player.firstSeen) player.firstSeen = date;
    if (date >= player.lastSeen) {
      player.lastSeen = date;
      player.championName = record.championName;
    }
    if (record.gameName && date >= (namedAt.get(record.otherPuuid) ?? '')) {
      player.gameName = record.gameName;
      player.tagLine = record.tagLine;
      namedAt.set(record.otherPuuid, date);
    }
  }
  return [...players.values()].sort((a, b) => b.total - a.total || b.lastSeen.localeCompare(a.lastSeen) || a.puuid.localeCompare(b.puuid));
}
