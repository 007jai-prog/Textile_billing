import React, { useState } from 'react';
import { Printer, Download, FileText, Smartphone } from 'lucide-react';
import { Modal } from '../common/Modal';
import { InvoiceA4Template } from './InvoiceA4Template';
import { Thermal80mmTemplate } from './Thermal80mmTemplate';
import { Thermal58mmTemplate } from './Thermal58mmTemplate';
import { exportService } from '../../services/exportService';

const PAPER_SIZES = ['80mm', 'A4', '58mm'];

export const InvoicePreviewModal = ({
  isOpen,
  onClose,
  invoice,
  settings,
}) => {
  const configuredSize = settings?.billing?.defaultPaperSize;
  const initialFormat = PAPER_SIZES.includes(configuredSize)
    ? configuredSize
    : '80mm';

  const [activeFormat, setActiveFormat] = useState(initialFormat);

  if (!invoice) return null;

  const handlePrint = () => {
    const invoiceElement = document.getElementById('printable-invoice');

    if (!invoiceElement) return;

    // Printing in a separate window keeps modal sizing and overflow rules
    // from clipping the invoice.
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      window.alert(
        'The print window was blocked. Allow pop-ups for this site, then try printing again.',
      );
      return;
    }

    const pageSize =
      activeFormat === 'A4'
        ? 'A4 portrait'
        : activeFormat === '58mm'
          ? '58mm auto'
          : '80mm auto';

    const pageMargin = activeFormat === 'A4' ? '10mm' : '2mm';

    const copiedStyles = Array.from(
      document.querySelectorAll('link[rel="stylesheet"], style'),
    )
      .map((styleElement) => styleElement.outerHTML)
      .join('\n');

    const invoiceClone = invoiceElement.cloneNode(true);
    invoiceClone.style.maxHeight = 'none';
    invoiceClone.style.height = 'auto';
    invoiceClone.style.overflow = 'visible';
    invoiceClone.style.padding = '0';
    invoiceClone.style.background = '#fff';
    invoiceClone.style.borderRadius = '0';
    invoiceClone.style.width = activeFormat === 'A4' ? '100%' : pageSize.split(' ')[0];

    printWindow.onafterprint = () => printWindow.close();

    printWindow.document.open();
    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <base href="${document.baseURI}" />
          <title>Invoice ${invoice.invoiceNumber || ''}</title>
          ${copiedStyles}
          <style>
            @page {
              size: ${pageSize};
              margin: ${pageMargin};
            }

            html,
            body {
              margin: 0 !important;
              padding: 0 !important;
              width: 100%;
              min-height: 0;
              background: #fff !important;
              overflow: visible !important;
            }

            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            #printable-invoice {
              display: flex !important;
              justify-content: center;
              align-items: flex-start;
              max-height: none !important;
              height: auto !important;
              overflow: visible !important;
              margin: 0 auto !important;
              box-shadow: none !important;
            }

            #printable-invoice * {
              overflow: visible;
              print-color-adjust: exact;
              -webkit-print-color-adjust: exact;
            }

            .no-print {
              display: none !important;
            }
          </style>
        </head>
        <body></body>
      </html>
    `);
    printWindow.document.body.appendChild(invoiceClone);
    printWindow.document.close();

    printWindow.onload = async () => {
      try {
        if (printWindow.document.fonts?.ready) {
          await printWindow.document.fonts.ready;
        }

        const images = Array.from(printWindow.document.images);
        await Promise.all(
          images.map((image) =>
            image.decode ? image.decode().catch(() => {}) : Promise.resolve(),
          ),
        );
      } catch {
        // Continue to print if a font or image cannot be decoded.
      }

      printWindow.focus();
      printWindow.print();
    };
  };

  const handleDownloadPDF = () => {
    exportService.downloadInvoicePDF(invoice, settings);
  };

  const formatButtonClass = (format) =>
    `min-w-0 flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-center text-xs transition-all ${
      activeFormat === format
        ? 'bg-white text-indigo-700 shadow-sm font-semibold'
        : 'text-slate-600 hover:text-slate-900'
    }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Invoice Preview: ${invoice.invoiceNumber}`}
      subtitle={`Customer: ${invoice.customer?.name || 'Walk-in'} • Amount: ₹${invoice.summary?.netPayable?.toLocaleString('en-IN')}`}
      maxWidth={activeFormat === 'A4' ? 'max-w-4xl' : 'max-w-md'}
    >
      <div className="no-print mb-4 flex flex-col gap-3 border-b border-slate-200 pb-4">
        <div
          className="grid w-full grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1"
          role="group"
          aria-label="Invoice format"
        >
          <button
            type="button"
            onClick={() => setActiveFormat('80mm')}
            className={formatButtonClass('80mm')}
            aria-pressed={activeFormat === '80mm'}
          >
            <Smartphone className="h-4 w-4 shrink-0" />
            <span>80mm Thermal</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormat('A4')}
            className={formatButtonClass('A4')}
            aria-pressed={activeFormat === 'A4'}
          >
            <FileText className="h-4 w-4 shrink-0" />
            <span>A4 Invoice</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFormat('58mm')}
            className={formatButtonClass('58mm')}
            aria-pressed={activeFormat === '58mm'}
          >
            <Smartphone className="h-4 w-4 shrink-0" />
            <span>58mm Mini</span>
          </button>
        </div>

        <div className="grid w-full grid-cols-2 gap-2">
          <button
            type="button"
            onClick={handleDownloadPDF}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-200"
          >
            <Download className="h-4 w-4 shrink-0 text-slate-500" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <Printer className="h-4 w-4 shrink-0" />
            <span>Print</span>
          </button>
        </div>
      </div>

      <div
        id="printable-invoice"
        className="flex max-h-[68vh] justify-center overflow-y-auto rounded-xl bg-slate-50 p-2 sm:p-4"
      >
        {activeFormat === 'A4' && (
          <InvoiceA4Template invoice={invoice} settings={settings} />
        )}
        {activeFormat === '80mm' && (
          <Thermal80mmTemplate invoice={invoice} settings={settings} />
        )}
        {activeFormat === '58mm' && (
          <Thermal58mmTemplate invoice={invoice} settings={settings} />
        )}
      </div>
    </Modal>
  );
};