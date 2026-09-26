import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { PDFDocument as PdfLibDocument, StandardFonts, rgb } from 'pdf-lib';
import { createPdfDocumentWithTables } from 'pdfkit-table';

const LOGO_PATH = path.join(process.cwd(), 'logo.png');

const DEFAULT_COMPANY = {
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

export function generateDeliveryOrderPdf(deliveryOrder: any): Promise<Buffer> {
  const COMPANY = {
    name: deliveryOrder.Company?.name?.toUpperCase() ?? DEFAULT_COMPANY.name,
    address:
      deliveryOrder.Company?.address?.split('\n') ?? DEFAULT_COMPANY.address,
  };

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
      ['DO Number', deliveryOrder.number],
      ['Date', formatDate(deliveryOrder.date)],
      ['SO Number', deliveryOrder.SalesOrder?.number || '-'],
      [
        'Reference Number',
        deliveryOrder.referenceNumber ||
          deliveryOrder.SalesOrder?.referenceNumber ||
          '-',
      ],
      ['Receipt Number', deliveryOrder.receiptNumber || '-'],
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
        .text('DELIVERY ORDER', infoBoxX, headerTop, {
          width: infoBoxWidth,
          align: 'right',
        });

      doc
        .lineWidth(0.5)
        .strokeColor(COLORS.border)
        .rect(infoBoxX, headerTop + 28, infoBoxWidth, 80.2)
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
        .text('CUSTOMER', left, 120);
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(deliveryOrder.Customer?.name || '-', left, 132);
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica')
        .text(deliveryOrder.Customer?.address || '-', left, 144);

      // contact person
      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica')
        .text(
          'Attn'.padEnd(15, ' ') +
            ': ' +
            (deliveryOrder.Customer?.Contacts?.[0]?.name || ''),
          left,
          180,
        );

      doc
        .fillColor('#000000')
        .fontSize(9)
        .font('Helvetica')
        .text(
          'Phone'.padEnd(12, ' ') +
            ': ' +
            (deliveryOrder.Customer?.Contacts?.[0]?.phone || ''),
          left,
          192,
        );

      drawWatermark();
      doc.y = contentTop;
    };

    const drawWatermark = () => {
      const status = String(deliveryOrder?.status ?? '')
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
        property: 'partNumberSupply',
        label: 'SUPPLY P/N',
        width: 80,
        align: 'left' as const,
      },
      {
        property: 'description',
        label: 'DESCRIPTION',
        width: width - 30 - 80 - 80 - 65,
        align: 'left' as const,
      },
      {
        property: 'quantitySupply',
        label: 'QTY',
        width: 65,
        align: 'center' as const,
      },
    ];

    doc.table(
      {
        headers: columns,
        data: (deliveryOrder.DeliveryOrderItems || []).map((item, index) => ({
          no: String(index + 1),
          partNumber: item.partNumber || '-',
          partNumberSupply: item.partNumberSupply || '-',
          description: item.description || '-',
          quantitySupply: String(item.quantitySupply),
        })),
      },
      { y: contentTop, x: left, absolutePosition: true },
    );

    doc.moveDown();
    doc
      .font('Helvetica')
      .fontSize(9)
      .text(`Notes: ${deliveryOrder.notes || '-'}`);

    const signatureTop = doc.y + 30;
    const signatureColumnWidth = width / 3;
    const signatureColumns = [
      {
        title: 'Pengirim :',
        organization: COMPANY.name,
        name: deliveryOrder.sender || '-',
      },
      {
        title: 'Expedisi/Courier :',
        organization: '',
        // name: deliveryOrder.pickUpBy || '____________',
        name: '____________',
      },
      {
        title: 'Penerima :',
        organization: deliveryOrder.Customer?.name || '-',
        // name: deliveryOrder.Customer?.name || '____________',
        name: '____________',
      },
    ];

    signatureColumns.forEach((column, index) => {
      const columnX = left + index * signatureColumnWidth;

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .fillColor('#000000')
        .text(column.title, columnX, signatureTop, {
          width: signatureColumnWidth,
          align: 'center',
        })
        .text(column.organization, columnX, signatureTop + 14, {
          width: signatureColumnWidth,
          align: 'center',
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(9)
        .text(`( ${column.name} )`, columnX, signatureTop + 76, {
          width: signatureColumnWidth,
          align: 'center',
        });

      doc
        .font('Helvetica-Oblique')
        .fontSize(8)
        .text('TANDA TANGAN & NAMA JELAS', columnX, signatureTop + 91, {
          width: signatureColumnWidth,
          align: 'center',
        });
    });

    doc.end();
  });
}
