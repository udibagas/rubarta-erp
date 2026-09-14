export const columnNames = [
  'orderNo',
  'dealerPo',
  'lineNo',
  'brand',
  'packedPartNo',
  'packedQty',
  'uom',
  'description',
  'tariffCode',
  'weightPerItem',
  'totalWeight',
] as const;

export type ColumnName = (typeof columnNames)[number];

export interface PackedItem {
  lineNo: number;
  packedPartNo: string;
  packedQty: number;
  description: string;
  /** Useful when a validation warning needs a manual review. */
  sourcePages: number[];
}

export interface ParseWarning {
  lineNo?: number;
  message: string;
}

export interface ParseResult {
  items: PackedItem[];
  warnings: ParseWarning[];
  columnStarts: Record<ColumnName, number>;
}
