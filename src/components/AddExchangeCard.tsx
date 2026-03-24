export function AddExchangeCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="border border-dashed border-container-border bg-transparent p-5 flex flex-col items-center justify-center gap-3 min-h-[160px] hover:border-text-tertiary transition-colors group"
    >
      <span className="text-2xl text-text-tertiary group-hover:text-text-secondary">+</span>
      <span className="text-xs font-mono text-text-tertiary group-hover:text-text-secondary tracking-wider">
        ADD EXCHANGE
      </span>
    </button>
  )
}
