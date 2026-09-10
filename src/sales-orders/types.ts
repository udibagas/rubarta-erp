export const columnNames = [
  'lineNo',
  'manufacturer',
  'vendorPartNo',
  'description',
  'tariffCode',
  'quantity',
  'unit',
  'unitPrice',
  'discountPercent',
  'netUnitPrice',
  'netAmount',
  'weight',
] as const;

export type ColumnName = (typeof columnNames)[number];

export interface TextToken {
  page: number;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TextRow {
  page: number;
  y: number;
  tokens: TextToken[];
}

export interface OrderItem {
  lineNo: number;
  manufacturer: string | null;
  vendorPartNo: string | null;
  description: string;
  tariffCode: string | null;
  quantity: number;
  unit: string | null;
  unitPrice: number;
  discountPercent: number;
  netUnitPrice: number;
  netAmount: number;
  weight: number | null;
  /** Useful when a validation warning needs a manual review. */
  sourcePages: number[];
}

export interface ParseWarning {
  lineNo?: number;
  message: string;
}

export interface ParseResult {
  items: OrderItem[];
  warnings: ParseWarning[];
  columnStarts: Record<ColumnName, number>;
}
