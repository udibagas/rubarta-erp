import { extractTokens, groupRows } from './pdf';
import { OrderItemSchema } from './schema';
import {
  columnNames,
  type ColumnName,
  type OrderItem,
  type ParseResult,
  type ParseWarning,
  type TextRow,
  type TextToken,
} from './types.js';

// These relative positions are a fallback for PPO055251-RBT's A4 layout. Header
// detection normally replaces them with exact X coordinates from every PDF.
const FALLBACK_STARTS: Record<ColumnName, number> = {
  lineNo: 9,
  manufacturer: 48,
  vendorPartNo: 126,
  description: 197,
  tariffCode: 267,
  quantity: 314,
  unit: 358,
  unitPrice: 393,
  discountPercent: 439,
  netUnitPrice: 495,
  netAmount: 555,
  weight: 631,
};

const headerNeedles: Record<ColumnName, RegExp> = {
  lineNo: /^line\s*no/i,
  manufacturer: /^manufacturer/i,
  vendorPartNo: /^vendor\s*part/i,
  description: /^description/i,
  tariffCode: /^tar+if+\s*code/i,
  quantity: /^quantity/i,
  unit: /^unit$/i,
  unitPrice: /^unit\s*price/i,
  discountPercent: /^discount/i,
  netUnitPrice: /^net\s*unit/i,
  netAmount: /^net\s*amount/i,
  weight: /^weight/i,
};

function rowString(row: TextRow) {
  return row.tokens
    .map((x) => x.text)
    .join(' ')
    .replace(/\s+/g, ' ');
}

/** Get real column X starts from the table header. Handles headings split into tokens. */
function detectColumns(rows: TextRow[]): Record<ColumnName, number> {
  const pageOne = rows.filter((r) => r.page === 1);
  const out = { ...FALLBACK_STARTS };
  for (const column of columnNames) {
    const needle = headerNeedles[column];
    const candidates = pageOne.flatMap((row) => {
      const hits: TextToken[] = [];
      for (let i = 0; i < row.tokens.length; i++) {
        for (let j = i; j < Math.min(row.tokens.length, i + 4); j++) {
          if (
            needle.test(
              row.tokens
                .slice(i, j + 1)
                .map((x) => x.text)
                .join(' '),
            )
          )
            hits.push(row.tokens[i]);
        }
      }
      return hits;
    });
    if (candidates.length)
      out[column] = Math.min(...candidates.map((x) => x.x));
  }
  return out;
}

function columnFor(x: number, starts: Record<ColumnName, number>): ColumnName {
  let current: ColumnName = columnNames[0];
  for (const name of columnNames) if (x >= starts[name] - 1.5) current = name;
  return current;
}

function append(oldValue: string, next: string, field: ColumnName): string {
  if (!oldValue) return next;
  // PDF often emits "17,920,240." then "00" or part-number suffixes separately.
  if (
    field === 'vendorPartNo' ||
    /[-.,/]$/.test(oldValue) ||
    ((field === 'unitPrice' ||
      field === 'netUnitPrice' ||
      field === 'netAmount' ||
      field === 'weight') &&
      /^\d/.test(next)) ||
    (field === 'description' &&
      next.length <= 3 &&
      /[A-Za-z0-9]$/.test(oldValue) &&
      /^[A-Za-z0-9]/.test(next))
  )
    return oldValue + next;
  return `${oldValue} ${next}`;
}

