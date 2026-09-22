import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { PDFDocument as PdfLibDocument, StandardFonts, rgb } from 'pdf-lib';
import { createPdfDocumentWithTables } from 'pdfkit-table';

const LOGO_PATH = path.join(process.cwd(), 'logo.png');

const COMPANY = {
  name: 'PT. RUBARTA PRIMA ABADI',
  address: [
    'The Savoy Blok B1-20. River Garden Boulevard',
    'Jakarta Garden City, Cakung',
    'Jakarta Timur 13910',
  ],
};

const COLORS = {
  green: '#1CA84B',
  navy: '#12355B',
  gray: '#555555',
  border: '#808181',
};

function formatDate(value?: Date | string | null) {
  if (!value) return '-';
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

async function addPageNumbers(pdfBuffer: Buffer): Promise<Buffer> {
  const document = await PdfLibDocument.load(pdfBuffer);
  const pages = document.getPages();
  const font = await document.embedFont(StandardFonts.Helvetica);
  const fontSize = 8;

  pages.forEach((page, index) => {
    const label = `Page ${index + 1} of ${pages.length}`;
    const { width } = page.getSize();
    const labelWidth = font.widthOfTextAtSize(label, fontSize);

    page.drawText(label, {
      x: (width - labelWidth) / 2,
      y: 50,
      size: fontSize,
      font,
      color: rgb(0.33, 0.33, 0.33),
    });
  });

  return Buffer.from(await document.save());
}

export function generateGoodsReceiptPdf(goodsReceipt: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const PDFDocumentWithTables = createPdfDocumentWithTables(PDFDocument);
    const doc = new PDFDocumentWithTables({
      size: 'A4',
      margin: 40,
      bufferPages: true,
    });
    const chunks: Buffer[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => {
      addPageNumbers(Buffer.concat(chunks)).then(resolve).catch(reject);
    });
    doc.on('error', reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;
    const infoBoxWidth = 200;
    const infoBoxX = right - infoBoxWidth;
    const contentTop = 220;
    const infoRows: [string, string][] = [
      ['No', goodsReceipt.number],
      ['Date', formatDate(goodsReceipt.date)],
      ['PO Number', goodsReceipt.PurchaseOrder?.number || '-'],
      ['Sender', goodsReceipt.sender || '-'],
      ['Recipient', goodsReceipt.recipient || '-'],
    ];

    const drawPageHeader = () => {
      const headerTop = doc.page.margins.top;

      if (fs.existsSync(LOGO_PATH)) {
        doc.image(LOGO_PATH, left, headerTop, { width: 45 });
      }

      doc
        .fillColor(COLORS.green)
        .fontSize(13)
        .font('Helvetica-Bold')
        .text(COMPANY.name, left + 55, headerTop, { width: 260 });

      doc
        .fillColor(COLORS.gray)
        .fontSize(8)
        .font('Helvetica')
        .text(COMPANY.address.join('\n'), left + 55, headerTop + 18, {
          width: 260,
        });

      doc
        .fillColor(COLORS.navy)
        .fontSize(20)
        .font('Helvetica-Bold')
        .text('GOODS RECEIPT', infoBoxX, headerTop, {
          width: infoBoxWidth,
          align: 'right',
        });

      doc
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .rect(infoBoxX, headerTop + 28, infoBoxWidth, 80)
        .stroke();

      doc.table({
        headers: [
          {
            label: 'Property',
            width: 80,
            property: 'property',
            padding: [0, 0, 0, 5],
          },
          { label: 'Value', width: 120, property: 'value' },
        ],
        data: infoRows.map(([label, value]) => ({
          property: `bold:${label}`,
          value: `: ${value}`,
        })),
        options: {
          x: infoBoxX,
          y: headerTop + 30,
          width: infoBoxWidth,
          hideHeader: true,
        },
      });

      doc
        .fillColor(COLORS.navy)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('SUPPLIER', left, 120);
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(goodsReceipt.Supplier?.name || '-', left, 132);

      drawWatermark();
      doc.y = contentTop;
    };

    const drawWatermark = () => {
      const status = String(goodsReceipt?.status ?? '')
        .trim()
        .toUpperCase();
      if (!['DRAFT'].includes(status)) {
        return;
      }

      const centerX = doc.page.width / 2;
      const centerY = doc.page.height / 2;

      const strokeColor = status === 'DRAFT' ? '#FF0000' : '#008000';

      doc
        .save()
        .rotate(315, { origin: [centerX, centerY] })
        .font('Helvetica-Bold')
        .fontSize(90)
        .strokeColor(strokeColor)
        .lineWidth(1.2)
        .text(status.split('').join(' '), centerX - 250, centerY - 28, {
          align: 'center',
          stroke: true,
          fill: false,
        })
        .restore();
    };

    drawPageHeader();
    doc.on('pageAdded', drawPageHeader);

    const columns = [
      { property: 'no', label: 'NO.', width: 30, align: 'center' as const },
      {
        property: 'partNumber',
        label: 'PART NO.',
        width: 80,
        align: 'left' as const,
      },
      {
        property: 'partNumberSupplier',
        label: 'SUPPLIER P/N',
        width: 80,
        align: 'left' as const,
      },
      {
        property: 'description',
        label: 'DESCRIPTION',
        width: width - 30 - 80 - 80 - 65 - 65 - 60,
        align: 'left' as const,
      },
      {
        property: 'quantityOrder',
        label: 'QTY ORDER',
        width: 65,
        align: 'right' as const,
      },
      {
        property: 'quantityReceived',
        label: 'QTY RECEIVED',
        width: 65,
        align: 'right' as const,
      },
      {
        property: 'balance',
        label: 'BALANCE',
        width: 60,
        align: 'right' as const,
      },
    ];

    doc.table(
      {
        headers: columns,
        data: (goodsReceipt.GoodsReceiptItems || []).map((item, index) => ({
          no: String(index + 1),
          partNumber: item.partNumber || '-',
          partNumberSupplier: item.partNumberSupplier || '-',
          description: item.description || '-',
          quantityOrder: String(item.quantityOrder),
          quantityReceived: String(item.quantityReceived),
          balance: String(item.quantityOrder - item.quantityReceived),
        })),
      },
      { y: contentTop - 30, x: left, absolutePosition: true },
    );

    doc.moveDown();
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(`Notes: ${goodsReceipt.notes || '-'}`);
    doc.end();
  });
}
