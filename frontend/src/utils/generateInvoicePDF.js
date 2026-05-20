import jsPDF from 'jspdf';
import { formatMoney } from './formatMoney.js';

export const generateInvoicePDF = (invoice, user, currency = 'USD') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 15;

  // Header
  doc.setFontSize(24);
  doc.setTextColor(99, 102, 241);
  doc.text('INVOICE', 20, yPosition);
  yPosition += 12;

  // Company Info
  doc.setFontSize(11);
  doc.setTextColor(50, 50, 50);
  doc.text(user?.businessName || 'Your Business', 20, yPosition);
  yPosition += 6;
  doc.setFontSize(9);
  doc.text(user?.email || '', 20, yPosition);
  yPosition += 12;

  // Invoice Details
  doc.setFontSize(10);
  doc.text(`Invoice #: ${invoice.invoiceNumber}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`, 20, yPosition);
  yPosition += 6;
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 20, yPosition);
  yPosition += 12;

  // Bill To
  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.text('BILL TO:', 20, yPosition);
  yPosition += 6;
  doc.setFontSize(10);
  doc.text(invoice.client?.name || 'Client', 20, yPosition);
  yPosition += 5;
  doc.text(invoice.client?.email || '', 20, yPosition);
  yPosition += 5;
  if (invoice.client?.phone) {
    doc.text(invoice.client.phone, 20, yPosition);
    yPosition += 5;
  }
  yPosition += 8;

  // Line Items Table
  const tableStartY = yPosition;
  const colWidths = [80, 40, 40, 35];
  const headers = ['Description', 'Qty', 'Unit Price', 'Amount'];
  
  // Header row
  doc.setFillColor(99, 102, 241);
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  let xPos = 20;
  headers.forEach((header, i) => {
    doc.text(header, xPos, yPosition, { maxWidth: colWidths[i] - 2, align: 'left' });
    xPos += colWidths[i];
  });
  yPosition += 8;

  // Item rows
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  invoice.items?.forEach(item => {
    xPos = 20;
    doc.text(item.description, xPos, yPosition, { maxWidth: colWidths[0] - 2 });
    xPos += colWidths[0];
    doc.text(String(item.quantity), xPos, yPosition);
    xPos += colWidths[1];
    doc.text(formatMoney(item.price, currency), xPos, yPosition);
    xPos += colWidths[2];
    doc.text(formatMoney(item.quantity * item.price, currency), xPos, yPosition);
    yPosition += 6;
  });

  yPosition += 6;

  // Totals
  const subtotal = invoice.items?.reduce((sum, item) => sum + (item.quantity * item.price), 0) || 0;
  const tax = subtotal * 0.1;
  const total = subtotal + tax;

  xPos = 20 + colWidths[0] + colWidths[1];
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal:', xPos, yPosition);
  doc.text(formatMoney(subtotal, currency), xPos + 30, yPosition, { align: 'right' });
  yPosition += 6;

  doc.text('Tax (10%):', xPos, yPosition);
  doc.text(formatMoney(tax, currency), xPos + 30, yPosition, { align: 'right' });
  yPosition += 6;

  doc.setFontSize(12);
  doc.setTextColor(99, 102, 241);
  doc.setFont(undefined, 'bold');
  doc.text('Total:', xPos, yPosition);
  doc.text(formatMoney(total, currency), xPos + 30, yPosition, { align: 'right' });
  yPosition += 12;

  // Notes
  if (invoice.notes) {
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text('Notes:', 20, yPosition);
    yPosition += 5;
    doc.setFont(undefined, 'normal');
    const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
    doc.text(splitNotes, 20, yPosition);
  }

  // Save
  doc.save(`Invoice-${invoice.invoiceNumber}.pdf`);
};
