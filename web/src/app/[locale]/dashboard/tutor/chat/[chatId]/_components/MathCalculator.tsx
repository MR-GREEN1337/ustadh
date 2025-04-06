"use client";

// Add TypeScript interface for Desmos
declare global {
  interface Window {
    Desmos: {
      GraphingCalculator: (
        element: HTMLElement | null,
        options?: {
          expressions?: boolean;
          settingsMenu?: boolean;
          zoomButtons?: boolean;
          expressionsTopbar?: boolean;
          border?: boolean;
          lockViewport?: boolean;
          invertedColors?: boolean;
          [key: string]: any;
        }
      ) => {
        setExpression: (options: { id: string; latex: string; color?: string; hidden?: boolean }) => void;
        removeExpression: (options: { id: string }) => void;
        updateSettings: (settings: { showGrid?: boolean; invertedColors?: boolean; [key: string]: any }) => void;
      };
    };
  }
}

import React, { useState, useEffect, useRef } from 'react';
import Script from 'next/script';
import { useParams } from 'next/navigation';
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import {
  LineChart,
  Maximize2,
  Minimize2,
  Save,
  Download,
  ChevronLeft,
  ChevronRight,
  Share2,
  Plus,
  Minus,
  Calculator,
  Trash2,
  History,
  Sparkles,
  BrainCircuit,
  HelpCircle,
  Lightbulb,
  Undo,
  Redo
} from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

