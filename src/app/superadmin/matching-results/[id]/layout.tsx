import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export default function ResultDetailLayout({ children }: LayoutProps) {
  return (
    <SuperadminLayout pageTitle="Detail Hasil Matching">
      {children}
    </SuperadminLayout>
  );
}
