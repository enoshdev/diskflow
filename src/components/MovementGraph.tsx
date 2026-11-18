import { useState } from 'react';
import { ExecutionEvent, SimulationResult } from '../engine/executionTypes';
import { StepSnapshot } from '../engine/simulationEngine';
import { getTickMarks } from '../utils/calculations';

interface MovementGraphProps {
  result: SimulationResult | null;
  snapshot: StepSnapshot | null;
}

interface ChartPoint {
  step: number;
  cylinder: number;
  previousPosition: number | null;
  distance: number;
  event: ExecutionEvent | null;
}

const CHART_W = 620;
const CHART_H = 260;
const PAD_LEFT = 46;
const PAD_RIGHT = 24;
const PAD_TOP = 20;
const PAD_BOTTOM = 34;

export function MovementGraph({ result, snapshot }: MovementGraphProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  if (!result || !snapshot) {
    return (
      <div className="bg-white rounded-xl border border-[#E5EAF2] p-5 shadow-subtle flex items-center justify-center min-h-[320px] text-xs text-[#64748B]">
        Configure valid disk parameters to render the movement graph.
      </div>
    );
  }

  const maxCylinder = Math.max(1, result.maxCylinder);
  const totalSteps = Math.max(1, result.events.length);
  const activeStep = snapshot.step;

  const allPoints: ChartPoint[] = [
    {
      step: 0,
      cylinder: result.initialHead,
      previousPosition: null,
      distance: 0,
      event: null,
    },
    ...result.events.map((ev) => ({
      step: ev.step,
      cylinder: ev.currentPosition,
      previousPosition: ev.previousPosition,
      distance: ev.distance,
      event: ev,
    })),
  ];

  const visiblePoints = allPoints.slice(0, activeStep + 1);

  const plotW = CHART_W - PAD_LEFT - PAD_RIGHT;
  const plotH = CHART_H - PAD_TOP - PAD_BOTTOM;

  const xForStep = (step: number) => {
    if (result.events.length === 0) return PAD_LEFT + plotW / 2;
    return PAD_LEFT + (step / totalSteps) * plotW;
  };

  const yForCylinder = (cyl: number) => {
    const ratio = Math.max(0, Math.min(1, cyl / maxCylinder));
    return PAD_TOP + plotH - ratio * plotH;
  };

  const yTicks = getTickMarks(result.maxCylinder).filter((_, idx, arr) => {
    if (arr.length <= 6) return true;
    return idx === 0 || idx === arr.length - 1 || idx % 2 === 0;
  });

  // Decide x-axis label stride so long queues stay legible
  const xLabelStride = totalSteps > 16 ? Math.ceil(totalSteps / 10) : 1;

  const hoveredPoint =
    hoveredStep !== null ? allPoints.find((p) => p.step === hoveredStep) ?? null : null;

  return (
    <div className="bg-white rounded-xl border border-[#E5EAF2] p-5 shadow-subtle flex flex-col justify-between">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#172B4D]">
              Head Movement vs Execution Step
            </h3>
            <p className="text-xs text-[#64748B]">
              Cartesian trace showing cylinder position across discrete execution steps
            </p>
          </div>
          <span className="text-[11px] mono-num px-2.5 py-0.5 rounded bg-[#EFF6FF] text-[#2563EB] border border-[#2563EB]/20 font-medium">
            Y: Cylinder (0–{result.maxCylinder}) · X: Step
          </span>
        </div>

        {/* Bright White Chart Frame with Subtle Blue Gridlines */}
        <div className="relative bg-white rounded-lg p-2.5 border border-[#E5EAF2]">
          <svg
            className="w-full h-[250px] overflow-visible"
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            role="img"
            aria-label="Disk head movement line chart"
          >
            {/* Horizontal subtle blue gridlines */}
            {yTicks.map((val) => {
              const y = yForCylinder(val);
              return (
                <g key={`y-grid-${val}`}>
                  <line
                    x1={PAD_LEFT}
                    y1={y}
                    x2={CHART_W - PAD_RIGHT}
                    y2={y}
                    stroke="#DBEAFE"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD_LEFT - 8}
                    y={y + 3.5}
                    textAnchor="end"
                    className="mono-num"
                    fontSize="10"
                    fill="#64748B"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* Vertical subtle gridlines & X-axis labels */}
            {allPoints.map((pt) => {
              const x = xForStep(pt.step);
              const showLabel =
                pt.step === 0 ||
                pt.step === result.events.length ||
                pt.step % xLabelStride === 0;
              return (
                <g key={`x-grid-${pt.step}`}>
                  <line
                    x1={x}
                    y1={PAD_TOP}
                    x2={x}
                    y2={CHART_H - PAD_BOTTOM}
                    stroke="#EFF6FF"
                    strokeWidth={1}
                  />
                  {showLabel && (
                    <text
                      x={x}
                      y={CHART_H - PAD_BOTTOM + 16}
                      textAnchor="middle"
                      className="mono-num"
                      fontSize="10"
                      fill={pt.step === activeStep ? '#2563EB' : '#64748B'}
                      fontWeight={pt.step === activeStep ? 700 : 400}
                    >
                      S{pt.step}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Axes */}
            <line
              x1={PAD_LEFT}
              y1={CHART_H - PAD_BOTTOM}
              x2={CHART_W - PAD_RIGHT}
              y2={CHART_H - PAD_BOTTOM}
              stroke="#CBD5E1"
              strokeWidth={1.2}
            />
            <line
              x1={PAD_LEFT}
              y1={PAD_TOP}
              x2={PAD_LEFT}
              y2={CHART_H - PAD_BOTTOM}
              stroke="#CBD5E1"
              strokeWidth={1.2}
            />

            {/* Faint full-path preview for upcoming steps */}
            {allPoints.length > 1 && (
              <g opacity={0.2}>
                {allPoints.slice(1).map((pt, idx) => {
                  const prev = allPoints[idx];
                  return (
                    <line
                      key={`preview-seg-${pt.step}`}
                      x1={xForStep(prev.step)}
                      y1={yForCylinder(prev.cylinder)}
                      x2={xForStep(pt.step)}
                      y2={yForCylinder(pt.cylinder)}
                      stroke="#94A3B8"
                      strokeWidth={1.5}
                      strokeDasharray={
                        pt.event?.eventType === 'CIRCULAR_JUMP' ? '5 4' : undefined
                      }
                    />
                  );
                })}
              </g>
            )}

            {/* Active Executed Path Segments */}
            {visiblePoints.slice(1).map((pt, idx) => {
              const prev = visiblePoints[idx];
              const isJump = pt.event?.eventType === 'CIRCULAR_JUMP';
              const isBoundary = pt.event?.eventType === 'BOUNDARY';
              return (
                <line
                  key={`active-seg-${pt.step}`}
                  x1={xForStep(prev.step)}
                  y1={yForCylinder(prev.cylinder)}
                  x2={xForStep(pt.step)}
                  y2={yForCylinder(pt.cylinder)}
                  stroke={isBoundary ? '#F59E0B' : '#2563EB'}
                  strokeWidth={2.2}
                  strokeDasharray={isJump ? '6 4' : undefined}
                />
              );
            })}

            {/* Data Points + Interactive Hover Targets */}
            {visiblePoints.map((pt) => {
              const x = xForStep(pt.step);
              const y = yForCylinder(pt.cylinder);
              const isCurrent = pt.step === activeStep;
              const isStart = pt.step === 0;
              const isBoundary = pt.event?.eventType === 'BOUNDARY';
              const isJump = pt.event?.eventType === 'CIRCULAR_JUMP';
              const isHovered = hoveredStep === pt.step;

              const fillColor = isStart
                ? '#FFFFFF'
                : isBoundary
                  ? '#F59E0B'
                  : isJump
                    ? '#2563EB'
                    : '#10B981';

              return (
                <g
                  key={`pt-${pt.step}`}
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredStep(pt.step)}
                  onMouseLeave={() => setHoveredStep(null)}
                >
                  {isCurrent && (
                    <circle
                      cx={x}
                      cy={y}
                      r={9}
                      fill="#2563EB"
                      opacity={0.16}
                    />
                  )}
                  <circle
                    cx={x}
                    cy={y}
                    r={isHovered || isCurrent ? 5.5 : 4.2}
                    fill={fillColor}
                    stroke={isStart ? '#2563EB' : '#FFFFFF'}
                    strokeWidth={isStart ? 2.2 : 1.6}
                  />
                  {/* Cylinder value label above point when not crowded */}
                  {totalSteps <= 14 && (
                    <text
                      x={x}
                      y={y - 9}
                      textAnchor="middle"
                      className="mono-num"
                      fontSize="9.5"
                      fontWeight={isCurrent ? 700 : 600}
                      fill={isBoundary ? '#B45309' : '#172B4D'}
                    >
                      {pt.cylinder}
                    </text>
                  )}
                  {/* Invisible wider hit area for smooth tooltip */}
                  <circle cx={x} cy={y} r={14} fill="transparent" />
                </g>
              );
            })}
          </svg>

          {/* Interactive Tooltip */}
          {hoveredPoint && (
            <div
              className="pointer-events-none absolute top-3 right-3 bg-[#172B4D] text-white rounded-lg px-3 py-2 text-[11px] shadow-elevated z-10 min-w-[175px]"
              role="tooltip"
            >
              <div className="flex items-center justify-between gap-3 border-b border-white/15 pb-1 mb-1">
                <span className="font-semibold">
                  {hoveredPoint.step === 0 ? 'Initial State (S0)' : `Step #${hoveredPoint.step}`}
                </span>
                <span className="mono-num text-[#93C5FD] font-bold">
                  Cyl {hoveredPoint.cylinder}
                </span>
              </div>
              {hoveredPoint.step === 0 ? (
                <div className="text-slate-300">Initial disk head position</div>
              ) : (
                <div className="space-y-0.5 mono-num">
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-300 font-sans">Previous:</span>
                    <span>{hoveredPoint.previousPosition}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-300 font-sans">Current:</span>
                    <span>{hoveredPoint.cylinder}</span>
                  </div>
                  <div className="flex justify-between gap-3">
                    <span className="text-slate-300 font-sans">Movement:</span>
                    <span className="text-[#34D399] font-semibold">
                      +{hoveredPoint.distance} cyl
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300 font-sans pt-0.5">
                    {hoveredPoint.event?.label}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend Footer */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-[#64748B] pt-3 mt-3 border-t border-[#E5EAF2] gap-2">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3.5 h-0.5 bg-[#2563EB] inline-block" />
            <span>Seek Path</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-4 h-0 border-t-2 border-dashed border-[#2563EB] inline-block" />
            <span>Circular Jump</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#F59E0B] inline-block" />
            <span>Boundary</span>
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#10B981] inline-block" />
            <span>Serviced</span>
          </span>
        </div>
        <span className="text-[#94A3B8]">Hover any point for step details</span>
      </div>
    </div>
  );
}

