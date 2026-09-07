import { db, firestoreModule, portalAuth } from './portal/firebase.js';

const { addDoc, collection, doc, getDocs, onSnapshot, serverTimestamp, setDoc, updateDoc } = firestoreModule;
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

function addStudentTools() {
  const panel = $('students')?.querySelector('.panel'); if (!panel || $('studentTools')) return;
  const tools = document.createElement('div'); tools.id = 'studentTools'; tools.className = 'panel';
  tools.innerHTML = `<h3>All student details</h3><p class="muted" id="studentSyncStatus">Waiting for Firebase student synchronization...</p><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;margin-top:1rem;font-size:.82rem"><thead><tr><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Name</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Email</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Phone</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Course</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Institution</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Status</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Actions</th></tr></thead><tbody id="studentDetailsBody"><tr><td colspan="7" style="padding:.7rem;color:var(--muted)">Loading student details...</td></tr></tbody></table></div><div class="grid" style="margin-top:1.2rem"><div class="field"><label>Name<input id="newStudentName"></label></div><div class="field"><label>Email<input id="newStudentEmail" type="email"></label></div><div class="field"><label>Course<input id="newStudentCourse"></label></div><div class="field"><label>Campus<input id="newStudentCampus"></label></div></div><div class="actions"><button class="${buttonClass}" id="saveNewStudent" type="button">Create approved student</button><label class="${buttonClass}" for="studentCsv" style="cursor:pointer">Sync CSV now<input id="studentCsv" type="file" accept=".csv,text/csv" hidden></label></div><div class="notice hidden" id="studentToolsMessage"></div>`;
  panel.prepend(tools);
  $('saveNewStudent').addEventListener('click', async () => {
    try { const name = $('newStudentName').value.trim(); const email = $('newStudentEmail').value.trim(); if (!name || !email) throw new Error('Name and email are required.'); await addDoc(collection(db, 'users'), { name, email, course:$('newStudentCourse').value.trim(), campusId:$('newStudentCampus').value.trim(), role:'Student', approvalStatus:'APPROVED', scholarshipStatus:'Approved', projectReviewStatus:'Approved', createdAt:serverTimestamp(), updatedAt:serverTimestamp() }); showMessage($('studentToolsMessage'), 'Approved student record created.', 'success'); } catch (error) { showMessage($('studentToolsMessage'), error.message, 'error'); }
  });
  $('studentCsv').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try { const rows = parseCsv(await file.text()); if (!rows.length) throw new Error('The CSV has no data rows.'); let imported = 0; for (const row of rows) { const name = row.fullName || row.name || ''; const email = row.email || ''; if (!name || !email) continue; await addDoc(collection(db, 'users'), { name, email, phone:row.phone || '', state:row.state || '', institution:row.university || '', level:row.currentLevel || '', course:row.learningTrack || row.pathway || '', campusId:(row.university || '').toLowerCase().includes('ilorin') ? 'unilorin' : '', plan:row.pathway || '', scholarshipStatus:row.status || 'Pending', createdAt:serverTimestamp(), updatedAt:serverTimestamp() }); imported += 1; } showMessage($('studentToolsMessage'), `${imported} student record(s) imported.`, 'success'); } catch (error) { showMessage($('studentToolsMessage'), error.message, 'error'); } finally { event.target.value = ''; }
  });
}

function addLiveMetrics() {
  const update = (id, value) => { if ($(id)) $(id).textContent = String(value); };
  onSnapshot(collection(db, 'users'), snapshot => { update('studentMetric', snapshot.size); update('pendingMetric', snapshot.docs.filter(item => item.data().approvalStatus !== 'APPROVED').length); const body = $('studentDetailsBody'); if (body) body.innerHTML = snapshot.docs.map(item => { const student = item.data(); const status = student.approvalStatus || 'APPROVED'; return `<tr><td style="padding:.55rem;border-bottom:1px solid var(--line)">${student.name || 'Unnamed'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${student.email || ''}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${student.phone || 'Not provided'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${student.course || 'Not assigned'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${student.institution || student.campusId || 'Not provided'}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)"><select data-student-status="${item.id}" style="padding:.3rem"><option ${status === 'APPROVED' ? 'selected' : ''}>APPROVED</option><option ${status === 'PENDING' ? 'selected' : ''}>PENDING</option><option ${status === 'REJECTED' ? 'selected' : ''}>REJECTED</option><option ${status === 'SUSPENDED' ? 'selected' : ''}>SUSPENDED</option></select></td><td style="padding:.55rem;border-bottom:1px solid var(--line)"><button class="${buttonClass}" type="button" data-reset-student="${item.id}" data-student-email="${student.email || ''}" style="padding:.35rem .5rem;font-size:.75rem">Issue password</button></td></tr>`; }).join('') || '<tr><td colspan="7" style="padding:.7rem;color:var(--muted)">No students found.</td></tr>'; }, () => {});
  onSnapshot(collection(db, 'staff'), snapshot => update('staffMetric', snapshot.size), () => {});
  onSnapshot(collection(db, 'courses'), snapshot => update('courseMetric', snapshot.docs.filter(item => item.data().status === 'published').length), () => {});
  $('studentDetailsBody')?.addEventListener('change', async event => { const id = event.target.dataset.studentStatus; if (!id) return; try { await updateDoc(doc(db, 'users', id), { approvalStatus:event.target.value, updatedAt:serverTimestamp() }); } catch (error) { showMessage($('studentToolsMessage'), error.message, 'error'); } });
  $('studentDetailsBody')?.addEventListener('click', async event => { const button = event.target.closest('[data-reset-student]'); if (!button) return; const email = button.dataset.studentEmail; if (!email) return showMessage($('studentToolsMessage'), 'This student has no email address for password setup.', 'error'); try { await portalAuth.sendPasswordReset(email); const isAdminEmail = email.toLowerCase() === 'theilmnexus@gmail.com'; showMessage($('studentToolsMessage'), `Firebase accepted the password reset link for ${email}. Check Inbox and Spam/Junk. ${isAdminEmail ? 'This is the administrator email listed in the CSV.' : 'No password was sent; the email contains a link to create one.'}`, 'success'); } catch (error) { showMessage($('studentToolsMessage'), error.code === 'auth/user-not-found' ? 'No Firebase Auth account exists for this email. Create the account in Firebase Authentication first.' : error.message, 'error'); } });
}

