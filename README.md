# DiskFlow — Interactive Disk Scheduling Simulator

An academic Operating Systems single-page web application for exploring, executing, visualizing, and comparing disk scheduling algorithms in real time.

## Features

- **Six Complete Disk Scheduling Algorithms**:
  - **FCFS** (First Come First Serve)
  - **SSTF** (Shortest Seek Time First — deterministic tie-breaking toward lower cylinder)
  - **SCAN** (Elevator Algorithm)
  - **C-SCAN** (Circular SCAN)
  - **LOOK**
  - **C-LOOK** (Circular LOOK)
- **Universal Dynamic Execution Engine**: Works for any valid cylinder count, initial head position, direction (`LEFT` / `RIGHT`), and custom request queue (including duplicates, single requests, and empty queues).
- **Interactive Disk Head Visualization**: Calibrated SVG cylinder track with collision-free labels, Framer Motion animated head pointer, pending/serviced request states, physical boundary markers, and dashed circular jump trajectories.
- **Full Simulation Playback Controls**: Start, Pause, Resume, Previous Step (exact state restoration), Next Step, Reset, Replay, and `0.5x`–`2x` playback speed.
- **Execution Analytics & Movement Graph**: Live KPI metrics, traversal order strip, Cartesian head-movement graph with step hover tooltips, and a 5-column Execution History table (`Step | Previous | Current | Movement | Event`).
- **Compare All Algorithms**: Dynamically benchmarks all six algorithms on the exact current configuration with a horizontal bar chart and expandable service sequences.

## Tech Stack

- React 19 + TypeScript + Vite
- Tailwind CSS v4
- Framer Motion + Lucide React
- Vitest + React Testing Library

## Getting Started

```bash
# Install dependencies
npm install

# Run local development server
npm run dev

# Run automated test suite (78 tests)
npm test

# Type-check and build for production
npm run build
```
