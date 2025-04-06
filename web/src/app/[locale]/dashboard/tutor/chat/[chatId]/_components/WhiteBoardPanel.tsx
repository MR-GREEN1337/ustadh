"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  PenTool,
  Maximize2,
  Minimize2,
  Save,
  Download,
  ChevronLeft,
  ChevronRight,
  Square,
  Circle,
  Type,
  Image,
  Share2,
  Undo,
  Redo
} from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Editor, TLUiOverrides, Tldraw } from 'tldraw';
import 'tldraw/tldraw.css';

export function WhiteboardPanel() {
  const { locale } = useParams();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTool, setActiveTool] = useState('draw');
  const [isSharing, setIsSharing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const editorRef = useRef<Editor | null>(null);
  const isRTL = locale === "ar";

  // Set isMounted to true after component mounts
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Function to handle editor mount
  const handleMount = (editor: Editor) => {
    editorRef.current = editor;
  };

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Save the whiteboard content
  const handleSave = () => {
    if (!editorRef.current) return;

    try {
      // Get the current document as JSON
      const document = editorRef.current.store.getSnapshot();

      // Save to localStorage
      localStorage.setItem('tldraw-whiteboard-state', JSON.stringify(document));

      console.log('Whiteboard state saved');
    } catch (error) {
      console.error('Error saving whiteboard:', error);
    }
  };

  // Download the whiteboard as an image
  const handleDownload = () => {
    if (!editorRef.current) return;

    try {
      // This would be replaced with actual export functionality using tldraw's API
      // For example: editorRef.current.exportImage('png')
      console.log('Downloading whiteboard as image');

      // For now we'll just alert the user
      alert('Whiteboard export functionality would be implemented here');
    } catch (error) {
      console.error('Error downloading whiteboard:', error);
    }
  };

  // Open the full whiteboard page
  const openFullWhiteboard = () => {
    router.push(`/${locale}/dashboard/tutor/whiteboard`);
    setOpen(false);
  };

  // Share whiteboard with chat
  const handleShareWithChat = () => {
    setIsSharing(true);

    // Simulate sharing process
    setTimeout(() => {
      setIsSharing(false);
      setOpen(false);

      // Dispatch a custom event that the ChatPage component will listen for
      const shareEvent = new CustomEvent('whiteboard-share', {
        detail: {
          message: "@Whiteboard\nJ'ai créé un diagramme dans le tableau blanc pour illustrer ce concept. Pouvez-vous me donner vos commentaires?"
        }
      });
      window.dispatchEvent(shareEvent);

      // You could also use a callback function passed as a prop
      if (window.addWhiteboardToChat) {
        window.addWhiteboardToChat();
      }
    }, 1000);
  };

  // Handle tool change
  const handleToolChange = (value: string) => {
    if (!value || !editorRef.current) return;

    setActiveTool(value);

    // Map our UI tool values to tldraw tool names
    switch (value) {
      case 'pencil':
        editorRef.current.setSelectedTool('draw');
        break;
      case 'square':
        editorRef.current.setSelectedTool('rectangle');
        break;
      case 'circle':
        editorRef.current.setSelectedTool('ellipse');
        break;
      case 'text':
        editorRef.current.setSelectedTool('text');
        break;
      case 'image':
        editorRef.current.setSelectedTool('image');
        break;
      default:
        editorRef.current.setSelectedTool('select');
    }
  };

  // Handle undo/redo
  const handleUndo = () => {
    if (editorRef.current) {
      editorRef.current.undo();
    }
  };

  const handleRedo = () => {
    if (editorRef.current) {
      editorRef.current.redo();
    }
  };

  // UI overrides to hide tldraw's default UI elements
  const uiOverrides: TLUiOverrides = {
    showMenu: false,
    showPages: false,
    showTools: false,
    showZoom: true,
    showStyles: true,
    showUI: true,
  };

  return (
    <Sheet open={open} onOpenChange={setOpen} modal={false}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full"
          title="Interactive Whiteboard"
        >
          <PenTool className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side={isRTL ? "left" : "right"}
        className={`p-0 border-l ${isExpanded ? 'w-[85vw]' : 'w-[450px]'} max-w-full`}
        hideCloseButton
      >
        <div className="flex flex-col h-full">
          {/* Whiteboard header */}
          <div className="flex items-center justify-between p-2 border-b bg-muted/40">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setOpen(false)}
              >
                {isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              <h3 className="text-sm font-medium ml-2">Interactive Whiteboard</h3>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleSave}
                title="Save"
              >
                <Save className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={handleDownload}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleExpanded}
                title={isExpanded ? "Minimize" : "Maximize"}
              >
                {isExpanded ?
                  <Minimize2 className="h-4 w-4" /> :
                  <Maximize2 className="h-4 w-4" />
                }
              </Button>
            </div>
          </div>

          {/* Tool selection */}
          <div className="border-b p-1 flex items-center justify-between bg-background">
            <ToggleGroup type="single" value={activeTool} onValueChange={handleToolChange}>
              <ToggleGroupItem value="pencil" aria-label="Pencil Tool">
                <PenTool className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="square" aria-label="Square Tool">
                <Square className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="circle" aria-label="Circle Tool">
                <Circle className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="text" aria-label="Text Tool">
                <Type className="h-4 w-4" />
              </ToggleGroupItem>
              <ToggleGroupItem value="image" aria-label="Image Tool">
                <Image className="h-4 w-4" />
              </ToggleGroupItem>
            </ToggleGroup>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleUndo}
              >
                <Undo className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleRedo}
              >
                <Redo className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Whiteboard canvas */}
          <div className="flex-1 relative bg-white dark:bg-zinc-900">
            {isMounted && (
              <div className="h-full w-full">
                <Tldraw
                  onMount={handleMount}
                  overrides={uiOverrides}
                  className="h-full w-full"
                />
              </div>
            )}

            {/* Share button */}
            <div className="absolute bottom-4 right-4 z-10">
              <Button
                variant="secondary"
                size="sm"
                className="rounded-full shadow-md"
                onClick={handleShareWithChat}
                disabled={isSharing}
              >
                {isSharing ? (
                  <div className="flex items-center gap-1">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse"></div>
                    <span className="text-xs">Sending...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1">
                    <Share2 className="h-4 w-4" />
                    <span className="text-xs">Share to Chat</span>
                  </div>
                )}
              </Button>
            </div>
          </div>

          {/* Footer with full view button */}
          <div className="border-t p-2 flex justify-center">
            <Button
              variant="outline"
              size="sm"
              className="text-xs w-full"
              onClick={openFullWhiteboard}
            >
              Open Full Whiteboard Editor
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
