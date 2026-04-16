/**
 * Formats a number into PKR currency format
 * @param amount Number to format
 * @returns Formatted string (e.g., "1,000.00")
 */
export const formatCurrency = (amount: number | string): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(value)) return '0.00';
  
  // Ensure no negative values are displayed as per requirement
  const absValue = Math.max(0, value);
  
  return new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absValue);
};
