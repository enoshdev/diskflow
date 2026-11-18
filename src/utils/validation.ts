import { DiskConfiguration, ValidationResult } from '../engine/executionTypes';

export const DEFAULT_CONFIG: DiskConfiguration = {
  totalCylinders: 200,
  initialHead: 53,
  requests: [98, 183, 37, 122, 14, 124, 65, 67],
  direction: 'RIGHT',
};

export interface SamplePreset {
  id: string;
  name: string;
  description: string;
  config: DiskConfiguration;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    id: 'textbook',
    name: 'Textbook Classic (Silberschatz)',
    description: '200 cylinders, Head 53, 8 classic requests',
    config: {
      totalCylinders: 200,
      initialHead: 53,
      requests: [98, 183, 37, 122, 14, 124, 65, 67],
      direction: 'RIGHT',
    },
  },
  {
    id: 'boundary-heavy',
    name: 'Boundary Extremes',
    description: '200 cylinders, Head 100, requests near edges 0 and 199',
    config: {
      totalCylinders: 200,
      initialHead: 100,
      requests: [195, 5, 199, 0, 120, 40, 185, 12],
      direction: 'LEFT',
    },
  },
  {
    id: 'large-disk',
    name: 'Large Disk (500 Cylinders)',
    description: '500 cylinders, Head 215, 10 mixed requests with duplicates',
    config: {
      totalCylinders: 500,
      initialHead: 215,
      requests: [45, 412, 215, 310, 88, 310, 490, 19, 265, 140],
      direction: 'RIGHT',
    },
  },
  {
    id: 'clustered',
    name: 'Clustered Workload',
    description: '100 cylinders, Head 50, tight cluster + distant outlier',
    config: {
      totalCylinders: 100,
      initialHead: 50,
      requests: [52, 48, 55, 46, 51, 95, 4, 53],
      direction: 'RIGHT',
    },
  },
];

export function parseRequestQueueString(
  raw: string,
  totalCylinders: number
): { requests: number[]; error?: string } {
  const trimmed = raw.trim();
  if (trimmed === '') {
    return { requests: [] };
  }

  const tokens = trimmed
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0);

  const maxCylinder = totalCylinders - 1;
  const parsed: number[] = [];

  for (const token of tokens) {
    if (!/^-?\d+$/.test(token)) {
      return {
        requests: [],
        error: `Invalid request "${token}". Every request must be an integer.`,
      };
    }
    const num = Number(token);
    if (!Number.isSafeInteger(num)) {
      return {
        requests: [],
        error: `Request "${token}" is out of safe integer range.`,
      };
    }
    if (totalCylinders >= 1 && (num < 0 || num > maxCylinder)) {
      return {
        requests: [],
        error: `Request ${num} is outside valid disk range [0, ${maxCylinder}].`,
      };
    }
    parsed.push(num);
  }

  return { requests: parsed };
}

export function validateConfiguration(config: DiskConfiguration): ValidationResult {
  const errors: ValidationResult['errors'] = {};

  if (!Number.isInteger(config.totalCylinders) || config.totalCylinders < 1) {
    errors.totalCylinders = 'Total disk cylinders must be a positive integer (>= 1).';
  } else if (config.totalCylinders > 100000) {
    errors.totalCylinders = 'Total disk cylinders must not exceed 100,000.';
  }

  const maxCylinder = Math.max(0, config.totalCylinders - 1);

  if (!Number.isInteger(config.initialHead)) {
    errors.initialHead = 'Initial head position must be an integer.';
  } else if (
    Number.isInteger(config.totalCylinders) &&
    config.totalCylinders >= 1 &&
    (config.initialHead < 0 || config.initialHead > maxCylinder)
  ) {
    errors.initialHead = `Initial head position must be between 0 and ${maxCylinder}.`;
  }

  for (let i = 0; i < config.requests.length; i++) {
    const req = config.requests[i];
    if (!Number.isInteger(req)) {
      errors.requests = `Request at position #${i + 1} is not a valid integer.`;
      break;
    }
    if (
      Number.isInteger(config.totalCylinders) &&
      config.totalCylinders >= 1 &&
      (req < 0 || req > maxCylinder)
    ) {
      errors.requests = `Request ${req} is outside disk boundaries [0, ${maxCylinder}].`;
      break;
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

export function generateRandomRequests(totalCylinders: number, count = 8): number[] {
  const maxCylinder = Math.max(0, totalCylinders - 1);
  return Array.from({ length: count }, () => Math.floor(Math.random() * (maxCylinder + 1)));
}

