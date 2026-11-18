export type AlgorithmId = 'FCFS' | 'SSTF' | 'SCAN' | 'CSCAN' | 'LOOK' | 'CLOOK';

export type Direction = 'LEFT' | 'RIGHT';

export type EventType = 'SERVICE' | 'BOUNDARY' | 'CIRCULAR_JUMP';

export type SimulationStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'COMPLETED';

export interface DiskConfiguration {
  totalCylinders: number;
  initialHead: number;
  requests: number[];
  direction: Direction;
}

export interface ExecutionEvent {
  step: number;
  previousPosition: number;
  currentPosition: number;
  distance: number;
  cumulativeMovement: number;
  eventType: EventType;
  direction: Direction | 'NONE';
  servicedRequestIndex: number | null;
  label: string;
}

export interface SimulationResult {
  algorithmId: AlgorithmId;
  algorithmName: string;
  shortName: string;
  directionUsed: Direction | null;
  totalCylinders: number;
  minCylinder: number;
  maxCylinder: number;
  initialHead: number;
  originalQueue: number[];
  serviceSequence: number[];
  headPath: number[];
  events: ExecutionEvent[];
  movementDistances: number[];
  boundaryEvents: ExecutionEvent[];
  circularJumpEvents: ExecutionEvent[];
  totalHeadMovement: number;
  averageHeadMovement: number;
  finalHeadPosition: number;
}

export interface AlgorithmMeta {
  id: AlgorithmId;
  name: string;
  shortName: string;
  subtitle: string;
  usesDirection: boolean;
  complexity: string;
  description: string;
  tradeoff: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: {
    totalCylinders?: string;
    initialHead?: string;
    requests?: string;
  };
}

