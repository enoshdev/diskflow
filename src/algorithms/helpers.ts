import {
  AlgorithmId,
  Direction,
  DiskConfiguration,
  EventType,
  ExecutionEvent,
  SimulationResult,
} from '../engine/executionTypes';
import {
  ALGORITHM_META,
  calculateAverageMovement,
  calculateTotalMovement,
  inferMoveDirection,
} from '../utils/calculations';

export class EventCollector {
  private events: ExecutionEvent[] = [];
  private cumulative = 0;

  push(params: {
    from: number;
    to: number;
    eventType: EventType;
    servicedRequestIndex: number | null;
    label?: string;
  }): void {
    const distance = Math.abs(params.to - params.from);
    this.cumulative += distance;
    const step = this.events.length + 1;
    const direction = inferMoveDirection(params.from, params.to);

    let label = params.label;
    if (!label) {
      if (params.eventType === 'SERVICE') {
        label = distance === 0 ? 'Serviced (Zero Seek)' : 'Serviced Request';
      } else if (params.eventType === 'BOUNDARY') {
        label = `Boundary Reached (${params.to})`;
      } else {
        label = `Circular Jump (${params.from} → ${params.to})`;
      }
    }

    this.events.push({
      step,
      previousPosition: params.from,
      currentPosition: params.to,
      distance,
      cumulativeMovement: this.cumulative,
      eventType: params.eventType,
      direction,
      servicedRequestIndex: params.servicedRequestIndex,
      label,
    });
  }

  getEvents(): ExecutionEvent[] {
    return this.events;
  }
}

export function buildSimulationResult(
  algorithmId: AlgorithmId,
  config: DiskConfiguration,
  events: ExecutionEvent[],
  directionUsed: Direction | null
): SimulationResult {
  const meta = ALGORITHM_META[algorithmId];
  const minCylinder = 0;
  const maxCylinder = Math.max(0, config.totalCylinders - 1);

  const serviceSequence: number[] = [];
  const headPath: number[] = [config.initialHead];
  const movementDistances: number[] = [];
  const boundaryEvents: ExecutionEvent[] = [];
  const circularJumpEvents: ExecutionEvent[] = [];

  for (const ev of events) {
    headPath.push(ev.currentPosition);
    movementDistances.push(ev.distance);
    if (ev.servicedRequestIndex !== null) {
      serviceSequence.push(ev.currentPosition);
    }
    if (ev.eventType === 'BOUNDARY') {
      boundaryEvents.push(ev);
    }
    if (ev.eventType === 'CIRCULAR_JUMP') {
      circularJumpEvents.push(ev);
    }
  }

  const totalHeadMovement = calculateTotalMovement(events);
  const averageHeadMovement = calculateAverageMovement(
    totalHeadMovement,
    serviceSequence.length
  );
  const finalHeadPosition =
    events.length > 0 ? events[events.length - 1].currentPosition : config.initialHead;

  return {
    algorithmId,
    algorithmName: meta.name,
    shortName: meta.shortName,
    directionUsed,
    totalCylinders: config.totalCylinders,
    minCylinder,
    maxCylinder,
    initialHead: config.initialHead,
    originalQueue: [...config.requests],
    serviceSequence,
    headPath,
    events,
    movementDistances,
    boundaryEvents,
    circularJumpEvents,
    totalHeadMovement,
    averageHeadMovement,
    finalHeadPosition,
  };
}

