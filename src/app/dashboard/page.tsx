'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const redirectToDashboard = async () => {
      try {
        // Fetch current user
        const userResponse = await fetch('/api/auth/me');
        if (!userResponse.ok) {
          router.push('/login');
          return;
        }
        const userData = await userResponse.json();
        const userRole = userData.user?.role;
        
        // Redirect to role-specific dashboard
        if (userRole === 'EMPLOYEE') {
          router.push('/employee/dashboard');
        } else if (userRole === 'ADMIN') {
          router.push('/superadmin/dashboard');
        } else {
          router.push('/login');
        }
      } catch (err) {
        router.push('/login');
      }
    };

    redirectToDashboard();
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <span
          className="material-symbols-outlined text-[40px] inline-block"
          style={{ animation: 'spin 2s linear infinite' }}
        >
          hourglass_empty
        </span>
        <p className="mt-4 text-on-surface-variant">Redirecting to your dashboard...</p>
      </div>
    </div>
  );
}
