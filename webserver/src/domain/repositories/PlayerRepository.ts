import type { Player } from '../entities/Player';

/** De dónde sale la lista de jugadores que sigue el grupo. */
export interface PlayerRepository {
  getTrackedPlayers(): Player[];
}
