import React, { useState } from 'react';
import {
  ArrowRight,
  Award,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Scale,
} from 'lucide-react';
import { AlgorithmId, DiskConfiguration } from '../engine/executionTypes';
import { ComparisonEntry } from '../engine/simulationEngine';
import { ALGORITHM_META, formatNumber } from '../utils/calculations';

interface ComparisonSectionProps {
  config: DiskConfiguration;
  activeAlgorithm: AlgorithmId;
  comparisonEntries: ComparisonEntry[] | null;
  isValid: boolean;
  onCompareAll: () => void;
  onSelectAlgorithm: (id: AlgorithmId) => void;
}

export function ComparisonSection({
  config,
  activeAlgorithm,
  comparisonEntries,
  isValid,
  onCompareAll,
  onSelectAlgorithm,
}: ComparisonSectionProps) {
  const [expandedAlgo, setExpandedAlgo] = useState<AlgorithmId | null>(null);

  const maxMovement =
    comparisonEntries && comparisonEntries.length > 0
      ? Math.max(...comparisonEntries.map((e) => e.result.totalHeadMovement), 1)
      : 1;

  const optimalNames = comparisonEntries
    ? comparisonEntries
        .filter((e) => e.isOptimal)
        .map((e) => e.result.shortName)
        .join(' / ')
    : '';

  const toggleExpand = (id: AlgorithmId) => {
    setExpandedAlgo((prev) => (prev === id ? null : id));
  };

  return (
    <section
      id="comparison-section"
      aria-label="Algorithm Performance Comparison"
      className="bg-white rounded-xl border border-[#E5EAF2] p-5 shadow-subtle space-y-5"
    >
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-[#E5EAF2]">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-[#EFF6FF] text-[#2563EB]">
              <Scale className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-[#172B4D]">
              Algorithm Performance Comparison
            </h2>
          </div>
          <p className="text-xs text-[#64748B] mt-1">
            Execute all six algorithms on the exact current input:{' '}
            <span className="mono-num font-semibold text-[#172B4D]">
              Cylinders 0–{Math.max(0, config.totalCylinders - 1)} · Head {config.initialHead} ·{' '}
              {config.direction} · [{config.requests.join(', ')}]
            </span>
          </p>
        </div>

        <button
          type="button"
          onClick={onCompareAll}
          disabled={!isValid}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors shadow-subtle shrink-0 cursor-pointer"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Compare All Algorithms</span>
        </button>
      </div>

      {!comparisonEntries ? (
        <div className="bg-[#F7F9FC] rounded-xl border border-dashed border-[#CBD5E1] p-8 text-center">
          <p className="text-sm font-semibold text-[#172B4D]">
            Ready to benchmark all six disk scheduling algorithms
          </p>
          <p className="text-xs text-[#64748B] mt-1">
            Click <strong>Compare All Algorithms</strong> to dynamically evaluate FCFS, SSTF, SCAN,
            C-SCAN, LOOK, and C-LOOK on your current request queue.
          </p>
        </div>
      ) : (
        <>
          {/* Horizontal Bar Chart */}
          <div className="bg-[#F7F9FC] rounded-xl p-4 border border-[#E5EAF2]">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3.5">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Total Head Movement (Lower is Better for Current Input)
              </h3>
              <span className="text-xs text-[#059669] bg-[#ECFDF5] border border-[#10B981]/25 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1.5 font-semibold">
                <Award className="w-3.5 h-3.5" />
                <span>Lowest for this input: {optimalNames}</span>
              </span>
            </div>

            <div className="space-y-2.5">
              {comparisonEntries.map((entry) => {
                const { result, isOptimal } = entry;
                const isActive = result.algorithmId === activeAlgorithm;
                const pct =
                  result.totalHeadMovement === 0
                    ? 2
                    : Math.max(8, Math.round((result.totalHeadMovement / maxMovement) * 100));

                const barColor = isOptimal
                  ? 'bg-[#10B981]'
                  : isActive
                    ? 'bg-[#2563EB]'
                    : 'bg-[#CBD5E1]';

                const labelColor = isOptimal || isActive ? 'text-white' : 'text-[#172B4D]';

                return (
                  <div
                    key={`bar-${result.algorithmId}`}
                    className="grid grid-cols-12 items-center gap-2 sm:gap-3 text-xs"
                  >
                    <div className="col-span-3 sm:col-span-2 flex items-center gap-1.5 mono-num">
                      <span
                        className={`font-bold ${
                          isActive ? 'text-[#2563EB]' : 'text-[#172B4D]'
                        }`}
                      >
                        {result.shortName}
                      </span>
                      {isOptimal && (
                        <span className="text-[10px] font-sans font-semibold text-[#059669]">
                          ★ Min
                        </span>
                      )}
                    </div>

                    <div className="col-span-7 sm:col-span-8 bg-white rounded-md border border-[#E5EAF2] h-7 p-0.5 flex items-center overflow-hidden">
                      <div
                        className={`h-full rounded-xs transition-all duration-300 flex items-center justify-end px-2.5 mono-num font-bold text-[11px] ${barColor} ${labelColor}`}
                        style={{ width: `${pct}%` }}
                      >
                        {result.totalHeadMovement} cyl
                      </div>
                    </div>

                    <div className="col-span-2 text-right mono-num text-[11px] text-[#64748B]">
                      avg {formatNumber(result.averageHeadMovement, 2)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comparison Table with Expandable Service Sequence */}
          <div className="overflow-x-auto border border-[#E5EAF2] rounded-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F1F5FB] text-[#64748B] border-b border-[#E5EAF2]">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Rank</th>
                  <th className="py-2.5 px-3 font-semibold">Algorithm</th>
                  <th className="py-2.5 px-3 font-semibold mono-num">Total Movement</th>
                  <th className="py-2.5 px-3 font-semibold mono-num">Avg / Request</th>
                  <th className="py-2.5 px-3 font-semibold hidden md:table-cell">
                    Characteristics
                  </th>
                  <th className="py-2.5 px-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5EAF2]">
                {comparisonEntries.map((entry) => {
                  const { rank, isOptimal, result } = entry;
                  const meta = ALGORITHM_META[result.algorithmId];
                  const isActive = result.algorithmId === activeAlgorithm;
                  const isExpanded = expandedAlgo === result.algorithmId;

                  return (
                    <React.Fragment key={result.algorithmId}>
                      <tr className={isActive ? 'bg-[#EFF6FF]/40' : 'hover:bg-[#F7F9FC]'}>
                        <td className="py-3 px-3 mono-num font-bold text-[#64748B]">
                          #{rank}
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-bold text-[#172B4D]">
                              {result.shortName}
                            </span>
                            <span className="text-[#64748B] text-[11px]">
                              ({meta.subtitle})
                            </span>
                            {isOptimal && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#ECFDF5] text-[#059669] border border-[#10B981]/25">
                                Lowest Movement
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#2563EB] text-white">
                                Active
                              </span>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleExpand(result.algorithmId)}
                            className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-[#2563EB] hover:underline cursor-pointer"
                          >
                            {isExpanded ? (
                              <>
                                <ChevronUp className="w-3 h-3" />
                                <span>Hide Sequence</span>
                              </>
                            ) : (
                              <>
                                <ChevronDown className="w-3 h-3" />
                                <span>Inspect Service Sequence</span>
                              </>
                            )}
                          </button>
                        </td>
                        <td className="py-3 px-3 mono-num">
                          <span
                            className={`font-bold text-sm ${
                              isOptimal ? 'text-[#059669]' : 'text-[#172B4D]'
                            }`}
                          >
                            {result.totalHeadMovement}
                          </span>{' '}
                          <span className="text-[#64748B] text-[11px]">cyl</span>
                        </td>
                        <td className="py-3 px-3 mono-num text-[#172B4D]">
                          {formatNumber(result.averageHeadMovement, 2)}
                        </td>
                        <td className="py-3 px-3 text-[#64748B] text-[11px] max-w-xs hidden md:table-cell">
                          {meta.tradeoff}
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => onSelectAlgorithm(result.algorithmId)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-[#2563EB] text-white'
                                : 'bg-white hover:bg-[#EFF6FF] text-[#2563EB] border border-[#E5EAF2] hover:border-[#2563EB]/30'
                            }`}
                          >
                            {isActive ? 'Selected' : 'Simulate'}
                          </button>
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr className="bg-[#F7F9FC]">
                          <td colSpan={6} className="px-4 py-3">
                            <div className="space-y-2">
                              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                                <span className="font-semibold text-[#172B4D]">
                                  Full Head Path ({result.events.length} transitions · Boundary
                                  events: {result.boundaryEvents.length} · Circular jumps:{' '}
                                  {result.circularJumpEvents.length})
                                </span>
                                <span className="mono-num text-[#64748B]">
                                  Final Head: {result.finalHeadPosition}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 mono-num text-[11px]">
                                <span className="px-2 py-0.5 rounded bg-[#2563EB] text-white font-bold">
                                  {result.initialHead}
                                </span>
                                {result.events.map((ev) => (
                                  <span
                                    key={`${result.algorithmId}-exp-${ev.step}`}
                                    className="inline-flex items-center gap-1"
                                  >
                                    <ArrowRight className="w-3 h-3 text-[#94A3B8]" />
                                    <span
                                      className={`px-2 py-0.5 rounded border ${
                                        ev.eventType === 'BOUNDARY'
                                          ? 'bg-[#FFFBEB] text-[#B45309] border-[#F59E0B]/40 font-semibold'
                                          : ev.eventType === 'CIRCULAR_JUMP'
                                            ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/30 font-semibold'
                                            : 'bg-white text-[#172B4D] border-[#E5EAF2]'
                                      }`}
                                    >
                                      {ev.currentPosition}
                                      <span className="text-[#94A3B8] ml-1">
                                        (+{ev.distance})
                                      </span>
                                    </span>
                                  </span>
                                ))}
                              </div>
                              <div className="text-[11px] text-[#64748B]">
                                Serviced Request Order:{' '}
                                <span className="mono-num text-[#172B4D] font-medium">
                                  {result.serviceSequence.length > 0
                                    ? result.serviceSequence.join(' → ')
                                    : '(Empty)'}
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}

