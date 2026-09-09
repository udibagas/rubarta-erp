import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import type { TextToken, TextRow } from './types';

/** Extracts PDF text with its original page-space coordinates. */
export async function extractTokens(pdfBuffer: Buffer): Promise<TextToken[]> {
  const bytes = new Uint8Array(pdfBuffer);
  // The legacy Node build does not require a browser worker.
  const document = await getDocument({ data: bytes }).promise;
  const tokens: TextToken[] = [];

  for (let pageNo = 1; pageNo <= document.numPages; pageNo++) {
    const page = await document.getPage(pageNo);
    const content = await page.getTextContent();
    for (const item of content.items) {
      if (!('str' in item) || !item.str.trim()) continue;
      const [, , , , x, y] = item.transform;
      tokens.push({
        page: pageNo,
        text: item.str.trim(),
        x,
        y,
        width: item.width,
        height: item.height,
      });
    }
  }
  return tokens;
}

/** PDF Y values differ by tiny fractions. Cluster them into visual rows. */
export function groupRows(tokens: TextToken[], tolerance = 2.2): TextRow[] {
  const rows: TextRow[] = [];
  for (const token of [...tokens].sort(
    (a, b) => a.page - b.page || b.y - a.y || a.x - b.x,
  )) {
    const existing = rows.find(
      (row) =>
        row.page === token.page && Math.abs(row.y - token.y) <= tolerance,
    );
    if (existing) {
      existing.tokens.push(token);
      existing.y =
        (existing.y * (existing.tokens.length - 1) + token.y) /
        existing.tokens.length;
    } else rows.push({ page: token.page, y: token.y, tokens: [token] });
  }
  return rows.map((row) => ({
    ...row,
    tokens: row.tokens.sort((a, b) => a.x - b.x),
  }));
}
