export function FilterBar() {
  return (
    <div className="flex gap-3 px-4 mt-2">
      <button
        type="button"
        className="flex items-center gap-2 h-[40px] px-4 rounded-[20px] bg-white text-[#2a594d] border border-[#84c4b4] hover:bg-[#f4f9f8] text-sm font-semibold transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 5h18l-7 8.2V19l-4 2v-7.8L3 5z" />
        </svg>
        Filtro
      </button>

      <button
        type="button"
        className="flex items-center gap-2 h-[40px] px-4 rounded-[20px] border border-[#84c4b4] text-[#2a594d] bg-white hover:bg-[#f4f9f8] text-sm font-semibold transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 6h16M4 12h10M4 18h6" />
          <path d="M16 15l3 3 3-3M19 10v8" />
        </svg>
        Ordenar
      </button>
    </div>
  )
}
