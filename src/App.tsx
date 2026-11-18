import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlgorithmSelector } from './components/AlgorithmSelector';
import { ComparisonSection } from './components/ComparisonSection';
import { ConfigurationPanel } from './components/ConfigurationPanel';
import { DiskVisualization } from './components/DiskVisualization';
import { ExecutionResults } from './components/ExecutionResults';
import { Header } from './components/Header';
import {
  AlgorithmId,
  DiskConfiguration,
  SimulationStatus,
} from './engine/executionTypes';
import {
  compareAllAlgorithms,
  ComparisonEntry,
  executeAlgorithm,
  getStepSnapshot,
} from './engine/simulationEngine';
import { ALGORITHM_META } from './utils/calculations';
import { DEFAULT_CONFIG, validateConfiguration } from './utils/validation';

export function App() {
  const [config, setConfig] = useState<DiskConfiguration>(DEFAULT_CONFIG);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState<AlgorithmId>('SCAN');
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [status, setStatus] = useState<SimulationStatus>('IDLE');
  const [speedMs, setSpeedMs] = useState<number>(800);
  const [comparisonEntries, setComparisonEntries] = useState<ComparisonEntry[] | null>(null);
  const [hasCompared, setHasCompared] = useState<boolean>(false);

  const validation = useMemo(() => validateConfiguration(config), [config]);

  const result = useMemo(() => {
    if (!validation.isValid) return null;
    try {
      return executeAlgorithm(selectedAlgorithm, config);
    } catch {
      return null;
    }
  }, [validation.isValid, selectedAlgorithm, config]);

  const totalSteps = result?.events.length ?? 0;

  const snapshot = useMemo(() => {
    if (!result) return null;
    return getStepSnapshot(result, currentStep);
  }, [result, currentStep]);

  // Keep comparison synchronized when user already triggered comparison and updates config
  useEffect(() => {
    if (!hasCompared) return;
    if (!validation.isValid) {
      setComparisonEntries(null);
      return;
    }
    try {
      setComparisonEntries(compareAllAlgorithms(config));
    } catch {
      setComparisonEntries(null);
    }
  }, [hasCompared, validation.isValid, config]);

  // Single deterministic timer — prevents duplicate intervals and race conditions
  useEffect(() => {
    if (status !== 'RUNNING') return;
    if (!result || totalSteps === 0) {
      setStatus('IDLE');
      return;
    }
    if (currentStep >= totalSteps) {
      setStatus('COMPLETED');
      return;
    }

    const timerId = window.setTimeout(() => {
      setCurrentStep((prev) => {
        const next = Math.min(prev + 1, totalSteps);
        if (next >= totalSteps) {
          setStatus('COMPLETED');
        }
        return next;
      });
    }, speedMs);

    return () => window.clearTimeout(timerId);
  }, [status, currentStep, totalSteps, speedMs, result]);

  const handleConfigChange = useCallback((nextConfig: DiskConfiguration) => {
    setConfig(nextConfig);
    setCurrentStep(0);
    setStatus('IDLE');
  }, []);

  const handleSelectAlgorithm = useCallback((algoId: AlgorithmId) => {
    setSelectedAlgorithm(algoId);
    setCurrentStep(0);
    setStatus('IDLE');
  }, []);

  const handleStart = useCallback(() => {
    if (!result || result.events.length === 0) return;
    if (currentStep >= result.events.length) {
      setCurrentStep(0);
    }
    setStatus('RUNNING');
  }, [result, currentStep]);

  const handlePause = useCallback(() => {
    setStatus((prev) => (prev === 'RUNNING' ? 'PAUSED' : prev));
  }, []);

  const handleResume = useCallback(() => {
    if (!result || result.events.length === 0) return;
    if (currentStep < result.events.length) {
      setStatus('RUNNING');
    } else {
      setStatus('COMPLETED');
    }
  }, [result, currentStep]);

  const handleReset = useCallback(() => {
    setStatus('IDLE');
    setCurrentStep(0);
  }, []);

  const handleReplay = useCallback(() => {
    if (!result || result.events.length === 0) return;
    setCurrentStep(0);
    setStatus('RUNNING');
  }, [result]);

  const handleNextStep = useCallback(() => {
    if (!result || result.events.length === 0) return;
    setCurrentStep((prev) => {
      const next = Math.min(prev + 1, result.events.length);
      setStatus(next >= result.events.length ? 'COMPLETED' : 'PAUSED');
      return next;
    });
  }, [result]);

  const handlePrevStep = useCallback(() => {
    if (!result) return;
    setCurrentStep((prev) => {
      const next = Math.max(0, prev - 1);
      setStatus(next === 0 ? 'IDLE' : 'PAUSED');
      return next;
    });
  }, [result]);

  const handleCompareAll = useCallback(() => {
    if (!validation.isValid) return;
    setHasCompared(true);
    setComparisonEntries(compareAllAlgorithms(config));
  }, [validation.isValid, config]);

  const handleJumpToCompare = useCallback(() => {
    if (validation.isValid) {
      setHasCompared(true);
      setComparisonEntries(compareAllAlgorithms(config));
    }
    document.getElementById('comparison-section')?.scrollIntoView({ behavior: 'smooth' });
  }, [validation.isValid, config]);

  const directionRelevant = ALGORITHM_META[selectedAlgorithm].usesDirection;

  return (
    <div className="min-h-screen bg-[#F7F9FC] text-[#172B4D] pb-16">
      <Header
        totalCylinders={config.totalCylinders}
        requestCount={config.requests.length}
        onJumpToCompare={handleJumpToCompare}
      />

      <main className="max-w-[1280px] mx-auto px-4 sm:px-6 pt-6 space-y-6">
        <ConfigurationPanel
          config={config}
          validation={validation}
          directionRelevant={directionRelevant}
          onChangeConfig={handleConfigChange}
        />

        <AlgorithmSelector
          selectedAlgorithm={selectedAlgorithm}
          onSelect={handleSelectAlgorithm}
        />

        <DiskVisualization
          result={result}
          snapshot={snapshot}
          status={status}
          initialDirection={config.direction}
          speedMs={speedMs}
          isValid={validation.isValid}
          onStart={handleStart}
          onPause={handlePause}
          onResume={handleResume}
          onPrevStep={handlePrevStep}
          onNextStep={handleNextStep}
          onReset={handleReset}
          onReplay={handleReplay}
          onChangeSpeed={setSpeedMs}
        />

        <ExecutionResults
          result={result}
          snapshot={snapshot}
          isValid={validation.isValid}
        />

        <ComparisonSection
          config={config}
          activeAlgorithm={selectedAlgorithm}
          comparisonEntries={comparisonEntries}
          isValid={validation.isValid}
          onCompareAll={handleCompareAll}
          onSelectAlgorithm={handleSelectAlgorithm}
        />
      </main>
    </div>
  );
}

export default App;

