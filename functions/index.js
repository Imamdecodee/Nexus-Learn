const { initializeApp } = require("firebase-admin/app");
const { getAuth } = require("firebase-admin/auth");
const { getFirestore } = require("firebase-admin/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { randomBytes } = require("node:crypto");

initializeApp();

const db = getFirestore();
const auth = getAuth();
const SITE_ORIGIN = "https://ilmnexus.tech";
const DEFAULT_IMAGE = `${SITE_ORIGIN}/image/nexus-learn%20logo.png`;
const LOGO_IMAGE = `${SITE_ORIGIN}/image/nexus-learn%20logo.png`;

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);
}

function safeWebUrl(value, fallback = "") {
    try {
        const url = new URL(value, SITE_ORIGIN);
        return url.protocol === "http:" || url.protocol === "https:" ? url.href : fallback;
    } catch {
        return fallback;
    }
}

function getImageDataUri(value) {
    if (typeof value !== "string" || value.length > 1000000) {
        return null;
    }

    const match = value.match(/^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i);
    if (!match) {
        return null;
    }

    const data = Buffer.from(match[2], "base64");
    if (!data.length || data.length > 750000) {
        return null;
    }

    return { contentType: match[1].toLowerCase(), data };
}

function getPublishedDate(article) {
    const value = article.dateAdded?.toDate ? article.dateAdded.toDate() : new Date(article.date || Date.now());
    return Number.isNaN(value.getTime()) ? new Date() : value;
}

function getShareImage(article, imageUrl) {
    if (getImageDataUri(article.image)) {
        return imageUrl;
    }
    return safeWebUrl(article.image, DEFAULT_IMAGE);
}

function renderLinkedLine(value) {
    const text = String(value ?? "");
    const pattern = /https?:\/\/[^\s<>"']+/gi;
    let output = "";
    let lastIndex = 0;
    let match;

    while ((match = pattern.exec(text))) {
        let urlText = match[0];
        let trailing = "";
        while (/[.,!?;:)]$/.test(urlText)) {
            trailing = urlText.slice(-1) + trailing;
            urlText = urlText.slice(0, -1);
        }

        const href = safeWebUrl(urlText);
        if (!href) {
            continue;
        }

        output += escapeHtml(text.slice(lastIndex, match.index));
        output += `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">${escapeHtml(urlText)}</a>${escapeHtml(trailing)}`;
        lastIndex = match.index + match[0].length;
    }

    return output + escapeHtml(text.slice(lastIndex));
}

function renderLinkedContent(value) {
    return String(value ?? "").split(/\n{2,}/).map(paragraph =>
        `<p>${paragraph.split("\n").map(renderLinkedLine).join("<br>")}</p>`
    ).join("");
}

