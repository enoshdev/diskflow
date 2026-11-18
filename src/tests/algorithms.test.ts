import { describe, expect, it } from 'vitest';
import { runCLOOK } from '../algorithms/clook';
import { runCSCAN } from '../algorithms/cscan';
import { runFCFS } from '../algorithms/fcfs';
import { runLOOK } from '../algorithms/look';
import { runSCAN } from '../algorithms/scan';
import { runSSTF } from '../algorithms/sstf';
import {
  AlgorithmId,
  DiskConfiguration,
  SimulationResult,
} from '../engine/executionTypes';
import {
  compareAllAlgorithms,
  executeAlgorithm,
  getStepSnapshot,
} from '../engine/simulationEngine';
import { ALGORITHM_ORDER } from '../utils/calculations';
import {
  DEFAULT_CONFIG,
  parseRequestQueueString,
  validateConfiguration,
} from '../utils/validation';

function assertResultInvariants(result: SimulationResult, config: DiskConfiguration) {
  const maxCylinder = config.totalCylinders - 1;

  // 1. Every request occurrence is serviced exactly once (multiset equality)
  const expectedSorted = [...config.requests].sort((a, b) => a - b);
  const actualSorted = [...result.serviceSequence].sort((a, b) => a - b);
  expect(actualSorted).toEqual(expectedSorted);

  // 2. Serviced request indices cover 0..N-1 with no duplicates
  const servicedIndices = result.events
    .map((e) => e.servicedRequestIndex)
    .filter((idx): idx is number => idx !== null);
  expect(servicedIndices.length).toBe(config.requests.length);
  expect(new Set(servicedIndices).size).toBe(config.requests.length);

  // 3. No invalid cylinder positions generated & step continuity holds
  let expectedPrev = config.initialHead;
  let runningSum = 0;
  for (let i = 0; i < result.events.length; i++) {
    const ev = result.events[i];
    expect(ev.step).toBe(i + 1);
    expect(ev.previousPosition).toBe(expectedPrev);
    expect(ev.currentPosition).toBeGreaterThanOrEqual(0);
    expect(ev.currentPosition).toBeLessThanOrEqual(maxCylinder);
    expect(ev.distance).toBe(Math.abs(ev.currentPosition - ev.previousPosition));
    runningSum += ev.distance;
    expect(ev.cumulativeMovement).toBe(runningSum);
    expectedPrev = ev.currentPosition;
  }

  // 4. Total movement matches sum of execution events
  expect(result.totalHeadMovement).toBe(runningSum);

  // 5. Average movement matches formula safely
  if (config.requests.length === 0) {
    expect(result.averageHeadMovement).toBe(0);
    expect(result.finalHeadPosition).toBe(config.initialHead);
  } else {
    expect(result.averageHeadMovement).toBe(
      Number((runningSum / config.requests.length).toFixed(2))
    );
    expect(result.finalHeadPosition).toBe(expectedPrev);
  }

  // 6. StepSnapshot consistency & Previous Step restoration
  for (let s = 0; s <= result.events.length; s++) {
    const snap = getStepSnapshot(result, s);
    expect(snap.step).toBe(s);
    expect(snap.servicedCount + snap.remainingCount).toBe(config.requests.length);
    if (s === 0) {
      expect(snap.currentHead).toBe(config.initialHead);
      expect(snap.cumulativeMovement).toBe(0);
    } else {
      expect(snap.currentHead).toBe(result.events[s - 1].currentPosition);
      expect(snap.cumulativeMovement).toBe(result.events[s - 1].cumulativeMovement);
    }
  }
}

