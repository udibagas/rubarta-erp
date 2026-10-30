import { BadRequestException } from '@nestjs/common';

export function findDuplicatePartNumbers(
  items: { partNumber: string }[],
): string[] {
  const seenPartNumbers = new Set<string>();
  const duplicatePartNumbers = new Set<string>();

  for (const { partNumber } of items) {
    if (seenPartNumbers.has(partNumber)) {
      duplicatePartNumbers.add(partNumber);
    } else {
      seenPartNumbers.add(partNumber);
    }
  }

  return [...duplicatePartNumbers];
}

export function assertNoDuplicatePartNumbers(
  items: { partNumber: string }[],
  documentName: string,
): void {
  const duplicatePartNumbers = findDuplicatePartNumbers(items);

  if (duplicatePartNumbers.length > 0) {
    throw new BadRequestException({
      message: `Invalid ${documentName} Items`,
      errors: [
        {
          property: 'items',
          error: `Duplicate part numbers are not allowed: ${duplicatePartNumbers.join(', ')}.`,
        },
      ],
    });
  }
}
