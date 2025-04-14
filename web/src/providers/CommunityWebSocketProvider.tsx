"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "./AuthProvider";

type WebSocketMessage = {
  type: string;
  data: any;
  timestamp: string;
};

type WebSocketContextType = {
  connect: (url: string) => void;
  disconnect: () => void;
  sendMessage: (message: any) => void;
  messages: WebSocketMessage[];
  isConnected: boolean;
};

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export function CommunityWebSocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<WebSocket | null>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, []);

  const connect = (url: string) => {
    // Close any existing connection
    if (socketRef.current) {
      socketRef.current.close();
    }

    // Create token parameter for authentication
    const token = localStorage.getItem("access_token");
    const wsUrl = `${url}?token=${token}`;

    // Create new WebSocket connection
    const socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected");
      setIsConnected(true);
    };

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, {
        type: data.type,
        data: data.content,
        timestamp: new Date().toISOString()
      }]);
    };

    socket.onclose = () => {
      console.log("WebSocket disconnected");
      setIsConnected(false);
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setIsConnected(false);
    };

    socketRef.current = socket;
  };

  const disconnect = () => {
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }
  };

  const sendMessage = (message: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error("Cannot send message: WebSocket not connected");
    }
  };

  return (
    <WebSocketContext.Provider value={{
      connect,
      disconnect,
      sendMessage,
      messages,
      isConnected
    }}>
      {children}
    </WebSocketContext.Provider>
  );
}

export function useCommunityWebSocket() {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error("useCommunityWebSocket must be used within a CommunityWebSocketProvider");
  }
  return context;
}