async function syncBundledStudentCsv() {
  if ($('studentSyncStatus')) $('studentSyncStatus').textContent = 'Reading the bundled student CSV...';
  const response = await fetch('./student_Data/scholarship_applications_20260907_152550.csv', { cache:'no-store' });
  if (!response.ok) throw new Error(`Student CSV could not be read (${response.status}).`);
  const rows = parseCsv(await response.text());
  let synced = 0;
  for (const row of rows) {
    const name = row.fullName || row.name || ''; const email = row.email || '';
    if (!name || !email || !row.id) continue;
    await setDoc(doc(db, 'users', `csv-${row.id}`), { name, email, phone:row.phone || '', state:row.state || '', institution:row.university || '', level:row.currentLevel || '', course:row.learningTrack || row.pathway || '', campusId:(row.university || '').toLowerCase().includes('ilorin') ? 'unilorin' : '', plan:row.pathway || '', scholarshipStatus:'', approvalStatus:'APPROVED', projectReviewStatus:'Approved', source:'student_data_csv', sourceId:String(row.id), syncedAt:serverTimestamp() }, { merge:true });
    synced += 1;
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

function addFundWorkflow() {
  const button = $('saveFund'); if (!button) return;
  button.textContent = 'Create approved fund request';
  button.addEventListener('click', async event => {
    event.preventDefault(); event.stopImmediatePropagation();
    const request = { requesterId:$('fundRequester').value.trim(), amount:Number($('fundAmount').value || 0), purpose:$('fundPurpose').value.trim(), targetDeadline:$('fundDeadline').value, status:'APPROVED', createdAt:serverTimestamp(), reviewedBy:portalAuth.auth.currentUser?.uid || '' };
    try { const reference = await addDoc(collection(db, 'fund_requests'), request); const letter = `ILM Nexus Academy\nOfficial Fund Assistance Approval\n\nRequest ID: ${reference.id}\nRequester: ${request.requesterId}\nAmount: NGN ${request.amount.toLocaleString()}\nDeadline: ${request.targetDeadline}\nPurpose: ${request.purpose}\n\nApproved by: ${portalAuth.auth.currentUser?.email || 'ILM Nexus administrator'}`; const link = document.createElement('a'); link.href = URL.createObjectURL(new Blob([letter], { type:'text/plain' })); link.download = `fund-approval-${reference.id}.txt`; link.textContent = 'Download approval letter'; link.className = 'text-link'; $('fundMessage').replaceChildren(link); $('fundMessage').className = 'notice success'; $('fundMessage').classList.remove('hidden'); } catch (error) { showMessage($('fundMessage'), error.message, 'error'); }
  }, true);
}

try { const user = await new Promise(resolve => { const stop = portalAuth.onAuthStateChanged(currentUser => { stop(); resolve(currentUser); }); }); addStudentTools(); if (user?.email?.toLowerCase() === 'theilmnexus@gmail.com') { try { await syncBundledStudentCsv(); } catch (error) { if ($('studentSyncStatus')) $('studentSyncStatus').textContent = `Automatic CSV sync failed: ${error.message}. Open the site through your web host, not file://.`; console.warn('Bundled CSV sync unavailable:', error); } } else if ($('studentSyncStatus')) $('studentSyncStatus').textContent = 'Tutor view: showing synchronized Firebase student records.'; addLiveMetrics(); addStaffReplication(); addFundWorkflow(); } catch (error) { console.warn('Admin enhancements unavailable:', error); }
