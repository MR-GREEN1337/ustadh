"use client";

import React, { createContext, useContext, ReactNode, useState } from 'react';

// Define the shape of our context
interface ChatToolsContextType {
  toolsComponent: ReactNode | null;
  setToolsComponent: (component: ReactNode) => void;
}

// Create the context with default values
const ChatToolsContext = createContext<ChatToolsContextType>({
  toolsComponent: null,
  setToolsComponent: () => {},
});

// Provider component
export const ChatToolsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [toolsComponent, setToolsComponent] = useState<ReactNode | null>(null);

  return (
    <ChatToolsContext.Provider value={{ toolsComponent, setToolsComponent }}>
      {children}
    </ChatToolsContext.Provider>
  );
};

// Custom hook to use the context
export const useChatTools = () => useContext(ChatToolsContext);

// Utility component to inject chat tools into the header
export const ChatToolsContainer: React.FC = () => {
  const { toolsComponent } = useChatTools();
  return <>{toolsComponent}</>;
};
