'use client';

interface LoadingStateProps {
  text?: string;
  fullHeight?: boolean;
}

export function LoadingState({
  text = 'Memuat...',
  fullHeight = true,
}: LoadingStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-md ${
        fullHeight ? 'min-h-[400px]' : 'py-xl'
      }`}
    >
      <div className="w-12 h-12 border-4 border-outline-variant border-t-primary rounded-full animate-spin"></div>
      <p className="font-body-md text-body-md text-on-surface-variant">
        {text}
      </p>
    </div>
  );
}
