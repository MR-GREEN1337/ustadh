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

// Routes that should bypass authentication check even if not in the public routes list
// This allows the client-side refresh token logic to run without middleware redirection
const bypassAuthCheckRoutes = [
  '/dashboard',
  '/profile',
  // Add other important routes where you want to allow refresh token to attempt
];

/**
 * Get the preferred locale from the request
 * Will prioritize cookie, then Accept-Language header, then defaultLocale
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
  const accessToken = request.cookies.get('access_token');
  const refreshToken = request.cookies.get('refresh_token');
  const hasAuthHeader = request.headers.get('authorization')?.startsWith('Bearer ');

  // If we have a refresh token but no access token, we should let the client-side
  // code handle the refresh instead of immediately redirecting to login
  if (refreshToken && (!accessToken && !hasAuthHeader)) {
    return true; // Pretend authenticated to let client refresh
  }

  // Normal authentication check
  return (accessToken || hasAuthHeader) ? true : false;
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

  // Root paths like /en, /fr should be public (landing pages)
  if (pathWithoutLocale === '' || pathWithoutLocale === '/') {
    return true;
  }

  // Check if it matches any public route pattern
  return publicRoutes.some(route =>
    pathWithoutLocale === route ||
    pathWithoutLocale.startsWith(`${route}/`)
  );
}

/**
 * Check if a route is specifically the landing page
 */
function isLandingPage(pathname: string): boolean {
  const segments = pathname.split('/');
  // Check if the path is just the locale (e.g., /en, /fr)
  if (segments.length === 2 && locales.includes(segments[1] as Locale)) {
    return true;
  }
  return false;
}

/**
 * Check if a route should bypass the authentication check to allow refresh token to work
 */
function shouldBypassAuthCheck(pathname: string): boolean {
  // Extract the path without locale prefix
  const segments = pathname.split('/');
  const localePrefix = segments[1];
  const isLocalePresent = locales.includes(localePrefix as Locale);

  // Get the path after the locale
  const pathWithoutLocale = isLocalePresent
    ? '/' + segments.slice(2).join('/')
    : pathname;

  return bypassAuthCheckRoutes.some(route =>
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
  const hasRefreshToken = request.cookies.has('refresh_token');

  // Skip middleware for static files, images, etc.
  if (
    pathname.match(/\.(jpg|jpeg|png|gif|svg|ico|css|js)$/) ||
    pathname.includes('_next/static') ||
    pathname.includes('_next/image')
  ) {
    return NextResponse.next();
  }

  // Special case for root path / - always redirect to defaultLocale
  if (pathname === '/') {
    return NextResponse.redirect(new URL(`/${defaultLocale}`, request.url));
  }

  // Check if the pathname starts with a locale
  const pathnameHasLocale = locales.some(
    locale => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  // If the pathname doesn't have a locale, redirect to add the default locale prefix
  if (!pathnameHasLocale) {
    // Skip redirecting API routes and other special routes
    if (globalPublicRoutes.some(route => pathname.startsWith(route))) {
      return NextResponse.next();
    }

    // Always use defaultLocale for paths without a locale prefix
    const newUrl = new URL(
      `/${defaultLocale}${pathname === '/' ? '' : pathname}${request.nextUrl.search}`,
      request.url
    );

    return NextResponse.redirect(newUrl);
  }

  // ALWAYS allow access to landing pages like /en, /fr, etc. without any auth check
  if (isLandingPage(pathname)) {
    return NextResponse.next();
  }

  // REDIRECT AUTHENTICATED USERS FROM AUTH PAGES
  // If the user is authenticated and trying to access an auth page, redirect to dashboard
  if (isAuthenticate && isAuthRoute(pathname)) {
    // Extract the current locale from the URL
    const urlLocale = pathname.split('/')[1] as Locale;
    const validLocale = locales.includes(urlLocale as Locale) ? urlLocale : defaultLocale;

    // Get returnUrl from query params or default to dashboard
    const returnUrl = request.nextUrl.searchParams.get('returnUrl') || `/${validLocale}/dashboard`;

    // If returnUrl is an auth page, go to dashboard instead
    const redirectUrl = isAuthRoute(returnUrl) ? `/${validLocale}/dashboard` : returnUrl;

    return NextResponse.redirect(new URL(redirectUrl, request.url));
  }

  // AUTH PROTECTION LOGIC with REFRESH TOKEN CONSIDERATION
  // If the route is not public and the user is not authenticated, check refresh token
  if (!isPublicRoute(pathname) && !isAuthenticate) {
    // If we have a refresh token and route is in our bypass list, let client handle refresh
    if (hasRefreshToken && shouldBypassAuthCheck(pathname)) {
      // Let the client-side token refresh logic handle this
      return NextResponse.next();
    }

    // Extract the current locale from the URL
    const urlLocale = pathname.split('/')[1] as Locale;
    const validLocale = locales.includes(urlLocale as Locale) ? urlLocale : defaultLocale;

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
