import Image from 'next/image';
import Link from 'next/link';
import type { PlayerProfileData } from '@/application/GetPlayerProfileUseCase';
import { avatarImgStyle } from '../format';
import { tierColorStyle } from '../tierColor';
import { LANE_LABELS } from '@/domain/services/computeLaneStats';
import { EncountersSection } from './EncountersSection';

export function ProfileView({ profile }: { profile: PlayerProfileData }) {
  const colorStyle = tierColorStyle(profile.tier);

  return (
    <main className="main profile-main" id="resumen">
      <Link href="/" className="profile-back">
        ‹ VOLVER AL RANKING
      </Link>

      <div className="profile-header">
        <div className="profile-avatar">
          {profile.profileIconUrl && (
            <Image src={profile.profileIconUrl} alt="" fill style={avatarImgStyle} sizes="96px" />
          )}
        </div>
        <div className="profile-identity">
          <div className="profile-name-row">
            <h1 className="profile-name">{profile.name}</h1>
            <div className="profile-tag">#{profile.tag}</div>
          </div>
          <div className="profile-meta">
            <div className="modal__tier-badge" style={colorStyle}>
              <div className="tier-dot" style={colorStyle} />
              <div className="tier-label" style={colorStyle}>
                {profile.tier}
                {profile.division ? ` ${profile.division}` : ''} · {profile.leaguePoints} LP
              </div>
            </div>
            {profile.mainLane && <span className="lane-badge">{LANE_LABELS[profile.mainLane]}</span>}
          </div>
          <div className="profile-actions">
            <a className="btn-secondary" href={profile.opggUrl} target="_blank" rel="noopener noreferrer">
              VER EN OP.GG
            </a>
          </div>
        </div>
      </div>

      {profile.error ? (
        <div className="state-panel">
          <div className="state-panel__icon state-panel__icon--error">
            <div className="state-panel__icon-glyph">!</div>
          </div>
          <div className="state-panel__title">No pudimos traer este perfil</div>
          <div className="state-panel__text">{profile.error}</div>
        </div>
      ) : (
        <>
          <nav className="profile-nav" aria-label="Secciones del perfil">
            <a href="#resumen">Resumen</a><a href="#encuentros">Encuentros <span>{profile.encounters.length}</span></a><a href="#rendimiento">Rendimiento</a>
          </nav>
          <div className="profile-tiles">
            <div className="profile-tile">
              <div className="profile-tile__label">WINRATE (RANGO)</div>
              <div className="profile-tile__value">{profile.winRate}%</div>
            </div>
            <div className="profile-tile">
              <div className="profile-tile__label">PARTIDAS (30 DÍAS)</div>
              <div className="profile-tile__value">{profile.gamesPlayed}</div>
            </div>
            <div className="profile-tile">
              <div className="profile-tile__label">CS / MIN</div>
              <div className="profile-tile__value">{profile.csPerMinute}</div>
            </div>
            <div className="profile-tile">
              <div className="profile-tile__label">KDA PROMEDIO</div>
              <div className="profile-tile__value">
                {profile.kda.kills}/{profile.kda.deaths}/{profile.kda.assists}
              </div>
            </div>
          </div>

          <EncountersSection encounters={profile.encounters} matches={profile.encounterMatches} pending={profile.pendingEncounterMatches} />
          <div className="profile-grid" id="rendimiento">
            <div><RecentFormSection profile={profile} /><DuoStatsSection profile={profile} /></div>
            <div><ChampionsSection profile={profile} /><LaneStatsSection profile={profile} /><GameModesSection profile={profile} /></div>
          </div>
        </>
      )}
    </main>
  );
}

