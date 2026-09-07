export const courseFees = {
  'Social Media Management': { Basic: 25000, Standard: 45000, Premium: 75000 },
  'Front-End Web Development': { Basic: 60000, Standard: 110000, Premium: 180000 },
  'AI Automation': { Basic: 50000, Standard: 90000, Premium: 150000 },
  'Graphic Design': { Basic: 35000, Standard: 65000, Premium: 110000 },
  'Video Editing': { Basic: 35000, Standard: 60000, Premium: 100000 },
  'Intro to Cybersecurity': { Basic: 45000, Standard: 80000, Premium: 130000 },
  'Digital Marketing': { Basic: 40000, Standard: 70000, Premium: 120000 },
  'Programme Management': { Basic: 45000, Standard: 85000, Premium: 140000 },
  'Data Science / Analysis': { Basic: 65000, Standard: 120000, Premium: 200000 },
  'Content Creation': { Basic: 25000, Standard: 45000, Premium: 75000 }
};

export function getRequiredFee(course, plan) {
  return Number(courseFees[course]?.[plan] || 0);
}

export function formatNaira(amount) {
  return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

export function calculateFeeStatus(requiredFee, amountPaid) {
  const balance = Math.max(Number(requiredFee || 0) - Number(amountPaid || 0), 0);
  return {
    outstandingBalance: balance,
    feeStatus: balance === 0 && Number(requiredFee || 0) > 0 ? 'Fully Paid' : Number(amountPaid || 0) > 0 ? 'Partially Paid' : 'Payment Pending'
  };
}
