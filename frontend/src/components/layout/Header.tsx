'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { Brain, Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

export function Header() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight">RepoMind</span>
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="hidden text-sm text-[var(--muted)] transition-colors hover:text-[var(--foreground)] sm:block"
          >
            Dashboard
          </Link>
          {mounted && (
            <button
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="rounded-lg p-2 text-[var(--muted)] transition-colors hover:bg-surface-elevated hover:text-[var(--foreground)]"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