function renderArticlePage(article, articleId, articleUrl, imageUrl) {
    const title = String(article.title || "ILM Nexus News");
    const description = String(article.description || article.content || "Read the latest news and updates from ILM Nexus.");
    const keywords = (Array.isArray(article.keywords) ? article.keywords : String(article.keywords || "").split(/[,\n]/))
        .map(keyword => String(keyword).trim())
        .filter(Boolean)
        .slice(0, 10);
    const image = getShareImage(article, imageUrl);
    const date = getPublishedDate(article);
    const content = renderLinkedContent(article.content || article.description || "");
    const gallery = Array.isArray(article.gallery) ? article.gallery : [];
    const galleryHtml = gallery.map(imageSource => {
        const url = safeWebUrl(imageSource);
        return url ? `<img src="${escapeHtml(url)}" alt="${escapeHtml(title)}">` : "";
    }).join("");
    const socialLinks = (Array.isArray(article.socialLinks) ? article.socialLinks : []).map(linkSource => {
        const url = safeWebUrl(linkSource);
        if (!url) {
            return "";
        }
        const parsedUrl = new URL(url);
        const label = `${parsedUrl.hostname.replace(/^www\./, "")}${parsedUrl.pathname === "/" ? "" : parsedUrl.pathname}`;
        return `<a class="related-link" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer"><span aria-hidden="true">↗</span> ${escapeHtml(label)}</a>`;
    }).join("");
    const sourceUrl = article.link && article.link !== "#" ? safeWebUrl(article.link) : "";
    const sourceLink = sourceUrl
        ? `<p><a class="source-link" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener noreferrer">Read the related story ↗</a></p>`
        : "";
    const structuredData = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: title,
        description,
        keywords: keywords.join(", "),
        image: [image],
        datePublished: date.toISOString(),
        mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
        author: { "@type": "Organization", name: "Ilm Nexus" },
        publisher: {
            "@type": "Organization",
            name: "Ilm Nexus",
            url: `${SITE_ORIGIN}/`,
            logo: { "@type": "ImageObject", url: DEFAULT_IMAGE }
        }
    }).replace(/</g, "\\u003c");

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)} | ILM Nexus News</title>
<meta name="description" content="${escapeHtml(description)}">
${keywords.length ? `<meta name="keywords" content="${escapeHtml(keywords.join(", "))}">` : ""}
<link rel="canonical" href="${escapeHtml(articleUrl)}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="ILM Nexus Academy">
<meta property="og:title" content="${escapeHtml(title)}">
<meta property="og:description" content="${escapeHtml(description)}">
<meta property="og:image" content="${escapeHtml(image)}">
<meta property="og:image:alt" content="${escapeHtml(title)}">
<meta property="og:url" content="${escapeHtml(articleUrl)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(title)}">
<meta name="twitter:description" content="${escapeHtml(description)}">
<meta name="twitter:image" content="${escapeHtml(image)}">
<script type="application/ld+json">${structuredData}</script>
<style>
:root{--ink:#172033;--muted:#718096;--blue:#4361ee;--border:#e5eaf3}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(ellipse at 50% -15%,#dfe7ff 0,transparent 44rem),#f3f6fc;color:var(--ink);font:16px/1.75 Arial,sans-serif}
.topbar{position:sticky;top:0;z-index:5;padding:0 24px;background:#ffffffeb;border-bottom:1px solid var(--border);backdrop-filter:blur(14px)}
.topbar-inner{width:min(1320px,100%);min-height:78px;margin:auto;display:flex;align-items:center;justify-content:space-between;gap:20px}
.topbar a{color:var(--ink);font-weight:bold;text-decoration:none}
.topbar .brand img{display:block;width:158px;height:auto}
main{width:min(1320px,calc(100% - 48px));margin:36px auto 60px;background:#fff;border:1px solid var(--border);border-radius:26px;overflow:hidden;box-shadow:0 28px 80px #23366e24}
.hero{min-height:450px;position:relative;display:flex;align-items:end;color:#fff;background:linear-gradient(120deg,#18254d,#4361ee)}
.hero>img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.hero:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,#0a122aeb,#0a122a70 65%,#0a122a12),linear-gradient(0deg,#0a122a4d,transparent 60%)}
.hero-copy{position:relative;z-index:1;max-width:980px;padding:clamp(28px,6vw,72px)}
.category{display:inline-block;padding:7px 14px;border:1px solid #ffffff5c;border-radius:99px;background:#ffffff24;font-size:.78rem;font-weight:bold;letter-spacing:.1em;text-transform:uppercase}
h1{max-width:900px;margin:16px 0;font-size:clamp(2.2rem,5.6vw,4.4rem);line-height:1.08;letter-spacing:-.035em}
.intro{max-width:760px;color:#ffffffdf;font-size:1.15rem}
.meta{display:flex;gap:20px;flex-wrap:wrap;color:#ffffffc9;font-size:.92rem}
.layout{display:grid;grid-template-columns:minmax(0,1fr) 290px;gap:clamp(36px,5vw,72px);padding:clamp(28px,5vw,72px)}
.content{color:#35425a;font-size:1.12rem;overflow-wrap:anywhere}
.content p{margin:0 0 1.3em}
.content a,.related-link,.source-link{color:#2336a7;font-weight:bold;text-decoration:underline;text-decoration-color:#a9b8ff;text-underline-offset:3px;overflow-wrap:anywhere}
.side{align-self:start;position:sticky;top:100px;padding:20px;border:1px solid var(--border);border-radius:18px;background:linear-gradient(145deg,#f8faff,#f1f4ff)}
.side h2,.heading{font-size:1.15rem}
.side p{color:var(--muted)}
.share-button{width:100%;padding:13px;border:0;border-radius:12px;color:#fff;background:linear-gradient(120deg,#4361ee,#7c3aed);font-weight:bold;cursor:pointer}
.gallery{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:16px;margin-top:16px}
.gallery img{width:100%;height:230px;object-fit:cover;border-radius:16px}
.links{display:grid;gap:12px;margin-top:16px}
.related-link,.source-link{display:block;padding:14px;border:1px solid var(--border);border-radius:12px;background:#fbfcff;text-decoration:none}
footer{text-align:center;padding:22px;color:var(--muted);font-size:.9rem}
@media(max-width:760px){.topbar{padding:0 16px}.topbar-inner{min-height:68px}.topbar .brand img{width:128px}main{width:calc(100% - 24px);margin:18px auto 40px}.layout{grid-template-columns:1fr;gap:28px}.side{position:static;grid-row:1}.hero{min-height:420px}}
</style>
</head>
<body>
<header class="topbar"><nav class="topbar-inner"><a class="brand" href="${SITE_ORIGIN}/" aria-label="ILM Nexus home"><img src="${escapeHtml(LOGO_IMAGE)}" alt="ILM Nexus"></a><a href="${SITE_ORIGIN}/news.html">← All News</a></nav></header>
<main>
<header class="hero"><img src="${escapeHtml(image)}" alt="${escapeHtml(title)}"><div class="hero-copy">
<div class="category">${escapeHtml(article.category || "ILM Nexus News")}</div>
<h1>${escapeHtml(title)}</h1>
<p class="intro">${escapeHtml(description)}</p>
<div class="meta"><span>Published ${escapeHtml(date.toLocaleDateString("en"))}</span>${article.views ? `<span>${escapeHtml(Number(article.views).toLocaleString())} views</span>` : ""}</div>
</div></header>
<div class="layout"><div>
<div class="content">${content}</div>
${galleryHtml ? `<h2 class="heading">More from this story</h2><div class="gallery">${galleryHtml}</div>` : ""}
${socialLinks ? `<h2 class="heading">Explore the links</h2><div class="links">${socialLinks}</div>` : ""}
${sourceLink}
</div><aside class="side"><h2>Share this story</h2><p>Pass this update along to your community.</p><button class="share-button" id="copyArticleLink" type="button">Copy article link</button></aside></div>
</main>
<footer>© ${new Date().getFullYear()} ILM Nexus Limited · Ilorin, Kwara State, Nigeria</footer>
<script>document.getElementById("copyArticleLink").addEventListener("click",async event=>{const button=event.currentTarget;try{await navigator.clipboard.writeText(window.location.href);button.textContent="Link copied";setTimeout(()=>button.textContent="Copy article link",1800)}catch(error){button.textContent="Copy the link from your address bar"}});</script>
<script>if(!/bot|crawler|spider|preview|whatsapp|facebookexternalhit|slackbot|linkedinbot|telegrambot/i.test(navigator.userAgent)){location.replace("/article.html?id=${encodeURIComponent(articleId)}"+location.search)}</script>
</body>
</html>`;
}

exports.articleShare = onRequest({ region: "us-central1" }, async (request, response) => {
    if (request.method !== "GET" && request.method !== "HEAD") {
        response.set("Allow", "GET, HEAD").status(405).send("Method not allowed");
        return;
    }

    const match = request.path.match(/^\/share\/article\/([^/]+)(\/image)?\/?$/);
    if (!match) {
        response.status(404).send("Article not found");
        return;
    }

    let articleId;
    try {
        articleId = decodeURIComponent(match[1]);
    } catch {
        response.status(400).send("Invalid article link");
        return;
    }

    if (!/^[A-Za-z0-9_-]{1,150}$/.test(articleId)) {
        response.status(400).send("Invalid article link");
        return;
    }

    try {
        const articleSnapshot = await db.collection("news").doc(articleId).get();
        let article;
        let queryString = "";
        if (articleSnapshot.exists) {
            article = articleSnapshot.data();
        } else if (typeof request.query.title === "string" && typeof request.query.image === "string") {
            article = {
                title: request.query.title.slice(0, 300),
                description: typeof request.query.description === "string" ? request.query.description.slice(0, 2000) : "",
                image: request.query.image.slice(0, 1000000),
                category: typeof request.query.category === "string" ? request.query.category.slice(0, 100) : "ILM Nexus News",
                keywords: typeof request.query.keywords === "string" ? request.query.keywords.slice(0, 300) : "",
                date: typeof request.query.date === "string" ? request.query.date.slice(0, 40) : ""
            };
            queryString = `?${new URLSearchParams({
                title: article.title,
                description: article.description,
                image: article.image,
                category: article.category,
                keywords: article.keywords,
                date: article.date
            })}`;
        } else {
            response.status(404).send("Article not found");
            return;
        }

        const imagePath = Boolean(match[2]);
        const articleUrl = `${SITE_ORIGIN}/share/article/${encodeURIComponent(articleId)}${queryString}`;

        if (imagePath) {
            const image = getImageDataUri(article.image);
            if (image) {
                response.set("Content-Type", image.contentType);
                response.set("Cache-Control", "public, max-age=3600");
                response.set("X-Content-Type-Options", "nosniff");
                response.status(200).end(request.method === "HEAD" ? undefined : image.data);
                return;
            }

            response.redirect(302, safeWebUrl(article.image, DEFAULT_IMAGE));
            return;
        }

        const imageUrl = `${SITE_ORIGIN}/share/article/${encodeURIComponent(articleId)}/image${queryString}`;
        response.set("Content-Type", "text/html; charset=utf-8");
        response.set("Cache-Control", "public, max-age=300");
        response.status(200).send(renderArticlePage(article, articleId, articleUrl, imageUrl));
    } catch (error) {
        console.error("Could not render article share page:", error);
        response.status(500).send("Could not load this article");
    }
});

function requirePortalAdmin(request) {
    if (request.auth?.token?.email?.toLowerCase() !== "theilmnexus@gmail.com") {
        throw new HttpsError("permission-denied", "Only the ILM Nexus administrator can manage accounts.");
    }
}

function validateAccountEmail(value) {
    const email = String(value || "").trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        throw new HttpsError("invalid-argument", "Enter a valid email address.");
    }
    return email;
}

exports.approveStudentImport = onCall({ region: "us-central1" }, async request => {
    requirePortalAdmin(request);
    const importId = String(request.data?.importId || "");
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(importId)) {
        throw new HttpsError("invalid-argument", "A valid student import ID is required.");
    }

    const importRef = db.collection("student_imports").doc(importId);
    const importSnapshot = await importRef.get();
    if (!importSnapshot.exists) {
        throw new HttpsError("not-found", "The imported student record was not found.");
    }

    const imported = importSnapshot.data();
    const email = validateAccountEmail(imported.email);
    const name = String(imported.name || "").trim();
    if (!name || name.length > 160) {
        throw new HttpsError("failed-precondition", "The student record needs a valid name before approval.");
    }

    let user;
    try {
        user = await auth.getUserByEmail(email);
    } catch (error) {
        if (error.code !== "auth/user-not-found") {
            throw new HttpsError("internal", "Could not check the student's sign-in account.");
        }
    }

    const accountCreated = !user;
    if (user) {
        const existingProfile = await db.collection("users").doc(user.uid).get();
        if (!existingProfile.exists || String(existingProfile.data().role || "").toLowerCase() !== "student") {
            throw new HttpsError("failed-precondition", "This email already belongs to an account that is not an approved student-import candidate.");
        }
    }
    if (!user) {
        user = await auth.createUser({
            email,
            displayName: name,
            password: randomBytes(32).toString("base64url"),
            emailVerified: false,
            disabled: false
        });
    } else if (user.disabled) {
        user = await auth.updateUser(user.uid, { disabled: false, displayName: name });
    }

    const claims = { ...(user.customClaims || {}), role: "student" };
    if (imported.campusId) claims.campusId = String(imported.campusId).slice(0, 100);
    await auth.setCustomUserClaims(user.uid, claims);

    const now = new Date();
    const studentProfile = {
        uid: user.uid,
        name,
        email,
        username: String(imported.username || email.split("@")[0]).slice(0, 100),
        course: String(imported.course || "").slice(0, 160),
        campusId: String(imported.campusId || "").slice(0, 100),
        plan: String(imported.plan || "").slice(0, 100),
        institution: String(imported.institution || "").slice(0, 160),
        phone: String(imported.phone || "").slice(0, 40),
        studentId: String(imported.studentId || "").slice(0, 80),
        role: "Student",
        approvalStatus: "APPROVED",
        passwordSetupRequired: true,
        updatedAt: now
    };
    await db.collection("users").doc(user.uid).set(studentProfile, { merge: true });
    await importRef.update({
        approvalStatus: "APPROVED",
        uid: user.uid,
        approvedAt: now,
        updatedAt: now
    });

    return { email, uid: user.uid, accountCreated };
});

exports.setStudentAccountStatus = onCall({ region: "us-central1" }, async request => {
    requirePortalAdmin(request);
    const uid = String(request.data?.uid || "");
    const status = String(request.data?.status || "").toUpperCase();
    const allowedStatuses = new Set(["APPROVED", "PENDING", "REJECTED", "SUSPENDED", "DISABLED"]);
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(uid) || !allowedStatuses.has(status)) {
        throw new HttpsError("invalid-argument", "A valid account and status are required.");
    }

    const userRef = db.collection("users").doc(uid);
    const snapshot = await userRef.get();
    if (!snapshot.exists || snapshot.data().role !== "Student") {
        throw new HttpsError("not-found", "The student account was not found.");
    }

    const user = await auth.getUser(uid);
    await auth.updateUser(uid, { disabled: status !== "APPROVED" });
    await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), role: "student" });
    await userRef.update({ approvalStatus: status, updatedAt: new Date() });
    return { uid, status };
});

exports.inviteStaffAccount = onCall({ region: "us-central1" }, async request => {
    requirePortalAdmin(request);
    const email = validateAccountEmail(request.data?.email);
    const name = String(request.data?.name || "").trim();
    const role = String(request.data?.role || "").toLowerCase();
    const campusId = String(request.data?.campusId || "").trim().slice(0, 100);
    const allowedRoles = new Set(["tutor", "instructor", "coordinator", "campus_president", "staff"]);
    if (!name || name.length > 160 || !allowedRoles.has(role)) {
        throw new HttpsError("invalid-argument", "Enter a name and a valid staff role.");
    }
    if (email === "theilmnexus@gmail.com") {
        throw new HttpsError("failed-precondition", "The administrator account cannot be used as a staff account.");
    }
    if ((role === "coordinator" || role === "campus_president") && !campusId) {
        throw new HttpsError("invalid-argument", "A campus is required for this staff role.");
    }

    let user;
    let created = false;
    try {
        user = await auth.getUserByEmail(email);
        const existingProfile = await db.collection("users").doc(user.uid).get();
        if (existingProfile.exists && String(existingProfile.data().role || "").toLowerCase() === "student") {
            throw new HttpsError("failed-precondition", "This email already belongs to a student account.");
        }
        user = await auth.updateUser(user.uid, { displayName: name, disabled: false });
    } catch (error) {
        if (error instanceof HttpsError) throw error;
        if (error.code !== "auth/user-not-found") {
            throw new HttpsError("internal", "Could not check the staff sign-in account.");
        }
        user = await auth.createUser({
            email,
            displayName: name,
            password: randomBytes(32).toString("base64url"),
            emailVerified: false,
            disabled: false
        });
        created = true;
    }
    try {
        await auth.setCustomUserClaims(user.uid, { role, ...(campusId ? { campusId } : {}) });
        const now = new Date();
        await db.collection("users").doc(user.uid).set({
            uid: user.uid,
            name,
            email,
            role,
            staffType: role,
            campusId,
            approvalStatus: "APPROVED",
            passwordSetupRequired: true,
            createdAt: now,
            updatedAt: now
        });
        await db.collection("staff").doc(user.uid).set({
            uid: user.uid,
            name,
            email,
            role,
            campusId,
            status: "active",
            createdAt: now
        });
    } catch (error) {
        if (created) await auth.deleteUser(user.uid);
        throw new HttpsError("internal", "The staff account could not be completed. Review the account before retrying.");
    }

    return { email, uid: user.uid, role };
});

exports.disableStaffAccount = onCall({ region: "us-central1" }, async request => {
    requirePortalAdmin(request);
    const uid = String(request.data?.uid || "");
    if (!/^[A-Za-z0-9_-]{1,150}$/.test(uid)) {
        throw new HttpsError("invalid-argument", "A valid staff account is required.");
    }

    const profileRef = db.collection("users").doc(uid);
    const profileSnapshot = await profileRef.get();
    if (!profileSnapshot.exists || String(profileSnapshot.data().role || "").toLowerCase() === "student") {
        throw new HttpsError("not-found", "The staff account was not found.");
    }
    const user = await auth.getUser(uid);
    if (user.email?.toLowerCase() === "theilmnexus@gmail.com") {
        throw new HttpsError("failed-precondition", "The administrator account cannot be disabled here.");
    }
    await auth.updateUser(uid, { disabled: true });
    await auth.setCustomUserClaims(uid, { ...(user.customClaims || {}), role: "disabled" });
    await profileRef.update({ approvalStatus: "DISABLED", updatedAt: new Date() });
    await db.collection("staff").doc(uid).set({ status: "disabled", updatedAt: new Date() }, { merge: true });
    return { uid, status: "DISABLED" };
});
