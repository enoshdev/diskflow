import {
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  SkipBack,
  SkipForward,
} from 'lucide-react';
import { SimulationStatus } from '../engine/executionTypes';

export interface SpeedOption {
  label: string;
  ms: number;
}

export const SPEED_OPTIONS: SpeedOption[] = [
  { label: '0.5x', ms: 1400 },
  { label: '1x', ms: 800 },
  { label: '1.5x', ms: 480 },
  { label: '2x', ms: 260 },
];

interface SimulationControlsProps {
  status: SimulationStatus;
  currentStep: number;
  totalSteps: number;
  speedMs: number;
  disabled: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onReset: () => void;
  onReplay: () => void;
  onChangeSpeed: (ms: number) => void;
}

export function SimulationControls({
  status,
  currentStep,
  totalSteps,
  speedMs,
  disabled,
  onStart,
  onPause,
  onResume,
  onPrevStep,
  onNextStep,
  onReset,
  onReplay,
  onChangeSpeed,
}: SimulationControlsProps) {
  const progressPct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0;

  const handlePrimaryAction = () => {
    if (disabled) return;
    if (status === 'RUNNING') {
      onPause();
    } else if (status === 'PAUSED') {
      onResume();
    } else if (status === 'COMPLETED') {
      onReplay();
    } else {
      onStart();
    }
  };

  const primaryLabel =
    status === 'RUNNING'
      ? 'Pause'
      : status === 'PAUSED'
        ? 'Resume'
        : status === 'COMPLETED'
          ? 'Replay Simulation'
          : 'Start Simulation';

  return (
    <div className="px-4 sm:px-5 py-3.5 bg-[#F1F5FB] border-t border-[#E5EAF2] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
      {/* Playback Controls */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={disabled}
          className="px-4 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-subtle transition-colors inline-flex items-center gap-2 cursor-pointer"
        >
          {status === 'RUNNING' ? (
            <Pause className="w-3.5 h-3.5 fill-white" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-white" />
          )}
          <span>{primaryLabel}</span>
        </button>

        <button
          type="button"
          onClick={onPrevStep}
          disabled={disabled || currentStep <= 0}
          className="px-2.5 py-2 text-xs font-medium text-[#172B4D] hover:bg-[#EAEFF8] disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-[#E5EAF2] rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          title="Previous Step"
        >
          <SkipBack className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Prev Step</span>
        </button>

        <button
          type="button"
          onClick={onNextStep}
          disabled={disabled || currentStep >= totalSteps}
          className="px-2.5 py-2 text-xs font-medium text-[#172B4D] hover:bg-[#EAEFF8] disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-[#E5EAF2] rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          title="Next Step"
        >
          <span className="hidden sm:inline">Next Step</span>
          <SkipForward className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={onReset}
          disabled={disabled || (currentStep === 0 && status === 'IDLE')}
          className="px-2.5 py-2 text-xs font-medium text-[#64748B] hover:text-[#172B4D] hover:bg-[#EAEFF8] disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-[#E5EAF2] rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          title="Reset to Initial Position"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          type="button"
          onClick={onReplay}
          disabled={disabled || totalSteps === 0}
          className="px-2.5 py-2 text-xs font-medium text-[#64748B] hover:text-[#2563EB] hover:bg-[#EFF6FF] disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-[#E5EAF2] rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer"
          title="Replay from Step 0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Replay</span>
        </button>
      </div>

      {/* Right: Progress + Speed Selector */}
      <div className="flex flex-wrap items-center justify-between md:justify-end gap-3.5">
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-[#64748B] mono-num">
            Step:{' '}
            <strong className="text-[#172B4D]">
              {currentStep} / {totalSteps}
            </strong>
          </span>
          <div className="w-20 h-1.5 bg-white border border-[#E5EAF2] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2563EB] rounded-full transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        <div
          className="flex items-center bg-white border border-[#E5EAF2] rounded-lg p-0.5 text-xs mono-num"
          role="group"
          aria-label="Animation Speed"
        >
          {SPEED_OPTIONS.map((opt) => {
            const active = speedMs === opt.ms;
            return (
              <button
                key={opt.label}
                type="button"
                onClick={() => onChangeSpeed(opt.ms)}
                className={`px-2 py-1 rounded-md transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#2563EB] text-white font-semibold'
                    : 'text-[#64748B] hover:text-[#172B4D]'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

