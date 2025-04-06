"use client";

import React, { useEffect, useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Share2, Download, Undo, Redo, Square, Circle, PencilLine, Text, Image } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Dynamically import tldraw to avoid SSR issues
const TldrawBoard = dynamic(
  () => import('tldraw').then((mod) => mod.Tldraw),
  { ssr: false, loading: () => <LoadingSpinner /> }
);

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-background">
      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

export default function WhiteboardEmbed() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTool, setActiveTool] = useState('pencil');
  const [isSharing, setIsSharing] = useState(false);
  const editorRef = useRef(null);

  useEffect(() => {
    setIsMounted(true);

    // Listen for messages from the parent WhiteboardPanel
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'save-request') {
        handleSave();
      } else if (event.data?.type === 'download-request') {
        handleDownload();
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleSave = () => {
    try {
      // Get tldraw editor state
      if (editorRef.current) {
        const editorState = {}; // Replace with actual state from tldraw API

        // Save to localStorage for persistence
        localStorage.setItem('whiteboard_panel_state', JSON.stringify(editorState));

        // Notify parent window
        window.parent.postMessage({
          type: 'whiteboard-save',
          status: 'success',
          content: editorState
        }, '*');
      }
    } catch (error) {
      console.error('Error saving whiteboard:', error);
    }
  };

  const handleDownload = () => {
    try {
      // In a real implementation, this would use tldraw's export API
      console.log('Exporting whiteboard as image');

      // Notify parent that download was initiated
      window.parent.postMessage({
        type: 'whiteboard-download',
        status: 'success'
      }, '*');
    } catch (error) {
      console.error('Error downloading whiteboard:', error);
    }
  };

  const handleShareWithChat = () => {
    setIsSharing(true);

    // Simulate sharing process
    setTimeout(() => {
      setIsSharing(false);

      // Notify parent window to update chat with whiteboard reference
      window.parent.postMessage({
        type: 'whiteboard-share',
        status: 'success'
      }, '*');
    }, 1000);
  };

  const handleToolChange = (value: string) => {
    if (value) setActiveTool(value);

    // Map our UI tool values to tldraw tool names
    const toolMap = {
      'pencil': 'draw',
      'square': 'rectangle',
      'circle': 'ellipse',
      'text': 'text',
      'image': 'image'
    };

    // If we have access to tldraw's API, we would set the active tool
    if (editorRef.current) {
      // editorRef.current.setActiveTool(toolMap[value]);
      console.log('Setting tool to:', toolMap[value as keyof typeof toolMap]);
    }
  };

  if (!isMounted) {
    return <LoadingSpinner />;
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Tool selection bar */}
      <div className="border-b p-1 flex items-center justify-between bg-background">
        <ToggleGroup type="single" value={activeTool} onValueChange={handleToolChange}>
          <ToggleGroupItem value="pencil" aria-label="Pencil Tool">
            <PencilLine className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="square" aria-label="Square Tool">
            <Square className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="circle" aria-label="Circle Tool">
            <Circle className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="text" aria-label="Text Tool">
            <Text className="h-4 w-4" />
          </ToggleGroupItem>
          <ToggleGroupItem value="image" aria-label="Image Tool">
            <Image className="h-4 w-4" />
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tldraw canvas */}
      <div className="flex-1 relative bg-white dark:bg-zinc-900">
        <TldrawBoard
          ref={editorRef}
          showMenu={false}
          showPages={false}
          showTools={false} // We're providing our own tool UI
          showZoom={true}
          showUI={true}
          showStyles={true}
        />
      </div>

      {/* Bottom actions */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-background/90 backdrop-blur-sm rounded-full shadow-md px-2 py-1 flex items-center gap-2 border border-muted z-10">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full h-8 w-8 p-0"
          onClick={handleDownload}
          title="Download as Image"
        >
          <Download className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full h-8"
          onClick={handleShareWithChat}
          disabled={isSharing}
        >
          {isSharing ? (
            <span className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
              <span className="text-xs">Sending...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              <span className="text-xs">Share to Chat</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
