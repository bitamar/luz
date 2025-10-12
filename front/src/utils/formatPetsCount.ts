export function formatPetsCount(count: number): string {
  if (count === 1) return 'חיה אחת';
  return `${count} חיות`;
}
