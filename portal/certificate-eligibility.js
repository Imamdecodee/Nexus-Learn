import { getRequiredFee, calculateFeeStatus, formatNaira } from './fees.js';

export function normalizeStudentFees(student) {
  const requiredFee = Number(student.requiredFee || getRequiredFee(student.course, student.plan));
  const payment = calculateFeeStatus(requiredFee, student.amountPaid);
  return { ...student, requiredFee, amountPaid: Number(student.amountPaid || 0), ...payment };
}

export function getCertificateEligibility(student) {
  const current = normalizeStudentFees(student || {});
  const reasons = [];
  if (!current.requiredFee) reasons.push('Your course and plan fee has not been assigned yet.');
  if (current.outstandingBalance > 0) reasons.push(`Your outstanding balance is ${formatNaira(current.outstandingBalance)}.`);
  if (current.feeStatus !== 'Fully Paid') reasons.push('Your fee account must be fully paid and verified.');
  if (Number(current.progress || current.courseCompletionPercent || 0) < 100) reasons.push('Complete all required course modules first.');
  if (Number(current.attendancePercent || 0) < 80) reasons.push('Your attendance must be at least 80% before certificate access can be approved.');
  if (current.projectReviewStatus !== 'Approved') reasons.push('Your project must be submitted and approved by the academic review team.');
  if (current.certificateStatus !== 'Approved') reasons.push('Your academic coordinator has not approved certificate access yet.');
  if (!current.certificateVerificationCode && !current.certificateVerificationCodeHash) reasons.push('Your academic coordinator has not issued a certificate verification code yet.');
  return { eligible: reasons.length === 0, reasons, student: current };
}

export async function hashCertificateCode(code) {
  const bytes = new TextEncoder().encode(code.trim());
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function verifyPortalCertificateCredentials(student, fullName, password, code) {
  const eligibility = getCertificateEligibility(student);
  const credentialsMatch = student.name?.trim().toLowerCase() === fullName.trim().toLowerCase();
  const passwordMatch = student.password === password;
  const codeHash = await hashCertificateCode(code);
  const codeMatch = student.certificateVerificationCodeHash ? student.certificateVerificationCodeHash === codeHash : student.certificateVerificationCode === code.trim();
  if (!credentialsMatch) return { valid: false, reason: 'The full name does not match this student account.' };
  if (!passwordMatch) return { valid: false, reason: 'The portal password is incorrect.' };
  if (!codeMatch) return { valid: false, reason: 'The certificate verification code is incorrect.' };
  if (!eligibility.eligible) return { valid: false, reason: eligibility.reasons[0], reasons: eligibility.reasons };
  return { valid: true, student: eligibility.student };
}
