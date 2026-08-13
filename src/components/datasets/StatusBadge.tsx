'use client';

interface StatusBadgeProps {
  status: 'UPLOADING' | 'VALIDATING' | 'READY' | 'FAILED';
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const statusConfig = {
    UPLOADING: {
      bg: 'bg-secondary-container',
      text: 'text-on-secondary-container',
      label: 'Mengunggah',
      icon: '📤',
    },
    VALIDATING: {
      bg: 'bg-secondary-container',
      text: 'text-on-secondary-container',
      label: 'Validasi',
      icon: '⏳',
    },
    READY: {
      bg: 'bg-green-100',
      text: 'text-green-900',
      label: 'Siap',
      icon: '✓',
    },
    FAILED: {
      bg: 'bg-error-container',
      text: 'text-on-error-container',
      label: 'Gagal',
      icon: '✕',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-xs px-sm py-xs rounded font-label-md text-label-md ${config.bg} ${config.text} ${className}`}
    >
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
}
