import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip static assets, root, and public routes
    if (
        pathname === '/' ||
        pathname.includes('.') ||
        pathname.startsWith('/_next') ||
        pathname === '/register' ||
        pathname.startsWith('/superadmin')
    ) {
        return updateSession(request);
    }

    // 2. Extract slug from /[slug]/...
    const segments = pathname.split('/');
    const slug = segments[1];

    if (!slug) {
        return updateSession(request);
    }

    // 3. Login pages don't need auth check
    if (pathname.endsWith('/login')) {
        return updateSession(request);
    }

    // 4. For all other routes, just refresh the session
    return updateSession(request);
}

async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    );
                    supabaseResponse = NextResponse.next({
                        request,
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    // Refresh the session
    await supabase.auth.getUser();

    return supabaseResponse;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
