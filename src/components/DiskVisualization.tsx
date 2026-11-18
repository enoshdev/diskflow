import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Direction,
  SimulationResult,
  SimulationStatus,
} from '../engine/executionTypes';
import { StepSnapshot } from '../engine/simulationEngine';
import { getTickMarks } from '../utils/calculations';
import { SimulationControls } from './SimulationControls';

interface DiskVisualizationProps {
  result: SimulationResult | null;
  snapshot: StepSnapshot | null;
  status: SimulationStatus;
  initialDirection: Direction;
  speedMs: number;
  isValid: boolean;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onPrevStep: () => void;
  onNextStep: () => void;
  onReset: () => void;
  onReplay: () => void;
  onChangeSpeed: (ms: number) => void;
}

const SVG_WIDTH = 920;
const TRACK_LEFT = 48;
const TRACK_RIGHT = 872;
const TRACK_SPAN = TRACK_RIGHT - TRACK_LEFT;
const TRACK_Y = 76;

interface TrackCylinderGroup {
  cylinder: number;
  x: number;
  totalCount: number;
  servicedCount: number;
  allServiced: boolean;
  labelPlacement: 'above' | 'below';
}

export function DiskVisualization({
  result,
  snapshot,
  status,
  initialDirection,
  speedMs,
  isValid,
  onStart,
  onPause,
  onResume,
  onPrevStep,
  onNextStep,
  onReset,
  onReplay,
  onChangeSpeed,
}: DiskVisualizationProps) {
  const maxCylinder = result ? result.maxCylinder : 199;
  const xFor = (cyl: number) => {
    if (maxCylinder <= 0) return TRACK_LEFT + TRACK_SPAN / 2;
    const clamped = Math.max(0, Math.min(maxCylinder, cyl));
    return TRACK_LEFT + (clamped / maxCylinder) * TRACK_SPAN;
  };

  const ticks = useMemo(() => getTickMarks(maxCylinder), [maxCylinder]);

  // Group requests by cylinder so duplicates display cleanly (e.g. "65 ×2")
  // and stagger labels vertically when neighbors are close on screen.
  const requestGroups = useMemo<TrackCylinderGroup[]>(() => {
    if (!result || !snapshot) return [];
    const byCyl = new Map<number, { total: number; serviced: number }>();
    result.originalQueue.forEach((cyl, idx) => {
      const entry = byCyl.get(cyl) ?? { total: 0, serviced: 0 };
      entry.total += 1;
      if (snapshot.servicedIndices.has(idx)) {
        entry.serviced += 1;
      }
      byCyl.set(cyl, entry);
    });

    const sorted = Array.from(byCyl.entries())
      .map(([cylinder, counts]) => ({
        cylinder,
        x: xFor(cylinder),
        totalCount: counts.total,
        servicedCount: counts.serviced,
        allServiced: counts.serviced >= counts.total,
        labelPlacement: 'above' as 'above' | 'below',
      }))
      .sort((a, b) => a.x - b.x);

    // Collision avoidance: stagger adjacent labels that are within 34px
    let lastAboveX = -999;
    let lastBelowX = -999;
    for (const group of sorted) {
      if (group.x - lastAboveX >= 34) {
        group.labelPlacement = 'above';
        lastAboveX = group.x;
      } else if (group.x - lastBelowX >= 34) {
        group.labelPlacement = 'below';
        lastBelowX = group.x;
      } else {
        // Pick whichever side has more breathing room
        if (group.x - lastAboveX >= group.x - lastBelowX) {
          group.labelPlacement = 'above';
          lastAboveX = group.x;
        } else {
          group.labelPlacement = 'below';
          lastBelowX = group.x;
        }
      }
    }

    return sorted;
  }, [result, snapshot, maxCylinder]);

  const completedEvents = snapshot?.completedEvents ?? [];
  const totalEvents = result?.events.length ?? 0;

  // Dynamic SVG height so many steps stay readable without cramping
  const trajectoryTop = 128;
  const rowStep = totalEvents <= 10 ? 22 : Math.max(15, Math.min(20, 240 / Math.max(1, totalEvents)));
  const svgHeight = Math.max(290, trajectoryTop + Math.max(1, totalEvents) * rowStep + 36);

  const visitedBoundaries = useMemo(() => {
    const set = new Set<number>();
    for (const ev of completedEvents) {
      if (ev.eventType === 'BOUNDARY') {
        set.add(ev.currentPosition);
      } else if (ev.eventType === 'CIRCULAR_JUMP' && result?.algorithmId === 'CSCAN') {
        set.add(ev.previousPosition);
        set.add(ev.currentPosition);
      }
    }
    return set;
  }, [completedEvents, result?.algorithmId]);

  const currentHead = snapshot ? snapshot.currentHead : result?.initialHead ?? 0;
  const headX = xFor(currentHead);
  const initialHeadX = xFor(result?.initialHead ?? 0);

  const activeDirectionLabel = (() => {
    if (snapshot?.lastEvent && snapshot.lastEvent.direction !== 'NONE') {
      return snapshot.lastEvent.direction === 'RIGHT' ? '→ RIGHT' : '← LEFT';
    }
    if (snapshot?.nextEvent && snapshot.nextEvent.direction !== 'NONE') {
      return snapshot.nextEvent.direction === 'RIGHT' ? '→ RIGHT' : '← LEFT';
    }
    if (result?.directionUsed) {
      return result.directionUsed === 'RIGHT' ? '→ RIGHT' : '← LEFT';
    }
    return initialDirection === 'RIGHT' ? '→ RIGHT' : '← LEFT';
  })();

  const statusConfig: Record<
    SimulationStatus,
    { label: string; dotClass: string; badgeClass: string }
  > = {
    IDLE: {
      label: 'Idle',
      dotClass: 'bg-[#94A3B8]',
      badgeClass: 'bg-[#F1F5FB] text-[#64748B] border-[#E5EAF2]',
    },
    RUNNING: {
      label: 'Running',
      dotClass: 'bg-[#2563EB] animate-pulse',
      badgeClass: 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/25',
    },
    PAUSED: {
      label: 'Paused',
      dotClass: 'bg-[#F59E0B]',
      badgeClass: 'bg-[#FFFBEB] text-[#B45309] border-[#F59E0B]/30',
    },
    COMPLETED: {
      label: 'Completed',
      dotClass: 'bg-[#10B981]',
      badgeClass: 'bg-[#ECFDF5] text-[#059669] border-[#10B981]/30',
    },
  };

  const stateBadge = statusConfig[status];
  const transitionDuration = Math.max(0.18, Math.min(0.45, speedMs / 2000));

  return (
    <section
      aria-label="Disk Head Visualization"
      className="bg-white rounded-xl border border-[#E5EAF2] shadow-subtle overflow-hidden"
    >
      {/* Header + Live Telemetry */}
      <div className="p-4 sm:p-5 border-b border-[#E5EAF2] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="text-base font-bold text-[#172B4D]">Disk Head Visualization</h2>
            {result && (
              <span className="px-2 py-0.5 text-xs mono-num font-bold rounded bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20">
                {result.shortName}
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[11px] font-semibold rounded-full border ${stateBadge.badgeClass}`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${stateBadge.dotClass}`} />
              <span>{stateBadge.label}</span>
            </span>
          </div>
          <p className="text-xs text-[#64748B] mt-0.5">
            Real-time calibrated cylinder track &amp; step-by-step physical seek trajectory
          </p>
        </div>

        {/* Live Telemetry Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mono-num">
          <div className="px-3 py-1.5 rounded-lg bg-[#F1F5FB] border border-[#E5EAF2]">
            <div className="text-[10px] text-[#64748B] uppercase font-sans font-medium">
              Head Pos
            </div>
            <div className="text-sm font-bold text-[#2563EB]" data-testid="telemetry-head-pos">
              {isValid ? currentHead : '—'}
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#F1F5FB] border border-[#E5EAF2]">
            <div className="text-[10px] text-[#64748B] uppercase font-sans font-medium">
              Next Target
            </div>
            <div className="text-sm font-bold text-[#172B4D]" data-testid="telemetry-next-target">
              {!isValid
                ? '—'
                : snapshot?.nextDestination !== null && snapshot?.nextDestination !== undefined
                  ? snapshot.nextDestination
                  : 'Done'}
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#F1F5FB] border border-[#E5EAF2]">
            <div className="text-[10px] text-[#64748B] uppercase font-sans font-medium">
              Step Seek
            </div>
            <div className="text-sm font-bold text-[#10B981]" data-testid="telemetry-step-seek">
              {!isValid
                ? '—'
                : snapshot?.lastEvent
                  ? `+${snapshot.lastEvent.distance}`
                  : snapshot?.nextEvent
                    ? `next +${snapshot.nextEvent.distance}`
                    : '0'}
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-[#F1F5FB] border border-[#E5EAF2]">
            <div className="text-[10px] text-[#64748B] uppercase font-sans font-medium">
              Direction
            </div>
            <div className="text-sm font-bold text-[#172B4D]">{activeDirectionLabel}</div>
          </div>
        </div>
      </div>

      {/* Main SVG Visualization Canvas */}
      <div className="p-4 sm:p-5 bg-[#F7F9FC]/70">
        {!isValid || !result ? (
          <div className="bg-white rounded-xl border border-[#E5EAF2] p-10 text-center">
            <p className="text-sm font-semibold text-[#172B4D]">
              Fix configuration validation errors above to visualize disk scheduling.
            </p>
            <p className="text-xs text-[#64748B] mt-1">
              Ensure cylinder count is positive and all head/request coordinates are within range.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-[#E5EAF2] p-4 sm:p-5">
            <div className="overflow-x-auto">
              <div className="min-w-[740px]">
                <svg
                  className="w-full overflow-visible"
                  viewBox={`0 0 ${SVG_WIDTH} ${svgHeight}`}
                  role="img"
                  aria-label={`Disk scheduling track visualization for ${result.algorithmName}`}
                >
                  <defs>
                    <marker
                      id="df-arrow-blue"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="5.5"
                      markerHeight="5.5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#2563EB" />
                    </marker>
                    <marker
                      id="df-arrow-amber"
                      viewBox="0 0 10 10"
                      refX="7"
                      refY="5"
                      markerWidth="5.5"
                      markerHeight="5.5"
                      orient="auto-start-reverse"
                    >
                      <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#F59E0B" />
                    </marker>
                  </defs>

                  {/* Physical Boundary Plates (0 and Max) */}
                  {[0, maxCylinder].map((boundary) => {
                    const bx = xFor(boundary);
                    const hit = visitedBoundaries.has(boundary);
                    return (
                      <g key={`boundary-${boundary}`}>
                        <line
                          x1={bx}
                          y1={TRACK_Y - 14}
                          x2={bx}
                          y2={svgHeight - 16}
                          stroke={hit ? '#F59E0B' : '#E5EAF2'}
                          strokeWidth={hit ? 1.5 : 1}
                          strokeDasharray="3 4"
                          opacity={hit ? 0.7 : 0.9}
                        />
                        <rect
                          x={bx - 4}
                          y={TRACK_Y - 12}
                          width={8}
                          height={24}
                          rx={2}
                          fill={hit ? '#FFFBEB' : '#F1F5FB'}
                          stroke={hit ? '#F59E0B' : '#CBD5E1'}
                          strokeWidth={1.6}
                        />
                      </g>
                    );
                  })}

                  {/* Main Cylinder Track Bar */}
                  <line
                    x1={TRACK_LEFT}
                    y1={TRACK_Y}
                    x2={TRACK_RIGHT}
                    y2={TRACK_Y}
                    stroke="#CBD5E1"
                    strokeWidth={3}
                    strokeLinecap="round"
                  />

                  {/* Scale Tick Marks */}
                  {ticks.map((t) => {
                    const tx = xFor(t);
                    const isEdge = t === 0 || t === maxCylinder;
                    return (
                      <g key={`tick-${t}`}>
                        <line
                          x1={tx}
                          y1={TRACK_Y - 5}
                          x2={tx}
                          y2={TRACK_Y + 6}
                          stroke={isEdge ? '#F59E0B' : '#94A3B8'}
                          strokeWidth={isEdge ? 1.8 : 1.2}
                        />
                        <text
                          x={tx}
                          y={TRACK_Y + 21}
                          textAnchor="middle"
                          className="mono-num"
                          fontSize="10"
                          fontWeight={isEdge ? 700 : 500}
                          fill={isEdge ? '#D97706' : '#64748B'}
                        >
                          {t}
                        </text>
                      </g>
                    );
                  })}

                  {/* Initial Head Position Marker (Blue Outline Circle + Vertical Guide) */}
                  <g>
                    <line
                      x1={initialHeadX}
                      y1={TRACK_Y}
                      x2={initialHeadX}
                      y2={trajectoryTop}
                      stroke="#2563EB"
                      strokeWidth={1.2}
                      strokeDasharray="3 3"
                      opacity={0.45}
                    />
                    <circle
                      cx={initialHeadX}
                      cy={TRACK_Y}
                      r={6.5}
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth={2.2}
                    />
                  </g>

                  {/* Request Markers on Track (Pending = slate blue-grey, Serviced = emerald green) */}
                  {requestGroups.map((group) => {
                    const isAbove = group.labelPlacement === 'above';
                    const labelY = isAbove ? TRACK_Y - 22 : TRACK_Y + 38;
                    const connectorY1 = isAbove ? TRACK_Y - 7 : TRACK_Y + 7;
                    const connectorY2 = isAbove ? TRACK_Y - 14 : TRACK_Y + 28;
                    const labelText =
                      group.totalCount > 1
                        ? `${group.cylinder} ×${group.totalCount}`
                        : `${group.cylinder}`;

                    return (
                      <g key={`req-group-${group.cylinder}`}>
                        <line
                          x1={group.x}
                          y1={connectorY1}
                          x2={group.x}
                          y2={connectorY2}
                          stroke={group.allServiced ? '#10B981' : '#CBD5E1'}
                          strokeWidth={1.1}
                        />
                        <circle
                          cx={group.x}
                          cy={TRACK_Y}
                          r={5}
                          fill={group.allServiced ? '#10B981' : '#94A3B8'}
                          stroke="#FFFFFF"
                          strokeWidth={1.6}
                        />
                        <text
                          x={group.x}
                          y={labelY}
                          textAnchor="middle"
                          className="mono-num"
                          fontSize="10.5"
                          fontWeight={group.allServiced ? 700 : 600}
                          fill={group.allServiced ? '#059669' : '#475569'}
                        >
                          {labelText}
                        </text>
                      </g>
                    );
                  })}

                  {/* Planned Future Trajectory (subtle faint ghost line for context) */}
                  {result.events.length > 0 && (
                    <g opacity={0.18}>
                      {result.events.map((ev, idx) => {
                        const x1 = xFor(ev.previousPosition);
                        const x2 = xFor(ev.currentPosition);
                        const y1 = trajectoryTop + idx * rowStep;
                        const y2 = trajectoryTop + (idx + 1) * rowStep;
                        return (
                          <line
                            key={`ghost-${ev.step}`}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="#64748B"
                            strokeWidth={1.5}
                            strokeDasharray={ev.eventType === 'CIRCULAR_JUMP' ? '5 4' : undefined}
                          />
                        );
                      })}
                    </g>
                  )}

                  {/* Active Completed Trajectory */}
                  <g>
                    {/* Start node at Step 0 */}
                    <circle
                      cx={initialHeadX}
                      cy={trajectoryTop}
                      r={4.5}
                      fill="#FFFFFF"
                      stroke="#2563EB"
                      strokeWidth={2}
                    />

                    {completedEvents.map((ev, idx) => {
                      const x1 = xFor(ev.previousPosition);
                      const x2 = xFor(ev.currentPosition);
                      const y1 = trajectoryTop + idx * rowStep;
                      const y2 = trajectoryTop + (idx + 1) * rowStep;
                      const isJump = ev.eventType === 'CIRCULAR_JUMP';
                      const isBoundary = ev.eventType === 'BOUNDARY';
                      const isLatest = idx === completedEvents.length - 1;

                      const strokeColor = isBoundary ? '#F59E0B' : '#2563EB';
                      const nodeFill = isBoundary
                        ? '#F59E0B'
                        : isJump
                          ? '#2563EB'
                          : '#10B981';

                      const midX = (x1 + x2) / 2;
                      const midY = (y1 + y2) / 2;

                      return (
                        <g key={`step-path-${ev.step}`}>
                          <motion.line
                            initial={{ pathLength: 0, opacity: 0.4 }}
                            animate={{ pathLength: 1, opacity: 1 }}
                            transition={{ duration: transitionDuration, ease: 'easeOut' }}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke={strokeColor}
                            strokeWidth={isLatest ? 2.5 : 2}
                            strokeDasharray={isJump ? '6 4' : undefined}
                            markerEnd={
                              isBoundary ? 'url(#df-arrow-amber)' : 'url(#df-arrow-blue)'
                            }
                          />

                          {/* Step distance pill along segment */}
                          {Math.abs(x2 - x1) >= 26 && (
                            <text
                              x={midX}
                              y={midY - 4}
                              textAnchor="middle"
                              className="mono-num"
                              fontSize="9.5"
                              fontWeight={600}
                              fill={isBoundary ? '#B45309' : isJump ? '#2563EB' : '#475569'}
                            >
                              S{ev.step} (+{ev.distance})
                            </text>
                          )}

                          {/* Endpoint Node */}
                          <circle
                            cx={x2}
                            cy={y2}
                            r={isLatest ? 5 : 4}
                            fill={nodeFill}
                            stroke="#FFFFFF"
                            strokeWidth={1.6}
                          />

                          {/* Endpoint Cylinder Label */}
                          <text
                            x={x2 + (x2 >= x1 ? 8 : -8)}
                            y={y2 + 3.5}
                            textAnchor={x2 >= x1 ? 'start' : 'end'}
                            className="mono-num"
                            fontSize="9.5"
                            fontWeight={isLatest ? 700 : 500}
                            fill={isBoundary ? '#B45309' : '#172B4D'}
                          >
                            {ev.currentPosition}
                          </text>
                        </g>
                      );
                    })}
                  </g>

                  {/* Animated Active Read/Write Head Marker */}
                  <motion.g
                    animate={{ x: headX }}
                    transition={{
                      type: 'spring',
                      stiffness: 240,
                      damping: 26,
                      mass: 0.7,
                    }}
                  >
                    {/* Vertical live laser beam down to active step */}
                    <line
                      x1={0}
                      y1={TRACK_Y}
                      x2={0}
                      y2={trajectoryTop + completedEvents.length * rowStep}
                      stroke="#2563EB"
                      strokeWidth={1.5}
                      strokeDasharray="2 3"
                      opacity={0.45}
                    />
                    {/* Halo Ring */}
                    <circle cx={0} cy={TRACK_Y} r={11} fill="#2563EB" opacity={0.16} />
                    {/* Core Head Dot */}
                    <circle
                      cx={0}
                      cy={TRACK_Y}
                      r={6.5}
                      fill="#2563EB"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                    {/* Floating Head Position Pill */}
                    <g transform={`translate(0, ${TRACK_Y - 46})`}>
                      <rect
                        x={-22}
                        y={-12}
                        width={44}
                        height={21}
                        rx={5}
                        fill="#172B4D"
                      />
                      <polygon points="-4,9 4,9 0,14" fill="#172B4D" />
                      <text
                        x={0}
                        y={2.5}
                        textAnchor="middle"
                        className="mono-num"
                        fontSize="11"
                        fontWeight={700}
                        fill="#FFFFFF"
                      >
                        {currentHead}
                      </text>
                    </g>
                  </motion.g>
                </svg>
              </div>
            </div>

            {/* Empty Queue Helper Banner */}
            {result.originalQueue.length === 0 && (
              <div className="mt-2 px-3 py-2 rounded-lg bg-[#F7F9FC] border border-[#E5EAF2] text-xs text-[#64748B] text-center">
                No disk requests in queue. Add cylinders above to animate head movement.
              </div>
            )}

            {/* Compact Legend */}
            <div className="mt-4 pt-3 border-t border-[#E5EAF2] flex flex-wrap items-center justify-between text-xs text-[#64748B] gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full border-2 border-[#2563EB] bg-white inline-block" />
                  <span>Initial Head ({result.initialHead})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#2563EB] ring-2 ring-[#2563EB]/25 inline-block" />
                  <span className="font-medium text-[#172B4D]">Current Head</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] inline-block" />
                  <span>Pending Request</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] inline-block" />
                  <span>Serviced Request</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#F59E0B] inline-block" />
                  <span>Boundary Event (0 / {maxCylinder})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-0 border-t-2 border-dashed border-[#2563EB] inline-block" />
                  <span>Circular Jump</span>
                </div>
              </div>
              <div className="text-[11px] text-[#94A3B8] mono-num">
                Track Span: 0–{maxCylinder} Cylinders
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Integrated Simulation Controls */}
      <SimulationControls
        status={status}
        currentStep={snapshot?.step ?? 0}
        totalSteps={result?.events.length ?? 0}
        speedMs={speedMs}
        disabled={!isValid || !result || result.events.length === 0}
        onStart={onStart}
        onPause={onPause}
        onResume={onResume}
        onPrevStep={onPrevStep}
        onNextStep={onNextStep}
        onReset={onReset}
        onReplay={onReplay}
        onChangeSpeed={onChangeSpeed}
      />
    </section>
  );
}

