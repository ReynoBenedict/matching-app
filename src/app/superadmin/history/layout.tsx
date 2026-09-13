import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export default function HistoryLayout({ children }: LayoutProps) {
  return (
    <SuperadminLayout pageTitle="Riwayat Proses">
      {children}
    </SuperadminLayout>
  );
}