describe('DiskFlow — Known Textbook Default Example (200 cyl, Head 53, RIGHT)', () => {
  it('FCFS produces exact textbook total movement = 640', () => {
    const res = runFCFS(DEFAULT_CONFIG);
    assertResultInvariants(res, DEFAULT_CONFIG);
    expect(res.serviceSequence).toEqual([98, 183, 37, 122, 14, 124, 65, 67]);
    expect(res.totalHeadMovement).toBe(640);
    expect(res.averageHeadMovement).toBe(80);
    expect(res.finalHeadPosition).toBe(67);
  });

  it('SSTF produces exact textbook total movement = 236', () => {
    const res = runSSTF(DEFAULT_CONFIG);
    assertResultInvariants(res, DEFAULT_CONFIG);
    expect(res.serviceSequence).toEqual([65, 67, 37, 14, 98, 122, 124, 183]);
    expect(res.totalHeadMovement).toBe(236);
    expect(res.averageHeadMovement).toBe(29.5);
    expect(res.finalHeadPosition).toBe(183);
  });

  it('SCAN (RIGHT) hits boundary 199 and produces exact total movement = 331', () => {
    const res = runSCAN(DEFAULT_CONFIG);
    assertResultInvariants(res, DEFAULT_CONFIG);
    expect(res.serviceSequence).toEqual([65, 67, 98, 122, 124, 183, 37, 14]);
    expect(res.boundaryEvents.length).toBe(1);
    expect(res.boundaryEvents[0].currentPosition).toBe(199);
    expect(res.totalHeadMovement).toBe(331);
    expect(res.averageHeadMovement).toBe(41.38);
    expect(res.finalHeadPosition).toBe(14);
  });

  it('SCAN (LEFT) hits boundary 0 and produces exact textbook total movement = 236', () => {
    const cfg: DiskConfiguration = { ...DEFAULT_CONFIG, direction: 'LEFT' };
    const res = runSCAN(cfg);
    assertResultInvariants(res, cfg);
    expect(res.serviceSequence).toEqual([37, 14, 65, 67, 98, 122, 124, 183]);
    expect(res.boundaryEvents.length).toBe(1);
    expect(res.boundaryEvents[0].currentPosition).toBe(0);
    expect(res.totalHeadMovement).toBe(236);
    expect(res.finalHeadPosition).toBe(183);
  });

  it('C-SCAN (RIGHT) counts boundary 199 and circular jump 199->0 for total = 382', () => {
    const res = runCSCAN(DEFAULT_CONFIG);
    assertResultInvariants(res, DEFAULT_CONFIG);
    expect(res.serviceSequence).toEqual([65, 67, 98, 122, 124, 183, 14, 37]);
    expect(res.boundaryEvents.length).toBe(1);
    expect(res.circularJumpEvents.length).toBe(1);
    expect(res.circularJumpEvents[0].previousPosition).toBe(199);
    expect(res.circularJumpEvents[0].currentPosition).toBe(0);
    expect(res.circularJumpEvents[0].distance).toBe(199);
    expect(res.totalHeadMovement).toBe(382);
    expect(res.finalHeadPosition).toBe(37);
  });

  it('LOOK (RIGHT) reverses at 183 without visiting boundary 199 for total = 299', () => {
    const res = runLOOK(DEFAULT_CONFIG);
    assertResultInvariants(res, DEFAULT_CONFIG);
    expect(res.serviceSequence).toEqual([65, 67, 98, 122, 124, 183, 37, 14]);
    expect(res.boundaryEvents.length).toBe(0);
    expect(res.totalHeadMovement).toBe(299);
    expect(res.finalHeadPosition).toBe(14);
  });

  it('C-LOOK (RIGHT) jumps directly 183->14 and counts circular jump for total = 322', () => {
    const res = runCLOOK(DEFAULT_CONFIG);
    assertResultInvariants(res, DEFAULT_CONFIG);
    expect(res.serviceSequence).toEqual([65, 67, 98, 122, 124, 183, 14, 37]);
    expect(res.boundaryEvents.length).toBe(0);
    expect(res.circularJumpEvents.length).toBe(1);
    expect(res.circularJumpEvents[0].previousPosition).toBe(183);
    expect(res.circularJumpEvents[0].currentPosition).toBe(14);
    expect(res.circularJumpEvents[0].distance).toBe(169);
    expect(res.totalHeadMovement).toBe(322);
    expect(res.finalHeadPosition).toBe(37);
  });
});

