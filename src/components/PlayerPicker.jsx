
export function PlayerPicker({ title, search, onSearch, options, valueId, onChangeId }) {
  return (
    <div className="backdrop-blur-md bg-white/5 border border-white/10 rounded-2xl p-4">
      <h3 className="text-base font-medium mb-3">{title}</h3>
      <input
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        placeholder="Search player..."
        className="w-full mb-3 px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10"
      />
      <select
        value={valueId}
        onChange={(e) => onChangeId(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10"
      >
        <option value="">Select</option>
        {options.map(p => (
          <option key={p.id} value={p.id}>
            {p.name} ({p.team})
          </option>
        ))}
      </select>
    </div>
  );
}
