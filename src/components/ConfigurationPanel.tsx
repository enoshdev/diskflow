import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  Check,
  ChevronDown,
  Pencil,
  Plus,
  Shuffle,
  Sliders,
  Trash2,
  X,
} from 'lucide-react';
import { Direction, DiskConfiguration, ValidationResult } from '../engine/executionTypes';
import {
  generateRandomRequests,
  parseRequestQueueString,
  SAMPLE_PRESETS,
  SamplePreset,
} from '../utils/validation';

interface ConfigurationPanelProps {
  config: DiskConfiguration;
  validation: ValidationResult;
  directionRelevant: boolean;
  onChangeConfig: (next: DiskConfiguration) => void;
}

export function ConfigurationPanel({
  config,
  validation,
  directionRelevant,
  onChangeConfig,
}: ConfigurationPanelProps) {
  const [cylindersText, setCylindersText] = useState(String(config.totalCylinders));
  const [headText, setHeadText] = useState(String(config.initialHead));
  const [batchText, setBatchText] = useState(config.requests.join(', '));
  const [batchError, setBatchError] = useState<string | null>(null);
  const [newReqText, setNewReqText] = useState('');
  const [newReqError, setNewReqError] = useState<string | null>(null);

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [presetMenuOpen, setPresetMenuOpen] = useState(false);

  const maxCylinder = Math.max(0, config.totalCylinders - 1);

  useEffect(() => {
    setCylindersText(String(config.totalCylinders));
  }, [config.totalCylinders]);

  useEffect(() => {
    setHeadText(String(config.initialHead));
  }, [config.initialHead]);

  useEffect(() => {
    setBatchText(config.requests.join(', '));
    setBatchError(null);
  }, [config.requests]);

  const handleCylindersChange = (val: string) => {
    setCylindersText(val);
    if (val.trim() === '') {
      onChangeConfig({ ...config, totalCylinders: 0 });
      return;
    }
    const parsed = Number(val);
    if (Number.isInteger(parsed)) {
      onChangeConfig({ ...config, totalCylinders: parsed });
    }
  };

  const handleHeadChange = (val: string) => {
    setHeadText(val);
    if (val.trim() === '') {
      onChangeConfig({ ...config, initialHead: -1 });
      return;
    }
    const parsed = Number(val);
    if (Number.isInteger(parsed)) {
      onChangeConfig({ ...config, initialHead: parsed });
    }
  };

  const handleDirectionChange = (direction: Direction) => {
    onChangeConfig({ ...config, direction });
  };

  const handleApplyBatch = () => {
    const { requests, error } = parseRequestQueueString(batchText, config.totalCylinders);
    if (error) {
      setBatchError(error);
      return;
    }
    setBatchError(null);
    setEditingIndex(null);
    onChangeConfig({ ...config, requests });
  };

  const handleAddSingle = () => {
    const trimmed = newReqText.trim();
    if (!trimmed) {
      setNewReqError('Enter a cylinder number.');
      return;
    }
    if (!/^-?\d+$/.test(trimmed)) {
      setNewReqError('Must be an integer.');
      return;
    }
    const num = Number(trimmed);
    if (config.totalCylinders < 1 || num < 0 || num > maxCylinder) {
      setNewReqError(`Must be within 0–${maxCylinder}.`);
      return;
    }
    setNewReqError(null);
    setNewReqText('');
    onChangeConfig({ ...config, requests: [...config.requests, num] });
  };

  const handleRemoveRequest = (idx: number) => {
    if (editingIndex === idx) setEditingIndex(null);
    const next = config.requests.filter((_, i) => i !== idx);
    onChangeConfig({ ...config, requests: next });
  };

  const handleStartEditChip = (idx: number) => {
    setEditingIndex(idx);
    setEditingValue(String(config.requests[idx]));
  };

  const handleCommitEditChip = (idx: number) => {
    const trimmed = editingValue.trim();
    if (!/^-?\d+$/.test(trimmed)) {
      setEditingIndex(null);
      return;
    }
    const num = Number(trimmed);
    if (config.totalCylinders >= 1 && num >= 0 && num <= maxCylinder) {
      const next = [...config.requests];
      next[idx] = num;
      onChangeConfig({ ...config, requests: next });
    }
    setEditingIndex(null);
  };

  const handleLoadPreset = (preset: SamplePreset) => {
    setPresetMenuOpen(false);
    setBatchError(null);
    setNewReqError(null);
    setEditingIndex(null);
    onChangeConfig({
      ...preset.config,
      requests: [...preset.config.requests],
    });
  };

  const handleRandomize = () => {
    const safeCylinders = config.totalCylinders >= 2 ? config.totalCylinders : 200;
    const count = Math.max(6, Math.min(12, config.requests.length || 8));
    const randomRequests = generateRandomRequests(safeCylinders, count);
    const safeHead =
      config.initialHead >= 0 && config.initialHead < safeCylinders
        ? config.initialHead
        : Math.floor(Math.random() * safeCylinders);
    setBatchError(null);
    setNewReqError(null);
    setEditingIndex(null);
    onChangeConfig({
      ...config,
      totalCylinders: safeCylinders,
      initialHead: safeHead,
      requests: randomRequests,
    });
  };

  const handleClearQueue = () => {
    setBatchError(null);
    setNewReqError(null);
    setEditingIndex(null);
    onChangeConfig({ ...config, requests: [] });
  };

  return (
    <section
      aria-label="Disk and Head Configuration"
      className="bg-white rounded-xl border border-[#E5EAF2] p-5 shadow-subtle"
    >
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 mb-4 border-b border-[#E5EAF2]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-[#EFF6FF] text-[#2563EB]">
            <Sliders className="w-4 h-4" />
          </div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
            Disk &amp; Head Parameters
          </h2>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 relative">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPresetMenuOpen((o) => !o)}
              className="px-2.5 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#2563EB] bg-[#F1F5FB] hover:bg-[#EFF6FF] border border-[#E5EAF2] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>Load Sample</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {presetMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setPresetMenuOpen(false)}
                />
                <div className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl border border-[#E5EAF2] shadow-elevated z-30 py-1.5">
                  {SAMPLE_PRESETS.map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => handleLoadPreset(preset)}
                      className="w-full text-left px-3 py-2 hover:bg-[#F7F9FC] transition-colors cursor-pointer"
                    >
                      <div className="text-xs font-semibold text-[#172B4D]">
                        {preset.name}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={handleRandomize}
            className="px-2.5 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#172B4D] bg-[#F1F5FB] hover:bg-[#EAEFF8] border border-[#E5EAF2] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Shuffle className="w-3.5 h-3.5" />
            <span>Randomize</span>
          </button>

          <button
            type="button"
            onClick={handleClearQueue}
            className="px-2.5 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#EF4444] bg-[#F1F5FB] hover:bg-rose-50 border border-[#E5EAF2] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* 4-Field Form Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {/* Total Cylinders */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="input-cylinders" className="text-xs font-medium text-[#172B4D]">
              Total Cylinders
            </label>
            <span className="text-[11px] text-[#94A3B8] mono-num">
              Range: 0–{maxCylinder}
            </span>
          </div>
          <div className="relative">
            <input
              id="input-cylinders"
              type="number"
              min={1}
              max={100000}
              value={cylindersText}
              onChange={(e) => handleCylindersChange(e.target.value)}
              className={`w-full px-3 py-2 pr-14 text-xs font-medium rounded-lg border bg-white focus:outline-none focus:ring-2 text-[#172B4D] mono-num transition-colors ${
                validation.errors.totalCylinders
                  ? 'border-[#EF4444] focus:ring-rose-200'
                  : 'border-[#E5EAF2] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
              }`}
            />
            <span className="absolute right-3 top-2 text-[11px] text-[#64748B] pointer-events-none">
              tracks
            </span>
          </div>
          {validation.errors.totalCylinders && (
            <p className="text-[11px] text-[#EF4444] flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{validation.errors.totalCylinders}</span>
            </p>
          )}
        </div>

        {/* Initial Head Position */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="input-head" className="text-xs font-medium text-[#172B4D]">
              Initial Head Position
            </label>
            <span className="text-[11px] text-[#2563EB] mono-num font-semibold">
              {validation.errors.initialHead ? 'Invalid' : `Cylinder ${config.initialHead}`}
            </span>
          </div>
          <div className="relative">
            <input
              id="input-head"
              type="number"
              min={0}
              max={maxCylinder}
              value={headText}
              onChange={(e) => handleHeadChange(e.target.value)}
              className={`w-full px-3 py-2 pr-14 text-xs font-medium rounded-lg border bg-white focus:outline-none focus:ring-2 text-[#172B4D] mono-num transition-colors ${
                validation.errors.initialHead
                  ? 'border-[#EF4444] focus:ring-rose-200'
                  : 'border-[#E5EAF2] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
              }`}
            />
            <div className="absolute right-3 top-2 flex items-center gap-1 pointer-events-none">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="text-[11px] text-[#64748B]">head</span>
            </div>
          </div>
          {validation.errors.initialHead && (
            <p className="text-[11px] text-[#EF4444] flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{validation.errors.initialHead}</span>
            </p>
          )}
        </div>

        {/* Initial Direction */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="text-xs font-medium text-[#172B4D]">Initial Direction</span>
            <span className="text-[11px] text-[#64748B]">
              {directionRelevant ? 'Active for algorithm' : 'Used by SCAN/LOOK'}
            </span>
          </div>
          <div
            className="grid grid-cols-2 p-1 bg-[#F1F5FB] border border-[#E5EAF2] rounded-lg text-xs font-semibold"
            role="group"
            aria-label="Initial Head Direction"
          >
            <button
              type="button"
              onClick={() => handleDirectionChange('LEFT')}
              aria-pressed={config.direction === 'LEFT'}
              className={`py-1.5 rounded-md text-center transition-all cursor-pointer ${
                config.direction === 'LEFT'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              ← LEFT
            </button>
            <button
              type="button"
              onClick={() => handleDirectionChange('RIGHT')}
              aria-pressed={config.direction === 'RIGHT'}
              className={`py-1.5 rounded-md text-center transition-all cursor-pointer ${
                config.direction === 'RIGHT'
                  ? 'bg-[#2563EB] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#172B4D]'
              }`}
            >
              RIGHT →
            </button>
          </div>
        </div>

        {/* Add Single Request */}
        <div className="space-y-1.5">
          <div className="flex justify-between items-center">
            <label htmlFor="input-new-req" className="text-xs font-medium text-[#172B4D]">
              Add Track Request
            </label>
            <span className="text-[11px] text-[#94A3B8]">Press Enter</span>
          </div>
          <div className="flex gap-1.5">
            <input
              id="input-new-req"
              type="number"
              min={0}
              max={maxCylinder}
              placeholder={`0–${maxCylinder}`}
              value={newReqText}
              onChange={(e) => {
                setNewReqText(e.target.value);
                if (newReqError) setNewReqError(null);
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddSingle();
                }
              }}
              className="w-full px-3 py-2 text-xs rounded-lg border border-[#E5EAF2] bg-white focus:outline-none focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] text-[#172B4D] mono-num"
            />
            <button
              type="button"
              onClick={handleAddSingle}
              className="px-3 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
          {newReqError && (
            <p className="text-[11px] text-[#EF4444] flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{newReqError}</span>
            </p>
          )}
        </div>
      </div>

      {/* Batch Queue Input (Comma-separated) */}
      <div className="pt-3.5 border-t border-[#E5EAF2] space-y-2 mb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label htmlFor="input-batch-queue" className="text-xs font-semibold text-[#172B4D]">
            Batch Queue Input (Comma-separated)
          </label>
          <span className="text-[11px] text-[#94A3B8]">
            Paste or type comma-separated cylinder indices · Duplicates allowed
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="input-batch-queue"
            type="text"
            value={batchText}
            onChange={(e) => {
              setBatchText(e.target.value);
              if (batchError) setBatchError(null);
            }}
            onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleApplyBatch();
              }
            }}
            placeholder="e.g. 98, 183, 37, 122, 14, 124, 65, 67"
            className={`flex-1 px-3 py-2 text-xs rounded-lg border bg-white focus:outline-none focus:ring-2 text-[#172B4D] mono-num ${
              batchError || validation.errors.requests
                ? 'border-[#EF4444] focus:ring-rose-200'
                : 'border-[#E5EAF2] focus:border-[#2563EB] focus:ring-[#2563EB]/20'
            }`}
          />
          <button
            type="button"
            onClick={handleApplyBatch}
            className="px-4 py-2 text-xs font-semibold text-white bg-[#2563EB] hover:bg-[#1D4ED8] rounded-lg transition-colors inline-flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Apply Queue</span>
          </button>
        </div>
        {(batchError || validation.errors.requests) && (
          <p className="text-xs text-[#EF4444] flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{batchError ?? validation.errors.requests}</span>
          </p>
        )}
      </div>

      {/* Request Queue Interactive Chips */}
      <div className="pt-3 border-t border-[#E5EAF2]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#172B4D]">
              Request Queue I/O Stream:
            </span>
            <span className="text-[11px] mono-num px-2 py-0.5 rounded-full bg-[#F1F5FB] border border-[#E5EAF2] text-[#64748B] font-medium">
              {config.requests.length} {config.requests.length === 1 ? 'item' : 'items'}
            </span>
          </div>
          <span className="text-[11px] text-[#94A3B8]">
            Click a chip to edit · Click × to remove · Order reflects arrival stream
          </span>
        </div>

        <div className="p-2.5 bg-[#F7F9FC] rounded-lg border border-[#E5EAF2] flex flex-wrap items-center gap-2 min-h-[46px]">
          {config.requests.length === 0 ? (
            <span className="text-xs text-[#94A3B8] italic px-1">
              Queue is empty. Add cylinders above, paste a comma-separated list, or load a sample preset.
            </span>
          ) : (
            config.requests.map((cyl, idx) => {
              const outOfBounds = config.totalCylinders < 1 || cyl < 0 || cyl > maxCylinder;
              if (editingIndex === idx) {
                return (
                  <div
                    key={`${idx}-editing`}
                    className="inline-flex items-center gap-1 bg-white border border-[#2563EB] rounded-md px-1.5 py-0.5 ring-2 ring-[#2563EB]/20"
                  >
                    <input
                      type="number"
                      min={0}
                      max={maxCylinder}
                      autoFocus
                      value={editingValue}
                      onChange={(e) => setEditingValue(e.target.value)}
                      onBlur={() => handleCommitEditChip(idx)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCommitEditChip(idx);
                        if (e.key === 'Escape') setEditingIndex(null);
                      }}
                      className="w-14 text-xs mono-num font-semibold text-[#172B4D] focus:outline-none"
                    />
                  </div>
                );
              }
              return (
                <div
                  key={`${idx}-${cyl}`}
                  className={`group inline-flex items-center gap-1 px-2.5 py-1 rounded-md border text-xs mono-num font-semibold transition-colors ${
                    outOfBounds
                      ? 'bg-rose-50 border-[#EF4444] text-[#EF4444]'
                      : 'bg-white border-[#E5EAF2] text-[#172B4D] hover:border-[#2563EB]/50'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => handleStartEditChip(idx)}
                    className="inline-flex items-center gap-1 cursor-pointer"
                    title="Click to edit cylinder"
                  >
                    <span>{cyl}</span>
                    <Pencil className="w-2.5 h-2.5 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemoveRequest(idx)}
                    aria-label={`Remove request ${cyl}`}
                    className="text-[#94A3B8] hover:text-[#EF4444] transition-colors ml-0.5 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}

