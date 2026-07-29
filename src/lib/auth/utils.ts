export function isInternalRoute(path: string): boolean {
  if (!path.startsWith('/') || path.startsWith('//')) return false;
  const slashIndex = path.indexOf('/');
  if (slashIndex === -1) return !path.includes(':');
  return !path.slice(0, slashIndex).includes(':');
}
