import { jsPDF } from 'jspdf';
import { formatDateTime, numberToWords } from '../utils/formatters';

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 14;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const BOTTOM_LIMIT = PAGE_HEIGHT - 14;

const cleanPdfText = (value) => {
  if (value === null || value === undefined) return '';

  return String(value)
    .replace(/₹/g, 'Rs. ')
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/•/g, '-')
    .replace(/\u00a0/g, ' ');
};

const formatPdfAmount = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return 'Rs. 0.00';
  }

  return `Rs. ${new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)}`;
};

const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
};

const drawTableHeader = (doc, y, columns) => {
  const headerHeight = 9;

  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.rect(MARGIN, y, CONTENT_WIDTH, headerHeight, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);

  columns.forEach((column) => {
    const textY = y + 5.8;

    if (column.align === 'right') {
      doc.text(column.label, column.x + column.width - 2, textY, {
        align: 'right',
      });
    } else if (column.align === 'center') {
      doc.text(column.label, column.x + column.width / 2, textY, {
        align: 'center',
      });
    } else {
      doc.text(column.label, column.x + 2, textY);
    }
  });

  return y + headerHeight;
};

export const exportService = {
  /**
   * Export an array of objects to CSV.
   */
  exportToCSV: (filename, rows = [], headers = []) => {
    if (!rows || rows.length === 0) {
      alert('No data available to export.');
      return;
    }

    const headerKeys = headers.map((header) => header.key);
    const headerLabels = headers.map((header) =>
      `"${String(header.label || '').replace(/"/g, '""')}"`,
    );

    const csvContent = [
      headerLabels.join(','),
      ...rows.map((row) =>
        headerKeys
          .map((key) => {
            const value =
              row[key] === undefined || row[key] === null
                ? ''
                : String(row[key]);

            return `"${value.replace(/"/g, '""')}"`;
          })
          .join(','),
      ),
    ].join('\r\n');

    const blob = new Blob([csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.href = url;
    link.download = `${filename}.csv`;
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  /**
   * Generate and download a readable A4 invoice PDF.
   * Uses "Rs." instead of the rupee glyph because jsPDF's built-in
   * Helvetica font does not reliably include the rupee character.
   */
  downloadInvoicePDF: (invoice, settings) => {
    try {
      if (!invoice) {
        alert('Invoice data is not available.');
        return;
      }

      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
        compress: true,
      });

      const store = settings?.store || {};
      const billing = settings?.billing || {};
      const customer = invoice.customer || {};
      const summary = invoice.summary || {};
      const payment = invoice.payment || {};
      const items = Array.isArray(invoice.items) ? invoice.items : [];

      const primaryColor = [15, 23, 42];
      const accentColor = [79, 70, 229];
      const textColor = [30, 41, 59];
      const mutedColor = [100, 116, 139];
      const borderColor = [203, 213, 225];

      const storeName = cleanPdfText(
        store.storeName || 'SRI MEENAKSHI SILKS & TEXTILES',
      );

      // Header banner
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, PAGE_WIDTH, 29, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);

      const storeNameLines = doc.splitTextToSize(storeName, 125);
      doc.text(storeNameLines.slice(0, 2), MARGIN, 10);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text(
        cleanPdfText(
          store.tagline || 'Authentic South Indian Silks & Handlooms',
        ),
        MARGIN,
        18,
      );
      doc.text(
        cleanPdfText(
          `GSTIN: ${store.gstin || '-'} | State: ${store.state || 'Tamil Nadu'} (Code: ${store.stateCode || '33'})`,
        ),
        MARGIN,
        24,
      );

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('TAX INVOICE', PAGE_WIDTH - MARGIN, 12, {
        align: 'right',
      });

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('ORIGINAL FOR RECIPIENT', PAGE_WIDTH - MARGIN, 19, {
        align: 'right',
      });

      // Customer and invoice information
      let y = 37;
      const leftX = MARGIN;
      const rightX = 112;
      const infoWidth = 84;

      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('CUSTOMER / BILLED TO', leftX, y);
      doc.text('INVOICE DETAILS', rightX, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);

      const customerLines = [
        `Name: ${customer.name || 'Walk-in Customer'}`,
        `Phone: ${customer.phone || '-'}`,
      ];

      if (customer.address) {
        customerLines.push(`Address: ${customer.address}`);
      }

      if (customer.city) {
        customerLines.push(
          `Place: ${customer.city}, ${customer.state || 'Tamil Nadu'}`,
        );
      }

      if (customer.gstin) {
        customerLines.push(`GSTIN: ${customer.gstin}`);
      }

      const invoiceLines = [
        `Invoice No: ${invoice.invoiceNumber || '-'}`,
        `Date & Time: ${formatDateTime(invoice.date)}`,
        `Payment Mode: ${payment.method || 'Cash'}`,
        `Cashier: ${invoice.cashier || 'Terminal 01'}`,
      ];

      const infoLineHeight = 4.5;
      const maxInfoLines = Math.max(customerLines.length, invoiceLines.length);

      customerLines.forEach((line, index) => {
        const wrapped = doc.splitTextToSize(cleanPdfText(line), infoWidth);
        doc.text(wrapped, leftX, y + 5 + index * infoLineHeight);
      });

      invoiceLines.forEach((line, index) => {
        const wrapped = doc.splitTextToSize(cleanPdfText(line), infoWidth);
        doc.text(wrapped, rightX, y + 5 + index * infoLineHeight);
      });

      y += 8 + maxInfoLines * infoLineHeight + 4;

      // Table columns: total width is 182mm, matching the page content width.
      const columns = [
        { key: 'index', label: '#', x: MARGIN, width: 8, align: 'center' },
        {
          key: 'item',
          label: 'Item Description / Variant',
          x: MARGIN + 8,
          width: 72,
          align: 'left',
        },
        {
          key: 'quantity',
          label: 'Qty',
          x: MARGIN + 80,
          width: 15,
          align: 'center',
        },
        {
          key: 'rate',
          label: 'Rate',
          x: MARGIN + 95,
          width: 27,
          align: 'right',
        },
        {
          key: 'gst',
          label: 'GST',
          x: MARGIN + 122,
          width: 18,
          align: 'center',
        },
        {
          key: 'amount',
          label: 'Amount',
          x: MARGIN + 140,
          width: 42,
          align: 'right',
        },
      ];

      const startTableOnNewPage = () => {
        doc.addPage();
        doc.setTextColor(...textColor);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`Invoice: ${cleanPdfText(invoice.invoiceNumber || '-')}`, MARGIN, 14);
        return drawTableHeader(doc, 18, columns);
      };

      y = drawTableHeader(doc, y, columns);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...textColor);

      items.forEach((item, index) => {
        const description = cleanPdfText(item.name || 'Item');
        const variantParts = [item.size, item.color]
          .filter(Boolean)
          .map(cleanPdfText);
        const details = [
          ...variantParts,
          item.sku ? `SKU: ${cleanPdfText(item.sku)}` : '',
        ]
          .filter(Boolean)
          .join(' | ');

        const descriptionLines = doc.splitTextToSize(description, 68);
        const detailLines = details
          ? doc.splitTextToSize(details, 68)
          : [];

        const lineCount = Math.max(
          descriptionLines.length + detailLines.length,
          1,
        );
        const rowHeight = Math.max(9, lineCount * 4 + 3);

        if (y + rowHeight > BOTTOM_LIMIT) {
          y = startTableOnNewPage();
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8);
          doc.setTextColor(...textColor);
        }

        const textY = y + 4;

        doc.text(String(index + 1), columns[0].x + columns[0].width / 2, textY, {
          align: 'center',
        });

        doc.setFont('helvetica', 'bold');
        doc.text(descriptionLines, columns[1].x + 2, textY);
        doc.setFont('helvetica', 'normal');

        if (detailLines.length > 0) {
          doc.setFontSize(7);
          doc.setTextColor(...mutedColor);
          doc.text(detailLines, columns[1].x + 2, textY + descriptionLines.length * 3.8);
          doc.setTextColor(...textColor);
          doc.setFontSize(8);
        }

        doc.text(
          cleanPdfText(item.quantity ?? 0),
          columns[2].x + columns[2].width / 2,
          textY,
          { align: 'center' },
        );

        doc.text(
          formatPdfAmount(item.unitPrice),
          columns[3].x + columns[3].width - 2,
          textY,
          { align: 'right' },
        );

        doc.text(
          `${safeNumber(item.gstRate)}%`,
          columns[4].x + columns[4].width / 2,
          textY,
          { align: 'center' },
        );

        doc.text(
          formatPdfAmount(item.lineTotal),
          columns[5].x + columns[5].width - 2,
          textY,
          { align: 'right' },
        );

        doc.setDrawColor(226, 232, 240);
        doc.line(MARGIN, y + rowHeight, PAGE_WIDTH - MARGIN, y + rowHeight);

        y += rowHeight;
      });

      if (items.length === 0) {
        doc.setTextColor(...mutedColor);
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8);
        doc.text('No invoice items.', MARGIN + 2, y + 6);
        y += 12;
      }

      y += 7;

      const totalRows = [
        ['Subtotal', formatPdfAmount(summary.grossSubtotal)],
      ];

      if (safeNumber(summary.totalDiscount) > 0) {
        totalRows.push([
          'Total Discount',
          `- ${formatPdfAmount(summary.totalDiscount)}`,
        ]);
      }

      totalRows.push([
        'Taxable Amount',
        formatPdfAmount(summary.taxableSubtotal),
      ]);

      const totalTax =
        summary.totalTax !== undefined
          ? summary.totalTax
          : safeNumber(summary.totalCGST) + safeNumber(summary.totalSGST);

      totalRows.push(['Total Tax (GST)', formatPdfAmount(totalTax)]);

      if (safeNumber(summary.roundOff) !== 0) {
        const roundOffPrefix = safeNumber(summary.roundOff) > 0 ? '+' : '';
        totalRows.push([
          'Round Off',
          `${roundOffPrefix}${formatPdfAmount(summary.roundOff)}`,
        ]);
      }

      const summaryBoxHeight = totalRows.length * 6 + 16;
      const words = cleanPdfText(numberToWords(summary.netPayable));
      const wordsLines = doc.splitTextToSize(words, 92);
      const paymentText = cleanPdfText(
        `Received ${formatPdfAmount(
          payment.amountReceived ?? summary.netPayable,
        )} via ${payment.method || 'Cash'}`,
      );
      const paymentLines = doc.splitTextToSize(paymentText, 92);
      const leftSummaryHeight =
        12 + wordsLines.length * 4 + 8 + paymentLines.length * 4;

      const summaryBlockHeight = Math.max(
        summaryBoxHeight,
        leftSummaryHeight,
      );

      if (y + summaryBlockHeight > BOTTOM_LIMIT) {
        doc.addPage();
        y = 18;
      }

      // Amount in words and payment details
      doc.setTextColor(...textColor);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('AMOUNT IN WORDS', MARGIN, y + 4);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.text(wordsLines, MARGIN, y + 9);

      const paymentY = y + 11 + wordsLines.length * 4;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text('PAYMENT DETAILS', MARGIN, paymentY);
      doc.text(paymentLines, MARGIN, paymentY + 4);

      if (safeNumber(payment.changeReturned) > 0) {
        const changeY = paymentY + 4 + paymentLines.length * 4;
        doc.text(
          `Change returned: ${formatPdfAmount(payment.changeReturned)}`,
          MARGIN,
          changeY,
        );
      }

      // Totals box
      const totalsX = 110;
      const totalsWidth = PAGE_WIDTH - MARGIN - totalsX;
      const totalsY = y;
      const regularRowsHeight = totalRows.length * 6 + 4;
      const grandTotalHeight = 10;
      const actualBoxHeight = regularRowsHeight + grandTotalHeight;

      doc.setDrawColor(...borderColor);
      doc.rect(totalsX, totalsY, totalsWidth, actualBoxHeight, 'S');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...textColor);

      totalRows.forEach(([label, amount], index) => {
        const rowY = totalsY + 6 + index * 6;

        doc.text(cleanPdfText(label), totalsX + 3, rowY);
        doc.text(cleanPdfText(amount), totalsX + totalsWidth - 3, rowY, {
          align: 'right',
        });
      });

      const grandTotalY = totalsY + regularRowsHeight;
      doc.setFillColor(...accentColor);
      doc.rect(totalsX, grandTotalY, totalsWidth, grandTotalHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(255, 255, 255);
      doc.text('NET PAYABLE', totalsX + 3, grandTotalY + 6.5);
      doc.text(
        formatPdfAmount(summary.netPayable),
        totalsX + totalsWidth - 3,
        grandTotalY + 6.5,
        { align: 'right' },
      );

      y += summaryBlockHeight + 8;

      // Terms and signatory
      const termsText = cleanPdfText(
        billing.termsAndConditions ||
          'Goods once sold can be exchanged within 7 days with the original bill.',
      );
      const termsLines = doc.splitTextToSize(termsText, 112);
      const termsBlockHeight = 14 + termsLines.length * 4;

      if (y + termsBlockHeight > BOTTOM_LIMIT) {
        doc.addPage();
        y = 20;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...textColor);
      doc.text('TERMS & CONDITIONS', MARGIN, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedColor);
      doc.text(termsLines, MARGIN, y + 11);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(...textColor);
      doc.text(
        `For ${storeName}`,
        PAGE_WIDTH - MARGIN,
        y + 8,
        { align: 'right' },
      );

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(...mutedColor);
      doc.text(
        'Authorized Signatory',
        PAGE_WIDTH - MARGIN,
        y + 20,
        { align: 'right' },
      );

      const filename = cleanPdfText(
        invoice.invoiceNumber || 'Invoice',
      ).replace(/[\\/:*?"<>|]/g, '-');

      doc.save(`${filename}.pdf`);
    } catch (error) {
      console.error('Failed to generate PDF:', error);
      alert('Could not generate PDF. Please try again or use browser print.');
    }
  },
};