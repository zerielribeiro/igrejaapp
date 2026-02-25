import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // 1. Skip static assets and root
    if (
        pathname === '/' ||
        pathname.includes('.') ||
        pathname.startsWith('/_next') ||
        pathname === '/register' ||
        pathname.startsWith('/superadmin')
    ) {
        return NextResponse.next();
    }

    // 2. Extract slug from /[slug]/...
    const segments = pathname.split('/');
    const slug = segments[1];

    // 3. For this demo, we just allow any slug that isn't empty
    // In a real app, you'd check if church exists in DB/Cache
    if (!slug) {
        return NextResponse.next();
    }

    // 4. Protection logic (Social/Auth check would go here)
    // For now, we just pass through as it's a mock demo

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
