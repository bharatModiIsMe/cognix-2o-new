
import React, { createContext, useContext, useState } from 'react';

interface ChatContextType {
  isPro: boolean;
  setIsPro: (isPro: boolean) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [isPro, setIsPro] = useState(false);

  return (
    <ChatContext.Provider value={{ isPro, setIsPro }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext must be used within a ChatProvider');
  }
  return context;
}
