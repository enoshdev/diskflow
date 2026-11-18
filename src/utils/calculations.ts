import { AlgorithmMeta, ExecutionEvent } from '../engine/executionTypes';

export const ALGORITHM_META: Record<AlgorithmMeta['id'], AlgorithmMeta> = {
  FCFS: {
    id: 'FCFS',
    name: 'First Come First Serve',
    shortName: 'FCFS',
    subtitle: 'First Come First Serve',
    usesDirection: false,
    complexity: 'O(N)',
    description:
      'Processes disk I/O requests strictly in their original arrival order without reordering the queue.',
    tradeoff: 'Simple and completely fair with zero starvation, but often causes wide head swings.',
  },
  SSTF: {
    id: 'SSTF',
    name: 'Shortest Seek Time First',
    shortName: 'SSTF',
    subtitle: 'Shortest Seek Time First',
    usesDirection: false,
    complexity: 'O(N²)',
    description:
      'Always selects the pending request closest to the current head position (ties break toward the lower cylinder).',
    tradeoff: 'Significantly reduces total head movement, though distant cylinders risk starvation.',
  },
  SCAN: {
    id: 'SCAN',
    name: 'SCAN (Elevator)',
    shortName: 'SCAN',
    subtitle: 'Elevator Algorithm',
    usesDirection: true,
    complexity: 'O(N log N)',
    description:
      'Sweeps in the chosen direction servicing requests until reaching the physical disk boundary, then reverses.',
    tradeoff: 'Eliminates starvation with predictable latency; travels to the disk edge before reversing.',
  },
  CSCAN: {
    id: 'CSCAN',
    name: 'C-SCAN (Circular SCAN)',
    shortName: 'C-SCAN',
    subtitle: 'Circular SCAN',
    usesDirection: true,
    complexity: 'O(N log N)',
    description:
      'Sweeps in one direction to the physical disk boundary, wraps circularly to the opposite boundary, and continues.',
    tradeoff: 'Delivers more uniform wait times than SCAN; includes full wraparound travel across the disk.',
  },
  LOOK: {
    id: 'LOOK',
    name: 'LOOK',
    shortName: 'LOOK',
    subtitle: 'Smart Elevator',
    usesDirection: true,
    complexity: 'O(N log N)',
    description:
      'Sweeps in the chosen direction and reverses immediately at the last pending request without visiting empty disk edges.',
    tradeoff: 'Improves on SCAN by avoiding redundant movement to physical disk boundaries.',
  },
  CLOOK: {
    id: 'CLOOK',
    name: 'C-LOOK (Circular LOOK)',
    shortName: 'C-LOOK',
    subtitle: 'Circular LOOK',
    usesDirection: true,
    complexity: 'O(N log N)',
    description:
      'Services requests in one direction, then jumps directly to the opposite extreme pending request and continues.',
    tradeoff: 'Combines uniform wait times of C-SCAN with LOOK’s avoidance of empty disk boundaries.',
  },
};

export const ALGORITHM_ORDER: AlgorithmMeta['id'][] = [
  'FCFS',
  'SSTF',
  'SCAN',
  'CSCAN',
  'LOOK',
  'CLOOK',
];

export interface RequestItem {
  cylinder: number;
  index: number;
}

export function toRequestItems(requests: number[]): RequestItem[] {
  return requests.map((cylinder, index) => ({ cylinder, index }));
}

export function inferMoveDirection(from: number, to: number): 'LEFT' | 'RIGHT' | 'NONE' {
  if (to > from) return 'RIGHT';
  if (to < from) return 'LEFT';
  return 'NONE';
}

export function calculateTotalMovement(events: ExecutionEvent[]): number {
  return events.reduce((acc, ev) => acc + ev.distance, 0);
}

export function calculateAverageMovement(totalMovement: number, servicedCount: number): number {
  if (servicedCount <= 0) return 0;
  return Number((totalMovement / servicedCount).toFixed(2));
}

export function formatNumber(value: number, decimals = 2): string {
  if (!Number.isFinite(value)) return '0';
  return value.toFixed(decimals);
}

export function getTickMarks(maxCylinder: number): number[] {
  if (maxCylinder <= 0) return [0];
  if (maxCylinder <= 10) {
    return Array.from({ length: maxCylinder + 1 }, (_, i) => i);
  }
  const desiredSteps = 8;
  const rawStep = maxCylinder / desiredSteps;
  const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
  const normalized = rawStep / magnitude;
  let niceStep = magnitude;
  if (normalized > 5) niceStep = 10 * magnitude;
  else if (normalized > 2.5) niceStep = 5 * magnitude;
  else if (normalized > 1.5) niceStep = 2.5 * magnitude;
  else if (normalized > 1) niceStep = 2 * magnitude;
  niceStep = Math.max(1, Math.round(niceStep));

  const ticks: number[] = [0];
  for (let v = niceStep; v < maxCylinder; v += niceStep) {
    if (maxCylinder - v >= niceStep * 0.35) {
      ticks.push(v);
    }
  }
  ticks.push(maxCylinder);
  return ticks;
}