describe('DiskFlow — Edge Cases Across All 6 Algorithms', () => {
  const edgeCases: { name: string; config: DiskConfiguration }[] = [
    {
      name: 'Empty request queue',
      config: { totalCylinders: 200, initialHead: 53, requests: [], direction: 'RIGHT' },
    },
    {
      name: 'Single request',
      config: { totalCylinders: 200, initialHead: 50, requests: [120], direction: 'LEFT' },
    },
    {
      name: 'Duplicate requests (including at initial head)',
      config: {
        totalCylinders: 200,
        initialHead: 53,
        requests: [53, 53, 98, 98, 14, 14, 14],
        direction: 'RIGHT',
      },
    },
    {
      name: 'All requests on the left (RIGHT direction)',
      config: {
        totalCylinders: 200,
        initialHead: 150,
        requests: [10, 45, 90, 120],
        direction: 'RIGHT',
      },
    },
    {
      name: 'All requests on the right (LEFT direction)',
      config: {
        totalCylinders: 200,
        initialHead: 20,
        requests: [60, 110, 175, 190],
        direction: 'LEFT',
      },
    },
    {
      name: 'Head starts at cylinder 0 (LEFT)',
      config: {
        totalCylinders: 200,
        initialHead: 0,
        requests: [0, 45, 120, 199],
        direction: 'LEFT',
      },
    },
    {
      name: 'Head starts at maximum cylinder 199 (RIGHT)',
      config: {
        totalCylinders: 200,
        initialHead: 199,
        requests: [199, 150, 20, 0],
        direction: 'RIGHT',
      },
    },
    {
      name: 'Large disk size (1000 cylinders)',
      config: {
        totalCylinders: 1000,
        initialHead: 420,
        requests: [950, 12, 600, 420, 310, 888, 5],
        direction: 'LEFT',
      },
    },
    {
      name: 'Tiny disk size (1 cylinder, only 0)',
      config: {
        totalCylinders: 1,
        initialHead: 0,
        requests: [0, 0],
        direction: 'RIGHT',
      },
    },
    {
      name: 'Equal-distance SSTF requests',
      config: {
        totalCylinders: 200,
        initialHead: 50,
        requests: [60, 40, 70, 30],
        direction: 'RIGHT',
      },
    },
  ];

  for (const tc of edgeCases) {
    for (const algoId of ALGORITHM_ORDER) {
      it(`${algoId}: handles "${tc.name}" accurately`, () => {
        const res = executeAlgorithm(algoId, tc.config);
        assertResultInvariants(res, tc.config);
      });
    }
  }

  it('SSTF deterministic tie-breaking selects lower cylinder on equal distance', () => {
    const cfg: DiskConfiguration = {
      totalCylinders: 200,
      initialHead: 50,
      requests: [60, 40],
      direction: 'RIGHT',
    };
    const res = runSSTF(cfg);
    expect(res.serviceSequence).toEqual([40, 60]);
    expect(res.totalHeadMovement).toBe(30); // |40-50| + |60-40|
  });

  it('Initial head matching a request is treated as zero-distance service event', () => {
    const cfg: DiskConfiguration = {
      totalCylinders: 200,
      initialHead: 53,
      requests: [53, 80],
      direction: 'RIGHT',
    };
    for (const algoId of ALGORITHM_ORDER) {
      const res = executeAlgorithm(algoId, cfg);
      expect(res.events[0].distance).toBe(0);
      expect(res.events[0].currentPosition).toBe(53);
      expect(res.events[0].servicedRequestIndex).toBe(0);
      assertResultInvariants(res, cfg);
    }
  });

  it('C-SCAN (LEFT) wraps from 0 to maxCylinder and counts full circular jump', () => {
    const cfg: DiskConfiguration = {
      totalCylinders: 200,
      initialHead: 53,
      requests: [98, 183, 37, 122, 14, 124, 65, 67],
      direction: 'LEFT',
    };
    const res = runCSCAN(cfg);
    assertResultInvariants(res, cfg);
    expect(res.serviceSequence).toEqual([37, 14, 183, 124, 122, 98, 67, 65]);
    expect(res.boundaryEvents.length).toBe(1);
    expect(res.boundaryEvents[0].currentPosition).toBe(0);
    expect(res.circularJumpEvents.length).toBe(1);
    expect(res.circularJumpEvents[0].previousPosition).toBe(0);
    expect(res.circularJumpEvents[0].currentPosition).toBe(199);
    // 53->0 (53) + 0->199 (199) + 199->65 (134) = 386
    expect(res.totalHeadMovement).toBe(386);
  });

  it('C-LOOK (LEFT) jumps directly from lowest left request to highest right request', () => {
    const cfg: DiskConfiguration = {
      totalCylinders: 200,
      initialHead: 53,
      requests: [98, 183, 37, 122, 14, 124, 65, 67],
      direction: 'LEFT',
    };
    const res = runCLOOK(cfg);
    assertResultInvariants(res, cfg);
    expect(res.serviceSequence).toEqual([37, 14, 183, 124, 122, 98, 67, 65]);
    expect(res.boundaryEvents.length).toBe(0);
    expect(res.circularJumpEvents.length).toBe(1);
    expect(res.circularJumpEvents[0].previousPosition).toBe(14);
    expect(res.circularJumpEvents[0].currentPosition).toBe(183);
    // 53->14 (39) + 14->183 (169) + 183->65 (118) = 326
    expect(res.totalHeadMovement).toBe(326);
  });
});

