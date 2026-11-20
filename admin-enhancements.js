import { callPortalFunction, db, firestoreModule, portalAuth } from './portal/firebase.js';

const { addDoc, collection, deleteDoc, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } = firestoreModule;
const $ = id => document.getElementById(id);
const buttonClass = 'button';
const showMessage = (node, text, type = '') => { node.textContent = text; node.className = `notice ${type}`; node.classList.remove('hidden'); };
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[character]));

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
  const email = String(row.email || '').trim().toLowerCase();
  const username = String(row.username || email.split('@')[0] || '').trim();
  const course = String(row.course || row.learningTrack || row.pathway || '').trim();
  const campusId = String(row.campusId || (String(row.university || '').toLowerCase().includes('ilorin') ? 'unilorin' : '')).trim();
  const plan = String(row.plan || row.pathway || '').trim();
  const studentId = String(row.studentId || '').trim();

  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { skipped: 1 };
  if (email === 'theilmnexus@gmail.com') throw new Error('The administrator email cannot be imported as a student.');

  const imported = {
    name,
    email,
    username,
    course,
    campusId,
    plan,
    phone: String(row.phone || '').trim(),
    institution: String(row.institution || row.university || '').trim(),
    studentId
  };
  const existing = await getDocs(query(collection(db, 'student_imports'), where('email', '==', email)));
  if (existing.empty) {
    await addDoc(collection(db, 'student_imports'), {
      ...imported,
      approvalStatus: 'PENDING',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  } else {
    await updateDoc(existing.docs[0].ref, { ...imported, updatedAt: serverTimestamp() });
  }
  return { created: 1, skipped: 0 };
}

function addStudentTools() {
  const panel = $('students')?.querySelector('.panel'); if (!panel || $('studentTools')) return;
  const tools = document.createElement('div'); tools.id = 'studentTools'; tools.className = 'panel';
  tools.innerHTML = `<h3>Student accounts</h3><p class="muted" id="studentSyncStatus">Student accounts stay pending until you approve them. Never include passwords in the CSV; approved students receive a secure password setup email.</p><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;margin-top:1rem;font-size:.82rem"><thead><tr><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Name</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Email</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Phone</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Course</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Institution</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Status</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Actions</th></tr></thead><tbody id="studentDetailsBody"><tr><td colspan="7" style="padding:.7rem;color:var(--muted)">Loading student details...</td></tr></tbody></table></div><div class="grid" style="margin-top:1.2rem"><div class="field"><label>Name<input id="newStudentName"></label></div><div class="field"><label>Email<input id="newStudentEmail" type="email"></label></div><div class="field"><label>Course<input id="newStudentCourse"></label></div><div class="field"><label>Campus<input id="newStudentCampus"></label></div></div><div class="actions"><button class="${buttonClass}" id="saveNewStudent" type="button">Add to approval queue</button><label class="${buttonClass}" for="studentCsv" style="cursor:pointer">Import student CSV<input id="studentCsv" type="file" accept=".csv,text/csv" hidden></label></div><div class="notice hidden" id="studentToolsMessage"></div><h3 style="margin-top:1.5rem">Pending student approvals</h3><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;margin-top:.7rem;font-size:.82rem"><thead><tr><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Name</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Email</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Course</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Campus</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Action</th></tr></thead><tbody id="studentImportBody"><tr><td colspan="5" style="padding:.7rem;color:var(--muted)">Loading approvals...</td></tr></tbody></table></div>`;
  panel.prepend(tools);
  $('saveNewStudent').addEventListener('click', async () => {
    try {
      const name = $('newStudentName').value.trim();
      const email = $('newStudentEmail').value.trim();
      if (!name || !email) throw new Error('Name and email are required.');
      await upsertStudentFromCsvRow({ name, email, course:$('newStudentCourse').value.trim(), campusId:$('newStudentCampus').value.trim() });
      showMessage($('studentToolsMessage'), 'Student added to the pending approval queue.', 'success');
    } catch (error) { showMessage($('studentToolsMessage'), error.message, 'error'); }
  });
  $('studentCsv').addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const rows = parseCsv(await file.text());
      if (!rows.length) throw new Error('The CSV has no data rows.');
      let imported = 0;
      let skipped = 0;
      let errors = 0;
      for (const row of rows) {
        try {
          const result = await upsertStudentFromCsvRow(row);
          if (result.skipped) skipped += 1;
          else imported += 1;
        } catch (error) {
          errors += 1;
          console.warn('CSV student import failed:', row.email, error);
        }
      }
      showMessage($('studentToolsMessage'), `${imported} student record(s) added to the pending approval queue. ${skipped ? `${skipped} invalid row(s) skipped. ` : ''}${errors ? `${errors} row(s) failed.` : ''}`.trim(), errors ? 'error' : 'success');
    } catch (error) { showMessage($('studentToolsMessage'), error.message, 'error'); } finally { event.target.value = ''; }
  });
  $('studentImportBody').addEventListener('click', async event => {
    const button = event.target.closest('[data-approve-import]');
    if (!button) return;
    button.disabled = true;
    try {
      const { data } = await callPortalFunction('approveStudentImport', { importId:button.dataset.approveImport });
      try {
        await portalAuth.sendPasswordReset(data.email, {
          url: `${window.location.origin}/login.html`,
          handleCodeInApp: false
        });
        showMessage($('studentToolsMessage'), `Approved ${data.email}. A secure password setup link was sent to the student.`, 'success');
      } catch (emailError) {
        showMessage($('studentToolsMessage'), `Student account ${data.email} was approved, but the setup email failed: ${emailError.message}. Use “Send setup link” in the student list to retry.`, 'error');
      }
    } catch (error) {
      showMessage($('studentToolsMessage'), `Student approval failed: ${error.message}`, 'error');
    } finally {
      button.disabled = false;
    }
  });
}

