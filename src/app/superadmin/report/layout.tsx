import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export default function ReportLayout({ children }: LayoutProps) {
  return (
    <SuperadminLayout pageTitle="Laporan">
      {children}
    </SuperadminLayout>
  );
}
