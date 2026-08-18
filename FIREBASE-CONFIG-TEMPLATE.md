# Firebase Configuration Template

## Replace these values in news.html (around line 810)

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN", 
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};
```

## Where to find these values:

1. Go to: https://console.firebase.google.com
2. Click your project name
3. Click ⚙️ (Project Settings, top-left)
4. Click "General" tab
5. Scroll to "Your apps" section
6. Click on the web app config
7. Copy your Firebase config object

## Quick Checklist:

- [ ] Firebase project created
- [ ] Firestore database enabled
- [ ] All 6 config values copied
- [ ] Pasted into news.html
- [ ] No extra spaces or typos
- [ ] Security rules published
- [ ] news.html pushed to Netlify

## Test Command:

After adding config, open browser console (F12) and paste:

```javascript
console.log(window.firebase)
```

You should see the Firebase app object. If you see error, config is wrong.

## Need Help?

See: FIREBASE-SETUP-GUIDE.md (full setup instructions)