function addLiveMetrics() {
  const update = (id, value) => { if ($(id)) $(id).textContent = String(value); };
  onSnapshot(collection(db, 'users'), snapshot => {
    const studentDocs = snapshot.docs.filter(item => String(item.data().role || '').toLowerCase() === 'student');
    update('studentMetric', studentDocs.length);
    update('pendingMetric', studentDocs.filter(item => item.data().approvalStatus !== 'APPROVED').length);
    const body = $('studentDetailsBody');
    if (!body) return;
    body.innerHTML = studentDocs.map(item => {
      const student = item.data();
      const status = String(student.approvalStatus || 'APPROVED').toUpperCase();
      const approveButton = status === 'APPROVED' ? '' : `<button class="${buttonClass}" type="button" data-approve-user="${escapeHtml(item.id)}" data-student-email="${escapeHtml(student.email || '')}">Approve</button>`;
      return `<tr><td>${escapeHtml(student.name || 'Unnamed')}</td><td>${escapeHtml(student.email || '')}</td><td>${escapeHtml(student.phone || 'Not provided')}</td><td>${escapeHtml(student.course || 'Not assigned')}</td><td>${escapeHtml(student.institution || student.campusId || 'Not provided')}</td><td>${escapeHtml(status)}</td><td>${approveButton} <button class="${buttonClass}" type="button" data-reset-student="${escapeHtml(item.id)}" data-student-email="${escapeHtml(student.email || '')}">Send setup link</button></td></tr>`;
    }).join('') || '<tr><td colspan="7">No students found.</td></tr>';
  }, error => { const message = $('studentToolsMessage'); if (message) showMessage(message, `Could not load student records: ${error.message}`, 'error'); });
  onSnapshot(collection(db, 'student_imports'), snapshot => {
    const body = $('studentImportBody');
    if (!body) return;
    const pending = snapshot.docs.filter(item => (item.data().approvalStatus || 'PENDING') === 'PENDING');
    body.innerHTML = pending.map(item => {
      const student = item.data();
      return `<tr><td>${escapeHtml(student.name || '')}</td><td>${escapeHtml(student.email || '')}</td><td>${escapeHtml(student.course || '—')}</td><td>${escapeHtml(student.campusId || '—')}</td><td><button class="${buttonClass}" type="button" data-approve-import="${escapeHtml(item.id)}">Approve &amp; send setup link</button></td></tr>`;
    }).join('') || '<tr><td colspan="5">No student approvals are waiting.</td></tr>';
  }, error => { const message = $('studentToolsMessage'); if (message) showMessage(message, `Could not load the approval queue: ${error.message}`, 'error'); });
  onSnapshot(collection(db, 'staff'), snapshot => update('staffMetric', snapshot.docs.filter(item => item.data().status !== 'disabled').length), () => {});
  onSnapshot(collection(db, 'courses'), snapshot => update('courseMetric', snapshot.docs.filter(item => item.data().status === 'published').length), () => {});
  $('studentDetailsBody')?.addEventListener('click', async event => {
    const approveButton = event.target.closest('[data-approve-user]');
    const resetButton = event.target.closest('[data-reset-student]');
    if (approveButton) {
      approveButton.disabled = true;
      try {
        const { data } = await callPortalFunction('setStudentAccountStatus', { uid:approveButton.dataset.approveUser, status:'APPROVED' });
        try {
          await portalAuth.sendPasswordReset(approveButton.dataset.studentEmail, {
            url: `${window.location.origin}/login.html`,
            handleCodeInApp: false
          });
          showMessage($('studentToolsMessage'), `Approved ${approveButton.dataset.studentEmail}. A secure password setup link was sent.`, 'success');
        } catch (emailError) {
          showMessage($('studentToolsMessage'), `Student account ${approveButton.dataset.studentEmail} was approved, but the setup email failed: ${emailError.message}. Use “Send setup link” to retry.`, 'error');
        }
      } catch (error) {
        showMessage($('studentToolsMessage'), `Student approval failed: ${error.message}`, 'error');
      } finally {
        approveButton.disabled = false;
      }
      return;
    }
    if (!resetButton) return;
    const email = resetButton.dataset.studentEmail;
    if (!email) return showMessage($('studentToolsMessage'), 'This student has no email address for password setup.', 'error');
    try {
      await portalAuth.sendPasswordReset(email, { url:`${window.location.origin}/login.html`, handleCodeInApp:false });
      showMessage($('studentToolsMessage'), `A secure password setup link was sent to ${email}.`, 'success');
    } catch (error) {
      showMessage($('studentToolsMessage'), error.code === 'auth/user-not-found' ? 'No Firebase Auth account exists for this email. Approve an imported student record to create it.' : error.message, 'error');
    }
  });
}

