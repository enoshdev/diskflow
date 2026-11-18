import { DiskConfiguration, SimulationResult } from '../engine/executionTypes';
import { buildSimulationResult, EventCollector } from './helpers';

/**
 * FCFS (First Come First Serve)
 * Processes every request in original arrival order without reordering.
 */
export function runFCFS(config: DiskConfiguration): SimulationResult {
  const collector = new EventCollector();
  let current = config.initialHead;

  for (let i = 0; i < config.requests.length; i++) {
    const target = config.requests[i];
    collector.push({
      from: current,
      to: target,
      eventType: 'SERVICE',
      servicedRequestIndex: i,
    });
    current = target;
  }

  return buildSimulationResult('FCFS', config, collector.getEvents(), null);
}

