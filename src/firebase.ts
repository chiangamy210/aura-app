// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

interface Card {
  id: string;
  title: string;
  quote: string;
  image: string;
}

export const saveCard = async (userId: string, card: Card) => {
  try {
    await addDoc(collection(db, "users", userId, "saved_cards"), {
      title: card.title,
      quote: card.quote,
      image: card.image,
    });
    console.log("Card saved successfully!");
  } catch (error) {
    console.error("Error saving card: ", error);
  }
};

export const getSavedCards = async (userId: string): Promise<Card[]> => {
  const querySnapshot = await getDocs(collection(db, "users", userId, "saved_cards"));
  const savedCards: Card[] = [];
  querySnapshot.forEach((doc) => {
    savedCards.push({ id: doc.id, ...doc.data() } as Card);
  });
  return savedCards;
};