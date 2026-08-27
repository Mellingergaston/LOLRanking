interface ErrorStateProps {
  message: string;
  retrying: boolean;
  onRetry: () => void;
}

export function ErrorState({ message, retrying, onRetry }: ErrorStateProps) {
  return (
    <div className="state-panel">
      <div className="state-panel__icon state-panel__icon--error">
        <div className="state-panel__icon-glyph">!</div>
      </div>
      <div className="state-panel__title">No pudimos traer el ranking</div>
      <div className="state-panel__text">
        La API de Riot no respondió. Puede ser un corte temporal del servicio o un problema de tu conexión.
      </div>
      <div className="state-panel__actions">
        <button type="button" className="btn-primary" disabled={retrying} onClick={onRetry}>
          <span className={`btn-refresh__icon${retrying ? ' spin' : ''}`} />
          REINTENTAR
        </button>
      </div>
      <div className="state-panel__http">{message}</div>
    </div>
  );
}
