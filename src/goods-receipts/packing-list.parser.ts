import { extractTokens, groupRows } from '../sales-orders/pdf';
import type { TextRow, TextToken } from '../sales-orders/types';
import { PackedItemSchema } from './packing-list.schema';
import {
  columnNames,
  type ColumnName,
  type PackedItem,
  type ParseResult,
  type ParseWarning,
} from './packing-list.types';

// Rough relative positions for a landscape A4 packing list. Header detection
// normally replaces them with exact X coordinates read from the PDF itself.
const FALLBACK_STARTS: Record<ColumnName, number> = {
  orderNo: 11,
  dealerPo: 74,
  lineNo: 151,
  brand: 189,
  packedPartNo: 226,
  packedQty: 309,
  uom: 365,
  description: 399,
  tariffCode: 494,
  weightPerItem: 572,
  totalWeight: 632,
};

const headerNeedles: Record<ColumnName, RegExp> = {
  orderNo: /^order\s*no/i,
  dealerPo: /^dealer\s*po/i,
  lineNo: /^line\s*no/i,
  brand: /^brand/i,
  packedPartNo: /^packed\s*p\/?n/i,
  packedQty: /^packed\s*qty/i,
  uom: /^uom/i,
  description: /^description/i,
  tariffCode: /^tar+if+\s*code/i,
  weightPerItem: /^weight\/?\s*item/i,
  totalWeight: /^total\s*weight/i,
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
  if (field === 'packedPartNo' || /[-.,/]$/.test(oldValue))
    return oldValue + next;
  return `${oldValue} ${next}`;
}

function numberFrom(value: string | undefined): number | null {
  if (!value) return null;
  const normalized = value.replace(/\s/g, '').replace(/,/g, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(normalized)) return null;
  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

type Raw = Record<ColumnName, string> & { pages: Set<number> };
function blankRaw(): Raw {
  return {
    orderNo: '',
    dealerPo: '',
    lineNo: '',
    brand: '',
    packedPartNo: '',
    packedQty: '',
    uom: '',
    description: '',
    tariffCode: '',
    weightPerItem: '',
    totalWeight: '',
    pages: new Set(),
  };
}

function isLineStart(
  row: TextRow,
  starts: Record<ColumnName, number>,
): boolean {
  const hasLineNo = row.tokens.some(
    (t) => columnFor(t.x, starts) === 'lineNo' && /^\d{1,4}$/.test(t.text),
  );
  const hasQty = row.tokens.some(
    (t) => columnFor(t.x, starts) === 'packedQty' && /^\d{1,5}$/.test(t.text),
  );
  return hasLineNo && hasQty;
}

// A page break repeats the document header/address block above the table but
// doesn't repeat the column header row, so an order number is the only
// reliable signal that real data has resumed.
function isDataStart(row: TextRow): boolean {
  return row.tokens.some((t) => /^[A-Z]{1,4}\d{5,}$/i.test(t.text));
}

function isFooter(row: TextRow): boolean {
  const text = rowString(row);
  return /case\s+total|shipment\s+total|total\s+item|total\s+qty|total\s+cases|total\s+net\s*weight|total\s+gross\s*weight|page:\s*\d+\s*\/\s*\d+|\d{1,2}:\d{2}\s*(am|pm)/i.test(
    text,
  );
}

function isTableHeader(row: TextRow): boolean {
  const text = rowString(row);
  return (
    /order\s*no/i.test(text) &&
    /packed\s*p\/?n/i.test(text) &&
    /description/i.test(text)
  );
}

function makeItem(raw: Raw, warnings: ParseWarning[]): PackedItem | null {
  const lineNo = numberFrom(raw.lineNo);
  const packedQty = numberFrom(raw.packedQty);
  if (lineNo === null || packedQty === null || !raw.packedPartNo) {
    warnings.push({
      lineNo: lineNo ?? undefined,
      message: `Incomplete row: ${JSON.stringify(raw)}`,
    });
    return null;
  }
  const item: PackedItem = {
    lineNo,
    packedPartNo: raw.packedPartNo,
    packedQty,
    description: raw.description,
    sourcePages: [...raw.pages],
  };
  const parsed = PackedItemSchema.safeParse(item);
  if (!parsed.success) {
    warnings.push({
      lineNo: item.lineNo,
      message: parsed.error.issues.map((x) => x.message).join('; '),
    });
    return null;
  }
  return item;
}

export async function parsePackingListItems(
  pdfBuffer: Buffer,
): Promise<ParseResult> {
  const rows = groupRows(await extractTokens(pdfBuffer));
  const columnStarts = detectColumns(rows);
  const warnings: ParseWarning[] = [];
  const items: PackedItem[] = [];
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
    if (isDataStart(row)) inTable = true;
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
      const column = columnFor(token.x, columnStarts);
      current[column] = append(current[column], token.text, column);
      current.pages.add(row.page);
    }
  }
  if (current) {
    const item = makeItem(current, warnings);
    if (item) items.push(item);
  }
  return { items, warnings, columnStarts };
}
