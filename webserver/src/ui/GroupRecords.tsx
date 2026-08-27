'use client';

import { useEffect, useState } from 'react';
import type { MonthlyStats } from '@/domain/entities/MonthlyStats';
import {
  computeGroupRecords,
  getStatLabel,
  getStatRanking,
  type GroupStatKey,
} from '@/domain/services/computeGroupRecords';
import { splitRiotId } from './format';

const VALUE_FORMATTERS: Record<GroupStatKey, (n: number) => string> = {
  kills: (n) => `${n} kills`,
  damageDealt: (n) => `${Math.round(n / 1000)}k daño`,
  damageTaken: (n) => `${Math.round(n / 1000)}k recibido`,
  visionScore: (n) => `${n} visión`,
  csPerMinute: (n) => `${n} CS/min`,
};

export function GroupRecords({ stats }: { stats: MonthlyStats[] }) {
  const [selectedStat, setSelectedStat] = useState<GroupStatKey | null>(null);
  const records = computeGroupRecords(stats);

  useEffect(() => {
    if (!selectedStat) return;
    function handleKeydown(e: KeyboardEvent) {
      if (e.key === 'Escape') setSelectedStat(null);
    }
    document.addEventListener('keydown', handleKeydown);
    return () => document.removeEventListener('keydown', handleKeydown);
  }, [selectedStat]);

  if (records.length === 0) return null;

  const ranking = selectedStat ? getStatRanking(stats, selectedStat) : [];

  return (
    <>
      <div className="records">
        {records.map((record) => {
          const { name } = splitRiotId(record.riotId);
          return (
            <button
              type="button"
              className="record-card"
              key={record.statKey}
              onClick={() => setSelectedStat(record.statKey)}
            >
              <div className="record-card__label">{record.label.toUpperCase()}</div>
              <div className="record-card__player">{name}</div>
              <div className="record-card__value">{VALUE_FORMATTERS[record.statKey](record.value)}</div>
            </button>
          );
        })}
      </div>

      {selectedStat && (
        <div className="modal" role="presentation" onClick={() => setSelectedStat(null)}>
          <div className="modal__backdrop" />
          <div className="modal__card" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="modal__top" style={{ paddingBottom: 'var(--spacing-sm)' }}>
              <div className="modal__identity">
                <div className="modal__name">{getStatLabel(selectedStat)}</div>
                <div className="modal__position" style={{ marginTop: 6 }}>
                  RANKING DEL GRUPO · ÚLTIMO MES
                </div>
              </div>
              <button
                type="button"
                className="modal__close"
                aria-label="Cerrar"
                onClick={() => setSelectedStat(null)}
              >
                ×
              </button>
            </div>

            <div style={{ marginTop: 'var(--spacing-sm)', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ranking.map((row, i) => {
                const { name, tag } = splitRiotId(row.riotId);
                return (
                  <div className="record-rank-row" key={row.riotId}>
                    <div className="record-rank-row__pos">{i + 1}</div>
                    <div className="record-rank-row__name">
                      {name}
                      <span className="record-rank-row__tag">#{tag}</span>
                    </div>
                    <div className="record-rank-row__value">{VALUE_FORMATTERS[selectedStat](row.value)}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
