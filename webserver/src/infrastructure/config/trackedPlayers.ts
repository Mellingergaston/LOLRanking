import type { PlayerRepository } from '@/domain/repositories/PlayerRepository';
import { parseRiotId, type Player } from '@/domain/entities/Player';

/**
 * Riot IDs del grupo. Para sumar o sacar amigos, se edita esta lista
 * (equivalente al PLAYER_IDS que antes vivía en server.js).
 */
const TRACKED_RIOT_IDS: string[] = [
  'ElNiñøLacoste#coco',
  'breakneck#3766',
  '456#real',
  'ellbertoo#6831',
  'ElOrgulloPeleda#LAS',
  'ElRayoLautySappe#RAYO',
  'Jig#jajs',
  'METESACA#TONKA',
  'PlayMaker#2536',
  'I mit0 I#LAS',
  'Kenpachiオーラ#TONKA',
  'Funa#2010',
];

export class StaticPlayerRepository implements PlayerRepository {
  getTrackedPlayers(): Player[] {
    return TRACKED_RIOT_IDS.map(parseRiotId);
  }
}
