import { Activity, ArrowRight, CheckCircle2, Disc, Gauge } from 'lucide-react';
import { EventType, SimulationResult } from '../engine/executionTypes';
import { StepSnapshot } from '../engine/simulationEngine';
import { formatNumber } from '../utils/calculations';
import { MovementGraph } from './MovementGraph';

interface ExecutionResultsProps {
  result: SimulationResult | null;
  snapshot: StepSnapshot | null;
  isValid: boolean;
}

function getEventBadgeClasses(type: EventType): string {
  switch (type) {
    case 'BOUNDARY':
      return 'bg-[#FFFBEB] text-[#B45309] border-[#F59E0B]/30';
    case 'CIRCULAR_JUMP':
      return 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/25';
    default:
      return 'bg-[#ECFDF5] text-[#059669] border-[#10B981]/25';
  }
}

export function ExecutionResults({
  result,
  snapshot,
  isValid,
}: ExecutionResultsProps) {
  const totalRequests = result?.originalQueue.length ?? 0;
  const servicedCount = snapshot?.servicedCount ?? 0;
  const remainingCount = snapshot?.remainingCount ?? 0;
  const progressPct =
    totalRequests > 0 ? Math.round((servicedCount / totalRequests) * 100) : 0;

  const isCompleted =
    result !== null && snapshot !== null && snapshot.step === result.events.length;

  // Show live cumulative metrics while stepping, matching final exact metrics at completion
  const displayedMovement = snapshot ? snapshot.cumulativeMovement : 0;
  const displayedAverage =
    isCompleted && result
      ? result.averageHeadMovement
      : snapshot
        ? snapshot.averageMovementSoFar
        : 0;
  const displayedFinalOrCurrentPos =
    isCompleted && result
      ? result.finalHeadPosition
      : snapshot
        ? snapshot.currentHead
        : result?.initialHead ?? 0;

  return (
    <section aria-label="Execution Results and History" className="space-y-4">
      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* 1. Total Head Movement */}
        <div className="bg-white p-4 rounded-xl border border-[#E5EAF2] shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              Total Head Movement
            </span>
            <div className="p-1.5 rounded-md bg-[#EFF6FF] text-[#2563EB]">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold mono-num text-[#172B4D]"
              data-testid="kpi-total-movement"
            >
              {isValid && result ? displayedMovement : '—'}
            </span>
            <span className="text-xs text-[#64748B]">cylinders</span>
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-1.5 flex items-center justify-between">
            <span>{result ? result.shortName : 'No algorithm'}</span>
            {result && !isCompleted && (
              <span className="mono-num text-[#64748B]">
                Final: {result.totalHeadMovement}
              </span>
            )}
          </div>
        </div>

        {/* 2. Average Head Movement */}
        <div className="bg-white p-4 rounded-xl border border-[#E5EAF2] shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              Average Head Movement
            </span>
            <div className="p-1.5 rounded-md bg-[#F5F3FF] text-[#8B7CF6]">
              <Gauge className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold mono-num text-[#172B4D]"
              data-testid="kpi-avg-movement"
            >
              {isValid && result ? formatNumber(displayedAverage, 2) : '—'}
            </span>
            <span className="text-xs text-[#64748B]">cyl / req</span>
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-1.5 flex items-center justify-between">
            <span>Total ÷ Serviced requests</span>
            {result && !isCompleted && (
              <span className="mono-num text-[#64748B]">
                Final: {formatNumber(result.averageHeadMovement, 2)}
              </span>
            )}
          </div>
        </div>

        {/* 3. Requests Completed / Remaining */}
        <div className="bg-white p-4 rounded-xl border border-[#E5EAF2] shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              Requests Progress
            </span>
            <div className="p-1.5 rounded-md bg-[#ECFDF5] text-[#10B981]">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span
              className="text-2xl font-bold mono-num text-[#10B981]"
              data-testid="kpi-serviced-count"
            >
              {isValid && result ? `${servicedCount} / ${totalRequests}` : '—'}
            </span>
            <span className="text-xs text-[#64748B]">
              ({remainingCount} remaining)
            </span>
          </div>
          <div className="w-full bg-[#F1F5FB] h-1.5 rounded-full overflow-hidden mt-2">
            <div
              className="bg-[#10B981] h-full rounded-full transition-all duration-200"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* 4. Final / Current Head Position */}
        <div className="bg-white p-4 rounded-xl border border-[#E5EAF2] shadow-subtle flex flex-col justify-between">
          <div className="flex items-center justify-between text-[#64748B] mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wide">
              {isCompleted ? 'Final Head Position' : 'Current Head Position'}
            </span>
            <div className="p-1.5 rounded-md bg-[#FFFBEB] text-[#F59E0B]">
              <Disc className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span
              className="text-2xl font-bold mono-num text-[#172B4D]"
              data-testid="kpi-final-pos"
            >
              {isValid && result ? displayedFinalOrCurrentPos : '—'}
            </span>
            <span className="text-xs text-[#64748B]">cylinder</span>
          </div>
          <div className="text-[11px] text-[#94A3B8] mt-1.5 flex items-center justify-between">
            <span>Initial: {result ? result.initialHead : '—'}</span>
            {result && !isCompleted && (
              <span className="mono-num text-[#64748B]">
                End: {result.finalHeadPosition}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Head Traversal & Service Sequence Flow Strip */}
      <div className="bg-white p-3.5 rounded-xl border border-[#E5EAF2] shadow-subtle">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
              Service &amp; Traversal Sequence:
            </span>
            <span className="text-[11px] text-[#94A3B8]">
              {result ? `${result.shortName}` : ''}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 mono-num text-xs">
            {!isValid || !result ? (
              <span className="text-[#94A3B8] font-sans">Invalid configuration</span>
            ) : (
              <>
                <span
                  className="px-2 py-0.5 rounded-md font-bold bg-[#2563EB] text-white"
                  title="Initial Head Position"
                >
                  {result.initialHead}
                </span>
                {result.events.map((ev) => {
                  const isReached = snapshot ? ev.step <= snapshot.step : false;
                  const isCurrent = snapshot ? ev.step === snapshot.step : false;
                  const isBoundary = ev.eventType === 'BOUNDARY';
                  const isJump = ev.eventType === 'CIRCULAR_JUMP';

                  const pillClasses = !isReached
                    ? 'bg-[#F7F9FC] text-[#94A3B8] border-[#E5EAF2]'
                    : isBoundary
                      ? 'bg-[#FFFBEB] text-[#B45309] border-[#F59E0B]/40 font-bold'
                      : isJump
                        ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/35 font-bold'
                        : 'bg-[#ECFDF5] text-[#059669] border-[#10B981]/30 font-semibold';

                  return (
                    <span key={`seq-${ev.step}`} className="inline-flex items-center gap-1">
                      <ArrowRight
                        className={`w-3 h-3 ${
                          isReached
                            ? isJump
                              ? 'text-[#2563EB]'
                              : 'text-[#64748B]'
                            : 'text-[#CBD5E1]'
                        }`}
                      />
                      <span
                        className={`px-2 py-0.5 rounded-md border transition-all ${pillClasses} ${
                          isCurrent ? 'ring-2 ring-[#2563EB]/30' : ''
                        }`}
                        title={`Step ${ev.step}: ${ev.label} (+${ev.distance})`}
                      >
                        {ev.currentPosition}
                      </span>
                    </span>
                  );
                })}
                {result.events.length === 0 && (
                  <span className="text-[#94A3B8] font-sans text-xs ml-1">
                    (No requests to service)
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Two-Column Analytics Grid: Movement Graph (7 cols) & Execution History Table (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <MovementGraph result={isValid ? result : null} snapshot={isValid ? snapshot : null} />
        </div>

        {/* Execution History Table */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-[#E5EAF2] p-5 shadow-subtle flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#172B4D]">Execution History</h3>
                <p className="text-xs text-[#64748B]">
                  Step-by-step position transitions &amp; seek distances
                </p>
              </div>
              <span className="text-[11px] mono-num px-2 py-0.5 rounded bg-[#F1F5FB] text-[#64748B] border border-[#E5EAF2]">
                {snapshot?.completedEvents.length ?? 0} / {result?.events.length ?? 0} steps
              </span>
            </div>

            <div className="overflow-auto max-h-[268px] border border-[#E5EAF2] rounded-lg">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-[#F1F5FB] text-[#64748B] border-b border-[#E5EAF2] sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-2.5 font-semibold whitespace-nowrap">Step</th>
                    <th className="py-2 px-2.5 font-semibold whitespace-nowrap">
                      Previous
                    </th>
                    <th className="py-2 px-2.5 font-semibold whitespace-nowrap">
                      Current
                    </th>
                    <th className="py-2 px-2.5 font-semibold whitespace-nowrap">
                      Movement
                    </th>
                    <th className="py-2 px-2.5 font-semibold whitespace-nowrap">Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5EAF2] mono-num text-[11px]">
                  {!isValid || !result || result.events.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-[#94A3B8] font-sans text-xs"
                      >
                        No execution steps yet.
                      </td>
                    </tr>
                  ) : snapshot && snapshot.completedEvents.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="py-8 text-center text-[#94A3B8] font-sans text-xs"
                      >
                        Click <strong>Start Simulation</strong> or <strong>Next Step</strong> to trace execution.
                      </td>
                    </tr>
                  ) : (
                    snapshot?.completedEvents.map((ev) => {
                      const isLatest = ev.step === snapshot.step;
                      return (
                        <tr
                          key={`row-${ev.step}`}
                          className={
                            isLatest ? 'bg-[#EFF6FF]/60' : 'hover:bg-[#F7F9FC]'
                          }
                        >
                          <td className="py-2 px-2.5 font-semibold text-[#64748B]">
                            #{ev.step}
                          </td>
                          <td className="py-2 px-2.5 text-[#64748B]">
                            {ev.previousPosition}
                          </td>
                          <td className="py-2 px-2.5 font-bold text-[#172B4D]">
                            {ev.currentPosition}
                          </td>
                          <td className="py-2 px-2.5 font-semibold text-[#2563EB]">
                            +{ev.distance}
                          </td>
                          <td className="py-2 px-2.5 font-sans">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-md border text-[10px] font-semibold whitespace-nowrap ${getEventBadgeClasses(
                                ev.eventType
                              )}`}
                            >
                              {ev.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 mt-3 border-t border-[#E5EAF2] flex items-center justify-between text-xs text-[#64748B]">
            <span>Cumulative head movement:</span>
            <span className="font-bold text-[#2563EB] mono-num text-sm">
              {displayedMovement} cylinders
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

