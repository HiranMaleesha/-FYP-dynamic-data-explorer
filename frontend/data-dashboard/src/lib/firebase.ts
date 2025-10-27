import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDLR4TZZoYmTP6L_ljsS4LNx-srd3a0ATA",
  authDomain: "data-explore-fyp.firebaseapp.com",
  projectId: "data-explore-fyp",
  storageBucket: "data-explore-fyp.firebasestorage.app",
  messagingSenderId: "611693961835",
  appId: "1:611693961835:web:ae957f883b9ccc0aadc72e"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);