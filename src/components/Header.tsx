import { BarChart2 } from 'lucide-react';

interface HeaderProps {
  totalCylinders: number;
  requestCount: number;
  onJumpToCompare: () => void;
}

export function Header({ totalCylinders, requestCount, onJumpToCompare }: HeaderProps) {
  const maxCylinder = Math.max(0, totalCylinders - 1);

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-[#E5EAF2] shadow-subtle">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 min-h-16 py-2.5 flex flex-wrap items-center justify-between gap-3">
        {/* Left Branding */}
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-9 h-9 rounded-lg bg-[#EFF6FF] border border-[#2563EB]/20 flex items-center justify-center text-[#2563EB] shrink-0"
            aria-hidden="true"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1">
              <circle cx="12" cy="12" r="9" />
              <circle cx="12" cy="12" r="3" />
              <path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21" strokeLinecap="round" />
              <path d="M12 12l5-5" strokeLinecap="round" />
              <circle cx="17" cy="7" r="1.5" fill="currentColor" />
            </svg>
          </div>
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 min-w-0">
            <h1 className="text-lg font-bold tracking-tight text-[#172B4D]">DiskFlow</h1>
            <span className="text-[#E5EAF2] hidden sm:inline">|</span>
            <span className="text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#2563EB]/15">
              Interactive Disk Scheduling Simulator
            </span>
          </div>
          <div className="hidden lg:block pl-3 border-l border-[#E5EAF2]">
            <p className="text-xs text-[#64748B]">
              Explore, execute, and visualize disk scheduling algorithms.
            </p>
          </div>
        </div>

        {/* Right Status & Quick Compare */}
        <div className="flex items-center gap-2.5">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#F1F5FB] border border-[#E5EAF2] text-xs font-medium text-[#64748B]">
            <span className="inline-block w-2 h-2 rounded-full bg-[#10B981]" />
            <span className="mono-num text-[#172B4D] font-semibold">
              0–{maxCylinder} Cylinders · {requestCount}{' '}
              {requestCount === 1 ? 'Request' : 'Requests'}
            </span>
          </div>
          <button
            type="button"
            onClick={onJumpToCompare}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB] bg-[#EFF6FF] hover:bg-blue-100 border border-[#2563EB]/20 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Compare All</span>
          </button>
        </div>
      </div>
    </header>
  );
}