function addStaffDirectory() {
  const section = $('staff'); const panel = section?.querySelector('.panel'); if (!panel || $('staffDirectory')) return;
  const directory = document.createElement('div'); directory.id = 'staffDirectory'; directory.className = 'panel';
  directory.innerHTML = '<h3>Staff directory</h3><div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:.82rem"><thead><tr><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Name</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Email</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Role</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Campus</th><th style="text-align:left;padding:.55rem;border-bottom:1px solid var(--line)">Action</th></tr></thead><tbody id="staffDirectoryBody"><tr><td colspan="5" style="padding:.7rem;color:var(--muted)">Loading staff...</td></tr></tbody></table></div><div class="notice hidden" id="staffDirectoryMessage"></div>';
  panel.after(directory);
  onSnapshot(collection(db, 'staff'), snapshot => {
    const body = $('staffDirectoryBody');
    body.innerHTML = snapshot.docs.map(item => { const staff = item.data(); const action = staff.status === 'disabled' ? 'Disabled' : `<button class="${buttonClass}" type="button" data-delete-staff="${escapeHtml(item.id)}" data-staff-email="${escapeHtml(staff.email || '')}" style="padding:.35rem .5rem;font-size:.75rem;background:var(--red)">Disable account</button>`; return `<tr><td style="padding:.55rem;border-bottom:1px solid var(--line)">${escapeHtml(staff.name || 'Unnamed')}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${escapeHtml(staff.email || 'No email')}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${escapeHtml(staff.role || 'Staff')}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${escapeHtml(staff.campusId || 'Global')}</td><td style="padding:.55rem;border-bottom:1px solid var(--line)">${action}</td></tr>`; }).join('') || '<tr><td colspan="5" style="padding:.7rem;color:var(--muted)">No staff profiles found.</td></tr>';
  }, error => { if ($('staffDirectoryMessage')) showMessage($('staffDirectoryMessage'), error.message, 'error'); });
  $('staffDirectoryBody').addEventListener('click', async event => {
    const button = event.target.closest('[data-delete-staff]'); if (!button) return;
    if (!window.confirm(`Disable access for ${button.dataset.staffEmail || 'this staff member'}? They will no longer be able to sign in.`)) return;
    try {
      await callPortalFunction('disableStaffAccount', { uid:button.dataset.deleteStaff });
      if (button.dataset.staffEmail) { const branch = await getDocs(query(collection(db, 'campuses', 'unilorin', 'staff'), where('email', '==', button.dataset.staffEmail))); await Promise.all(branch.docs.map(item => deleteDoc(item.ref))); }
      showMessage($('staffDirectoryMessage'), 'Staff sign-in access disabled.', 'success');
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

try {
  const user = await new Promise(resolve => {
    const stop = portalAuth.onAuthStateChanged(currentUser => { stop(); resolve(currentUser); });
  });
  if (user?.email?.toLowerCase() !== 'theilmnexus@gmail.com') {
    window.location.href = 'login.html';
  } else {
    addStudentTools();
    addStaffDirectory();
    addLiveMetrics();

    addFundWorkflow();
  }
} catch (error) {
  console.warn('Admin enhancements unavailable:', error);
}
