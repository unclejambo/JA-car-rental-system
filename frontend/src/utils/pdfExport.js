import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Format currency for display
 * Using 'PHP' prefix for consistency across all export formats
 */
const formatCurrency = (amount) => {
  return `PHP ${Number(amount || 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

/**
 * Format date for display
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Format date and time for display
 */
const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Generate PDF for Transaction Logs
 * @param {string} activeTab - 'TRANSACTIONS', 'PAYMENT', or 'REFUND'
 * @param {Array} rows - Data rows to include in PDF
 */
export const generateTransactionPDF = (activeTab, rows) => {
  const doc = new jsPDF('landscape');
  
  // Add title
  const title = `JA Car Rental System - ${activeTab} Report`;
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(title, 14, 20);
  
  // Add generation date
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, 14, 28);
  doc.text(`Total Records: ${rows.length}`, 14, 34);

  // Define columns based on tab
  let columns = [];
  let dataRows = [];

  if (activeTab === 'TRANSACTIONS') {
    columns = [
      { header: 'Transaction ID', dataKey: 'transactionId' },
      { header: 'Booking ID', dataKey: 'bookingId' },
      { header: 'Customer', dataKey: 'customerName' },
      { header: 'Car Model', dataKey: 'carModel' },
      { header: 'Start Date', dataKey: 'startDate' },
      { header: 'End Date', dataKey: 'endDate' },
      { header: 'Driver', dataKey: 'driver' },
      { header: 'Completion Date', dataKey: 'completionDate' },
      { header: 'Cancellation Date', dataKey: 'cancellationDate' },
    ];

    dataRows = rows.map(row => ({
      transactionId: row.transactionId || row.transaction_id || 'N/A',
      bookingId: row.bookingId || row.booking_id || 'N/A',
      customerName: row.customerName || 'N/A',
      carModel: row.carModel || 'N/A',
      startDate: formatDate(row.startDate || row.start_date),
      endDate: formatDate(row.endDate || row.end_date),
      driver: row.driver || 'N/A',
      completionDate: formatDate(row.completionDate || row.completion_date),
      cancellationDate: formatDate(row.cancellationDate || row.cancellation_date),
    }));
  } else if (activeTab === 'PAYMENT') {
    columns = [
      { header: 'Payment ID', dataKey: 'paymentId' },
      { header: 'Booking ID', dataKey: 'bookingId' },
      { header: 'Customer', dataKey: 'customerName' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Payment Method', dataKey: 'paymentMethod' },
      { header: 'Paid Date', dataKey: 'paidDate' },
      { header: 'Description', dataKey: 'description' },
    ];

    dataRows = rows.map(row => ({
      paymentId: row.paymentId || row.payment_id || 'N/A',
      bookingId: row.bookingId || row.booking_id || 'N/A',
      customerName: row.customerName || 'N/A',
      amount: formatCurrency(row.totalAmount || row.amount),
      paymentMethod: row.paymentMethod || row.payment_method || 'N/A',
      paidDate: formatDate(row.paidDate || row.paid_date),
      description: row.description || 'N/A',
    }));
  } else if (activeTab === 'REFUND') {
    columns = [
      { header: 'Refund ID', dataKey: 'refundId' },
      { header: 'Booking ID', dataKey: 'bookingId' },
      { header: 'Customer', dataKey: 'customerName' },
      { header: 'Amount', dataKey: 'amount' },
      { header: 'Refund Date', dataKey: 'refundDate' },
      { header: 'Description', dataKey: 'description' },
    ];

    dataRows = rows.map(row => ({
      refundId: row.refundId || row.refund_id || 'N/A',
      bookingId: row.bookingId || row.booking_id || 'N/A',
      customerName: row.customerName || 'N/A',
      amount: formatCurrency(row.refundAmount || row.refund_amount),
      refundDate: formatDate(row.refundDate || row.refund_date),
      description: row.description || 'N/A',
    }));
  }

  // Generate table
  autoTable(doc, {
    columns: columns,
    body: dataRows,
    startY: 40,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [193, 0, 7], // Red color matching your theme
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    margin: { top: 40 },
  });

  // Calculate totals if applicable
  if (activeTab === 'PAYMENT' || activeTab === 'REFUND') {
    const total = rows.reduce((sum, row) => {
      const amount = activeTab === 'PAYMENT' 
        ? (row.totalAmount || row.amount || 0)
        : (row.refundAmount || row.refund_amount || 0);
      return sum + Number(amount);
    }, 0);
    const finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Total ${activeTab}: ${formatCurrency(total)}`, 14, finalY);
  }

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF
  const fileName = `${activeTab}_Report_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

/**
 * Generate PDF for Reports & Analytics
 * @param {Object} params - Report parameters
 * @param {string} params.primaryView - 'income', 'expenses', 'topCars', 'topCustomers'
 * @param {string} params.period - 'monthly', 'quarterly', 'yearly'
 * @param {number} params.selectedYear - Selected year
 * @param {Array} params.chartData - Chart data array
 * @param {Array} params.chartLabels - Chart labels array
 * @param {number} params.totalIncome - Total income
 * @param {number} params.totalMaintenance - Total maintenance cost
 * @param {number} params.totalRefunds - Total refunds
 * @param {Array} params.maintenanceData - Maintenance data array
 * @param {Array} params.refundsData - Refunds data array
 */
export const generateAnalyticsPDF = (params) => {
  const {
    primaryView,
    period,
    selectedYear,
    selectedQuarter,
    selectedMonthIndex,
    chartData,
    chartLabels,
    totalIncome,
    totalMaintenance,
    totalRefunds,
    maintenanceData = [],
    refundsData = [],
  } = params;

  const doc = new jsPDF();
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('JA Car Rental System', 14, 20);
  
  doc.setFontSize(16);
  doc.text('Reports & Analytics', 14, 28);
  
  // Report details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${new Date().toLocaleString('en-US')}`, 14, 36);
  
  // Period information
  let periodText = '';
  if (period === 'monthly') {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                    'July', 'August', 'September', 'October', 'November', 'December'];
    periodText = `${months[selectedMonthIndex]} ${selectedYear}`;
  } else if (period === 'quarterly') {
    periodText = `Q${selectedQuarter} ${selectedYear}`;
  } else {
    periodText = `Year ${selectedYear}`;
  }
  
  doc.text(`Period: ${periodText}`, 14, 42);
  doc.text(`View: ${primaryView.charAt(0).toUpperCase() + primaryView.slice(1)}`, 14, 48);

  let startY = 58;

  // Summary section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, startY);
  startY += 8;

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  if (primaryView === 'income') {
    doc.text(`Total Income: ${formatCurrency(totalIncome)}`, 14, startY);
    startY += 10;
  } else if (primaryView === 'expenses') {
    doc.text(`Total Maintenance: ${formatCurrency(totalMaintenance)}`, 14, startY);
    startY += 6;
    doc.text(`Total Refunds: ${formatCurrency(totalRefunds)}`, 14, startY);
    startY += 6;
    const totalExpenses = totalMaintenance + totalRefunds;
    doc.setFont('helvetica', 'bold');
    doc.text(`Total Expenses: ${formatCurrency(totalExpenses)}`, 14, startY);
    startY += 10;
    doc.setFont('helvetica', 'normal');
  }

  // Data table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Data', 14, startY);
  startY += 8;

  // Prepare table data based on view
  let columns = [];
  let dataRows = [];

  if (primaryView === 'income') {
    columns = [
      { header: 'Period', dataKey: 'label' },
      { header: 'Income', dataKey: 'value' },
    ];
    
    dataRows = chartLabels.map((label, index) => ({
      label: label || 'N/A',
      value: formatCurrency(chartData[index] || 0),
    }));
  } else if (primaryView === 'expenses') {
    columns = [
      { header: 'Period', dataKey: 'label' },
      { header: 'Maintenance', dataKey: 'maintenance' },
      { header: 'Refunds', dataKey: 'refunds' },
      { header: 'Total', dataKey: 'total' },
    ];
    
    dataRows = chartLabels.map((label, index) => {
      const maint = maintenanceData[index] || 0;
      const ref = refundsData[index] || 0;
      return {
        label: label || 'N/A',
        maintenance: formatCurrency(maint),
        refunds: formatCurrency(ref),
        total: formatCurrency(maint + ref),
      };
    });
  } else if (primaryView === 'topCars' || primaryView === 'topCustomers') {
    const isTopCars = primaryView === 'topCars';
    columns = [
      { header: isTopCars ? 'Car Model' : 'Customer Name', dataKey: 'label' },
      { header: 'Total Bookings', dataKey: 'value' },
    ];
    
    dataRows = chartLabels.map((label, index) => ({
      label: label || 'N/A',
      value: chartData[index] || 0,
    }));
  }

  autoTable(doc, {
    columns: columns,
    body: dataRows,
    startY: startY,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [193, 0, 7],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
  });

  // Add footer
  const pageCount = doc.internal.getNumberOfPages();
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.text(
      `Page ${i} of ${pageCount}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }

  // Save the PDF with descriptive name including view type
  const fileName = `JA_Analytics_${primaryView}_${period}_${selectedYear}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
