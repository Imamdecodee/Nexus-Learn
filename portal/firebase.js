const firebaseVersion = '10.7.0';
const firebaseConfig = {
  apiKey: 'AIzaSyBJKtNJDIxbo-_PxSwGTYcuS8gRjg9ReX8',
  authDomain: 'ilmnexusnews.firebaseapp.com',
  projectId: 'ilmnexusnews',
  storageBucket: 'ilmnexusnews.firebasestorage.app',
  messagingSenderId: '434251311563',
  appId: '1:434251311563:web:0264d1049c463369862e4e'
};

const [{ initializeApp }, authModule, firestoreModule] = await Promise.all([
  import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-app.js`),
  import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-auth.js`),
  import(`https://www.gstatic.com/firebasejs/${firebaseVersion}/firebase-firestore.js`)
]);

const app = initializeApp(firebaseConfig);
const auth = authModule.getAuth(app);
await authModule.setPersistence(auth, authModule.browserLocalPersistence);
const db = firestoreModule.getFirestore(app);

export const portalAuth = {
  auth,
  googleProvider: new authModule.GoogleAuthProvider(),
  githubProvider: new authModule.GithubAuthProvider(),
  onAuthStateChanged: callback => authModule.onAuthStateChanged(auth, callback),
  createUserWithEmail: (email, password) => authModule.createUserWithEmailAndPassword(auth, email, password),
  signInWithEmail: (email, password) => authModule.signInWithEmailAndPassword(auth, email, password),
  signInWithGoogle: () => authModule.signInWithPopup(auth, new authModule.GoogleAuthProvider()),
  signInWithGithub: () => authModule.signInWithPopup(auth, new authModule.GithubAuthProvider()),
  signOut: () => authModule.signOut(auth)
};

export { app, db, firestoreModule };
