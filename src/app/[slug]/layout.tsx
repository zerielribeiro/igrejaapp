'use client';

import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';
import { Separator } from '@/components/ui/separator';
import { Bell } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { RouteGuard } from '@/components/route-guard';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, KeyRound, LogOut, ChevronDown } from 'lucide-react';
import { ChangePasswordDialog } from '@/components/change-password-dialog';
import { useState } from 'react';
import { toast } from 'sonner';

export default function TenantLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const pathname = usePathname();
    const router = useRouter();
    const slug = params.slug as string;
    const { session, logout } = useAuth();
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);

    const roleTranslations: Record<string, string> = {
        'super_admin': 'Super Administrador',
        'admin': 'Administrador',
        'pastor': 'Pastor',
        'treasurer': 'Tesoureiro',
        'secretary': 'Secretária'
    };

    const handleLogout = () => {
        logout();
        router.push(`/${slug}/login`);
        toast.success('Logout realizado');
    };

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

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button className="flex items-center gap-3 p-1 rounded-lg hover:bg-muted transition-colors outline-none">
                                        <div className="hidden md:flex flex-col items-end">
                                            <span className="text-sm font-medium">{session?.user.name}</span>
                                            <span className="text-xs text-muted-foreground capitalize">
                                                {session?.user.role ? roleTranslations[session.user.role] || session.user.role : ''}
                                            </span>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-56">
                                    <DropdownMenuLabel>Minha Conta</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => setPasswordDialogOpen(true)} className="cursor-pointer">
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Trocar Senha
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sair
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>

                            <ChangePasswordDialog
                                open={passwordDialogOpen}
                                onOpenChange={setPasswordDialogOpen}
                            />
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
