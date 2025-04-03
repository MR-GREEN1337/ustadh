import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from '@/i18n/config';
import type { Locale } from '@/i18n/config';

/**
 * Middleware for handling:
 * 1. Internationalization (i18n) route handling
 * 2. Authentication and route protection
 * 3. Public vs private routes
 * 4. Redirect authenticated users away from auth pages
 */

// Public routes that don't require authentication
const publicRoutes = [
  '/',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/not-found'
];

// Auth routes that authenticated users should be redirected from
const authRoutes = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password'
];

// Routes that are always public regardless of the locale
const globalPublicRoutes = [
  '/_next',
  '/api',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml'
];

/**
 * Get the preferred locale from the request
 */
function getLocale(request: NextRequest): Locale {
  // Check if there is a preferred locale in the cookies
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;

  if (cookieLocale && locales.includes(cookieLocale as Locale)) {
    return cookieLocale as Locale;
  }

  // Check for Accept-Language header
  const acceptLanguage = request.headers.get('accept-language');
  if (acceptLanguage) {
    const acceptedLocales = acceptLanguage.split(',')
      .map(locale => locale.split(';')[0].trim());

    // Find the first locale that matches our supported locales
    for (const locale of acceptedLocales) {
      const matchedLocale = locales.find(supportedLocale =>
        locale.startsWith(supportedLocale) || supportedLocale.startsWith(locale)
      );
      if (matchedLocale) return matchedLocale;
    }
  }

  // Default locale as fallback
  return defaultLocale;
}

/**
 * Check if the user is authenticated
 */
function isAuthenticated(request: NextRequest): boolean {
  // Check for authentication cookie or auth token
  const hasCookieAuth = request.cookies.has('access_token');
  const hasAuthHeader = request.headers.get('authorization')?.startsWith('Bearer ');

  // Check localStorage (client-side storage, not accessible in middleware)
  // We rely on cookies or auth header for server-side authentication
  return (hasCookieAuth || hasAuthHeader) ?? false;
}

/**
 * Check if a route is public (doesn't require authentication)
 */
function isPublicRoute(pathname: string): boolean {
  // Check global public routes first (no locale prefix)
  if (globalPublicRoutes.some(route => pathname.startsWith(route))) {
    return true;
  }

  // Extract the path without locale prefix
  // e.g., /en/login -> /login
  const segments = pathname.split('/');
  const localePrefix = segments[1];
  const isLocalePresent = locales.includes(localePrefix as Locale);

  // Get the path after the locale
  const pathWithoutLocale = isLocalePresent
    ? '/' + segments.slice(2).join('/')
    : pathname;

  // Check if it matches any public route pattern
  return publicRoutes.some(route =>
    pathWithoutLocale === route ||
    pathWithoutLocale.startsWith(`${route}/`)
  );
}

/**
 * Check if a route is an auth page that authenticated users should be redirected from
 */
function isAuthRoute(pathname: string): boolean {
  // Extract the path without locale prefix
  const segments = pathname.split('/');
  const localePrefix = segments[1];
  const isLocalePresent = locales.includes(localePrefix as Locale);

  // Get the path after the locale
  const pathWithoutLocale = isLocalePresent
    ? '/' + segments.slice(2).join('/')
    : pathname;

  // Check if it matches any auth route pattern
  return authRoutes.some(route =>
    pathWithoutLocale === route ||
    pathWithoutLocale.startsWith(`${route}/`)
  );
}

/**
 * The main middleware function
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isAuthenticate = isAuthenticated(request);

  // Skip middleware for static files, images, etc.
  if (
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/) ||
    pathname.includes('_next/static') ||
    pathname.includes('_next/image')
  ) {
    return NextResponse.next();
  }

  // Check if the pathname starts with a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // Get the locale to use
  const locale = getLocale(request);

  // If the pathname doesn't have a locale, redirect to add the locale prefix
  if (!pathnameHasLocale) {
    // Skip redirecting API routes and other special routes
    if (globalPublicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Construct the new URL with the locale
    const newUrl = new URL(
      `/${locale}${pathname === '/' ? '' : pathname}${request.nextUrl.search}`,
      request.url
    );

    return NextResponse.redirect(newUrl);
  }

  // REDIRECT AUTHENTICATED USERS FROM AUTH PAGES

  // If the user is authenticated and trying to access an auth page, redirect to dashboard
  if (isAuthenticate && isAuthRoute(pathname)) {
    const urlLocale = pathname.split('/')[1] as Locale;
    const validLocale = locales.includes(urlLocale as Locale) ? urlLocale : locale;

    // Get returnUrl from query params or default to dashboard
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || `/${validLocale}/dashboard`;

    // If returnUrl is an auth page, go to dashboard instead
    const redirectUrl = isAuthRoute(returnUrl) ? `/${validLocale}/dashboard` : returnUrl;

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // AUTH PROTECTION LOGIC

  // If the route is not public and the user is not authenticated, redirect to login
  if (!isPublicRoute(pathname) && !isAuthenticate) {
    // Extract the current locale from the URL
    const urlLocale = pathname.split('/')[1] as Locale;
    const validLocale = locales.includes(urlLocale as Locale) ? urlLocale : locale;

    // Redirect to login with the return URL
    const loginUrl = new URL(`/${validLocale}/login`, request.url);

    // Add the return URL to query params
    loginUrl.searchParams.set('returnUrl', pathname);

    return NextResponse.redirect(loginUrl);
  }

  // If all checks pass, proceed with the request
  return NextResponse.next();
}

/**
 * Configure which paths should trigger the middleware
 */
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
