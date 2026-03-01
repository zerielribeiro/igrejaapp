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

    // 4. Extract slug from /[slug]/...
    const segments = pathname.split('/');
    const slug = segments[1];

    if (!slug) {
        return await updateSession(request);
    }

    // 5. Login pages don't need auth check
    if (pathname.endsWith('/login')) {
        return await updateSession(request);
    }

    // 6. Verify authentication for all protected routes
    return await verifyAuthAndUpdateSession(request, slug);
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

    // IMPORTANT: Use getUser() instead of getSession() for security in middleware
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // Double check: if we are already on a login page, don't redirect again
        if (request.nextUrl.pathname.endsWith('/login')) {
            return supabaseResponse;
        }

        const loginUrl = request.nextUrl.clone();
        loginUrl.pathname = `/${slug}/login`;
        // Preserve the original destination for possible redirect back
        loginUrl.searchParams.set('redirectTo', request.nextUrl.pathname);
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

    // Refresh session if it exists
    await supabase.auth.getUser();

    return supabaseResponse;
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
