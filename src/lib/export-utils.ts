export function exportTransfersToCSV(transfers: any[], filename: string = 'transfers') {
  if (transfers.length === 0) {
    return;
  }

  const headers = [
    'ID',
    'Date',
    'Recipient Name',
    'Recipient Phone',
    'Amount (GBP)',
    'Amount (SLL)',
    'Exchange Rate',
    'Status',
    'Payment Method'
  ];

  const csvContent = [
    headers.join(','),
    ...transfers.map(transfer => [
      transfer.id,
      new Date(transfer.created_at).toLocaleString(),
      `"${transfer.recipient_name || ''}"`,
      transfer.recipient_phone || '',
      transfer.amount_gbp || transfer.amount || 0,
      transfer.amount_sll || 0,
      transfer.gbp_to_sll_rate || '',
      transfer.status,
      transfer.payment_method || ''
    ].join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function exportTransfersToJSON(transfers: any[], filename: string = 'transfers') {
  if (transfers.length === 0) {
    return;
  }

  const jsonContent = JSON.stringify(transfers, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}_${new Date().toISOString().split('T')[0]}.json`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
