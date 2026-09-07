import { portalAuth } from './firebase.js';
import { watchPublishedCourses, watchUpcomingSessions, watchPublishedNotices, formatSessionTime } from './data.js';

export function startPortalState({ onUser, onCourses, onSessions, onNotices, onError }) {
  const stopAuth = portalAuth.onAuthStateChanged(user => onUser(user));
  const stopCourses = watchPublishedCourses(onCourses, onError);
  const stopSessions = watchUpcomingSessions(onSessions, onError);
  const stopNotices = watchPublishedNotices(onNotices, onError);
  return () => {
    stopAuth();
    stopCourses();
    stopSessions();
    stopNotices();
  };
}

export function sessionLabel(session) {
  return formatSessionTime(session.startsAt, undefined, Intl.DateTimeFormat().resolvedOptions().timeZone);
}
