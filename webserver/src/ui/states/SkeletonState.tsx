export function SkeletonState() {
  return (
    <>
      <div className="skeleton-podium">
        <div className="skeleton skeleton--gold" />
        <div className="skeleton" />
        <div className="skeleton" />
      </div>
      <div className="skeleton-rows">
        {Array.from({ length: 6 }).map((_, i) => (
          <div className="skeleton-row" key={i}>
            <div className="skeleton skeleton-row__avatar" />
            <div className="skeleton skeleton-row__name" />
            <div className="skeleton skeleton-row__tier" />
            <div className="skeleton skeleton-row__lp" />
            <div className="skeleton skeleton-row__wr" />
          </div>
        ))}
      </div>
    </>
  );
}
