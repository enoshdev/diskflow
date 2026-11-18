import { DiskConfiguration, SimulationResult } from '../engine/executionTypes';
import { toRequestItems } from '../utils/calculations';
import { buildSimulationResult, EventCollector } from './helpers';

/**
 * SSTF (Shortest Seek Time First)
 * Repeatedly selects the nearest pending request to the current head position.
 * Deterministic tie-breaking: on equal distance, choose the lower cylinder number
 * (and if identical cylinders / duplicates, the earlier arrival index).
 */
export function runSSTF(config: DiskConfiguration): SimulationResult {
  const collector = new EventCollector();
  const pending = toRequestItems(config.requests);
  let current = config.initialHead;

  while (pending.length > 0) {
    let bestIdx = 0;
    let bestDist = Math.abs(pending[0].cylinder - current);

    for (let i = 1; i < pending.length; i++) {
      const dist = Math.abs(pending[i].cylinder - current);
      if (
        dist < bestDist ||
        (dist === bestDist &&
          (pending[i].cylinder < pending[bestIdx].cylinder ||
            (pending[i].cylinder === pending[bestIdx].cylinder &&
              pending[i].index < pending[bestIdx].index)))
      ) {
        bestDist = dist;
        bestIdx = i;
      }
    }

    const [chosen] = pending.splice(bestIdx, 1);
    collector.push({
      from: current,
      to: chosen.cylinder,
      eventType: 'SERVICE',
      servicedRequestIndex: chosen.index,
    });
    current = chosen.cylinder;
  }

  return buildSimulationResult('SSTF', config, collector.getEvents(), null);
}

