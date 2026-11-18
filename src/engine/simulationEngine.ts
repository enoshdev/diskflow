import { runCLOOK } from '../algorithms/clook';
import { runCSCAN } from '../algorithms/cscan';
import { runFCFS } from '../algorithms/fcfs';
import { runLOOK } from '../algorithms/look';
import { runSCAN } from '../algorithms/scan';
import { runSSTF } from '../algorithms/sstf';
import { ALGORITHM_ORDER } from '../utils/calculations';
import { validateConfiguration } from '../utils/validation';
import {
  AlgorithmId,
  DiskConfiguration,
  ExecutionEvent,
  SimulationResult,
} from './executionTypes';

const RUNNERS: Record<AlgorithmId, (config: DiskConfiguration) => SimulationResult> = {
  FCFS: runFCFS,
  SSTF: runSSTF,
  SCAN: runSCAN,
  CSCAN: runCSCAN,
  LOOK: runLOOK,
  CLOOK: runCLOOK,
};

export function executeAlgorithm(
  algorithmId: AlgorithmId,
  config: DiskConfiguration
): SimulationResult {
  const validation = validateConfiguration(config);
  if (!validation.isValid) {
    const firstError = Object.values(validation.errors)[0] ?? 'Invalid disk configuration.';
    throw new Error(firstError);
  }
  return RUNNERS[algorithmId](config);
}

export interface ComparisonEntry {
  rank: number;
  isOptimal: boolean;
  result: SimulationResult;
}

export function compareAllAlgorithms(config: DiskConfiguration): ComparisonEntry[] {
  const results = ALGORITHM_ORDER.map((algoId) => executeAlgorithm(algoId, config));

  const sorted = [...results].sort(
    (a, b) =>
      a.totalHeadMovement - b.totalHeadMovement ||
      ALGORITHM_ORDER.indexOf(a.algorithmId) - ALGORITHM_ORDER.indexOf(b.algorithmId)
  );

  const minMovement = sorted.length > 0 ? sorted[0].totalHeadMovement : 0;

  let currentRank = 1;
  return sorted.map((result, idx) => {
    if (idx > 0 && result.totalHeadMovement > sorted[idx - 1].totalHeadMovement) {
      currentRank = idx + 1;
    }
    return {
      rank: currentRank,
      isOptimal: result.totalHeadMovement === minMovement,
      result,
    };
  });
}

export interface StepSnapshot {
  step: number;
  totalSteps: number;
  currentHead: number;
  nextDestination: number | null;
  lastEvent: ExecutionEvent | null;
  nextEvent: ExecutionEvent | null;
  completedEvents: ExecutionEvent[];
  servicedIndices: Set<number>;
  pendingIndices: Set<number>;
  servicedCount: number;
  remainingCount: number;
  cumulativeMovement: number;
  averageMovementSoFar: number;
}

/**
 * Pure deterministic projection of simulation state at any step index (0..result.events.length).
 * Guarantees Previous Step, Next Step, Reset, Pause, and Resume are always 100% consistent.
 */
export function getStepSnapshot(result: SimulationResult, step: number): StepSnapshot {
  const totalSteps = result.events.length;
  const clampedStep = Math.max(0, Math.min(step, totalSteps));
  const completedEvents = result.events.slice(0, clampedStep);
  const lastEvent = clampedStep > 0 ? result.events[clampedStep - 1] : null;
  const nextEvent = clampedStep < totalSteps ? result.events[clampedStep] : null;

  const currentHead = lastEvent ? lastEvent.currentPosition : result.initialHead;
  const nextDestination = nextEvent ? nextEvent.currentPosition : null;

  const servicedIndices = new Set<number>();
  for (const ev of completedEvents) {
    if (ev.servicedRequestIndex !== null) {
      servicedIndices.add(ev.servicedRequestIndex);
    }
  }

  const pendingIndices = new Set<number>();
  for (let i = 0; i < result.originalQueue.length; i++) {
    if (!servicedIndices.has(i)) {
      pendingIndices.add(i);
    }
  }

  const cumulativeMovement = lastEvent ? lastEvent.cumulativeMovement : 0;
  const servicedCount = servicedIndices.size;
  const remainingCount = pendingIndices.size;
  const averageMovementSoFar =
    servicedCount > 0 ? Number((cumulativeMovement / servicedCount).toFixed(2)) : 0;

  return {
    step: clampedStep,
    totalSteps,
    currentHead,
    nextDestination,
    lastEvent,
    nextEvent,
    completedEvents,
    servicedIndices,
    pendingIndices,
    servicedCount,
    remainingCount,
    cumulativeMovement,
    averageMovementSoFar,
  };
}

