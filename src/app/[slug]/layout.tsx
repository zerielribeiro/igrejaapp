'use client';

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useParams, usePathname } from 'next/navigation';
import { RouteGuard } from '@/components/route-guard';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const slug = params.slug as string;
    const { session } = useAuth();

    const isPublicPage = pathname.endsWith('/login') || pathname.endsWith('/register') || pathname === '/';

    if (isPublicPage) {
        return <div className="min-h-screen bg-background">{children}</div>;
    }

    return (
        <RouteGuard>
            <SidebarProvider>
                <AppSidebar slug={slug} />
                <SidebarInset>
                    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-md px-4 md:px-6">
                        <SidebarTrigger className="-ml-1" />
                        <Separator orientation="vertical" className="h-6" />
                        <div className="flex-1" />
                        <div className="flex items-center gap-3">
                            <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px] bg-destructive">
                                    2
                                </Badge>
                            </button>
                            <div className="hidden md:flex flex-col items-end">
                                <span className="text-sm font-medium">{session?.user.name}</span>
                                <span className="text-xs text-muted-foreground capitalize">{session?.user.role}</span>
                            </div>
                        </div>
                    </header>
                    <main className="flex-1 p-4 md:p-6 lg:p-8">
                        {children}
                    </main>
                </SidebarInset>
            </SidebarProvider>
        </RouteGuard>
    );
}
