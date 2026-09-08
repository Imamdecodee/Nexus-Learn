(async function () {
  const root = window.CAMPUS_ROOT || '../../../';
  const campus = window.ILM_CAMPUSES[window.CAMPUS_ID];
  const app = document.getElementById('campusApp');
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#039;' }[character]));

  if (!campus) {
    app.innerHTML = `<main class="notice"><h1>Campus not found</h1><a href="${root}index.html">Return to ILM Nexus</a></main>`;
    return;
  }

  const logo = `${root}${campus.logo}`;
  const memberUrl = 'https://ilmnexus-5oxknaa6.manus.space/join';
  const contactNumber = '09161699509';
  const contactUrl = `tel:${contactNumber}`;
  const dashboardUrl = `${root}dashboard.html#courses`;
  const campusPath = campus.route.replace(/\/$/, '');
  const campusUrl = `https://ilmnexus.tech/${campusPath}/`;
  const pageTitle = `ILM Nexus ${campus.name} Campus | Learn, Build, Grow`;
  const pageDescription = `Join the ILM Nexus ${campus.institution} community for practical digital skills, campus events, and career growth.`;
  const leadership = window.CAMPUS_ID === 'unilorin' ? [
    { name:'Bakare Aminat Adewunmi', role:'Campus President', meta:'Employment Relations & HRM · 200 Level', contact:'+2349057808154', hobbies:'Community building, learning', image:'president.jpg', vision:'I am glad to have everyone onboard and I look forward to the growth and progress of ILM NEXUS with every single person.' },
    { name:'Abdulhadi Sanni (McTops)', role:'Vice President', meta:'ER / HRM · 200 Level', contact:'+2347084484946', hobbies:'Surfing the net, sports', image:'vice president.jpg', vision:'Because I believe in ILM Nexus and I want to see it progress and succeed.' },
    { name:'Agbabiaka Fatihat Omotayo', role:'Public Relations Officer', meta:'Pharmacy · 500 Level', contact:'+2349080694072', hobbies:'Reading, watching movies, posting memes', image:'prounilorin.jpg', vision:'I want to be more responsible and give out to the community. Also for the experience!' },
    { name:'Ifabiyi Abdulbaseet Olanrewaju', role:'Academic Coordinator', meta:'IRPM · 200 Level', contact:'+2347062218619', hobbies:'Pro gaming, e-book reading', image:'AcademicCord.jpg', vision:'I believe in the goal of ILM Nexus, the world is evolving; a certificate alone will not cut it, and opportunities to prove oneself are rare.' },
    { name:'Abdulazeez Ifedolapo Okikiola (Big Mike)', role:'Community Manager', meta:'Industrial Relations & Personnel Management · 200 Level', contact:'+2347061491603', hobbies:'Reading, music, creative fields', image:'comunitymanager.jpg', vision:'I am enthusiastic about growing, learning, and connecting. I believe joining ILM Nexus will help me achieve it all.' },
    { name:'Victory Odeleme Francis', role:'General Secretary', meta:'Industrial Relations & Personnel Management · 300 Level', contact:'+2348137242021', hobbies:'Cooking, reading, writing, listening to music', image:'Gensece.jpg', vision:'I joined ILM Nexus to learn, grow, explore my interest in technology, and connect with like-minded people.' },
    { name:'Abioye Emmanuel Great', role:'Campus Creative Designer', meta:'Computer Engineering · 300 Level', contact:'+2349044690715', hobbies:'Reading, doing what I am best at, listening to music', image:'campusdesiner.jpg', vision:'I am a curious and creative learner who enjoys discovering new ideas and developing practical skills. I joined ILM Nexus to grow, gain meaningful experience, and contribute to this community.' }
  ] : [];
  const classroom = [
    { title:'Frontend Development', icon:'fa-code', description:'Build responsive interfaces and publish real projects.' },
    { title:'Digital Marketing', icon:'fa-bullhorn', description:'Learn campaigns, content strategy, and analytics.' },
    { title:'Content Creation', icon:'fa-clapperboard', description:'Turn ideas into scripts, visual stories, and portfolio work.' },
    { title:'UI/UX Design & Product Strategy', icon:'fa-pen-ruler', description:'Design useful experiences and think clearly about products.' },
    { title:'Data Analysis & Visualization', icon:'fa-chart-column', description:'Find patterns, explain insights, and build clear dashboards.' },
    { title:'Cybersecurity Fundamentals', icon:'fa-shield-halved', description:'Understand identity, risk, networks, and safe digital practice.' }
  ];
  const classroomFeed = [
    { name:'Bada Kehinde', category:'Questions', content:'What should I include in my first frontend portfolio project?', time:'Today · 10:30' },
    { name:'Aisha Bello', category:'Resources', content:'Sharing a useful checklist for planning a digital campaign.', time:'Yesterday · 16:05' }
  ];
  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error('The profile image could not be read.'));
      reader.onload = () => { const image = new Image(); image.onload = () => { const scale = Math.min(1, 800 / Math.max(image.width, image.height)); const canvas = document.createElement('canvas'); canvas.width = Math.max(1, Math.round(image.width * scale)); canvas.height = Math.max(1, Math.round(image.height * scale)); canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height); resolve(canvas.toDataURL('image/jpeg', .72)); }; image.onerror = () => reject(new Error('The profile image is invalid.')); image.src = reader.result; };
      reader.readAsDataURL(file);
    });
  }
  const events = [
    { id:'unilorin-campus-workshop', title:'UNILORIN Digital Skills Workshop', date:'Coming soon', description:'A practical campus session for students building their first digital project.' },
    { id:'unilorin-community-meetup', title:'ILM Nexus Chapter Meetup', date:'Coming soon', description:'Meet the chapter team, find collaborators, and learn how to join a campus path.' },
    { id:'unilorin-virtual-lab', title:'Virtual Portfolio Lab', date:'Coming soon', description:'Bring a project, ask questions, and leave with a clearer next step.' }
  ];

  document.title = pageTitle;
  document.querySelector('meta[name="description"]')?.setAttribute('content', pageDescription);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', campusUrl);
  document.querySelector('meta[property="og:url"]')?.setAttribute('content', campusUrl);
  document.querySelector('meta[property="og:title"]')?.setAttribute('content', pageTitle);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', pageDescription);
  const structuredData = document.getElementById('campusStructuredData');
  if (structuredData) structuredData.textContent = JSON.stringify({ '@context':'https://schema.org', '@type':'EducationalOrganization', name:pageTitle, url:campusUrl, logo:`https://ilmnexus.tech/${campus.logo}`, description:pageDescription, parentOrganization:{ '@type':'EducationalOrganization', name:'ILM Nexus Academy' }, address:{ '@type':'PostalAddress', addressLocality:campus.state, addressCountry:'NG' } });

  app.innerHTML = `
    <header class="campus-header"><div class="wrap campus-nav"><a href="${root}index.html" class="brand"><img src="${root}image/logo.png" alt="ILM Nexus logo"><span>ILM Nexus</span></a><nav><a href="#classroom">Classroom</a><a href="#leadership">Leadership</a><a href="#events">Events</a><a href="#news">News</a><a class="nav-join" href="${memberUrl}">Join Campus</a></nav></div></header>
    <main>
      <section class="campus-hero"><div class="wrap hero-grid"><div><p class="eyebrow">${escapeHtml(campus.state)} · UNILORIN chapter</p><h1>Learn, build, and grow at ${escapeHtml(campus.name)}.</h1><p>${escapeHtml(campus.description)} Join a practical community where students build visible skills and meaningful connections.</p><div class="actions"><a class="button button-gold" href="${memberUrl}">Join as a member</a><a class="button button-light" href="#classroom">Explore classroom</a><a class="button button-light" href="${contactUrl}"><i class="fas fa-phone"></i> Contact the chapter</a></div></div><div class="identity"><img class="ilm-logo" src="${root}image/logo.png" alt="ILM Nexus logo"><span>×</span><img class="institution-logo" src="${logo}" alt="${escapeHtml(campus.institution)} logo"><strong>${escapeHtml(campus.institution)} · ILM Nexus Chapter</strong></div></div></section>
      <section class="section" id="about"><div class="wrap"><p class="eyebrow blue">The chapter</p><h2>A campus community built for action.</h2><p class="lead">ILM Nexus UNILORIN connects motivated students to guided learning, practical projects, local events, and peers who are building their next opportunity.</p><div class="stats"><div><strong>3 learning paths</strong><span>Practical classroom tracks</span></div><div><strong>4 chapter leaders</strong><span>Student-led support</span></div><div><strong>One community</strong><span>Online and on campus</span></div></div></div></section>
      <section class="section section-light" id="classroom"><div class="wrap"><p class="eyebrow blue">Nexus classroom</p><h2>Choose your next practical path.</h2><p class="lead">Explore a track, join the conversation, and open the dashboard when you are ready to continue your learning.</p><div class="skills-grid">${classroom.map(item => `<a class="skill-card" href="${dashboardUrl}"><i class="fas ${item.icon}"></i><h3>${item.title}</h3><p>${item.description}</p><span class="text-link" style="margin-top:auto">Open classroom →</span></a>`).join('')}</div><div class="classroom-layout"><div class="classroom-panel"><div class="cms-modal-header"><div><p class="eyebrow blue">Community discussion</p><h3>Ask, share, and build together.</h3></div><span class="muted">UNILORIN chapter</span></div><form class="classroom-form" id="classroomPostForm"><label>Post category<select name="category"><option>Questions</option><option>Designs</option><option>Resources</option><option>Announcements</option></select></label><label>Link attachment (optional)<input name="link" type="url" placeholder="https://..."></label><label class="full">Message<textarea name="content" placeholder="Share a question, design, resource, or announcement" required></textarea></label><div class="full feed-actions"><div class="filter-pills"><button class="filter-pill active" type="button" data-filter="All">All</button><button class="filter-pill" type="button" data-filter="Questions">Questions</button><button class="filter-pill" type="button" data-filter="Designs">Designs</button><button class="filter-pill" type="button" data-filter="Resources">Resources</button><button class="filter-pill" type="button" data-filter="Announcements">Announcements</button></div><button class="small-button" type="submit"><i class="fas fa-paper-plane"></i> Post</button></div></form><div class="feed" id="classroomFeed">${classroomFeed.map(post => `<article class="feed-item" data-category="${post.category}"><div class="feed-item-head"><span class="feed-avatar">${post.name.charAt(0)}</span><strong>${post.name}</strong><time>${post.time}</time></div><p>${post.content}</p></article>`).join('')}</div></div><aside class="classroom-sidebar"><div class="classroom-widget"><h3><i class="fas fa-thumbtack"></i> Pinned announcement</h3><p>Bring one practical project to the next chapter session. Progress becomes visible when you share the work.</p></div><div class="classroom-widget"><h3><i class="fas fa-folder-open"></i> Resources</h3><ul><li><a class="text-link" href="${root}programs.html">Academy programme catalogue</a></li><li><a class="text-link" href="${root}dashboard.html#courses">Student dashboard</a></li><li><a class="text-link" href="${root}events/build-digital-identity.html">Live event classroom</a></li></ul></div><div class="classroom-widget"><h3><i class="fas fa-calendar-days"></i> Upcoming sessions</h3><p>Chapter workshop dates will appear here when published.</p><a class="contact-link" href="tel:${contactNumber}"><i class="fas fa-phone"></i> Contact ${contactNumber}</a></div></aside></div></div></section>
      <section class="section" id="leadership"><div class="wrap"><p class="eyebrow blue">Executive roster</p><h2>Meet the ${escapeHtml(campus.name)} chapter team.</h2><p class="lead">A student-led team creating a more capable, connected, and opportunity-ready campus community.</p><div class="leaders-grid">${leadership.length ? leadership.map((person, index) => `<article class="leader-card ${index === 0 ? 'featured-leader' : ''}"><img src="${root}state/kwara/unilorin/staffpic/${encodeURIComponent(person.image)}" alt="${escapeHtml(person.name)}"><span class="leader-role">${index === 0 ? 'ILM Nexus Hub Manager · Ilorin' : escapeHtml(person.role)}</span><h3>${escapeHtml(person.name)}</h3><p class="leader-meta">${escapeHtml(person.meta)}</p><p><strong>Contact:</strong> <a class="text-link" href="tel:${person.contact}">${escapeHtml(person.contact)}</a></p><p><strong>Hobbies:</strong> ${escapeHtml(person.hobbies)}</p><p class="vision">${escapeHtml(person.vision)}</p></article>`).join('') : '<article class="empty-state"><i class="fas fa-users"></i><p>Chapter leadership profiles will appear here when assigned by central administration.</p></article>'}</div></div></section>
      <section class="section section-light" id="events"><div class="wrap"><p class="eyebrow blue">Event community</p><h2>Learn together, in public.</h2><p class="lead">Browse chapter questions and project reviews by conversation type.</p><div class="filter-pills review-filters"><button class="filter-pill active" type="button" data-review-filter="All Posts">All Threads</button><button class="filter-pill" type="button" data-review-filter="Code Debugs">Code Debugs</button><button class="filter-pill" type="button" data-review-filter="Project Feedback">Project Feedback</button><button class="filter-pill" type="button" data-review-filter="Announcements">Announcements</button></div><div class="event-grid">${events.map(event => `<article class="event-card" data-event-id="${event.id}"><i class="fas fa-calendar-days"></i><h3>${event.title}</h3><p>${event.description}</p><time>${event.date}</time><div class="event-posts"><strong>Review timeline</strong><div class="post-list"><p class="muted">Loading reviews...</p></div></div></article>`).join('')}</div><div class="feedback-panel" id="studentFeedback"><p class="eyebrow blue">Student feedback</p><h3>Tell the chapter team what you need.</h3><form class="feedback-form" id="feedbackForm"><select name="category"><option>General feedback</option><option>Code Debugs</option><option>Project Feedback</option><option>Announcements</option></select><textarea name="message" placeholder="Write your feedback" required maxlength="2000"></textarea><button class="small-button" type="submit"><i class="fas fa-paper-plane"></i> Send feedback</button><p class="cms-message" id="feedbackMessage"></p></form></div></div></section>
      <section class="section" id="news"><div class="wrap"><p class="eyebrow blue">Live campus news</p><h2>What is happening at UNILORIN.</h2><p class="lead">Published articles tagged with <strong>unilorin</strong> appear here automatically from the central news collection.</p><div class="news-grid" id="campusNews"><article class="empty-state"><i class="fas fa-newspaper"></i><p>Connecting to live campus news...</p></article></div></div></section>
      <section class="campus-join"><div class="wrap join-row"><div><p class="eyebrow">Join this community</p><h2>Build with ILM Nexus UNILORIN.</h2><p>Register your interest and choose your campus during onboarding.</p></div><a class="button button-gold" href="${memberUrl}">Join as a member <i class="fas fa-arrow-right"></i></a></div></section>
    </main><footer><div class="wrap footer-row"><span>ILM Nexus · ${escapeHtml(campus.name)} Campus</span><a href="${root}campus-admin.html?campus=unilorin">Campus executive login</a><a href="${root}index.html">Central ILM Nexus</a><button class="cms-trigger" id="cmsTrigger" type="button" aria-label="Open local CMS"><i class="fas fa-gear"></i></button></div></footer><div class="cms-modal-backdrop" id="cmsModal"><section class="cms-modal" role="dialog" aria-modal="true" aria-labelledby="cmsTitle"><div class="cms-modal-header"><div><p class="eyebrow blue">Local chapter tools</p><h2 id="cmsTitle">Presido access</h2></div><button class="cms-close" id="cmsClose" type="button" aria-label="Close"><i class="fas fa-xmark"></i></button></div><form id="cmsPinForm"><label>Authorization pass<input id="cmsPin" type="password" autocomplete="off" required></label><button class="small-button" type="submit">Unlock panel</button><p class="cms-message" id="cmsPinMessage"></p></form><div class="cms-grid" id="cmsPanel" hidden><form class="cms-form" id="courseForm"><h3>Add new course module</h3><label>Course title<input name="title" required></label><label>Description<textarea name="description" required></textarea></label><label>Video or workspace link<input name="link" type="url"></label><button class="small-button" type="submit">Save course</button><p class="cms-message" id="courseMessage"></p></form><form class="cms-form" id="staffForm"><h3>Upload local staff profile</h3><label>Name<input name="name" required></label><label>Position<input name="position" required></label><label>Department<input name="department" required></label><label>Level<input name="level" required></label><label>Contact<input name="contact" type="tel" required></label><label>Hobbies<input name="hobbies"></label><label>Short bio<textarea name="bio" required></textarea></label><label>Profile picture<input name="image" type="file" accept="image/*" required></label><button class="small-button" type="submit">Save staff profile</button><p class="cms-message" id="staffMessage"></p></form></div></section></div>`;

  let firebaseReady;
  const loggedInStudent = JSON.parse(localStorage.getItem('student_data') || 'null');
  if (loggedInStudent?.role === 'Student' || localStorage.getItem('student_logged_in') === 'yes') document.getElementById('studentFeedback')?.classList.add('visible');
  const cmsModal = document.getElementById('cmsModal');
  document.getElementById('cmsTrigger').addEventListener('click', () => cmsModal.classList.add('open'));
  document.getElementById('cmsClose').addEventListener('click', () => cmsModal.classList.remove('open'));
  cmsModal.addEventListener('click', event => { if (event.target === cmsModal) cmsModal.classList.remove('open'); });
  document.getElementById('cmsPinForm').addEventListener('submit', event => {
    event.preventDefault();
    const message = document.getElementById('cmsPinMessage');
    if (document.getElementById('cmsPin').value === 'presido01') { document.getElementById('cmsPanel').hidden = false; event.currentTarget.hidden = true; message.textContent = ''; }
    else message.textContent = 'That access pass is not valid.';
  });
  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('[data-filter]').forEach(item => item.classList.toggle('active', item === button));
    document.querySelectorAll('#classroomFeed .feed-item').forEach(item => { item.hidden = button.dataset.filter !== 'All' && item.dataset.category !== button.dataset.filter; });
  }));

  async function connectFirebase() {
    try {
      firebaseReady = import(`${root}portal/firebase.js`);
      const { db, firestoreModule } = await firebaseReady;
      const { addDoc, collection, doc, getDocs, onSnapshot, serverTimestamp } = firestoreModule;
      document.getElementById('classroomPostForm').addEventListener('submit', async event => {
        event.preventDefault();
        const formElement = event.currentTarget; const form = new FormData(formElement);
        try { await addDoc(collection(db, 'classroom_events', 'unilorin-classroom', 'posts'), { eventId:'unilorin-classroom', memberName:'UNILORIN member', memberEmail:'campus-member@ilmnexus.pro', content:String(form.get('content')).trim(), category:String(form.get('category')), attachmentUrl:String(form.get('link')).trim(), type:'discussion', createdAt:serverTimestamp() }); formElement.reset(); } catch (error) { window.alert(error.message || 'Your post could not be submitted.'); }
      });
      onSnapshot(collection(db, 'classroom_events', 'unilorin-classroom', 'posts'), snapshot => {
        const feed = document.getElementById('classroomFeed');
        const posts = snapshot.docs.map(item => item.data()).slice(-12).reverse();
        if (!posts.length) return;
        feed.innerHTML = posts.map(post => `<article class="feed-item" data-category="${escapeHtml(post.category || 'Questions')}"><div class="feed-item-head"><span class="feed-avatar">${escapeHtml(String(post.memberName || 'M').charAt(0))}</span><strong>${escapeHtml(post.memberName || 'Member')}</strong><time>${post.createdAt?.toDate ? post.createdAt.toDate().toLocaleString() : 'Recently'}</time></div><p>${escapeHtml(post.content)}</p>${post.attachmentUrl ? `<a href="${escapeHtml(post.attachmentUrl)}" target="_blank" rel="noopener">Open attachment</a>` : ''}</article>`).join('');
      }, () => {});
      document.getElementById('courseForm').addEventListener('submit', async event => {
        event.preventDefault();
        const formElement = event.currentTarget; const form = new FormData(formElement); const message = document.getElementById('courseMessage');
        try { await addDoc(collection(db, 'campuses', 'unilorin', 'courses'), { title:String(form.get('title')).trim(), description:String(form.get('description')).trim(), link:String(form.get('link')).trim(), createdAt:serverTimestamp() }); formElement.reset(); message.textContent = 'Course saved.'; } catch (error) { message.textContent = error.message || 'Course could not be saved. Sign in with an authorized Firebase account.'; }
      });
      document.getElementById('staffForm').addEventListener('submit', async event => {
        event.preventDefault();
        const formElement = event.currentTarget; const form = new FormData(formElement); const message = document.getElementById('staffMessage'); const image = form.get('image');
        try { const imageUrl = await compressImage(image); if (imageUrl.length > 900000) throw new Error('Choose a smaller profile image.'); await addDoc(collection(db, 'campuses', 'unilorin', 'staff_profiles'), { name:String(form.get('name')).trim(), position:String(form.get('position')).trim(), department:String(form.get('department')).trim(), level:String(form.get('level')).trim(), contact:String(form.get('contact')).trim(), hobbies:String(form.get('hobbies')).trim(), bio:String(form.get('bio')).trim(), imageUrl, campusId:'unilorin', createdAt:serverTimestamp() }); formElement.reset(); message.textContent = 'Staff profile saved on the free Firebase plan.'; } catch (error) { message.textContent = error.message || 'Staff profile could not be saved.'; }
      });
      const renderNews = snapshot => {
        const articles = snapshot.docs.map(item => ({ id:item.id, ...item.data() })).filter(article => Object.values(article).some(value => String(value ?? '').toLowerCase().includes('unilorin'))).slice(0, 6);
        const news = document.getElementById('campusNews');
        news.innerHTML = articles.length ? articles.map(article => `<article class="news-card"><span class="news-category">${escapeHtml(article.category || 'Campus update')}</span><h3>${escapeHtml(article.title || 'UNILORIN campus update')}</h3><p>${escapeHtml(article.description || article.content || 'Read the latest ILM Nexus update.')}</p><time>${escapeHtml(article.date || 'Recently published')}</time><a class="text-link" href="${root}article.html?id=${encodeURIComponent(article.id)}">Read update →</a></article>`).join('') : '<article class="empty-state"><i class="fas fa-newspaper"></i><p>No UNILORIN news has been published yet. New tagged articles will appear here automatically.</p></article>';
      };
      onSnapshot(collection(db, 'news'), renderNews, () => { document.getElementById('campusNews').innerHTML = '<article class="empty-state"><i class="fas fa-circle-info"></i><p>Live news is temporarily unavailable. Please check the central news page.</p></article>'; });
      onSnapshot(collection(db, 'campuses', 'unilorin', 'staff_profiles'), snapshot => {
        const grid = document.querySelector('#leadership .leaders-grid');
        if (!grid || !snapshot.docs.length) return;
        const remoteProfiles = snapshot.docs.map(item => item.data());
        grid.insertAdjacentHTML('beforeend', remoteProfiles.map(person => `<article class="leader-card"><img src="${escapeHtml(person.imageUrl || '')}" alt="${escapeHtml(person.name || 'Staff profile')}"><span class="leader-role">${escapeHtml(person.position || 'Chapter staff')}</span><h3>${escapeHtml(person.name || 'Unnamed staff')}</h3><p class="leader-meta">${escapeHtml(person.department || '')} · ${escapeHtml(person.level || '')}</p><p><strong>Contact:</strong> <a class="text-link" href="tel:${escapeHtml(person.contact || '')}">${escapeHtml(person.contact || 'Not provided')}</a></p><p><strong>Hobbies:</strong> ${escapeHtml(person.hobbies || 'Not provided')}</p><p class="vision">${escapeHtml(person.bio || '')}</p></article>`).join(''));
      }, () => {});
      document.querySelectorAll('.event-card').forEach(card => {
        const eventId = card.dataset.eventId;
        const posts = card.querySelector('.post-list');
        onSnapshot(collection(db, 'classroom_events', eventId, 'posts'), snapshot => {
          const items = snapshot.docs.map(item => item.data()).slice(0, 4);
          posts.innerHTML = items.length ? items.map(item => `<p data-review-category="${escapeHtml(item.category || item.type || 'All Posts')}"><strong>${escapeHtml(item.memberName || 'Verified member')}:</strong> <span class="leader-role" style="display:inline">${escapeHtml(item.category || item.type || 'Discussion')}</span> ${escapeHtml(item.content)}</p>`).join('') : '<p>No reviews yet. New chapter discussions will appear here.</p>';
        }, () => { posts.innerHTML = '<p>Community board coming online soon.</p>'; });
      });
      document.querySelectorAll('[data-review-filter]').forEach(button => button.addEventListener('click', () => { document.querySelectorAll('[data-review-filter]').forEach(item => item.classList.toggle('active', item === button)); document.querySelectorAll('[data-review-category]').forEach(item => { item.hidden = button.dataset.reviewFilter !== 'All Posts' && item.dataset.reviewCategory !== button.dataset.reviewFilter; }); }));
      document.getElementById('feedbackForm')?.addEventListener('submit', async event => { const formElement = event.currentTarget; event.preventDefault(); const form = new FormData(formElement); const message = document.getElementById('feedbackMessage'); const feedback = { campusId:'unilorin', studentName:loggedInStudent?.name || 'Student', studentEmail:loggedInStudent?.email || '', category:String(form.get('category')), message:String(form.get('message')).trim(), createdAt:new Date().toISOString() }; try { await addDoc(collection(db, 'campus_feedback'), { ...feedback, createdAt:serverTimestamp() }); formElement.reset(); message.textContent = 'Feedback sent to the chapter team.'; } catch (error) { const saved = JSON.parse(localStorage.getItem('campus_feedback') || '[]'); saved.push(feedback); localStorage.setItem('campus_feedback', JSON.stringify(saved)); formElement.reset(); message.textContent = 'Feedback saved on this device. It will sync when your Firebase student account is connected.'; } });
    } catch (error) {
      document.getElementById('campusNews').innerHTML = '<article class="empty-state"><i class="fas fa-circle-info"></i><p>Live campus services are temporarily unavailable. The classroom and chapter information remain available.</p></article>';
      console.warn('Campus Firebase services unavailable:', error);
    }
  }

  connectFirebase();
})();
