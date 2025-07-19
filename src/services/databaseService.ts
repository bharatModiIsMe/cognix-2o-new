
import { ref, push, set, get, onValue, off } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { database, storage } from './firebase';
import { Message } from '@/components/ChatInterface';

export interface ChatHistory {
  id: string;
  userId: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  title: string;
}

export const saveChatHistory = async (userId: string, messages: Message[], title: string): Promise<string> => {
  try {
    const chatRef = ref(database, `chats/${userId}`);
    const newChatRef = push(chatRef);
    
    const chatData: Omit<ChatHistory, 'id'> = {
      userId,
      messages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      title
    };
    
    await set(newChatRef, chatData);
    return newChatRef.key!;
  } catch (error) {
    console.error('Error saving chat history:', error);
    throw error;
  }
};

export const getChatHistory = async (userId: string): Promise<ChatHistory[]> => {
  try {
    const chatRef = ref(database, `chats/${userId}`);
    const snapshot = await get(chatRef);
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
    }
    
    return [];
  } catch (error) {
    console.error('Error getting chat history:', error);
    throw error;
  }
};

export const uploadFile = async (file: File, userId: string, folder: string = 'uploads'): Promise<string> => {
  try {
    const fileName = `${folder}/${userId}/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, fileName);
    
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const subscribeToUserChats = (userId: string, callback: (chats: ChatHistory[]) => void) => {
  const chatRef = ref(database, `chats/${userId}`);
  
  const unsubscribe = onValue(chatRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const chats = Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      }));
      callback(chats);
    } else {
      callback([]);
    }
  });
  
  return () => off(chatRef, 'value', unsubscribe);
};
