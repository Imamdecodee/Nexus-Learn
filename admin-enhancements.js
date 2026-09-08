import { db, firestoreModule, portalAuth } from './portal/firebase.js';

const { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, setDoc, updateDoc, where } = firestoreModule;
const $ = id => document.getElementById(id);
const buttonClass = 'button';
const showMessage = (node, text, type = '') => { node.textContent = text; node.className = `notice ${type}`; node.classList.remove('hidden'); };

function parseCsv(text) {
  const rows = [];
  let row = [], value = '', quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index]; const next = text[index + 1];
    if (character === '"' && quoted && next === '"') { value += '"'; index += 1; }
    else if (character === '"') quoted = !quoted;
    else if (character === ',' && !quoted) { row.push(value.trim()); value = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) { if (character === '\r' && next === '\n') index += 1; row.push(value.trim()); if (row.some(Boolean)) rows.push(row); row = []; value = ''; }
    else value += character;
  }
  if (value || row.length) { row.push(value.trim()); rows.push(row); }
  const headers = rows.shift()?.map(header => header.trim()) || [];
  return rows.map(columns => Object.fromEntries(headers.map((header, index) => [header, columns[index] || ''])));
}

async function upsertStudentFromCsvRow(row) {
  const name = String(row.fullName || row.name || '').trim();
  const email = String(row.email || '').trim();
  const username = String(row.username || email.split('@')[0] || '').trim();
  const course = String(row.course || row.learningTrack || row.pathway || '').trim();
  const campusId = String(row.campusId || (String(row.university || '').toLowerCase().includes('ilorin') ? 'unilorin' : '')).trim();
  const plan = String(row.plan || row.pathway || '').trim();
  const tempPassword = String(row.temporaryPassword || row.initialPassword || row.password || 'ILMNexus2026!').trim() || 'ILMNexus2026!';
  const approvalStatus = String(row.approvalStatus || row.status || 'PENDING').trim().toUpperCase();

  if (!name || !email) return { created: 0, updated: 0, skipped: 1 };

  let authUid = null;
  try {
    const authResult = await portalAuth.createUserWithEmail(email, tempPassword);
    authUid = authResult.user.uid;
  } catch (error) {
    if (error.code !== 'auth/email-already-in-use') {
      console.warn('Firebase student creation failed for', email, error);
      throw error;
    }
    const existing = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
    const match = existing.docs[0];
    if (!match) {
      console.warn('Student email already exists in Firebase but no user record was found in Firestore:', email);
      return { created: 0, updated: 0, skipped: 1 };
    }
    authUid = match.id;
  }

  const studentRecord = {
    uid: authUid,
    name,
    email,
    username,
    course,
    campusId,
    plan,
    role: 'Student',
    approvalStatus: ['APPROVED', 'PENDING', 'SUSPENDED', 'REJECTED', 'DISABLED'].includes(approvalStatus) ? approvalStatus : 'PENDING',
    scholarshipStatus: String(row.scholarshipStatus || 'Pending').trim(),
    projectReviewStatus: String(row.projectReviewStatus || 'Not Submitted').trim(),
    certificateStatus: String(row.certificateStatus || 'Not Approved').trim(),
    phone: String(row.phone || '').trim(),
    state: String(row.state || '').trim(),
    institution: String(row.institution || row.university || '').trim(),
    level: String(row.currentLevel || row.level || '').trim(),
    format: String(row.format || '').trim(),
    heard: String(row.heard || '').trim(),
    requiredFee: Number(row.requiredFee || 0),
    amountPaid: Number(row.amountPaid || 0),
    outstandingBalance: Number(row.outstandingBalance || 0),
    paymentStatus: String(row.paymentStatus || 'Payment Pending').trim(),
    feeStatus: String(row.feeStatus || 'Payment Pending').trim(),
    studentId: String(row.studentId || `ILM-${Date.now().toString(36).toUpperCase()}`).trim(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(doc(db, 'users', authUid), studentRecord, { merge: true });
  return { created: 1, updated: 1, skipped: 0 };
}

function addStudentTools() {
  const panel = $('students')?.querySelector('.panel'); if (!panel || $('studentTools')) return;
  const tools = document.createElement('div'); tools.id = 'studentTools'; tools.className = 'panel';
  tools.innerHTML = `<h3>All student details</h3><p class="muted" id="studentSyncStatus">Waiting for Firebase student synchronization...</p><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;margin-top:1rem;font-size:.82rem"><thead><tr><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Name</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Email</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Phone</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Course</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Institution</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Status</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Actions</th></tr></thead><tbody id="studentDetailsBody"><tr><td colspan="7" style="padding:.7rem;color:var(--muted)">Loading student details...</td></tr></tbody></table></div><div class="grid" style="margin-top:1.2rem"><div class="field"><label>Name<input id="newStudentName"></label></div><div class="field"><label>Email<input id="newStudentEmail" type="email"></label></div><div class="field"><label>Temporary password<input id="newStudentPassword" type="text" value="ILMNexus2026!"></label></div><div class="field"><label>Course<input id="newStudentCourse"></label></div><div class="field"><label>Campus<input id="newStudentCampus"></label></div></div><div class="actions"><button class="${buttonClass}" id="saveNewStudent" type="button">Create approved student</button><label class="${buttonClass}" for="studentCsv" style="cursor:pointer">Sync CSV now<input id="studentCsv" type="file" accept=".csv,text/csv" hidden></label></div><div class="notice hidden" id="studentToolsMessage"></div>`;
  panel.prepend(tools);
  $('saveNewStudent').addEventListener('click', async () => {
    try {
      const name = $('newStudentName').value.trim();
      const email = $('newStudentEmail').value.trim();
      const password = $('newStudentPassword').value.trim() || 'ILMNexus2026!';
      if (!name || !email) throw new Error('Name and email are required.');
      const authResult = await portalAuth.createUserWithEmail(email, password).catch(error => {
        if (error.code === 'auth/email-already-in-use') return { user: { uid: null } };
        throw error;
      });
      const uid = authResult.user.uid;
      if (!uid) {
        const existing = await getDocs(query(collection(db, 'users'), where('email', '==', email)));
        if (!existing.docs[0]) throw new Error('This student already exists in Firebase and has no profile record yet.');
        await setDoc(doc(db, 'users', existing.docs[0].id), { uid: existing.docs[0].id, name, email, course:$('newStudentCourse').value.trim(), campusId:$('newStudentCampus').value.trim(), role:'Student', approvalStatus:'APPROVED', scholarshipStatus:'Approved', projectReviewStatus:'Approved', updatedAt:serverTimestamp() }, { merge: true });
      } else {
        await setDoc(doc(db, 'users', uid), { uid, name, email, course:$('newStudentCourse').value.trim(), campusId:$('newStudentCampus').value.trim(), role:'Student', approvalStatus:'APPROVED', scholarshipStatus:'Approved', projectReviewStatus:'Approved', createdAt:serverTimestamp(), updatedAt:serverTimestamp() }, { merge: true });
      }
      showMessage($('studentToolsMessage'), 'Approved student record created.', 'success');
    } catch (error) { showMessage($('studentToolsMessage'), error.message, 'error'); }
  });
  $('studentCsv').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) throw new Error('The CSV has no data rows.');
      let imported = 0;
      let errors = 0;
      for (const row of rows) {
        try {
          const result = await upsertStudentFromCsvRow(row);
          if (!result.skipped) imported += 1;
        } catch (error) {
          errors += 1;
          console.warn('CSV student import failed:', row.email, error);
        }
      }
      showMessage($('studentToolsMessage'), `${imported} student record(s) imported. ${errors ? `${errors} failed.` : ''}`.trim(), errors ? 'error' : 'success');
    } catch (error) { showMessage($('studentToolsMessage'), error.message, 'error'); } finally { event.target.value = ''; }
  });
}

