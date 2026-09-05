(function () {
  const root = window.CAMPUS_ROOT || '../../../';
  const campus = window.ILM_CAMPUSES[window.CAMPUS_ID];
  const app = document.getElementById('campusApp');

  if (!campus) {
    app.innerHTML = '<main class="notice"><h1>Campus not found</h1><a href="' + root + 'index.html">Return to ILM Nexus</a></main>';
    return;
  }

  const logo = `${root}${campus.logo}`;
  const programs = campus.programs.length ? campus.programs.map(program => `<li>${program}</li>`).join('') : '<li class="muted">Programs will be announced soon.</li>';
  const memberUrl = 'https://ilmnexus-5oxknaa6.manus.space/join';
  const dashboardUrl = `${root}campus-admin.html?campus=${encodeURIComponent(campus.id)}`;
  const campusPath = campus.route.replace(/\/$/, '');
  const campusUrl = `https://ilmnexus.tech/${campusPath}/`;
  const pageTitle = `Best Campus Community in Tech at ${campus.name} | Ilm Nexus Academy`;
  const pageDescription = `Discover the Ilm Nexus campus community at ${campus.institution} (${campus.name}). Connect with student developers, access local tech bootcamps, and launch your career.`;
  document.title = pageTitle;
  document.querySelector('meta[name="description"]')?.setAttribute('content', pageDescription);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', campusUrl);
  const socialMeta = {
    'og:url': campusUrl,
    'og:title': pageTitle,
    'og:description': `Join the premier student tech community at ${campus.institution}. Bootcamps, tech events, and peer networking.`,
    'og:image': `https://ilmnexus.tech/${campus.logo}`
  };
  Object.entries(socialMeta).forEach(([property, content]) => {
    document.querySelector(`meta[property="${property}"]`)?.setAttribute('content', content);
  });
  document.querySelector('meta[name="twitter:title"]')?.setAttribute('content', pageTitle);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', socialMeta['og:description']);
  document.querySelector('meta[name="twitter:image"]')?.setAttribute('content', socialMeta['og:image']);
  const campusStructuredData = document.getElementById('campusStructuredData');
  if (campusStructuredData) {
    campusStructuredData.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      name: pageTitle,
      url: campusUrl,
      logo: 'https://ilmnexus.tech/image/logo.png',
      description: pageDescription,
      parentOrganization: { '@type': 'EducationalOrganization', name: 'Ilm Nexus Academy', url: 'https://ilmnexus.tech/' },
      address: { '@type': 'PostalAddress', addressLocality: campus.state, addressCountry: 'NG' }
    });
  }

  app.innerHTML = `
    <header class="campus-header">
      <div class="wrap campus-nav">
        <a href="${root}index.html" class="brand"><img src="${root}image/logo.png" alt="ILM Nexus logo"><span>ILM Nexus</span></a>
        <nav><a href="#about">About</a><a href="#programs">Programs</a><a href="#leadership">Leadership</a><a href="#events">Events</a><a href="#news">News</a><a class="nav-join" href="${memberUrl}">Join Campus</a></nav>
      </div>
    </header>
    <main>
      <section class="campus-hero"><div class="wrap hero-grid"><div><p class="eyebrow">${campus.state} · Campus community</p><h1>ILM Nexus — ${campus.name} Campus</h1><p>${campus.description}</p><div class="actions"><a class="button button-gold" href="${memberUrl}">Join ILM Nexus ${campus.name}</a><a class="button button-light" href="#programs">Explore campus</a></div></div><div class="identity"><img class="ilm-logo" src="${root}image/logo.png" alt="ILM Nexus logo"><span>×</span><img class="institution-logo" src="${logo}" alt="${campus.institution} logo"><strong>${campus.institution}</strong></div></div></section>
      <section class="section" id="about"><div class="wrap"><p class="eyebrow blue">About this campus</p><h2>One ILM Nexus. A campus community built for action.</h2><p class="lead">This campus page uses the shared ILM Nexus architecture. Campus programs, leaders, students, bootcamps, events, and announcements will be managed by campus scope rather than copied into separate websites.</p><div class="stats"><div><strong>Updating</strong><span>Campus students</span></div><div><strong>Coming soon</strong><span>Active programs</span></div><div><strong>Coming soon</strong><span>Upcoming activities</span></div></div></div></section>
      <section class="section section-light" id="leadership"><div class="wrap"><p class="eyebrow blue">Campus leadership</p><h2>Meet the campus team</h2><p class="lead">Executive profiles will appear here when assigned by central administration.</p><div class="empty-grid"><article><i class="fas fa-user-tie"></i><h3>Campus President</h3><p>Profile coming soon</p></article><article><i class="fas fa-users"></i><h3>Four executive positions</h3><p>Positions and responsibilities are configurable by admin.</p></article></div></div></section>
      <section class="section" id="programs"><div class="wrap"><p class="eyebrow blue">Campus programs</p><h2>Programs selected for ${campus.name}</h2><div class="program-list">${programs}</div><a class="text-link" href="${root}programs.html">View the central academy catalogue →</a></div></section>
      <section class="section section-light" id="events"><div class="wrap"><p class="eyebrow blue">Bootcamps & events</p><h2>Campus activities</h2><div class="empty-state"><i class="fas fa-calendar-days"></i><p>Bootcamps, events, schedules, venues, and registration will be published here by campus administrators.</p></div></div></section>
      <section class="section" id="news"><div class="wrap"><p class="eyebrow blue">Campus news</p><h2>Announcements for ${campus.name}</h2><div class="empty-state"><i class="fas fa-newspaper"></i><p>No campus-only announcements yet. Global ILM Nexus news remains available on the central news page.</p><a class="text-link" href="${root}news.html">Read central ILM Nexus news →</a></div></div></section>
      <section class="campus-join"><div class="wrap join-row"><div><p class="eyebrow">Join this community</p><h2>Build with ILM Nexus ${campus.name}.</h2><p>Register your interest and select this campus during onboarding.</p></div><a class="button button-gold" href="${memberUrl}">Join as a member <i class="fas fa-arrow-right"></i></a></div></section>
    </main>
    <footer><div class="wrap footer-row"><span>ILM Nexus · ${campus.name} Campus</span><a href="${root}campus-admin.html?campus=${encodeURIComponent(campus.id)}">Campus executive login</a><a href="${root}index.html">Central ILM Nexus</a></div></footer>`;
})();
