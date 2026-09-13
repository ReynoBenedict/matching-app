import { SuperadminLayout } from '@/components/layouts/SuperadminLayout';

export default function MatchingResultsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SuperadminLayout pageTitle="Hasil Matching">
      {children}
    </SuperadminLayout>
  );
}