function addLiveMetrics() {
  const update = (id, value) => { if ($(id)) $(id).textContent = String(value); };
  onSnapshot(collection(db, 'users'), snapshot => { update('studentMetric', snapshot.size); update('pendingMetric', snapshot.docs.filter(item => item.data().approvalStatus !== 'APPROVED').length); const body = $('studentDetailsBody'); if (body) body.innerHTML = snapshot.docs.map(item => { const student = item.data(); const status = student.approvalStatus || 'APPROVED'; return `<tr><td style="padding:.55rem;border-bottom:1px solid var(--line)">${student.name || 'Unnamed'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${student.email || ''}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${student.phone || 'Not provided'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${student.course || 'Not assigned'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${student.institution || student.campusId || 'Not provided'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)"><select data-student-status="${item.id}" style="padding:.3rem"><option ${status === 'APPROVED' ? 'selected' : ''}>APPROVED</option><option ${status === 'PENDING' ? 'selected' : ''}>PENDING</option><option ${status === 'REJECTED' ? 'selected' : ''}>REJECTED</option><option ${status === 'SUSPENDED' ? 'selected' : ''}>SUSPENDED</option></select></td><td style="padding:.55rem;border-bottom:1px solid var(--line)"><button class="${buttonClass}" type="button" data-reset-student="${item.id}" data-student-email="${student.email || ''}" style="padding:.35rem .5rem;font-size:.75rem">Send reset link</button></td></tr>`; }).join('') || '<tr><td colspan="7" style="padding:.7rem;color:var(--muted)">No students found.</td></tr>'; }, () => {});
  onSnapshot(collection(db, 'staff'), snapshot => update('staffMetric', snapshot.size), () => {});
  onSnapshot(collection(db, 'courses'), snapshot => update('courseMetric', snapshot.docs.filter(item => item.data().status === 'published').length), () => {});
  $('studentDetailsBody')?.addEventListener('change', async event => { const id = event.target.dataset.studentStatus; if (!id) return; try { await updateDoc(doc(db, 'users', id), { approvalStatus:event.target.value, updatedAt:serverTimestamp() }); } catch (error) { showMessage($('studentToolsMessage'), error.message, 'error'); } });
  $('studentDetailsBody')?.addEventListener('click', async event => { const button = event.target.closest('[data-reset-student]'); if (!button) return; const email = button.dataset.studentEmail; if (!email) return showMessage($('studentToolsMessage'), 'This student has no email address for password setup.', 'error'); try { await portalAuth.sendPasswordReset(email); const isAdminEmail = email.toLowerCase() === 'theilmnexus@gmail.com'; showMessage($('studentToolsMessage'), `Firebase accepted a reset link for ${email}. Check Inbox and Spam/Junk. To set a password directly, use Firebase Console Authentication; this website never stores passwords. ${isAdminEmail ? 'This is the administrator email listed in the CSV.' : ''}`, 'success'); } catch (error) { showMessage($('studentToolsMessage'), error.code === 'auth/user-not-found' ? 'No Firebase Auth account exists for this email. Create the account in Firebase Authentication first.' : error.message, 'error'); } });
}

