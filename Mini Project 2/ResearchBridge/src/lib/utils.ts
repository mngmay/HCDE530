import type { Stance, InfluenceLevel, InterestLevel } from '../lib/types';

export function stanceColor(stance: Stance): 'success' | 'warning' | 'error' | 'default' {
  switch (stance) {
    case 'supporter': return 'success';
    case 'neutral': return 'warning';
    case 'blocker': return 'error';
    default: return 'default';
  }
}

export function levelColor(level: InfluenceLevel | InterestLevel): 'error' | 'warning' | 'success' {
  switch (level) {
    case 'high': return 'error';
    case 'medium': return 'warning';
    case 'low': return 'success';
  }
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

export function avatarColor(name: string): string {
  const colors = ['#1565c0', '#00695c', '#6a1b9a', '#c62828', '#e65100', '#2e7d32'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}
