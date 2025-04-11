"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

/**
 * Step component interface
 */
export interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current step number (0-indexed) */
  currentStep?: number;
  /** Total number of steps */
  totalSteps?: number;
  /** Whether the step is the current step */
  isActive?: boolean;
  /** Whether the step is completed */
  isCompleted?: boolean;
  /** Icon to display */
  icon?: React.ReactNode;
  /** Optional click handler for the step */
  onStepClick?: () => void;
}

/**
 * Steps container interface
 */
export interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current step (0-indexed) */
  currentStep: number;
  /** Handler for step change */
  onStepChange?: (step: number) => void;
  /** Step configuration array */
  steps: Array<{
    title: string;
    description?: string;
    icon?: React.ReactNode;
    optional?: boolean;
  }>;
  /** Optional progress indicator */
  showProgress?: boolean;
}

/**
 * Individual step component
 */
const Step = React.forwardRef<HTMLDivElement, StepProps>(
  ({ className, currentStep, totalSteps, isActive, isCompleted, icon, onStepClick, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center text-center space-y-2",
          isActive ? "text-primary" : isCompleted ? "text-primary" : "text-muted-foreground",
          onStepClick && "cursor-pointer",
          className
        )}
        onClick={onStepClick}
        {...props}
      >
        <div
          className={cn(
            "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
            isActive
              ? "border-primary"
              : isCompleted
                ? "bg-primary border-primary text-primary-foreground"
                : "border-muted-foreground/30"
          )}
        >
          {isCompleted ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            icon || (currentStep !== undefined && totalSteps !== undefined && <span>{currentStep + 1}</span>)
          )}
        </div>
        <div>{children}</div>
      </div>
    );
  }
);
Step.displayName = "Step";

/**
 * Steps container component with progress indicator
 */
export const Steps = React.forwardRef<HTMLDivElement, StepsProps>(
  ({ className, currentStep, onStepChange, steps, showProgress = true, ...props }, ref) => {
    return (
      <div ref={ref} className={cn("w-full space-y-4", className)} {...props}>
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <Step
              key={index}
              currentStep={index}
              totalSteps={steps.length}
              isActive={currentStep === index}
              isCompleted={currentStep > index}
              icon={step.icon}
              onStepClick={onStepChange ? () => onStepChange(index) : undefined}
            >
              <span className="text-xs sm:text-sm font-medium hidden sm:block">
                {step.title}
                {step.optional && <span className="text-xs text-muted-foreground"> (Optional)</span>}
              </span>
            </Step>
          ))}
        </div>

        {showProgress && (
          <Progress
            value={((currentStep + 1) / steps.length) * 100}
            className="h-2"
          />
        )}
      </div>
    );
  }
);
Steps.displayName = "Steps";
