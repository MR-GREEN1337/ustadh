"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

interface LogoProps {
  className?: string;
  hideBadge?: boolean;
  url?: string;
  logoOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function Logo({
  className,
  hideBadge = false,
  url = `/`,
  logoOnly = false,
  size = "md"
}: LogoProps) {
  const [mounted, setMounted] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const logoRef = useRef<HTMLDivElement>(null);

  // Handle sizing based on prop
  const sizeMap = {
    sm: { logo: 40, container: "w-10 h-10", text: "text-lg" },
    md: { logo: 48, container: "w-12 h-12", text: "text-xl" },
    lg: { logo: 56, container: "w-14 h-14", text: "text-2xl" }
  };

  const { logo: logoSize, container: containerSize, text: textSize } = sizeMap[size];

  useEffect(() => {
    setMounted(true);

    // Initial glow animation
    const timer = setTimeout(() => {
      setIsHovered(true);

      const timer2 = setTimeout(() => {
        setIsHovered(false);
      }, 1500);

      return () => clearTimeout(timer2);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  // Track mouse position for parallax effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!logoRef.current) return;

    const rect = logoRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    setMousePosition({ x, y });
  };

  return (
    <Link
      href={`${url}`}
      className={cn("flex items-center", className)}
    >
      <div
        className="flex items-center gap-3 group"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        ref={logoRef}
      >
        {/* Advanced AI Logo Mark */}
        <div className={cn("relative", logoOnly ? `${containerSize} scale-110` : containerSize)}>
          {/* Dynamic glow effect */}
          <div
            className={cn(
              "absolute -inset-[25%] rounded-full blur-xl transition-opacity duration-1000",
              isHovered && mounted ? "opacity-70" : "opacity-0",
            )}
            style={{
              background: "radial-gradient(circle, rgba(79, 70, 229, 0.5) 0%, rgba(99, 102, 241, 0.3) 40%, rgba(16, 185, 129, 0.1) 70%, transparent 100%)",
              transform: isHovered && mounted
                ? `translate(${mousePosition.x * 0.03}px, ${mousePosition.y * 0.03}px)`
                : 'translate(0, 0)',
              transition: 'transform 0.2s ease-out'
            }}
          />

          {/* SVG Logo Mark */}
          <div
            className={cn(
              "relative z-10 transition-transform duration-700",
              isHovered && mounted ? "scale-105" : "scale-100"
            )}
            style={{
              transform: isHovered && mounted
                ? `translate(${mousePosition.x * 0.02}px, ${mousePosition.y * 0.02}px)`
                : 'translate(0, 0)',
              transition: 'transform 0.2s ease-out'
            }}
          >
            <svg
              width={logoSize}
              height={logoSize}
              viewBox="0 0 80 80"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                {/* Advanced gradients */}
                <linearGradient id="mainGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" /> {/* Purple */}
                  <stop offset="50%" stopColor="#6366F1" /> {/* Indigo */}
                  <stop offset="100%" stopColor="#3B82F6" /> {/* Blue */}
                </linearGradient>

                <linearGradient id="accentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10B981" /> {/* Emerald */}
                  <stop offset="100%" stopColor="#06B6D4" /> {/* Cyan */}
                </linearGradient>

                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>

                {/* Particle effect for advanced neural connections */}
                <pattern id="neuralPattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                  <circle cx="2" cy="2" r="1" fill="#6366F1" opacity="0.3" />
                  <circle cx="10" cy="10" r="0.8" fill="#10B981" opacity="0.4" />
                  <circle cx="18" cy="18" r="0.6" fill="#F59E0B" opacity="0.3" />
                </pattern>
              </defs>

              {/* Dynamic brain-inspired neural background pattern */}
              <rect width="80" height="80" fill="url(#neuralPattern)" fillOpacity="0.7" className="animate-pulse" style={{ animationDuration: '10s' }} />

              {/* Base shape - dynamic hexagon with cut corners for uniqueness */}
              <path
                d="M40 10L65 22.5V47.5L40 60L15 47.5V22.5L40 10Z"
                className={`${isHovered && mounted ? 'fill-indigo-600' : 'fill-indigo-700'} dark:fill-indigo-600 transition-colors duration-700`}
                opacity="0.95"
              />

              {/* Inner accent - AI neural paths */}
              <path
                d="M40 20L55 28.75V46.25L40 55L25 46.25V28.75L40 20Z"
                className={`${isHovered && mounted ? 'fill-sky-600' : 'fill-sky-700'} dark:fill-sky-600 transition-colors duration-700`}
                opacity="0.9"
              />

              {/* Core element - pulsing emerald core */}
              <path
                d="M40 30L47.5 35V45L40 50L32.5 45V35L40 30Z"
                fill="url(#accentGradient)"
                className={`${isHovered && mounted ? 'opacity-100' : 'opacity-90'} transition-opacity duration-300`}
              />

              {/* Ustadh U element - highly stylized */}
              <path
                d="M30 26V38C30 43.5228 34.4772 48 40 48V48C45.5228 48 50 43.5228 50 38V26"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                className={`${isHovered && mounted ? 'opacity-100' : 'opacity-80'} transition-opacity duration-300`}
              />

              {/* Neural network pathways - abstract AI representation */}
              <path
                d="M30 34H50"
                stroke="white"
                strokeWidth="1"
                strokeDasharray="1 3"
                strokeLinecap="round"
                className={`${isHovered && mounted ? 'opacity-80' : 'opacity-50'} transition-opacity duration-500`}
              />

              {/* Advanced AI connection points - animate on hover */}
              <g className={`${isHovered && mounted ? 'opacity-100' : 'opacity-60'} transition-opacity duration-700`}>
                {/* Left node */}
                <circle
                  cx="25"
                  cy="35"
                  r="2"
                  fill="#10B981"
                  filter="url(#glow)"
                  className={`${isHovered && mounted ? 'animate-pulse' : ''}`}
                  style={{ animationDuration: '3s' }}
                />

                {/* Right node */}
                <circle
                  cx="55"
                  cy="35"
                  r="2"
                  fill="#F59E0B"
                  filter="url(#glow)"
                  className={`${isHovered && mounted ? 'animate-pulse' : ''}`}
                  style={{ animationDuration: '4s' }}
                />

                {/* Top node */}
                <circle
                  cx="40"
                  cy="20"
                  r="2"
                  fill="#06B6D4"
                  filter="url(#glow)"
                  className={`${isHovered && mounted ? 'animate-pulse' : ''}`}
                  style={{ animationDuration: '2.5s' }}
                />

                {/* Bottom node */}
                <circle
                  cx="40"
                  cy="50"
                  r="2"
                  fill="#8B5CF6"
                  filter="url(#glow)"
                  className={`${isHovered && mounted ? 'animate-pulse' : ''}`}
                  style={{ animationDuration: '3.5s' }}
                />
              </g>

              {/* Futuristic data point indicators */}
              <g className={`${isHovered && mounted ? 'opacity-100' : 'opacity-40'} transition-opacity duration-500`}>
                <line x1="25" y1="25" x2="30" y2="30" stroke="white" strokeWidth="0.75" strokeLinecap="round" />
                <line x1="55" y1="25" x2="50" y2="30" stroke="white" strokeWidth="0.75" strokeLinecap="round" />
                <line x1="25" y1="45" x2="30" y2="40" stroke="white" strokeWidth="0.75" strokeLinecap="round" />
                <line x1="55" y1="45" x2="50" y2="40" stroke="white" strokeWidth="0.75" strokeLinecap="round" />
              </g>

              {/* Dynamic particle nodes - creates advanced AI feel */}
              <g className={`${isHovered && mounted ? 'opacity-80' : 'opacity-0'} transition-opacity duration-700`}>
                {Array.from({ length: 8 }).map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const radius = 25;
                  const x = 40 + Math.cos(angle) * radius;
                  const y = 40 + Math.sin(angle) * radius;
                  return (
                    <circle
                      key={i}
                      cx={x}
                      cy={y}
                      r="0.8"
                      fill="white"
                      className="animate-ping"
                      style={{ animationDuration: `${2 + i * 0.3}s` }}
                    />
                  );
                })}
              </g>
            </svg>
          </div>
        </div>

        {/* Brand name - only show if not logoOnly */}
        {!logoOnly && (
          <div className="relative overflow-hidden">
            <h1 className={cn(
              "flex items-baseline font-bold transition-transform duration-500",
              textSize,
              isHovered && mounted ? "transform -translate-y-1" : ""
            )}>
              <span className="mr-1 font-[El_Messiri] text-slate-800 dark:text-white">أُستاذ</span>
              <span className="tracking-tight uppercase text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-sky-500 to-indigo-400">
                USTADH
              </span>
            </h1>

            {/* Dynamic secondary line with advanced AI positioning */}
            <div className="h-5 relative">
              <p
                className={cn(
                  "absolute top-0 left-0 font-medium text-xs tracking-wide transition-all duration-500 w-full",
                  isHovered && mounted
                    ? "text-emerald-600 dark:text-emerald-400 transform translate-y-0 opacity-100"
                    : "text-slate-500 dark:text-slate-400 transform translate-y-6 opacity-0"
                )}
              >
                ADVANCED AI LEARNING
              </p>
            </div>
          </div>
        )}

        {/* High-tech beta badge */}
        {!hideBadge && (
          <div className="relative">
            {/* Badge glow effect */}
            <div
              className={cn(
                "absolute inset-0 blur-md transition-opacity duration-700 rounded-md",
                isHovered && mounted ? "opacity-80" : "opacity-0"
              )}
              style={{
                background: "linear-gradient(135deg, rgba(16, 185, 129, 0.7), rgba(6, 182, 212, 0.7))"
              }}
            />

            {/* Advanced beta badge */}
            <div
              className={cn(
                "relative px-2 py-0.5 rounded text-xs uppercase tracking-wider font-bold border transition-all duration-500",
                isHovered && mounted
                  ? "bg-gradient-to-r from-emerald-600 to-cyan-600 text-white border-emerald-400/30 transform -rotate-2"
                  : "bg-slate-900/90 dark:bg-white/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20"
              )}
            >
              Beta
            </div>
          </div>
        )}
      </div>

      {/* Animation keyframes */}
      <style jsx global>{`
        @keyframes particle-flow {
          0%, 100% {
            opacity: 0.4;
            transform: translateY(0) translateX(0);
          }
          25% {
            opacity: 0.8;
            transform: translateY(-2px) translateX(1px);
          }
          75% {
            opacity: 0.8;
            transform: translateY(2px) translateX(-1px);
          }
        }
        .particle {
          animation: particle-flow 8s ease-in-out infinite;
        }
      `}</style>
    </Link>
  );
}
