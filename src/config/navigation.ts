import { ClipboardPenLine, FileClock, LayoutDashboard, Settings } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavigationItem {
  label: string;
  path: string;
  icon: LucideIcon;
  adminOnly?: boolean;
}

export const navigationItems: NavigationItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'Reportar', path: '/acciones', icon: ClipboardPenLine },
  { label: 'Historial', path: '/historial', icon: FileClock },
  { label: 'Configuracion', path: '/configuracion', icon: Settings, adminOnly: true },
];
