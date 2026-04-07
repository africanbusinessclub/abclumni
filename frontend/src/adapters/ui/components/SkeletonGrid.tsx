export function SkeletonGrid() {
    return (
        <div className="card-grid">
            {Array.from({ length: 6 }).map((_, index) => (
                <div className="panel skeleton" key={index}></div>
            ))}
        </div>
    )
}
