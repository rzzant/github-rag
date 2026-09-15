'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/providers/auth-provider';

const PUBLIC_PATHS = ['/login'];

/**
 * Client-side redirect for UX only. The actual security boundary is the
 * backend's requireAuth middleware - every API route rejects unauthenticated
 * requests with a 401 regardless of what this component does. This just
 * avoids flashing protected UI/making doomed API calls before the user is
 * sent to /login.
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const isPublicPath = PUBLIC_PATHS.includes(pathname);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated && !isPublicPath) {
      router.replace('/login');
    }
    if (isAuthenticated && pathname === '/login') {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, isPublicPath, pathname, router]);

  if (isPublicPath) {
    return <>{children}</>;
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--muted)]" />
      </div>
    );
  }

  return <>{children}</>;
}
