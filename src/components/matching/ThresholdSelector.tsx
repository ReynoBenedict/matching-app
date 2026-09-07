'use client';

interface ThresholdSelectorProps {
  threshold: number;
  onThresholdChange: (threshold: number) => void;
}

export function ThresholdSelector({
  threshold,
  onThresholdChange,
}: ThresholdSelectorProps) {
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    onThresholdChange(value);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value >= 0 && value <= 100) {
      onThresholdChange(value / 100);
    }
  };

  const percentageValue = Math.round(threshold * 100);

  return (
    <div className="bg-surface-container-low p-6 rounded-lg border border-outline-variant space-y-4">
      <h3 className="font-headline-sm text-primary">Langkah 4: Atur Threshold Kesamaan</h3>

      <p className="text-sm text-on-surface-variant">
        Hanya pasangan record dengan nilai kesamaan di atas threshold yang akan ditampilkan.
      </p>

      <div className="flex gap-4 items-center">
        <input
          type="range"
          min="0"
          max="100"
          value={percentageValue}
          onChange={handleSliderChange}
          className="flex-1 h-2 bg-outline-variant rounded-lg appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, #ff6366 0%, #ffa726 50%, #66bb6a 100%)`,
          }}
        />
        <div className="flex items-center gap-2 bg-surface p-2 rounded-lg border border-outline-variant">
          <input
            type="number"
            min="0"
            max="100"
            value={percentageValue}
            onChange={handleInputChange}
            className="w-16 text-center text-on-surface font-semibold bg-transparent border-none focus:outline-none"
          />
          <span className="text-on-surface-variant text-sm">%</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs text-on-surface-variant">
        <div className="text-left">0%</div>
        <div className="text-center">50%</div>
        <div className="text-right">100%</div>
      </div>

      <div className="bg-surface p-3 rounded-lg">
        <p className="text-sm">
          <span className="font-semibold text-on-surface">Threshold saat ini: </span>
          <span className="text-on-surface-variant">{percentageValue}%</span>
        </p>
        <p className="text-xs text-on-surface-variant mt-1">
          Pasangan dengan nilai kesamaan ≥ {percentageValue}% akan ditampilkan.
        </p>
      </div>
    </div>
  );
}