function numberFrom(value: string | undefined, percent = false): number | null {
  if (!value) return null;
  const normalized = value
    .replace(/\s/g, '')
    .replace(/%/g, '')
    .replace(/,/g, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? (percent ? n : n) : null;
}

type Raw = Record<ColumnName, string> & { pages: Set<number> };
function blankRaw(): Raw {
  return {
    lineNo: '',
    manufacturer: '',
    vendorPartNo: '',
    description: '',
    tariffCode: '',
    quantity: '',
    unit: '',
    unitPrice: '',
    discountPercent: '',
    netUnitPrice: '',
    netAmount: '',
    weight: '',
    pages: new Set(),
  };
}
function isLineStart(
  row: TextRow,
  starts: Record<ColumnName, number>,
): boolean {
  return row.tokens.some(
    (t) => columnFor(t.x, starts) === 'lineNo' && /^\d{2,5}$/.test(t.text),
  );
}
function isFooter(row: TextRow): boolean {
  return /total\s+(?:excl|incl|discount)|gross\s+weight|purchase order number|page\s+\d|payable\s+to|vat\s*(?:code|%|total)/i.test(
    rowString(row),
  );
}

function isTableHeader(row: TextRow): boolean {
  const text = rowString(row);
  return (
    /line\s*no/i.test(text) &&
    /manufacturer/i.test(text) &&
    /vendor\s*part/i.test(text)
  );
}

function makeItem(raw: Raw, warnings: ParseWarning[]): OrderItem | null {
  const lineNo = numberFrom(raw.lineNo);
  const quantity = numberFrom(raw.quantity);
  const unitPrice = numberFrom(raw.unitPrice);
  const discountPercent = numberFrom(raw.discountPercent);
  const netUnitPrice = numberFrom(raw.netUnitPrice);
  const netAmount = numberFrom(raw.netAmount);
  if (
    [
      lineNo,
      quantity,
      unitPrice,
      discountPercent,
      netUnitPrice,
      netAmount,
    ].some((x) => x === null)
  ) {
    warnings.push({
      lineNo: lineNo ?? undefined,
      message: `Incomplete numeric columns: ${JSON.stringify(raw)}`,
    });
    return null;
  }
  const item: OrderItem = {
    lineNo: lineNo!,
    manufacturer: raw.manufacturer || null,
    vendorPartNo: raw.vendorPartNo || null,
    description: raw.description,
    tariffCode: raw.tariffCode || null,
    quantity: quantity!,
    unit: raw.unit || null,
    unitPrice: unitPrice!,
    discountPercent: discountPercent!,
    netUnitPrice: netUnitPrice!,
    netAmount: netAmount!,
    weight: numberFrom(raw.weight),
    sourcePages: [...raw.pages],
  };
  const parsed = OrderItemSchema.safeParse(item);
  if (!parsed.success) {
    warnings.push({
      lineNo: item.lineNo,
      message: parsed.error.issues.map((x) => x.message).join('; '),
    });
    return null;
  }
  const expected = item.quantity * item.netUnitPrice;
  if (Math.abs(expected - item.netAmount) > 0.02)
    warnings.push({
      lineNo: item.lineNo,
      message: `netAmount ${item.netAmount} differs from qty × netUnitPrice (${expected})`,
    });
  return item;
}

export async function parsePurchaseOrderItems(
  pdfBuffer: Buffer,
): Promise<ParseResult> {
  const rows = groupRows(await extractTokens(pdfBuffer));
  const columnStarts = detectColumns(rows);
  const warnings: ParseWarning[] = [];
  const items: OrderItem[] = [];
  let current: Raw | null = null;
  let activePage = 0;
  let inTable = false;
  for (const row of rows) {
    if (row.page !== activePage) {
      activePage = row.page;
      inTable = false;
    }
    if (isTableHeader(row)) {
      inTable = true;
      continue;
    }
    if (isFooter(row)) {
      inTable = false;
      continue;
    }
    if (!inTable) continue;
    if (isLineStart(row, columnStarts)) {
      if (current) {
        const item = makeItem(current, warnings);
        if (item) items.push(item);
      }
      current = blankRaw();
    }
    if (!current) continue;
    for (const token of row.tokens) {
      // The source renders a standalone "LS" below several tariff codes. It is
      // not part of the printed tariff value and must not poison numeric parsing.
      if (token.text === 'LS') continue;
      const column = columnFor(token.x, columnStarts);
      current[column] = append(current[column], token.text, column);
      current.pages.add(row.page);
    }
  }
  if (current) {
    const item = makeItem(current, warnings);
    if (item) items.push(item);
  }
  for (let i = 1; i < items.length; i++)
    if (items[i].lineNo <= items[i - 1].lineNo)
      warnings.push({
        lineNo: items[i].lineNo,
        message: 'Line number is not increasing',
      });
  return { items, warnings, columnStarts };
}
