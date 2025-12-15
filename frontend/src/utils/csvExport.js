/**
 * Format currency for display
 * Using 'PHP' instead of '₱' to avoid encoding issues in CSV files
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
 * Escape CSV field (handle commas, quotes, newlines)
 */
const escapeCSVField = (field) => {
  if (field === null || field === undefined) return '';
  const str = String(field);
  // If field contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Generate CSV for Transaction Logs
 * @param {string} activeTab - 'TRANSACTIONS', 'PAYMENT', or 'REFUND'
 * @param {Array} rows - Data rows to include in CSV
 */
export const generateTransactionCSV = (activeTab, rows) => {
  let headers = [];
  let dataRows = [];

  if (activeTab === 'TRANSACTIONS') {
    headers = [
      'Transaction ID',
      'Booking ID',
      'Customer',
      'Car Model',
      'Start Date',
      'End Date',
      'Driver',
      'Completion Date',
      'Cancellation Date',
    ];

    dataRows = rows.map(row => [
      row.transactionId || row.transaction_id || '',
      row.bookingId || row.booking_id || '',
      row.customerName || '',
      row.carModel || '',
      formatDate(row.startDate || row.start_date),
      formatDate(row.endDate || row.end_date),
      row.driver || '',
      formatDate(row.completionDate || row.completion_date),
      formatDate(row.cancellationDate || row.cancellation_date),
    ]);
  } else if (activeTab === 'PAYMENT') {
    headers = [
      'Payment ID',
      'Booking ID',
      'Customer',
      'Amount',
      'Payment Method',
      'Paid Date',
      'Description',
    ];

    dataRows = rows.map(row => [
      row.paymentId || row.payment_id || '',
      row.bookingId || row.booking_id || '',
      row.customerName || '',
      formatCurrency(row.totalAmount || row.amount),
      row.paymentMethod || row.payment_method || '',
      formatDate(row.paidDate || row.paid_date),
      row.description || '',
    ]);
  } else if (activeTab === 'REFUND') {
    headers = [
      'Refund ID',
      'Booking ID',
      'Customer',
      'Amount',
      'Refund Date',
      'Description',
    ];

    dataRows = rows.map(row => [
      row.refundId || row.refund_id || '',
      row.bookingId || row.booking_id || '',
      row.customerName || '',
      formatCurrency(row.refundAmount || row.refund_amount),
      formatDate(row.refundDate || row.refund_date),
      row.description || '',
    ]);
  }

  // Build CSV string
  const csvContent = [
    // Header row
    headers.map(escapeCSVField).join(','),
    // Data rows
    ...dataRows.map(row => row.map(escapeCSVField).join(','))
  ].join('\n');

  // Create blob and download with UTF-8 BOM for better Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${activeTab}_Report_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

/**
 * Generate CSV for Analytics Reports
 * @param {Object} params - Analytics parameters
 */
export const generateAnalyticsCSV = (params) => {
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
    maintenanceData,
    refundsData,
  } = params;

  let headers = [];
  let dataRows = [];
  let title = '';

  // Determine period string
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  let periodString = '';
  if (period === 'monthly') {
    periodString = `${monthNames[selectedMonthIndex]} ${selectedYear}`;
  } else if (period === 'quarterly') {
    periodString = `Q${selectedQuarter} ${selectedYear}`;
  } else {
    periodString = `Year ${selectedYear}`;
  }

  if (primaryView === 'income') {
    title = `Income Report - ${periodString}`;
    headers = ['Date', 'Income'];
    dataRows = chartLabels.map((label, index) => [
      label,
      formatCurrency(chartData[index] || 0),
    ]);
  } else if (primaryView === 'expenses') {
    title = `Expenses Report - ${periodString}`;
    headers = ['Date', 'Maintenance', 'Refunds', 'Total Expenses'];
    dataRows = chartLabels.map((label, index) => [
      label,
      formatCurrency(maintenanceData[index] || 0),
      formatCurrency(refundsData[index] || 0),
      formatCurrency((maintenanceData[index] || 0) + (refundsData[index] || 0)),
    ]);
  } else if (primaryView === 'topCars') {
    title = `Top Cars Report - ${periodString}`;
    headers = ['Car Model', 'Total Bookings'];
    dataRows = chartLabels.map((label, index) => [
      label || 'N/A',
      chartData[index] || 0,
    ]);
  } else if (primaryView === 'topCustomers') {
    title = `Top Customers Report - ${periodString}`;
    headers = ['Customer', 'Total Bookings'];
    dataRows = chartLabels.map((label, index) => [
      label || 'N/A',
      chartData[index] || 0,
    ]);
  }

  // Build CSV string with title and summary
  const csvLines = [
    title,
    '',
    `Generated: ${new Date().toLocaleString('en-US')}`,
    '',
  ];

  // Add summary for income/expenses
  if (primaryView === 'income') {
    csvLines.push(`Total Income: ${formatCurrency(totalIncome)}`);
    csvLines.push('');
  } else if (primaryView === 'expenses') {
    csvLines.push(`Total Maintenance: ${formatCurrency(totalMaintenance)}`);
    csvLines.push(`Total Refunds: ${formatCurrency(totalRefunds)}`);
    csvLines.push(`Total Expenses: ${formatCurrency(totalMaintenance + totalRefunds)}`);
    csvLines.push('');
  }

  // Add headers and data
  csvLines.push(headers.map(escapeCSVField).join(','));
  dataRows.forEach(row => {
    csvLines.push(row.map(escapeCSVField).join(','));
  });

  const csvContent = csvLines.join('\n');

  // Create blob and download with UTF-8 BOM for better Excel compatibility
  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `JA_Analytics_${primaryView}_${period}_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
