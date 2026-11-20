function dateOffset(days) {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + days);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function sampleEvent(id, title, summary, daysFromNow, partnerName = '') {
    return {
        id,
        title: `Sample: ${title}`,
        summary,
        date: dateOffset(daysFromNow),
        startTime: '17:00',
        endTime: '18:30',
        venue: partnerName ? 'Online · Partner session (demo)' : 'Online · ILM Nexus (demo)',
        format: 'Online',
        flyer: './image/flyer.jpg',
        details: `${summary} This is a sample event listing for demonstration, not a confirmed event.`,
        partnerName,
        isDemo: true
    };
}

export function getDemoEvents() {
    return [
        {
            id: 'demo-build-digital-identity',
            title: 'Build Your Digital Identity: LinkedIn Optimization & Professional Visibility',
            summary: 'A practical masterclass with Abdulbasit Lukman on building a credible digital identity and improving LinkedIn visibility.',
            date: '2026-09-05',
            startTime: '20:20',
            endTime: '21:30',
            venue: 'Online · Google Meet',
            format: 'Online',
            flyer: './image/flyer.jpg'
        },
        sampleEvent('demo-upcoming-career-readiness', 'Career Readiness Lab', 'A practical session on CV writing, interviews, and preparing for early-career opportunities.', 2, 'ILM Nexus partner (demo)'),
        sampleEvent('demo-upcoming-ai-learning', 'AI for Learning Workshop', 'Explore responsible ways to use AI tools for research, study planning, and productivity.', 5),
        sampleEvent('demo-upcoming-portfolio', 'Build a Portfolio That Gets Noticed', 'Create a clear portfolio that communicates your skills, projects, and professional goals.', 8),
        sampleEvent('demo-upcoming-campus-innovation', 'Campus Innovation Meetup', 'An interactive meetup for students to share ideas and learn how to turn them into projects.', 12, 'ILM Nexus partner (demo)'),
        sampleEvent('demo-upcoming-digital-skills', 'Digital Skills Open Session', 'A guided introduction to practical digital skills for study, work, and entrepreneurship.', 18),
        sampleEvent('demo-recent-entrepreneurship', 'Student Entrepreneurship Roundtable', 'A sample recap of a conversation about testing ideas and building student-led ventures.', -2, 'ILM Nexus partner (demo)'),
        sampleEvent('demo-recent-communication', 'Communication Skills Masterclass', 'A sample recap of exercises in public speaking, clear writing, and confident presentation.', -5),
        sampleEvent('demo-recent-career-networking', 'Career Networking Hour', 'A sample recap of a networking session focused on meaningful professional connections.', -10, 'ILM Nexus partner (demo)'),
        sampleEvent('demo-recent-project-showcase', 'Student Project Showcase', 'A sample recap celebrating student projects, peer feedback, and collaborative learning.', -17),
        sampleEvent('demo-recent-study-skills', 'Study Skills and Productivity Clinic', 'A sample recap of practical planning techniques for a more focused semester.', -25),
        sampleEvent('demo-past-leadership', 'Student Leadership Forum', 'A sample event page demonstrating how a past leadership forum can be presented.', -45, 'ILM Nexus partner (demo)'),
        sampleEvent('demo-past-design-thinking', 'Design Thinking Sprint', 'A sample recap of a collaborative workshop for exploring problems and prototyping ideas.', -60),
        sampleEvent('demo-past-community-service', 'Community Impact Day', 'A sample recap of a community-focused day of service and reflection.', -90, 'ILM Nexus partner (demo)'),
        sampleEvent('demo-past-research', 'Research and Scholarship Clinic', 'A sample recap covering research planning, scholarship applications, and academic resources.', -120),
        sampleEvent('demo-past-technology', 'Technology for Good Meetup', 'A sample recap of a discussion on using technology to support communities.', -160, 'ILM Nexus partner (demo)'),
        sampleEvent('demo-past-mentorship', 'Mentorship and Career Pathways', 'A sample recap of a mentoring session about career exploration and professional growth.', -210)
    ];
}
