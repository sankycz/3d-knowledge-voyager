// src/lib/favorites.ts
import { firestore, firebase } from "@/lib/firebase";
import { doc, setDoc, deleteDoc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import type { User } from "firebase/auth";

/**
 * Add article to user's favorites collection.
 */
export const addFavorite = async (user: User, article: any) => {
  const favRef = doc(firestore.db, "users", user.uid, "favorites", article.id.toString());
  await setDoc(favRef, { ...article, savedAt: new Date().toISOString() });
};

/**
 * Remove article from favorites.
 */
export const removeFavorite = async (user: User, articleId: number) => {
  const favRef = doc(firestore.db, "users", user.uid, "favorites", articleId.toString());
  await deleteDoc(favRef);
};

/**
 * Retrieve all favorite articles for a user.
 */
export const getFavorites = async (user: User) => {
  const favCol = collection(firestore.db, "users", user.uid, "favorites");
  const snapshot = await getDocs(favCol);
  const favs: any[] = [];
  snapshot.forEach((doc) => favs.push({ id: Number(doc.id), ...doc.data() }));
  return favs;
};
