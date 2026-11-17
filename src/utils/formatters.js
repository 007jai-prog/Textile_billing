import dayjs from 'dayjs';

/**
 * Format number as Indian Rupee (₹)
 * Example: 125000 -> ₹1,25,000.00
 */
export const formatCurrency = (amount, showDecimals = true) => {
  const num = Number(amount) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(num);
};

/**
 * Format standard date
 */
export const formatDate = (date, format = 'DD MMM YYYY') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

/**
 * Format date with time
 */
export const formatDateTime = (date, format = 'DD MMM YYYY, hh:mm A') => {
  if (!date) return '-';
  return dayjs(date).format(format);
};

/**
 * Convert number to words in Indian Rupee format (e.g. for tax invoice footer)
 */
export const numberToWords = (amount) => {
  const num = Math.round(Number(amount) || 0);
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n) => {
    let str = '';
    if (n > 99) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 19) {
      str += b[Math.floor(n / 10)] + ' ' + a[n % 10];
    } else {
      str += a[n];
    }
    return str.trim();
  };

  let crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  remainder = remainder % 1000;

  let words = '';
  if (crore > 0) words += inWords(crore) + ' Crore ';
  if (lakh > 0) words += inWords(lakh) + ' Lakh ';
  if (thousand > 0) words += inWords(thousand) + ' Thousand ';
  if (remainder > 0) words += inWords(remainder);

  return (words.trim() + ' Rupees Only').replace(/\s+/g, ' ');
};