async function syncBundledStudentCsv() {
  if ($('studentSyncStatus')) $('studentSyncStatus').textContent = 'Reading the bundled student CSV...';
  const response = await fetch('./student_Data/scholarship_applications_20260907_152550.csv', { cache:'no-store' });
  if (!response.ok) throw new Error(`Student CSV could not be read (${response.status}).`);
  const rows = parseCsv(await response.text());
  let synced = 0;
  for (const row of rows) {
    try {
      const result = await upsertStudentFromCsvRow(row);
      if (!result.skipped) synced += 1;
    } catch (error) {
      console.warn('Bundled CSV student sync failed:', row.email, error);
    }
  }
  const existing = await getDocs(collection(db, 'users'));
  await Promise.all(existing.docs.filter(item => item.data().approvalStatus !== 'APPROVED' || item.data().projectReviewStatus !== 'Approved').map(item => updateDoc(doc(db, 'users', item.id), { approvalStatus:'APPROVED', scholarshipStatus:'Approved', projectReviewStatus:'Approved', updatedAt:serverTimestamp() })));
  if ($('roleLabel')) $('roleLabel').title = `${synced} bundled student records synchronized from student_data.`;
  if ($('studentSyncStatus')) $('studentSyncStatus').textContent = `${synced} bundled student records synchronized. Loading the complete live directory...`;
}

function addStaffReplication() {
  $('saveStaff')?.addEventListener('click', async () => {
    const campusId = $('staffCampus').value.trim().toLowerCase(); if (campusId !== 'unilorin') return;
    try { await addDoc(collection(db, 'campuses', 'unilorin', 'staff'), { name:$('staffName').value.trim(), email:$('staffEmail').value.trim(), role:$('staffRole').value, grade:Number($('staffGrade').value || 0), campusId, featured:$('staffFeatured').value === 'true', status:'active', syncedAt:serverTimestamp() }); } catch (error) { console.warn('Campus staff replication failed:', error); }
  });
}

