import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyAFTVdoXpV0BFSrO2eOaGrrM4fyK105vys",
  authDomain: "scheduler-74412.firebaseapp.com",
  projectId: "scheduler-74412",
  storageBucket: "scheduler-74412.appspot.com",
  messagingSenderId: "218793515985",
  appId: "1:218793515985:web:f9d9d1a1af702c8edb9ef0",
  measurementId: "G-497M1MX4JC"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

export { db , analytics };