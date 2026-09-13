import type { ReactNode } from 'react';
import { KepalaLayout } from '@/components/layouts/KepalaLayout';

interface LayoutProps {
  children: ReactNode;
}

export const metadata = {
  title: 'Kepala BPS - Sistem Pencocokan Data',
  description: 'Dashboard eksekutif untuk Kepala BPS',
};

export default function KepalaRootLayout({ children }: LayoutProps) {
  return (
    <KepalaLayout>
      {children}
    </KepalaLayout>
  );
}