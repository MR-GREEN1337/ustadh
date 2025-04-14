'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/i18n/client';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { WhiteboardService, WhiteboardSession, WhiteboardInteraction } from '@/services/WhiteboardService';

import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  ArrowLeft,
  Camera,
  Save,
  Brain,
  Undo,
  Redo,
  PauseCircle,
  PlayCircle,
  CheckCircle,
  Trash2,
  Settings,
  Download,
  Share2,
  RefreshCw,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Calculator,
  PenTool,
  Eraser,
  Type,
  Square,
  Circle,
  Shapes,
  Plus,
  Minus,
  HelpCircle,
  MessageSquare,
  Wand2,
} from 'lucide-react';

// This is a placeholder for the actual Desmos API
// You would need to load the Desmos script in your app
interface DesmosCalculator {
  setExpression: (options: { id: string; latex: string }) => void;
  getState: () => any;
  setState: (state: any) => void;
  mathquill: {
    MathQuill: any;
  };
}

declare global {
  interface Window {
    Desmos?: {
      GraphingCalculator: (element: HTMLElement, options?: any) => DesmosCalculator;
    };
  }
}

const WhiteboardSessionPage = () => {
  const { t } = useTranslation();
  const params = useParams();
  const locale = params.locale as string;
  const sessionId = params.sessionId as string;
  const router = useRouter();
  const { user } = useAuth();

  // References
  const calculatorRef = useRef<HTMLDivElement>(null);
  const calculator = useRef<DesmosCalculator | null>(null);
  const whiteboardServiceRef = useRef<WhiteboardService>(new WhiteboardService());

  // State
  const [session, setSession] = useState<WhiteboardSession | null>(null);
  const [interactions, setInteractions] = useState<WhiteboardInteraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTool, setActiveTool] = useState<string>('expression');
  const [isSaving, setIsSaving] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [currentInteraction, setCurrentInteraction] = useState<WhiteboardInteraction | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [wsUnsubscribe, setWsUnsubscribe] = useState<(() => void) | null>(null);

  // Load session data and initialize Desmos
  useEffect(() => {
    const loadSessionAndInitialize = async () => {
      try {
        setIsLoading(true);

        // Fetch session data
        const sessionData = await whiteboardServiceRef.current.getSession(sessionId);
        setSession(sessionData);

        // Fetch interactions
        const interactionsData = await whiteboardServiceRef.current.getInteractions(sessionId);
        setInteractions(interactionsData);

        // Load Desmos script if not already loaded
        if (!window.Desmos) {
          await loadDesmosScript();
        } else {
          initializeCalculator(sessionData);
        }

        // Connect to WebSocket
        await connectToWebSocket();
      } catch (error) {
        console.error('Error loading session:', error);
        setError('Failed to load whiteboard session. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadSessionAndInitialize();

    // Cleanup
    return () => {
      if (wsUnsubscribe) {
        wsUnsubscribe();
      }
      whiteboardServiceRef.current.disconnectFromSession();
    };
  }, [sessionId]);

  // Load Desmos script
  const loadDesmosScript = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://www.desmos.com/api/v1.7/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6';
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Failed to load Desmos script'));
      document.body.appendChild(script);
    });
  };

  // Initialize Desmos calculator
  const initializeCalculator = (sessionData: WhiteboardSession) => {
    if (!window.Desmos || !calculatorRef.current) return;

    // Create calculator instance
    calculator.current = window.Desmos.GraphingCalculator(calculatorRef.current, {
      expressions: true,
      settingsMenu: false,
      expressionsCollapsed: false,
      lockViewport: false,
      zoomButtons: true,
      trace: true,
      keypad: true,
      graphpaper: true,
      fontSize: 14,
    });

    // Set initial state if available
    if (sessionData.current_state && Object.keys(sessionData.current_state).length > 0) {
      calculator.current.setState(sessionData.current_state);
    }
  };

  // Connect to WebSocket for real-time collaboration
  const connectToWebSocket = async () => {
    try {
      await whiteboardServiceRef.current.connectToSession(sessionId);
      setIsConnected(true);

      // Register message handler
      const unsubscribe = whiteboardServiceRef.current.onMessage((message) => {
        handleWebSocketMessage(message);
      });

      setWsUnsubscribe(() => unsubscribe);
    } catch (error) {
      console.error('WebSocket connection error:', error);
      setError('Failed to establish real-time connection. Some features may not work properly.');
      setIsConnected(false);
    }
  };

  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (message: any) => {
    switch (message.action) {
      case 'update_state':
        if (calculator.current && message.data.state) {
          calculator.current.setState(message.data.state);
        }
        break;
      case 'ai_response':
        // Update the interaction with AI response
        setInteractions(prev => prev.map(interaction =>
          interaction.id === message.data.interaction_id
            ? {
                ...interaction,
                ai_processed: true,
                ai_response: message.data.ai_response,
                ocr_text: message.data.ocr_text
              }
            : interaction
        ));

        // If this is the current interaction, update it
        if (currentInteraction?.id === message.data.interaction_id) {
          setCurrentInteraction(prev =>
            prev ? {
              ...prev,
              ai_processed: true,
              ai_response: message.data.ai_response,
              ocr_text: message.data.ocr_text
            } : null
          );
        }

        // Show AI panel with the latest response
        setShowAIPanel(true);
        break;
      case 'new_interaction':
        // Add the new interaction to the list
        setInteractions(prev => [...prev, message.data.interaction]);
        break;
      default:
        console.log('Unhandled WebSocket message:', message);
    }
  };

  // Save the current state of the whiteboard
  const saveWhiteboardState = async () => {
    if (!calculator.current || !session) return;

    try {
      setIsSaving(true);

      // Get current state
      const state = calculator.current.getState();

      // Save to server
      const updatedSession = await whiteboardServiceRef.current.updateSession(
        session.id,
        { current_state: state }
      );

      // Update local state
      setSession(updatedSession);

      // Broadcast state update to other users
      whiteboardServiceRef.current.sendMessage({
        action: 'update_state',
        data: { state }
      });
    } catch (error) {
      console.error('Error saving whiteboard state:', error);
      setError('Failed to save whiteboard state. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Capture whiteboard screenshot and process with AI
  const captureWhiteboard = async () => {
    if (!calculatorRef.current || !session) return;

    try {
      setIsCapturing(true);

      // Capture screenshot
      const interaction = await whiteboardServiceRef.current.captureWhiteboardScreenshot(
        session.id,
        calculatorRef.current
      );

      // Add to interactions list
      setInteractions(prev => [...prev, interaction]);

      // Set as current interaction
      setCurrentInteraction(interaction);

      // Show AI panel
      setShowAIPanel(true);
    } catch (error) {
      console.error('Error capturing whiteboard:', error);
      setError('Failed to capture whiteboard. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };

  // Change the session status
  const updateSessionStatus = async (status: string) => {
    if (!session) return;

    try {
      const updatedSession = await whiteboardServiceRef.current.updateSession(
        session.id,
        { status }
      );

      setSession(updatedSession);
    } catch (error) {
      console.error('Error updating session status:', error);
      setError(`Failed to change session status to ${status}. Please try again.`);
    }
  };

  // Change the active tool
  const handleToolChange = (tool: string) => {
    setActiveTool(tool);

    // Apply tool-specific behavior
    switch (tool) {
      case 'expression':
        // Default mode, nothing to do
        break;
      case 'draw':
        // Enable drawing mode (would require custom implementation)
        break;
      case 'erase':
        // Enable eraser mode
        break;
      default:
        break;
    }
  };

  // Format date for display
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // If still loading or session not found, show loading state
  if (isLoading || !session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh]">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-opacity-50 border-t-primary rounded-full mb-4"></div>
        <p className="text-center font-serif text-lg">
          {t('loadingWhiteboard') || 'Loading your mathematical canvas...'}
        </p>
      </div>
    );
  }

  // If error, show error message
  if (error) {
    return (
      <div className="p-8">
        <Button
          variant="ghost"
          onClick={() => router.push(`/${locale}/dashboard/tutor/whiteboard`)}
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('backToSessions') || 'Back to Sessions'}
        </Button>

        <div className="bg-destructive/10 border border-destructive/20 text-destructive p-6 rounded-md">
          <h2 className="text-lg font-serif mb-2">{t('errorOccurred') || 'An error occurred'}</h2>
          <p>{error}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('tryAgain') || 'Try Again'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-7rem)] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-[#f8f5f0] dark:bg-black/20">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/${locale}/dashboard/tutor/whiteboard`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('back') || 'Back'}
          </Button>

          <div>
            <h1 className="font-serif text-lg font-medium line-clamp-1">{session.title}</h1>
            <div className="flex items-center text-xs text-muted-foreground">
              <span>{formatDateTime(session.created_at)}</span>
              {session.status === 'active' && (
                <Badge className="ml-2 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                  <PlayCircle className="h-3 w-3 mr-1" />
                  {t('active') || 'Active'}
                </Badge>
              )}
              {session.status === 'paused' && (
                <Badge className="ml-2 bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                  <PauseCircle className="h-3 w-3 mr-1" />
                  {t('paused') || 'Paused'}
                </Badge>
              )}
              {session.status === 'completed' && (
                <Badge className="ml-2 bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  {t('completed') || 'Completed'}
                </Badge>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Session status controls */}
          {session.status === 'active' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSessionStatus('paused')}
              className="h-8"
            >
              <PauseCircle className="h-4 w-4 mr-2" />
              {t('pause') || 'Pause'}
            </Button>
          )}

          {session.status === 'paused' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSessionStatus('active')}
              className="h-8"
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              {t('resume') || 'Resume'}
            </Button>
          )}

          {(session.status === 'active' || session.status === 'paused') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => updateSessionStatus('completed')}
              className="h-8"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {t('complete') || 'Complete'}
            </Button>
          )}

          {/* Save button */}
          <Button
            variant="outline"
            size="sm"
            onClick={saveWhiteboardState}
            disabled={isSaving}
            className="h-8"
          >
            {isSaving ? (
              <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> {t('saving') || 'Saving...'}</>
            ) : (
              <><Save className="h-4 w-4 mr-2" /> {t('save') || 'Save'}</>
            )}
          </Button>

          {/* More actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white dark:bg-black/90 border-stone-200 dark:border-stone-700">
              <DropdownMenuLabel>{t('sessionActions') || 'Session Actions'}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setShowHelp(true)}>
                <HelpCircle className="h-4 w-4 mr-2" />
                {t('help') || 'Help'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                {t('export') || 'Export'}
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Share2 className="h-4 w-4 mr-2" />
                {t('share') || 'Share'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Settings className="h-4 w-4 mr-2" />
                {t('settings') || 'Settings'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <div className="w-12 bg-[#f8f5f0] dark:bg-black/20 border-r flex flex-col items-center py-4 space-y-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === 'expression' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleToolChange('expression')}
                  className="h-9 w-9 p-0"
                >
                  <Type className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('expressions') || 'Expressions'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === 'draw' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleToolChange('draw')}
                  className="h-9 w-9 p-0"
                >
                  <PenTool className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('draw') || 'Draw'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === 'erase' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleToolChange('erase')}
                  className="h-9 w-9 p-0"
                >
                  <Eraser className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('erase') || 'Erase'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTool === 'shapes' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => handleToolChange('shapes')}
                  className="h-9 w-9 p-0"
                >
                  <Shapes className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('shapes') || 'Shapes'}</p>
              </TooltipContent>
            </Tooltip>

            <Separator className="my-2" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}}
                  className="h-9 w-9 p-0"
                >
                  <Undo className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('undo') || 'Undo'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {}}
                  className="h-9 w-9 p-0"
                >
                  <Redo className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('redo') || 'Redo'}</p>
              </TooltipContent>
            </Tooltip>

            <Separator className="my-2" />

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={showAIPanel ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setShowAIPanel(!showAIPanel)}
                  className="h-9 w-9 p-0"
                >
                  <Brain className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('aiPanel') || 'AI Analysis'}</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={captureWhiteboard}
                  disabled={isCapturing}
                  className="h-9 w-9 p-0"
                >
                  {isCapturing ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>{t('captureForAI') || 'Capture for AI Analysis'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Whiteboard area */}
        <div className="flex-1 relative bg-white dark:bg-black/40">
          {/* Desmos calculator container */}
          <div
            ref={calculatorRef}
            className="absolute inset-0 w-full h-full"
          ></div>
        </div>

        {/* AI panel */}
        {showAIPanel && (
          <div className="w-80 bg-[#f8f5f0] dark:bg-black/20 border-l p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg font-medium">
                <Brain className="h-5 w-5 inline-block mr-2" />
                {t('aiAnalysis') || 'AI Analysis'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAIPanel(false)}
                className="h-8 w-8 p-0"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {currentInteraction && currentInteraction.type === 'screenshot' ? (
              <div className="space-y-4">
                {currentInteraction.ai_processed ? (
                  <>
                    {/* OCR Text */}
                    {currentInteraction.ocr_text && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">{t('detected') || 'Detected Mathematics'}</h4>
                        <Card className="bg-white/50 dark:bg-black/10 border-stone-200 dark:border-stone-700">
                          <CardContent className="p-3 font-mono text-sm">
                            {currentInteraction.ocr_text}
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* AI Analysis */}
                    {currentInteraction.ai_response && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">{t('analysis') || 'Analysis'}</h4>
                        <Card className="bg-white/50 dark:bg-black/10 border-stone-200 dark:border-stone-700">
                          <CardContent className="p-3 text-sm">
                            <p>{currentInteraction.ai_response.explanation}</p>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Suggestions */}
                    {currentInteraction.ai_response && currentInteraction.ai_response.suggestions && (
                      <div className="space-y-2">
                        <h4 className="font-medium text-sm">{t('suggestions') || 'Suggestions'}</h4>
                        <Card className="bg-white/50 dark:bg-black/10 border-stone-200 dark:border-stone-700">
                          <CardContent className="p-3 text-sm">
                            <ul className="list-disc list-inside space-y-1">
                              {currentInteraction.ai_response.suggestions.map((suggestion: string, index: number) => (
                                <li key={index}>{suggestion}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => {
                          // Apply the formula to the calculator if available
                          if (calculator.current && currentInteraction.ai_response?.identified_math) {
                            calculator.current.setExpression({
                              id: 'ai-suggested',
                              latex: currentInteraction.ai_response.identified_math
                            });
                          }
                        }}
                      >
                        <Wand2 className="h-4 w-4 mr-2" />
                        {t('applyFormula') || 'Apply Formula'}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => captureWhiteboard()}
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        {t('newCapture') || 'New Capture'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 py-6">
                    <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                    <div className="text-center">
                      <h4 className="font-medium">{t('processing') || 'Processing...'}</h4>
                      <p className="text-sm text-muted-foreground">
                        {t('aiProcessingDescription') || 'The AI is analyzing your whiteboard...'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4 py-8">
                <div className="p-3 bg-primary/10 rounded-full">
                  <Camera className="h-6 w-6 text-primary" />
                </div>
                <div className="text-center">
                  <h4 className="font-medium">{t('noCaptures') || 'No captures yet'}</h4>
                  <p className="text-sm text-muted-foreground">
                    {t('captureDescription') || 'Capture your whiteboard to get AI analysis of your mathematical work.'}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={captureWhiteboard}
                    className="mt-4"
                  >
                    <Camera className="h-4 w-4 mr-2" />
                    {t('captureNow') || 'Capture Now'}
                  </Button>
                </div>
              </div>
            )}

{/* Previous interactions list */}
{interactions.filter(i => i.type === 'screenshot' && i.ai_processed).length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-medium text-sm mb-3">{t('previousCaptures') || 'Previous Captures'}</h4>
                <div className="space-y-2">
                  {interactions
                    .filter(i => i.type === 'screenshot' && i.ai_processed)
                    .map((interaction) => (
                      <Card
                        key={interaction.id}
                        className={`cursor-pointer bg-white/50 dark:bg-black/10 border-stone-200 dark:border-stone-700 ${
                          currentInteraction?.id === interaction.id ? 'border-primary' : ''
                        }`}
                        onClick={() => {
                          setCurrentInteraction(interaction);
                          setShowAIPanel(true);
                        }}
                      >
                        <CardContent className="p-3 text-sm">
                          <div className="flex justify-between items-start mb-1">
                            <div className="font-medium">
                              {interaction.ai_response?.identified_math || t('capture') || 'Capture'}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(interaction.timestamp).toLocaleTimeString(locale, {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {interaction.ai_response?.explanation || ''}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Help dialog */}
      <Dialog open={showHelp} onOpenChange={setShowHelp}>
        <DialogContent className="bg-[#f8f5f0] dark:bg-black/20 border-stone-200 dark:border-stone-800">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{t('helpTitle') || 'Using the Mathematical Canvas'}</DialogTitle>
            <DialogDescription className="font-light">
              {t('helpDescription') || 'Learn how to use the interactive whiteboard features'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <h3 className="font-medium">{t('expressionsHelp') || 'Working with Expressions'}</h3>
              <p className="text-sm text-muted-foreground">
                {t('expressionsHelpText') || 'Click the expression button to add mathematical expressions. Use standard algebraic notation like y=x^2 for a parabola.'}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">{t('aiHelpTitle') || 'AI Analysis'}</h3>
              <p className="text-sm text-muted-foreground">
                {t('aiHelpText') || 'Capture a screenshot of your work with the camera button. The AI will analyze your mathematical expressions and provide insights and suggestions.'}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">{t('savingHelpTitle') || 'Saving Your Work'}</h3>
              <p className="text-sm text-muted-foreground">
                {t('savingHelpText') || 'Click the Save button to store your current work. The system automatically saves snapshots throughout your session.'}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="font-medium">{t('keyboardShortcuts') || 'Keyboard Shortcuts'}</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="font-mono">Ctrl+Z</div>
                <div>{t('undo') || 'Undo'}</div>
                <div className="font-mono">Ctrl+Y</div>
                <div>{t('redo') || 'Redo'}</div>
                <div className="font-mono">Ctrl+S</div>
                <div>{t('save') || 'Save'}</div>
                <div className="font-mono">Ctrl+P</div>
                <div>{t('captureForAI') || 'Capture for AI'}</div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              onClick={() => setShowHelp(false)}
              className="bg-stone-800 hover:bg-stone-700 text-white dark:bg-stone-800 dark:hover:bg-stone-700 dark:text-white font-serif"
            >
              {t('gotIt') || 'Got it'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Connection status indicator */}
      <div className={`fixed bottom-4 right-4 px-3 py-1 rounded-full flex items-center gap-2 text-xs ${
        isConnected
          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200'
          : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200'
      }`}>
        <div className={`w-2 h-2 rounded-full ${
          isConnected ? 'bg-green-500' : 'bg-red-500'
        }`}></div>
        {isConnected
          ? (t('connected') || 'Connected')
          : (t('disconnected') || 'Disconnected')
        }
      </div>
    </div>
  );
};

export default WhiteboardSessionPage;
