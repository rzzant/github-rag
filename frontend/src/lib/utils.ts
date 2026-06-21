import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'ready':
      return 'text-emerald-500 bg-emerald-500/10';
    case 'failed':
      return 'text-red-500 bg-red-500/10';
    case 'pending':
      return 'text-gray-500 bg-gray-500/10';
    default:
      return 'text-amber-500 bg-amber-500/10';
  }
}

export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    typescript: 'bg-blue-500',
    javascript: 'bg-yellow-500',
    python: 'bg-green-500',
    go: 'bg-cyan-500',
    rust: 'bg-orange-500',
    java: 'bg-red-500',
    markdown: 'bg-gray-500',
  };
  return colors[language] || 'bg-purple-500';
}
