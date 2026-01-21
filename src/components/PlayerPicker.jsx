import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export function PlayerPicker({ title, search, onSearch, options, valueId, onChangeId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });
  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  const selectedPlayer = options.find((p) => p.id === valueId);

  // Close dropdown when clicking outside (but not on the dropdown itself)
  useEffect(() => {
    function handleClickOutside(event) {
      // Don't close if clicking on container or dropdown
      if (
        containerRef.current?.contains(event.target) ||
        dropdownRef.current?.contains(event.target)
      ) {
        return;
      }
      setIsOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Update dropdown position when open, input changes, or window resizes
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const rect = inputRef.current.getBoundingClientRect();
      // Use viewport coordinates directly for fixed positioning
      setDropdownPos({
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isOpen, options.length, search]);

  // Handle window resize to keep dropdown positioned correctly
  useEffect(() => {
    if (!isOpen) return;

    function handleResize() {
      if (inputRef.current) {
        const rect = inputRef.current.getBoundingClientRect();
        setDropdownPos({
          top: rect.bottom,
          left: rect.left,
          width: rect.width,
        });
      }
    }

    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize);
    };
  }, [isOpen]);

  const handleSelectPlayer = (id) => {
    console.log("Selecting player:", id);
    onChangeId(id);
    setIsOpen(false);
    // Clear search after selection
    onSearch("");
  };

  // Portal dropdown content
  const dropdownContent = isOpen ? (
    <div
      ref={dropdownRef}
      className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl shadow-2xl max-h-96 overflow-y-auto animate-in fade-in slide-in-from-top-2 z-[9999]"
      style={{
        position: 'fixed',
        top: `${dropdownPos.top + 8}px`,
        left: `${dropdownPos.left}px`,
        width: `${dropdownPos.width}px`,
      }}
      onMouseDown={(e) => e.preventDefault()}
    >
      {options.length > 0 ? (
        options.map((player) => (
          <button
            key={player.id}
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSelectPlayer(player.id);
            }}
            className={`w-full text-left px-4 py-3 hover:bg-white/10 transition-colors duration-200 flex items-center justify-between border-b border-white/5 last:border-b-0 cursor-pointer ${
              valueId === player.id ? "bg-gradient-to-r from-blue-500/20 to-blue-600/10" : ""
            }`}
          >
            <div className="flex-1">
              <div className="text-white font-medium text-sm">{player.display_name}</div>
              <div className="text-slate-400 text-xs mt-0.5">
                {player.team} • {player.position}
                {player.college && ` • ${player.college}`}
              </div>
            </div>
            {valueId === player.id && (
              <span className="text-blue-400 text-lg ml-2">✓</span>
            )}
          </button>
        ))
      ) : search ? (
        <div className="px-4 py-3 text-slate-400 text-sm">
          No players match "{search}"
        </div>
      ) : null}
    </div>
  ) : null;

  return (
    <div
      ref={containerRef}
      className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6 relative hover:bg-white/[0.07] transition-all duration-300 shadow-xl"
    >
      <h3 className="text-lg font-semibold text-white mb-4">{title}</h3>
      
      <input
        ref={inputRef}
        value={search}
        onChange={(e) => {
          onSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        placeholder="Search player..."
        className="w-full mb-4 px-4 py-3 rounded-xl bg-slate-900/80 border border-white/10 hover:border-white/20 focus:border-blue-500/50 focus:outline-none transition-all duration-300 backdrop-blur-sm"
      />

      {/* Selected player display */}
      {selectedPlayer && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-900/30 to-blue-800/20 border border-blue-500/30 text-sm hover:border-blue-500/50 transition-all duration-300">
          <span className="text-white font-semibold">{selectedPlayer.display_name}</span>
          <span className="text-slate-300 ml-2 text-xs">({selectedPlayer.team} • {selectedPlayer.position})</span>
        </div>
      )}

      {/* Portal for dropdown */}
      {createPortal(
        dropdownContent,
        document.body
      )}
    </div>
  );
}
