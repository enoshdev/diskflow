import { DiskConfiguration, SimulationResult } from '../engine/executionTypes';
import { toRequestItems } from '../utils/calculations';
import { buildSimulationResult, EventCollector } from './helpers';

/**
 * LOOK
 * Moves in the initial direction servicing requests along the path,
 * then immediately reverses at the last pending request without traveling
 * unnecessarily to the physical disk boundaries.
 */
export function runLOOK(config: DiskConfiguration): SimulationResult {
  const collector = new EventCollector();
  const items = toRequestItems(config.requests);
  let current = config.initialHead;

  if (items.length === 0) {
    return buildSimulationResult('LOOK', config, [], config.direction);
  }

  if (config.direction === 'RIGHT') {
    const ahead = items
      .filter((item) => item.cylinder >= config.initialHead)
      .sort((a, b) => a.cylinder - b.cylinder || a.index - b.index);
    const behind = items
      .filter((item) => item.cylinder < config.initialHead)
      .sort((a, b) => b.cylinder - a.cylinder || a.index - b.index);

    for (const item of [...ahead, ...behind]) {
      collector.push({
        from: current,
        to: item.cylinder,
        eventType: 'SERVICE',
        servicedRequestIndex: item.index,
      });
      current = item.cylinder;
    }
  } else {
    const ahead = items
      .filter((item) => item.cylinder <= config.initialHead)
      .sort((a, b) => b.cylinder - a.cylinder || a.index - b.index);
    const behind = items
      .filter((item) => item.cylinder > config.initialHead)
      .sort((a, b) => a.cylinder - b.cylinder || a.index - b.index);

    for (const item of [...ahead, ...behind]) {
      collector.push({
        from: current,
        to: item.cylinder,
        eventType: 'SERVICE',
        servicedRequestIndex: item.index,
      });
      current = item.cylinder;
    }
  }

  return buildSimulationResult('LOOK', config, collector.getEvents(), config.direction);
}

