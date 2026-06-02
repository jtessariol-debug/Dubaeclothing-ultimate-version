import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
    getAuth,
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    serverTimestamp,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC9tqmadELj4fRNHYZuihrdKBrcakPcaQQ",
    authDomain: "dubaeclothing-fea73.firebaseapp.com",
    projectId: "dubaeclothing-fea73",
    storageBucket: "dubaeclothing-fea73.firebasestorage.app",
    messagingSenderId: "332208741358",
    appId: "1:332208741358:web:92cca16ae7f58a865b8cff"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

const ADMIN_EMAILS = [
    "admin@dubae.com",
    "tu-email@gmail.com"
];

export {
    auth,
    db,
    provider,
    signInWithPopup,
    signOut,
    onAuthStateChanged,
    collection,
    addDoc,
    getDocs,
    query,
    where,
    updateDoc,
    deleteDoc,
    doc,
    orderBy,
    serverTimestamp,
    onSnapshot,
    ADMIN_EMAILS
};