function addStaffDirectory() {
  const section = $('staff'); const panel = section?.querySelector('.panel'); if (!panel || $('staffDirectory')) return;
  const directory = document.createElement('div'); directory.id = 'staffDirectory'; directory.className = 'panel';
  directory.innerHTML = '<h3>Staff directory</h3><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:.82rem"><thead><tr><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Name</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Email</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Role</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Campus</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Action</th></tr></thead><tbody id="staffDirectoryBody"><tr><td colspan="5" style="padding:.7rem;color:var(--muted)">Loading staff...</td></tr></tbody></table></div><div class="notice hidden" id="staffDirectoryMessage"></div>';
  panel.after(directory);
  onSnapshot(collection(db, 'staff'), snapshot => {
    const body = $('staffDirectoryBody');
    body.innerHTML = snapshot.docs.map(item => { const staff = item.data(); return `<tr><td style="padding:.55rem;border-bottom:1px solid var(--line)">${staff.name || 'Unnamed'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${staff.email || 'No email'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${staff.role || 'Staff'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${staff.campusId || 'Global'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)"><button class="${buttonClass}" type="button" data-delete-staff="${item.id}" data-staff-email="${staff.email || ''}" style="padding:.35rem .5rem;font-size:.75rem;background:var(--red)">Delete staff</button></td></tr>`; }).join('') || '<tr><td colspan="5" style="padding:.7rem;color:var(--muted)">No staff profiles found.</td></tr>';
  }, error => { if ($('staffDirectoryMessage')) showMessage($('staffDirectoryMessage'), error.message, 'error'); });
  $('staffDirectoryBody').addEventListener('click', async event => {
    const button = event.target.closest('[data-delete-staff]'); if (!button) return;
    if (!window.confirm(`Delete ${button.dataset.staffEmail || 'this staff profile'}?`)) return;
    try {
      await deleteDoc(doc(db, 'staff', button.dataset.deleteStaff));
      if (button.dataset.staffEmail) { const branch = await getDocs(query(collection(db, 'campuses', 'unilorin', 'staff'), where('email', '==', button.dataset.staffEmail))); await Promise.all(branch.docs.map(item => deleteDoc(item.ref))); }
      showMessage($('staffDirectoryMessage'), 'Staff profile deleted.', 'success');
    } catch (error) { showMessage($('staffDirectoryMessage'), error.message, 'error'); }
  });
}

function addFundWorkflow() {
  const button = $('saveFund'); if (!button) return;
  button.textContent = 'Create approved fund request';
  button.addEventListener('click', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const request = { requesterId:$('fundRequester').value.trim(), amount:Number($('fundAmount').value || 0), purpose:$('fundPurpose').value.trim(), targetDeadline:$('fundDeadline').value, status:'APPROVED', createdAt:serverTimestamp(), reviewedBy:portalAuth.auth.currentUser?.uid || '' };
    try { const reference = await addDoc(collection(db, 'fund_requests'), request); const letter = `ILM Nexus Academy\nOfficial Fund Assistance Approval\n\nRequest ID: ${reference.id}\nRequester: ${request.requesterId}\nAmount: NGN ${request.amount.toLocaleString()}\nDeadline: ${request.targetDeadline}\nPurpose: ${request.purpose}\n\nApproved by: ${portalAuth.auth.currentUser?.email || 'ILM Nexus administrator'}`; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([letter], { type:'text/plain' })); link.download = `fund-approval-${reference.id}.txt`; link.textContent = 'Download approval letter'; link.className = 'text-link'; $('fundMessage').replaceChildren(link); $('fundMessage').className = 'notice success'; $('fundMessage').classList.remove('hidden'); } catch (error) { showMessage($('fundMessage'), error.message, 'error'); }
  }, true);
}

try { const user = await new Promise(resolve => { const stop = portalAuth.onAuthStateChanged(currentUser => { stop(); resolve(currentUser); }); }); addStudentTools(); addStaffDirectory(); if (user?.email?.toLowerCase() === 'theilmnexus@gmail.com') { try { await syncBundledStudentCsv(); } catch (error) { if ($('studentSyncStatus')) $('studentSyncStatus').textContent = `Automatic CSV sync failed: ${error.message}. Open the site through your web host, not file://.`; console.warn('Bundled CSV sync unavailable:', error); } } else if ($('studentSyncStatus')) $('studentSyncStatus').textContent = 'Tutor view: showing synchronized Firebase student records.'; addLiveMetrics(); addStaffReplication(); addFundWorkflow(); } catch (error) { console.warn('Admin enhancements unavailable:', error); }
