
const firebaseConfig = {
    apiKey: "AIzaSyBCGXodf7UbnuwVk1sluDHemVCCQaZkWo0",
    authDomain: "yorbetfen.firebaseapp.com",
    projectId: "yorbetfen",
    storageBucket: "yorbetfen.firebasestorage.app",
    messagingSenderId: "212766192577",
    appId: "1:212766192577:web:2fd28587291609b60c7540",
    measurementId: "G-96EKX1DSF4"
};

firebase.initializeApp(firebaseConfig);


const auth = firebase.auth();
const db = firebase.firestore();