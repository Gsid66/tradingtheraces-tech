export function normalizeHorseName(name: string | null | undefined): string {
  if (!name) return '';
  
  return name
    .toLowerCase()
    .replace(/[']/g, '')
    .replace(/[.]/g, '')
    .replace(/[-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function horseNamesMatch(name1: string | null | undefined, name2: string | null | undefined): boolean {
  const normalized1 = normalizeHorseName(name1);
  const normalized2 = normalizeHorseName(name2);
  
  if (!normalized1 || !normalized2) return false;
  
  return normalized1 === normalized2;
}
