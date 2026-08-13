'use client';

import Link from 'next/link';

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionText?: string;
  actionHref?: string;
  icon?: string;
}

export function EmptyState({
  title = 'Tidak ada dataset',
  description = 'Belum ada dataset yang diunggah. Mulai dengan mengunggah dataset baru.',
  actionText = 'Unggah Dataset',
  actionHref = '/datasets/upload',
  icon = '📂',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-surface-container-low rounded-lg border border-outline-variant p-xl">
      <div className="text-5xl mb-lg">{icon}</div>
      <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm text-center">
        {title}
      </h3>
      <p className="font-body-md text-body-md text-on-surface-variant text-center mb-lg max-w-sm">
        {description}
      </p>
      {actionHref && (
        <Link
          href={actionHref}
          className="px-lg py-md bg-primary text-on-primary rounded font-label-md text-label-md hover:opacity-90 transition-opacity"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
