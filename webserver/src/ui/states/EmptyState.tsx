export function EmptyState() {
  return (
    <div className="state-panel">
      <div className="state-panel__diamonds">
        <div />
        <div />
        <div />
      </div>
      <div className="state-panel__title">El podio está vacío</div>
      <div className="state-panel__text">
        Todavía no hay jugadores en la lista. Sumalos editando{' '}
        <code>trackedPlayers.ts</code> en <code>src/infrastructure/config</code>.
      </div>
    </div>
  );
}