describe('DiskFlow — Previous Step Restoration & Comparison Engine', () => {
  it('Previous Step restores exact prior state at every transition', () => {
    const res = executeAlgorithm('CSCAN', DEFAULT_CONFIG);
    const snapStep5 = getStepSnapshot(res, 5);
    const snapStep6 = getStepSnapshot(res, 6);
    const restoredStep5 = getStepSnapshot(res, snapStep6.step - 1);

    expect(restoredStep5.currentHead).toBe(snapStep5.currentHead);
    expect(restoredStep5.cumulativeMovement).toBe(snapStep5.cumulativeMovement);
    expect(restoredStep5.servicedCount).toBe(snapStep5.servicedCount);
    expect(Array.from(restoredStep5.servicedIndices)).toEqual(
      Array.from(snapStep5.servicedIndices)
    );
  });

  it('compareAllAlgorithms ranks all 6 algorithms dynamically with accurate optimal flag', () => {
    const comparison = compareAllAlgorithms(DEFAULT_CONFIG);
    expect(comparison.length).toBe(6);
    expect(comparison[0].result.algorithmId).toBe('SSTF');
    expect(comparison[0].result.totalHeadMovement).toBe(236);
    expect(comparison[0].isOptimal).toBe(true);
    expect(comparison[5].result.algorithmId).toBe('FCFS');
    expect(comparison[5].result.totalHeadMovement).toBe(640);
  });

  it('Validation catches invalid disk size, out-of-bounds head, and invalid requests', () => {
    expect(
      validateConfiguration({
        totalCylinders: 0,
        initialHead: 0,
        requests: [],
        direction: 'RIGHT',
      }).isValid
    ).toBe(false);

    expect(
      validateConfiguration({
        totalCylinders: 100,
        initialHead: 100,
        requests: [10],
        direction: 'RIGHT',
      }).isValid
    ).toBe(false);

    expect(parseRequestQueueString('10, abc, 20', 200).error).toBeDefined();
    expect(parseRequestQueueString('10, 250', 200).error).toBeDefined();
    expect(parseRequestQueueString('10, 20, 20, 0, 199', 200).requests).toEqual([
      10, 20, 20, 0, 199,
    ]);
  });
});

describe('DiskFlow — Randomized Property-Based Tests (All 6 Algorithms)', () => {
  // Deterministic PRNG for reproducible property tests
  let seed = 424242;
  const nextRand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };

  it('satisfies all movement, boundary, and request conservation invariants across 40 random configs', () => {
    const diskSizes = [10, 50, 100, 200, 500, 1000];

    for (let trial = 0; trial < 40; trial++) {
      const totalCylinders = diskSizes[Math.floor(nextRand() * diskSizes.length)];
      const initialHead = Math.floor(nextRand() * totalCylinders);
      const count = Math.floor(nextRand() * 18); // includes 0, 1, many
      const requests = Array.from({ length: count }, () =>
        Math.floor(nextRand() * totalCylinders)
      );
      const direction = nextRand() < 0.5 ? 'LEFT' : 'RIGHT';

      const config: DiskConfiguration = {
        totalCylinders,
        initialHead,
        requests,
        direction,
      };

      for (const algoId of ALGORITHM_ORDER as AlgorithmId[]) {
        const res = executeAlgorithm(algoId, config);
        assertResultInvariants(res, config);

        // LOOK must never generate boundary events or circular jumps
        if (algoId === 'LOOK') {
          expect(res.boundaryEvents.length).toBe(0);
          expect(res.circularJumpEvents.length).toBe(0);
        }
        // C-LOOK must never generate boundary events
        if (algoId === 'CLOOK') {
          expect(res.boundaryEvents.length).toBe(0);
        }
        // FCFS must preserve exact arrival order
        if (algoId === 'FCFS') {
          expect(res.serviceSequence).toEqual(requests);
        }
      }
    }
  });
});

