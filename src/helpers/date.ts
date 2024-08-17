export function formatDate(date: Date): string {
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function formatDateNumeric(date: Date): string {
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
