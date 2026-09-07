import { db, firestoreModule } from './firebase.js';
import { getRequiredFee, formatNaira } from './fees.js';

const { collection, doc, getDocs, onSnapshot, query, updateDoc, where } = firestoreModule;

export const courseOutlines = {
  'Front-End Web Development': ['Web foundations and semantic HTML', 'CSS layout and responsive systems', 'JavaScript fundamentals', 'Accessible interface design', 'Git and GitHub workflows', 'Portfolio project and review'],
  'Social Media Management': ['Audience and content strategy', 'Platform planning', 'Content production', 'Community management', 'Analytics and reporting', 'Campaign project and review'],
  'AI Automation': ['Automation foundations', 'Prompt and workflow design', 'No-code integrations', 'Data and process mapping', 'Responsible AI practice', 'Automation project and review'],
  'Graphic Design': ['Design principles', 'Typography and colour', 'Layout systems', 'Brand identity', 'Production workflows', 'Brand project and review'],
  'Video Editing': ['Storytelling and shot planning', 'Editing fundamentals', 'Audio and pacing', 'Motion and transitions', 'Export for platforms', 'Video project and review'],
  'Intro to Cybersecurity': ['Security foundations', 'Identity and access', 'Network awareness', 'Threat modelling', 'Safe digital practice', 'Security awareness project'],
  'Digital Marketing': ['Digital strategy', 'Search and content', 'Social campaigns', 'Email and conversion', 'Analytics', 'Campaign project and review'],
  'Programme Management': ['Programme foundations', 'Planning and scope', 'Risk and stakeholders', 'Delivery systems', 'Measurement', 'Programme plan project'],
  'Data Science / Analysis': ['Data literacy', 'Spreadsheet analysis', 'Data cleaning', 'Visualisation', 'Insights and communication', 'Analysis project and review'],
  'Content Creation': ['Creative direction', 'Research and scripting', 'Production systems', 'Publishing workflows', 'Audience growth', 'Content portfolio review']
};

export function getCourseOutline(course) {
  return courseOutlines[course] || ['Orientation and learning goals', 'Core concepts and guided practice', 'Applied project work', 'Final project review'];
}

export function calculateStudentFee(student) {
  const originalFee = Number(student.requiredFee || getRequiredFee(student.course, student.plan));
  const scholarshipPercent = Number(student.scholarshipPercent || 0);
  const discountAmount = Number(student.discountAmount || 0);
  const scholarshipAmount = Math.round(originalFee * scholarshipPercent / 100);
  const finalFee = Math.max(originalFee - scholarshipAmount - discountAmount, 0);
  const amountPaid = Number(student.amountPaid || 0);
  return { originalFee, scholarshipPercent, scholarshipAmount, discountAmount, finalFee, amountPaid, outstandingBalance: Math.max(finalFee - amountPaid, 0), feeStatus: finalFee === 0 || amountPaid >= finalFee ? 'Fully Paid' : amountPaid > 0 ? 'Partially Paid' : 'Payment Pending', formattedFinalFee: formatNaira(finalFee) };
}

export function attendanceSummary(records = []) {
  const total = records.length;
  const attended = records.filter(record => record.status === 'Present' || record.status === 'Late').length;
  const percentage = total ? Math.round(attended / total * 100) : 0;
  return { total, attended, missed: total - attended, percentage, required: 80, meetsRequirement: percentage >= 80 };
}

export function watchStudentTimetable(userId, onChange, onError) {
  return onSnapshot(query(collection(db, 'timetables'), where('userId', '==', userId)), snapshot => onChange(snapshot.docs.map(item => ({ id: item.id, ...item.data() })).sort((a, b) => String(a.startsAt).localeCompare(String(b.startsAt)))), onError);
}

export async function getStudentAttendance(userId) {
  const snapshot = await getDocs(query(collection(db, 'attendance'), where('userId', '==', userId)));
  return snapshot.docs.map(item => ({ id: item.id, ...item.data() }));
}

export function updateStudentAcademicStatus(userId, updates) {
  return updateDoc(doc(db, 'users', userId), { ...updates, updatedAt: new Date() });
}
