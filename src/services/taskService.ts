import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';

const getTasksCollection = () => {
const uid = auth().currentUser?.uid;
if (!uid) return null;
  return firestore().collection('users').doc(uid).collection('tasks');
};

// 🔥 Subskrypcja zadań
export const subscribeToTasks = (callback: (tasks: any[]) => void) => {
  const collection = getTasksCollection();
  if (!collection) {
    // brak użytkownika -> wywołujemy callback z pustą listą i nic nie subskrybujemy
    callback([]);
    // zwracamy funkcję cleanup, która nic nie robi
    return () => {};
  }

  // jeśli użytkownik jest zalogowany -> subskrybujemy normalnie
  return collection
    .orderBy('createdAt', 'desc')
    .onSnapshot(
      (snapshot) => {
        if (!snapshot) {
          callback([]);
          return;
        }
        const tasks = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        callback(tasks);
      },
      (error) => {
        console.error('Błąd subskrypcji zadań:', error);
        callback([]);
      }
    );
};

// ➕ Dodawanie zadania
export const addTask = async (text: string) => {
  const collection = getTasksCollection();
  if (!collection) throw new Error('Brak zalogowanego użytkownika');
  await collection.add({
    text,
    completed: false,
    createdAt: firestore.FieldValue.serverTimestamp(),
  });
};

// ✅ Przełączanie completed
export const toggleTask = async (id: string, completed: boolean) => {
  const collection = getTasksCollection();
  if (!collection) throw new Error('Brak zalogowanego użytkownika');
  await collection.doc(id).update({ completed: !completed });
};

// 🗑 Usuwanie zadania
export const deleteTask = async (id: string) => {
  const collection = getTasksCollection();
  if (!collection) throw new Error('Brak zalogowanego użytkownika');
  await collection.doc(id).delete();
};