function RecentFormSection({ profile }: { profile: PlayerProfileData }) {
  return (
    <section className="profile-section">
      <div className="profile-section__title">ÚLTIMAS {profile.recentForm.length || 10} PARTIDAS</div>
      {profile.recentForm.length === 0 ? (
        <div className="profile-section__empty">
          Sin partidas sincronizadas todavía — tocá &quot;Sincronizar partidas&quot; en el ranking.
        </div>
      ) : (
        <div className="recent-form">
          {profile.recentForm.map((match) => (
            <div
              key={match.matchId}
              className={`recent-form__game recent-form__game--${match.win ? 'win' : 'loss'}`}
              title={`${match.win ? 'Victoria' : 'Derrota'} · ${match.championName} · ${match.kills}/${match.deaths}/${match.assists} · ${match.gameCreation.toLocaleDateString('es-AR')}`}
            >
              {match.championIconUrl && <Image src={match.championIconUrl} alt={match.championName} width={36} height={36} />}
              <strong>{match.win ? 'Victoria' : 'Derrota'}</strong>
              <span>{match.championName}</span>
              <b>{match.kills} / {match.deaths} / {match.assists}</b>
              <time>{match.gameCreation.toLocaleDateString('es-AR', { timeZone: 'UTC' })}</time>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ChampionsSection({ profile }: { profile: PlayerProfileData }) {
  const showBestSeparately =
    profile.bestChampion && profile.bestChampion.championId !== profile.topChampions[0]?.championId;

  return (
    <section className="profile-section">
      <div className="profile-section__title">TUS CAMPEONES (30 DÍAS)</div>
      {profile.topChampions.length === 0 ? (
        <div className="profile-section__empty">
          Sin partidas sincronizadas todavía — tocá &quot;Sincronizar partidas&quot; en el ranking.
        </div>
      ) : (
        <>
          <div className="champion-cards">
            {profile.topChampions.map((champ) => (
              <div className="champion-card" key={champ.championId}>
                <div className="champion-card__icon">
                  {champ.championIconUrl && (
                    <Image src={champ.championIconUrl} alt="" fill style={avatarImgStyle} sizes="40px" />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="champion-card__name">{champ.championName}</div>
                  <div className="champion-card__sub">
                    {champ.games} partidas · <span className="champion-card__wr">{champ.winRate}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {showBestSeparately && (
            <div className="highlight-row">
              <div className="highlight-row__label">MEJOR WINRATE</div>
              <div>
                {profile.bestChampion!.championName} — {profile.bestChampion!.winRate}% en{' '}
                {profile.bestChampion!.games} partidas
              </div>
            </div>
          )}
        </>
      )}

      {profile.topMasteries.length > 0 && (
        <>
          <div className="profile-section__title" style={{ marginTop: 'var(--spacing-md)' }}>
            TUS MAINS (MAESTRÍA)
          </div>
          <div className="champion-cards">
            {profile.topMasteries.map((mastery) => (
              <div className="champion-card" key={mastery.championId}>
                <div className="champion-card__icon">
                  {mastery.championIconUrl && (
                    <Image src={mastery.championIconUrl} alt="" fill style={avatarImgStyle} sizes="40px" />
                  )}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div className="champion-card__name">{mastery.championName}</div>
                  <div className="champion-card__sub">{mastery.championPoints.toLocaleString('es-AR')} pts</div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function LaneStatsSection({ profile }: { profile: PlayerProfileData }) {
  if (profile.laneStats.length === 0) return null;

  return (
    <section className="profile-section">
      <div className="profile-section__title">RENDIMIENTO POR LÍNEA</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...profile.laneStats]
          .sort((a, b) => b.games - a.games)
          .map((lane) => (
            <div className="record-rank-row" key={lane.lane}>
              <div className="record-rank-row__name">
                {LANE_LABELS[lane.lane]}
                {lane.lane === profile.mainLane && <span className="lane-badge">MAIN</span>}
              </div>
              <div className="record-rank-row__tag">{lane.games} partidas</div>
              <div className="record-rank-row__value">{lane.winRate}%</div>
            </div>
          ))}
      </div>
    </section>
  );
}

function DuoStatsSection({ profile }: { profile: PlayerProfileData }) {
  return (
    <section className="profile-section">
      <div className="profile-section__title">CON QUIÉN MÁS GANÁS</div>
      {profile.duoStats.length === 0 ? (
        <div className="profile-section__empty">Todavía no jugó suficientes partidas con otros del grupo.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {profile.duoStats.map((duo) => (
            <Link
              href={`/players/${encodeURIComponent(duo.riotId)}`}
              className="record-rank-row"
              key={duo.riotId}
              style={{ textDecoration: 'none', color: 'inherit' }}
            >
              <div className="record-rank-row__name">{duo.riotId.split('#')[0]}</div>
              <div className="record-rank-row__tag">{duo.gamesTogether} partidas juntos</div>
              <div className="record-rank-row__value">{duo.winRateTogether}%</div>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

function GameModesSection({ profile }: { profile: PlayerProfileData }) {
  if (profile.gameModeStats.length === 0) return null;

  return (
    <section className="profile-section" style={{ paddingBottom: 'var(--spacing-xl)' }}>
      <div className="profile-section__title">POR MODO DE JUEGO</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {profile.gameModeStats.map((mode) => (
          <div className="record-rank-row" key={mode.queueId}>
            <div className="record-rank-row__name">{mode.label}</div>
            <div className="record-rank-row__tag">{mode.games} partidas</div>
            <div className="record-rank-row__value">{mode.winRate}%</div>
          </div>
        ))}
      </div>
    </section>
  );
}
