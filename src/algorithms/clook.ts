import { DiskConfiguration, SimulationResult } from '../engine/executionTypes';
import { toRequestItems } from '../utils/calculations';
import { buildSimulationResult, EventCollector } from './helpers';

/**
 * C-LOOK (Circular LOOK)
 * Services requests in one direction up to the furthest pending request,
 * then jumps directly to the opposite extreme pending request (counted in total movement)
 * and continues servicing in the original direction without visiting physical boundaries.
 */
export function runCLOOK(config: DiskConfiguration): SimulationResult {
  const collector = new EventCollector();
  const items = toRequestItems(config.requests);
  let current = config.initialHead;

  if (items.length === 0) {
    return buildSimulationResult('CLOOK', config, [], config.direction);
  }

  if (config.direction === 'RIGHT') {
    const ahead = items
      .filter((item) => item.cylinder >= config.initialHead)
      .sort((a, b) => a.cylinder - b.cylinder || a.index - b.index);
    const behind = items
      .filter((item) => item.cylinder < config.initialHead)
      .sort((a, b) => a.cylinder - b.cylinder || a.index - b.index);

    for (const item of ahead) {
      collector.push({
        from: current,
        to: item.cylinder,
        eventType: 'SERVICE',
        servicedRequestIndex: item.index,
      });
      current = item.cylinder;
    }

    if (behind.length > 0) {
      const firstBehind = behind[0];
      collector.push({
        from: current,
        to: firstBehind.cylinder,
        eventType: 'CIRCULAR_JUMP',
        servicedRequestIndex: firstBehind.index,
        label: `Circular Jump & Service (${current} → ${firstBehind.cylinder})`,
      });
      current = firstBehind.cylinder;

      for (let i = 1; i < behind.length; i++) {
        const item = behind[i];
        collector.push({
          from: current,
          to: item.cylinder,
          eventType: 'SERVICE',
          servicedRequestIndex: item.index,
        });
        current = item.cylinder;
      }
    }
  } else {
    const ahead = items
      .filter((item) => item.cylinder <= config.initialHead)
      .sort((a, b) => b.cylinder - a.cylinder || a.index - b.index);
    const behind = items
      .filter((item) => item.cylinder > config.initialHead)
      .sort((a, b) => b.cylinder - a.cylinder || a.index - b.index);

    for (const item of ahead) {
      collector.push({
        from: current,
        to: item.cylinder,
        eventType: 'SERVICE',
        servicedRequestIndex: item.index,
      });
      current = item.cylinder;
    }

    if (behind.length > 0) {
      const firstBehind = behind[0];
      collector.push({
        from: current,
        to: firstBehind.cylinder,
        eventType: 'CIRCULAR_JUMP',
        servicedRequestIndex: firstBehind.index,
        label: `Circular Jump & Service (${current} → ${firstBehind.cylinder})`,
      });
      current = firstBehind.cylinder;

      for (let i = 1; i < behind.length; i++) {
        const item = behind[i];
        collector.push({
          from: current,
          to: item.cylinder,
          eventType: 'SERVICE',
          servicedRequestIndex: item.index,
        });
        current = item.cylinder;
      }
    }
  }

  return buildSimulationResult('CLOOK', config, collector.getEvents(), config.direction);
}

