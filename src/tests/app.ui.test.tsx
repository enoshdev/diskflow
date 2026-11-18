// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App';

afterEach(() => {
  cleanup();
});

describe('DiskFlow — Full UI Integration Tests', () => {
  it('renders single-page simulator with default textbook configuration and updates live on Next/Prev Step & Reset', () => {
    render(<App />);

    expect(screen.getByText('DiskFlow')).toBeTruthy();
    expect(screen.getByText('Interactive Disk Scheduling Simulator')).toBeTruthy();
    expect(screen.getByTestId('telemetry-head-pos').textContent).toBe('53');
    expect(screen.getByTestId('kpi-total-movement').textContent).toBe('0');

    const nextBtn = screen.getByTitle('Next Step');
    const prevBtn = screen.getByTitle('Previous Step');
    const resetBtn = screen.getByTitle('Reset to Initial Position');

    // Step 1: 53 -> 65 (+12)
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('telemetry-head-pos').textContent).toBe('65');
    expect(screen.getByTestId('kpi-total-movement').textContent).toBe('12');

    // Step 2: 65 -> 67 (+2 => total 14)
    fireEvent.click(nextBtn);
    expect(screen.getByTestId('telemetry-head-pos').textContent).toBe('67');
    expect(screen.getByTestId('kpi-total-movement').textContent).toBe('14');

    // Previous Step genuinely restores Step 1 exact state
    fireEvent.click(prevBtn);
    expect(screen.getByTestId('telemetry-head-pos').textContent).toBe('65');
    expect(screen.getByTestId('kpi-total-movement').textContent).toBe('12');

    // Reset restores Step 0
    fireEvent.click(resetBtn);
    expect(screen.getByTestId('telemetry-head-pos').textContent).toBe('53');
    expect(screen.getByTestId('kpi-total-movement').textContent).toBe('0');
  });

  it('switches algorithms and computes exact matching outputs dynamically', () => {
    render(<App />);

    // Select FCFS
    fireEvent.click(screen.getByRole('radio', { name: /FCFS/i }));
    const nextBtn = screen.getByTitle('Next Step');
    // Step through all 8 FCFS requests
    for (let i = 0; i < 8; i++) {
      fireEvent.click(nextBtn);
    }
    expect(screen.getByTestId('kpi-total-movement').textContent).toBe('640');
    expect(screen.getByTestId('kpi-avg-movement').textContent).toBe('80.00');
    expect(screen.getByTestId('kpi-final-pos').textContent).toBe('67');
  });

  it('dynamically handles custom cylinders, head, direction, duplicate queue, and Compare All Algorithms', () => {
    render(<App />);

    const cylInput = screen.getByLabelText('Total Cylinders');
    const headInput = screen.getByLabelText('Initial Head Position');
    const batchInput = screen.getByLabelText('Batch Queue Input (Comma-separated)');

    fireEvent.change(cylInput, { target: { value: '300' } });
    fireEvent.change(headInput, { target: { value: '100' } });
    fireEvent.change(batchInput, { target: { value: '10, 150, 75, 10' } });
    fireEvent.click(screen.getByRole('button', { name: /Apply Queue/i }));

    // Verify head updated to 100 and 4 items in queue (duplicates preserved)
    expect(screen.getByTestId('telemetry-head-pos').textContent).toBe('100');
    expect(screen.getByText('4 items')).toBeTruthy();

    // Switch direction to LEFT
    fireEvent.click(screen.getByRole('button', { name: /LEFT/i }));

    // Click Compare All Algorithms
    fireEvent.click(screen.getByRole('button', { name: /Compare All Algorithms/i }));

    // All 6 algorithms should render inspectable sequence buttons
    const inspectButtons = screen.getAllByRole('button', {
      name: /Inspect Service Sequence/i,
    });
    expect(inspectButtons.length).toBe(6);

    // Expand first algorithm sequence
    fireEvent.click(inspectButtons[0]);
    expect(screen.getByText(/Serviced Request Order:/i)).toBeTruthy();
  });
});

