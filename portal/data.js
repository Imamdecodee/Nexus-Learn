import { db, firestoreModule } from './firebase.js';

const { addDoc, collection, doc, getDocs, onSnapshot, orderBy, query, serverTimestamp, setDoc, Timestamp, updateDoc, where } = firestoreModule;

export const portalCollections = {
  users: 'users',
  courses: 'courses',
  progress: 'user_progress',
  sessions: 'live_sessions',
  notices: 'notices',
  projects: 'projects',
  certificates: 'certificates'
};

export function watchPublishedCourses(onChange, onError) {
  const coursesQuery = query(collection(db, portalCollections.courses), where('status', '==', 'published'), orderBy('sortOrder', 'asc'));
  return onSnapshot(coursesQuery, snapshot => onChange(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))), onError);
}

export function watchUpcomingSessions(onChange, onError) {
  const sessionsQuery = query(collection(db, portalCollections.sessions), where('startsAt', '>=', Timestamp.now()), orderBy('startsAt', 'asc'));
  return onSnapshot(sessionsQuery, snapshot => onChange(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))), onError);
}

export function watchPublishedNotices(onChange, onError) {
  const noticesQuery = query(collection(db, portalCollections.notices), where('status', '==', 'published'), orderBy('publishedAt', 'desc'));
  return onSnapshot(noticesQuery, snapshot => onChange(snapshot.docs.map(item => ({ id: item.id, ...item.data() }))), onError);
}

export async function getUserProfile(userId) {
  const snapshot = await getDocs(query(collection(db, portalCollections.users), where('__name__', '==', userId)));
  return snapshot.empty ? null : { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
}

export function saveUserProfile(userId, profile) {
  return setDoc(doc(db, portalCollections.users, userId), { ...profile, updatedAt: serverTimestamp() }, { merge: true });
}

export function saveProgress(userId, courseId, progress) {
  return setDoc(doc(db, portalCollections.progress, `${userId}_${courseId}`), {
    userId,
    courseId,
    completionPercent: Math.max(0, Math.min(100, Number(progress.completionPercent || 0))),
    lastPositionSeconds: Math.max(0, Number(progress.lastPositionSeconds || 0)),
    unlockedMilestones: Array.isArray(progress.unlockedMilestones) ? progress.unlockedMilestones : [],
    updatedAt: serverTimestamp()
  }, { merge: true });
}

export function submitProject(userId, project) {
  return addDoc(collection(db, portalCollections.projects), {
    userId,
    title: String(project.title || '').trim(),
    repositoryUrl: String(project.repositoryUrl || '').trim(),
    liveUrl: String(project.liveUrl || '').trim(),
    status: 'submitted',
    submittedAt: serverTimestamp()
  });
}

export function createCourse(adminCourse) {
  return addDoc(collection(db, portalCollections.courses), {
    title: adminCourse.title,
    description: adminCourse.description || '',
    status: adminCourse.status || 'draft',
    modules: Array.isArray(adminCourse.modules) ? adminCourse.modules : [],
    sortOrder: Number(adminCourse.sortOrder || 0),
    updatedAt: serverTimestamp()
  });
}

export function createLiveSession(adminSession) {
  const startsAt = new Date(adminSession.startsAt);
  if (Number.isNaN(startsAt.getTime())) throw new Error('Provide a valid session date and time.');
  return addDoc(collection(db, portalCollections.sessions), {
    cohortId: adminSession.cohortId,
    title: adminSession.title,
    startsAt: Timestamp.fromDate(startsAt),
    timezoneSource: Intl.DateTimeFormat().resolvedOptions().timeZone,
    meetingUrl: adminSession.meetingUrl || '',
    status: 'scheduled',
    createdAt: serverTimestamp()
  });
}

export function updateLiveSession(sessionId, updates) {
  return updateDoc(doc(db, portalCollections.sessions, sessionId), updates);
}

export function formatSessionTime(timestamp, locale = undefined, timeZone = undefined) {
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(date);
}
