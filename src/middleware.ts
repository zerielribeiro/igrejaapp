import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip static assets
    if (
        pathname.includes('.') ||
        pathname.startsWith('/_next')
    ) {
        return updateSession(request);
    }

    // 2. Public routes that don't need auth
    if (
        pathname === '/' ||
        pathname === '/register' ||
        pathname.startsWith('/superadmin')
    ) {
        return updateSession(request);
    }

    // 3. Extract slug from /[slug]/...
    const segments = pathname.split('/');
    const slug = segments[1];

    if (!slug) {
        return updateSession(request);
    }

    // 4. Login pages don't need auth check
    if (pathname.endsWith('/login')) {
        return updateSession(request);
    }

    // 5. SECURITY FIX: Verify authentication for all protected routes
    return verifyAuthAndUpdateSession(request, slug);
}

async function verifyAuthAndUpdateSession(request: NextRequest, slug: string) {
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
                    cookiesToSet.forEach(({ name, value }) =>
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

    // Verify user is authenticated
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
        // Not authenticated — redirect to login
        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = `/${slug}/login`;
        return NextResponse.redirect(loginUrl);
    }

    return supabaseResponse;
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
                    cookiesToSet.forEach(({ name, value }) =>
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
