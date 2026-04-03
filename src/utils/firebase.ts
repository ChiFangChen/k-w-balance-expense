import { initializeApp, FirebaseApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  Firestore,
  writeBatch,
} from 'firebase/firestore'
import { AppState, Expense, Template, OperationLog, Settings } from '../types'

// Firebase config — user needs to fill these in from Firebase Console
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
}

let app: FirebaseApp | null = null
let db: Firestore | null = null

export function isFirebaseConfigured(): boolean {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
}

export function initFirebase(): Firestore | null {
  if (!isFirebaseConfigured()) return null
  if (db) return db
  try {
    app = initializeApp(firebaseConfig)
    db = getFirestore(app)
    return db
  } catch (error) {
    console.error('Firebase init failed:', error)
    return null
  }
}

// Sync expenses
export function subscribeToExpenses(
  db: Firestore,
  callback: (expenses: Expense[]) => void
): () => void {
  return onSnapshot(collection(db, 'expenses'), (snapshot) => {
    const expenses = snapshot.docs.map((doc) => doc.data() as Expense)
    expenses.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    callback(expenses)
  })
}

export async function syncExpense(db: Firestore, expense: Expense): Promise<void> {
  await setDoc(doc(db, 'expenses', expense.id), expense)
}

export async function deleteExpenseFromFirestore(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'expenses', id))
}

// Sync templates
export function subscribeToTemplates(
  db: Firestore,
  callback: (templates: Template[]) => void
): () => void {
  return onSnapshot(collection(db, 'templates'), (snapshot) => {
    const templates = snapshot.docs.map((doc) => doc.data() as Template)
    callback(templates)
  })
}

export async function syncTemplate(db: Firestore, template: Template): Promise<void> {
  await setDoc(doc(db, 'templates', template.id), template)
}

export async function deleteTemplateFromFirestore(db: Firestore, id: string): Promise<void> {
  await deleteDoc(doc(db, 'templates', id))
}

// Sync operation logs
export function subscribeToOperationLogs(
  db: Firestore,
  callback: (logs: OperationLog[]) => void
): () => void {
  return onSnapshot(collection(db, 'operationLogs'), (snapshot) => {
    const logs = snapshot.docs.map((doc) => doc.data() as OperationLog)
    logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    callback(logs)
  })
}

export async function syncOperationLog(db: Firestore, log: OperationLog): Promise<void> {
  await setDoc(doc(db, 'operationLogs', log.id), log)
}

// Sync settings
export function subscribeToSettings(
  db: Firestore,
  callback: (settings: Settings) => void
): () => void {
  return onSnapshot(doc(db, 'app', 'settings'), (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.data() as Settings)
    }
  })
}

export async function syncSettings(db: Firestore, settings: Settings): Promise<void> {
  await setDoc(doc(db, 'app', 'settings'), settings)
}

// Batch operations for balance/reset
export async function batchReplaceExpenses(db: Firestore, newExpenses: Expense[]): Promise<void> {
  // Delete all existing expenses and add new ones
  const snapshot = await import('firebase/firestore').then(m => m.getDocs(collection(db, 'expenses')))
  const batch = writeBatch(db)
  snapshot.docs.forEach((d) => batch.delete(d.ref))
  newExpenses.forEach((expense) => {
    batch.set(doc(db, 'expenses', expense.id), expense)
  })
  await batch.commit()
}

export async function batchDeleteAllExpenses(db: Firestore): Promise<void> {
  const snapshot = await import('firebase/firestore').then(m => m.getDocs(collection(db, 'expenses')))
  const batch = writeBatch(db)
  snapshot.docs.forEach((d) => batch.delete(d.ref))
  await batch.commit()
}
