import { DiskConfiguration, SimulationResult } from '../engine/executionTypes';
import { toRequestItems } from '../utils/calculations';
import { buildSimulationResult, EventCollector } from './helpers';

/**
 * C-SCAN (Circular SCAN)
 * Services requests in one direction up to the physical disk boundary,
 * wraps circularly to the opposite physical boundary (counted in movement total),
 * and continues servicing remaining requests in the same original direction.
 */
export function runCSCAN(config: DiskConfiguration): SimulationResult {
  const collector = new EventCollector();
  const items = toRequestItems(config.requests);
  const minCylinder = 0;
  const maxCylinder = Math.max(0, config.totalCylinders - 1);
  let current = config.initialHead;

  if (items.length === 0) {
    return buildSimulationResult('CSCAN', config, [], config.direction);
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
      if (current !== maxCylinder) {
        collector.push({
          from: current,
          to: maxCylinder,
          eventType: 'BOUNDARY',
          servicedRequestIndex: null,
          label: `Boundary Reached (${maxCylinder})`,
        });
        current = maxCylinder;
      }

      collector.push({
        from: current,
        to: minCylinder,
        eventType: 'CIRCULAR_JUMP',
        servicedRequestIndex: null,
        label: `Circular Wrap (${maxCylinder} → ${minCylinder})`,
      });
      current = minCylinder;

      for (const item of behind) {
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
      if (current !== minCylinder) {
        collector.push({
          from: current,
          to: minCylinder,
          eventType: 'BOUNDARY',
          servicedRequestIndex: null,
          label: `Boundary Reached (${minCylinder})`,
        });
        current = minCylinder;
      }

      collector.push({
        from: current,
        to: maxCylinder,
        eventType: 'CIRCULAR_JUMP',
        servicedRequestIndex: null,
        label: `Circular Wrap (${minCylinder} → ${maxCylinder})`,
      });
      current = maxCylinder;

      for (const item of behind) {
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

  return buildSimulationResult('CSCAN', config, collector.getEvents(), config.direction);
}

