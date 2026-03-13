import { collection, doc, getDoc, getDocs, setDoc, updateDoc, query, where } from "firebase/firestore";
import { db as firestore } from "./firebase";

// Firestore-based database layer replacing localStorage

export const db = {
    // 1. Generic Fetch with schoolId scoping
    async fetch<T>(table: string, schoolId: string, _localKey?: string): Promise<T[]> {
        const q = query(collection(firestore, table), where("schoolId", "==", schoolId));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => doc.data() as T);
    },

    // 2. Generic Insert
    async insert<T extends { id?: string | number }>(table: string, item: T, _localKey?: string): Promise<void> {
        // If the item doesn't have an ID, Firestore can auto-generate it if we use addDoc,
        // but since the original implementation relied on objects having an id or generating one,
        // we'll assume it has an 'id' property. If not, converting it to a string for the doc ref.
        const id = item.id ? String(item.id) : Date.now().toString();
        await setDoc(doc(firestore, table, id), item);
    },

    // 3. Generic Update (by ID)
    async update<T>(table: string, id: string | number, updates: Partial<T>, _localKey?: string): Promise<void> {
        await updateDoc(doc(firestore, table, String(id)), updates as { [x: string]: any });
    },

    // 4. Generic Upsert (by ID or custom key)
    async upsert<T extends { id?: string | number }>(table: string, item: T, _localKey?: string, conflictKey: string = 'id'): Promise<void> {
        // Firestore setDoc with { merge: true } acts as an upsert.
        // It uses the document ID. If the conflict key is different from 'id', it could be more complex,
        // but typical usage here is strictly ID-based on the collections.
        const idValue = (item as any)[conflictKey] || item.id;
        if (!idValue) throw new Error("Upsert requires a valid identifier key.");

        await setDoc(doc(firestore, table, String(idValue)), item, { merge: true });
    },

    // 5. Find Single User (for auth/login)
    async findUser(generatedId: string, email: string) {
        // Query users collection for generatedId
        const qId = query(collection(firestore, "registrations"), where("generatedId", "==", generatedId));
        const snapshotId = await getDocs(qId);
        if (!snapshotId.empty) return snapshotId.docs[0].data();

        // Query users collection for email as fallback
        const qEmail = query(collection(firestore, "registrations"), where("email", "==", email));
        const snapshotEmail = await getDocs(qEmail);
        if (!snapshotEmail.empty) return snapshotEmail.docs[0].data();

        return null;
    },

    // 6. School Management
    async getSchool(id: string) {
        const docSnap = await getDoc(doc(firestore, "registeredSchools", id));
        return docSnap.exists() ? docSnap.data() : null;
    },

    async saveSchool(school: any) {
        if (!school.id) throw new Error("School requires an ID to save.");
        await setDoc(doc(firestore, "registeredSchools", school.id), school, { merge: true });
    }
}
