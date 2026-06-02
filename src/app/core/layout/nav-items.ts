export interface NavItem {
  key: string;
  route: string;
}

export function getNavItems(role: string): NavItem[] {
  const items: NavItem[] = [
    { key: 'nav.dashboard', route: '/dashboard' },
  ];
  if (role === 'admin' || role === 'staff') {
    items.push({ key: 'nav.staff', route: '/staff/dashboard' });
  }
  items.push(
    { key: 'nav.routines', route: '/routines' },
    { key: 'nav.history', route: '/history' },
    { key: 'nav.exercises', route: '/exercises' },
    { key: 'nav.metrics', route: '/metrics' },
  );
  if (role === 'admin') {
    items.push({ key: 'nav.admin', route: '/admin/dashboard' });
  }
  items.push({ key: 'nav.settings', route: '/settings' });
  return items;
}
