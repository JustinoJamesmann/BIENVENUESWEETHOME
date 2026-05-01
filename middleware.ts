import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isProtectedRoute = createRouteMatcher([
  '/(.*)',
]);

const ALLOWED_EMAILS = [
  'bienvenuesweethome@gmail.com',
  'jjraharizo@gmail.com',
];

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedRoute(req)) {
    const { sessionClaims } = await auth();
    const email = sessionClaims?.email_address as string | undefined;
    
    if (email && !ALLOWED_EMAILS.includes(email)) {
      return Response.redirect(new URL('/blocked', req.url));
    }
    
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
