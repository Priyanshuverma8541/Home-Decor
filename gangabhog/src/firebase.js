// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAod3sO9WRXWDSht8kjlwrNBt1rEr95fKo",
  authDomain: "savitri-jewellers-auth.firebaseapp.com",
  projectId: "savitri-jewellers-auth",
  storageBucket: "savitri-jewellers-auth.firebasestorage.app",
  messagingSenderId: "299762721373",
  appId: "1:299762721373:web:0a2e642fcfc86f3f3da3b4",
  measurementId: "G-2ZPFMXZXV4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig); 
// ✅ THIS WAS MISSING
export const auth = getAuth(app);