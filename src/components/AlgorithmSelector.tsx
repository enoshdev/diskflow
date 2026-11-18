import { AlgorithmId } from '../engine/executionTypes';
import { ALGORITHM_META, ALGORITHM_ORDER } from '../utils/calculations';

interface AlgorithmSelectorProps {
  selectedAlgorithm: AlgorithmId;
  onSelect: (id: AlgorithmId) => void;
}

export function AlgorithmSelector({
  selectedAlgorithm,
  onSelect,
}: AlgorithmSelectorProps) {
  const activeMeta = ALGORITHM_META[selectedAlgorithm];

  return (
    <section aria-label="Algorithm Selection" className="space-y-2.5">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
          Disk Scheduling Algorithm
        </h2>
        <span className="text-xs text-[#94A3B8]">Select to simulate &amp; trace</span>
      </div>

      <div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5"
        role="radiogroup"
        aria-label="Disk scheduling algorithm"
      >
        {ALGORITHM_ORDER.map((id) => {
          const meta = ALGORITHM_META[id];
          const isActive = id === selectedAlgorithm;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onSelect(id)}
              className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                isActive
                  ? 'border-[#2563EB] bg-[#EFF6FF] ring-1 ring-[#2563EB]/25 shadow-subtle'
                  : 'border-[#E5EAF2] bg-white hover:border-[#2563EB]/40 hover:bg-[#F7F9FC]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold mono-num tracking-tight ${
                    isActive ? 'text-[#2563EB]' : 'text-[#172B4D]'
                  }`}
                >
                  {meta.shortName}
                </span>
                <span
                  className={`w-1.5 h-1.5 rounded-full transition-colors ${
                    isActive ? 'bg-[#2563EB]' : 'bg-transparent'
                  }`}
                />
              </div>
              <div
                className={`text-[11px] truncate font-medium ${
                  isActive ? 'text-[#2563EB]' : 'text-[#64748B]'
                }`}
              >
                {meta.subtitle}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Algorithm Description Bar */}
      <div className="px-3.5 py-2.5 bg-white rounded-lg border border-[#E5EAF2] text-xs flex flex-wrap items-center justify-between gap-2 shadow-subtle">
        <div className="flex flex-wrap items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] mono-num font-bold text-[11px] border border-[#2563EB]/15">
            {activeMeta.shortName}
          </span>
          <span className="text-[#172B4D]">{activeMeta.description}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {!activeMeta.usesDirection && (
            <span className="text-[11px] px-2 py-0.5 rounded bg-[#F1F5FB] text-[#64748B] border border-[#E5EAF2]">
              Direction-independent
            </span>
          )}
          <span className="text-[11px] mono-num text-[#94A3B8]">
            Time: {activeMeta.complexity}
          </span>
        </div>
      </div>
    </section>
  );
}