export function DesmosPanel() {
  const params = useParams();
  const locale = params?.locale || 'en';
  const [open, setOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [currentTab, setCurrentTab] = useState('graph');
  const [expressions, setExpressions] = useState([{ id: 1, latex: '', color: '#2d70b3', visible: true }]);
  const [currentExpressionId, setCurrentExpressionId] = useState(1);

  const calculatorRef = useRef(null);
  const containerRef = useRef(null);
  const isRTL = locale === "ar";

  // Define a set of common math function examples
  const mathExamples = [
    { name: "Linear Function", latex: "y = mx + b", description: "Linear function with slope m and y-intercept b" },
    { name: "Quadratic Function", latex: "y = ax^2 + bx + c", description: "Quadratic function with a, b, and c parameters" },
    { name: "Sine Wave", latex: "y = a\\sin(bx + c) + d", description: "Sine wave with amplitude a, period 2π/b, phase shift c, and vertical shift d" },
    { name: "Circle", latex: "(x-h)^2 + (y-k)^2 = r^2", description: "Circle with center (h,k) and radius r" }
  ];

  // Initialize Desmos calculator when sheet is opened
  useEffect(() => {
    if (!open || typeof window === 'undefined') return;

    // Check if Desmos is available, if not, set up a listener for when the script loads
    const initializeCalculator = () => {
      if (!document.getElementById('calculator-container')) return;

      try {
        const calculator = window.Desmos.GraphingCalculator(
          document.getElementById('calculator-container'),
          {
            expressions: true,
            settingsMenu: true,
            zoomButtons: true,
            expressionsTopbar: true,
            border: false,
            lockViewport: false,
            invertedColors: isDarkMode
          }
        );

        calculatorRef.current = calculator;

        // Apply grid visibility setting
        calculator.updateSettings({ showGrid: isGridVisible });

        // Load initial expressions
        expressions.forEach(expr => {
          if (expr.latex) {
            calculator.setExpression({
              id: `expr${expr.id}`,
              latex: expr.latex,
              color: expr.color,
              hidden: !expr.visible
            });
          }
        });
      } catch (err) {
        console.error("Error initializing Desmos calculator:", err);
      }
    };

    // If Desmos is already loaded
    if (window.Desmos) {
      // Wait a bit for the DOM to be ready
      setTimeout(initializeCalculator, 100);
    } else {
      // Set up event listener for script loading
      const handleScriptLoad = () => {
        // Wait a bit for Desmos to initialize fully
        setTimeout(initializeCalculator, 100);
      };

      // Find the script element and add a load event listener
      const scriptElement = document.querySelector('script[src*="desmos"]');
      if (scriptElement) {
        scriptElement.addEventListener('load', handleScriptLoad);
      }
    }

    return () => {
      if (calculatorRef.current) {
        calculatorRef.current = null;
      }
    };
  }, [open, isDarkMode, isGridVisible, expressions]);

  // Handle theme changes
  useEffect(() => {
    if (calculatorRef.current) {
      calculatorRef.current.updateSettings({ invertedColors: isDarkMode });
    }
  }, [isDarkMode]);

  // Handle grid visibility changes
  useEffect(() => {
    if (calculatorRef.current) {
      calculatorRef.current.updateSettings({ showGrid: isGridVisible });
    }
  }, [isGridVisible]);

  // Function to add a new expression
  const addExpression = () => {
    const newId = expressions.length > 0 ? Math.max(...expressions.map(e => e.id)) + 1 : 1;
    setExpressions([...expressions, { id: newId, latex: '', color: '#2d70b3', visible: true }]);
    setCurrentExpressionId(newId);
  };

  // Function to update an expression
  const updateExpression = (id, newProps) => {
    setExpressions(expressions.map(expr =>
      expr.id === id ? { ...expr, ...newProps } : expr
    ));

    if (calculatorRef.current && newProps.latex !== undefined) {
      calculatorRef.current.setExpression({
        id: `expr${id}`,
        latex: newProps.latex,
        color: expressions.find(e => e.id === id)?.color || '#2d70b3',
        hidden: !expressions.find(e => e.id === id)?.visible
      });
    }
  };

  // Function to delete an expression
  const deleteExpression = (id) => {
    setExpressions(expressions.filter(expr => expr.id !== id));
    if (calculatorRef.current) {
      calculatorRef.current.removeExpression({ id: `expr${id}` });
    }

    if (currentExpressionId === id) {
      const newExpressions = expressions.filter(expr => expr.id !== id);
      if (newExpressions.length > 0) {
        setCurrentExpressionId(newExpressions[0].id);
      } else {
        addExpression();
      }
    }
  };

  // Function to load an example
  const loadExample = (latex) => {
    if (currentExpressionId) {
      updateExpression(currentExpressionId, { latex });
    } else {
      const newId = expressions.length > 0 ? Math.max(...expressions.map(e => e.id)) + 1 : 1;
      setExpressions([...expressions, { id: newId, latex, color: '#2d70b3', visible: true }]);
      setCurrentExpressionId(newId);
    }
  };

  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <Script
          src="https://www.desmos.com/api/v1.10/calculator.js?apiKey=dcb31709b452b1cf9dc26972add0fda6"
          strategy="lazyOnload"
          onLoad={() => console.log("Desmos script loaded successfully")}
          onError={(e) => console.error("Error loading Desmos script:", e)}
        />

        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-full"
            aria-label="Open Graphing Calculator"
          >
            <LineChart className="h-5 w-5" />
          </Button>
        </SheetTrigger>

        <SheetContent
          side={isRTL ? "left" : "right"}
          className={`p-0 border-l ${isExpanded ? 'w-[85vw]' : 'w-[450px]'} max-w-full`}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-2 border-b">
              <div className="flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                <h2 className="text-lg font-medium">Desmos Graphing Calculator</h2>
              </div>

              <div className="flex space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsExpanded(!isExpanded)}
                      >
                        {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {isExpanded ? 'Minimize' : 'Maximize'}
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-1 min-h-0">
              {/* Tabs for different sections */}
              <Tabs
                value={currentTab}
                onValueChange={setCurrentTab}
                className="flex flex-col w-full h-full"
              >
                <TabsList className="p-1 justify-start border-b rounded-none">
                  <TabsTrigger value="graph">Graph</TabsTrigger>
                  <TabsTrigger value="examples">Examples</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>

                {/* Graph Tab */}
                <TabsContent value="graph" className="flex-1 min-h-0 flex flex-col">
                  <div className="flex-1 min-h-0" ref={containerRef}>
                    <div
                      id="calculator"
                      className="w-full h-full min-h-[300px]"
                    ></div>
                  </div>

                  {/* Expression Entry */}
                  <div className="p-2 border-t">
                    <div className="flex items-center mb-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={addExpression}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Expression
                      </Button>
                    </div>

                    <ScrollArea className="h-[100px]">
                      {expressions.map((expr) => (
                        <div
                          key={expr.id}
                          className={`flex items-center p-1 mb-1 rounded ${currentExpressionId === expr.id ? 'bg-secondary/20' : ''}`}
                          onClick={() => setCurrentExpressionId(expr.id)}
                        >
                          <input
                            type="color"
                            value={expr.color}
                            onChange={(e) => updateExpression(expr.id, { color: e.target.value })}
                            className="h-6 w-6 mr-2 rounded-full border cursor-pointer"
                          />
                          <Input
                            value={expr.latex}
                            onChange={(e) => updateExpression(expr.id, { latex: e.target.value })}
                            placeholder="Enter LaTeX expression..."
                            className="flex-1 h-8"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 ml-1"
                            onClick={() => updateExpression(expr.id, { visible: !expr.visible })}
                          >
                            {expr.visible ? (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                <circle cx="12" cy="12" r="3"></circle>
                              </svg>
                            ) : (
                              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                                <line x1="1" y1="1" x2="23" y2="23"></line>
                              </svg>
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 ml-1"
                            onClick={() => deleteExpression(expr.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </ScrollArea>
                  </div>
                </TabsContent>

                {/* Examples Tab */}
                <TabsContent value="examples" className="flex-1 p-4 overflow-auto">
                  <h3 className="text-lg font-medium mb-4">Common Functions</h3>
                  <div className="space-y-3">
                    {mathExamples.map((example, index) => (
                      <div key={index} className="border rounded-md p-3">
                        <h4 className="font-medium">{example.name}</h4>
                        <pre className="bg-muted p-2 rounded my-2 text-sm overflow-x-auto">
                          {example.latex}
                        </pre>
                        <p className="text-sm text-muted-foreground">{example.description}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => loadExample(example.latex)}
                        >
                          Use this example
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* Settings Tab */}
                <TabsContent value="settings" className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="grid-toggle">Show Grid</Label>
                      <Switch
                        id="grid-toggle"
                        checked={isGridVisible}
                        onCheckedChange={setIsGridVisible}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="theme-toggle">Dark Mode</Label>
                      <Switch
                        id="theme-toggle"
                        checked={isDarkMode}
                        onCheckedChange={setIsDarkMode}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
