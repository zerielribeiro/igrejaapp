'use client';

import { useAuth } from '@/lib/auth-context';
import { useRouter, useParams, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AlertCircle, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Map URL segments to module permission keys
const moduleFromPath: Record<string, string> = {
    dashboard: 'dashboard',
    membros: 'membros',
    chamada: 'chamada',
    relatorios: 'relatorios',
    financeiro: 'financeiro',
    configuracoes: 'configuracoes',
};

export function RouteGuard({ children }: { children: React.ReactNode }) {
    const { session, isLoading, logout, rolePermissions } = useAuth();
    const router = useRouter();
    const params = useParams();
    const pathname = usePathname();
    const slug = params?.slug as string;
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        if (isLoading) return;

        // Skip guarding for login and register pages
        const isPublicPage = pathname.endsWith('/login') || pathname.endsWith('/register') || pathname === '/';
        if (isPublicPage) {
            setAuthorized(true);
            return;
        }

        // 1. Check if authenticated
        if (!session) {
            console.log('RouteGuard: No session. Redirecting to login.');
            setAuthorized(false);
            router.push(`/${slug}/login`);
            return;
        }

        // 2. Check if the logged-in user belongs to this church slug
        if (session.user.role !== 'super_admin' && session.church.slug !== slug) {
            console.warn(`RouteGuard: Institution mismatch. User(${session.church.slug}) tried to access (${slug}). Redirecting.`);
            setAuthorized(false);
            router.push(`/${session.church.slug}/dashboard`);
            return;
        }

        // 3. SECURITY FIX: Check module-level permissions based on role
        if (session.user.role !== 'super_admin') {
            const segments = pathname.split('/');
            const moduleSegment = segments[2]; // /[slug]/[module]/...
            const moduleKey = moduleSegment ? moduleFromPath[moduleSegment] : null;

            if (moduleKey) {
                const userRolePermission = rolePermissions.find(rp => rp.role === session.user.role);
                const hasModuleAccess = userRolePermission?.modules?.[moduleKey] ?? false;

                if (!hasModuleAccess) {
                    console.warn(`RouteGuard: Role "${session.user.role}" denied access to module "${moduleKey}".`);
                    setAuthorized(false);
                    toast.error(`Você não tem permissão para acessar o módulo "${moduleKey}".`);
                    router.push(`/${slug}/dashboard`);
                    return;
                }
            }
        }

        setAuthorized(true);
    }, [session, isLoading, slug, router, pathname, rolePermissions]);

    // Show nothing (or a loading spinner) while checking/redirecting
    if (isLoading || !authorized) {
        return (
            <div className="flex h-screen w-full items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground font-medium">Verificando acesso...</p>
                </div>
            </div>
        );
    }

    // Show inactive message if church is inactive
    if (session && session.user.role !== 'super_admin' && !session.church.is_active) {
        return (
            <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
                <div className="max-w-md animate-fade-in space-y-6">
                    <div className="flex justify-center">
                        <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                            <AlertCircle className="h-10 w-10" />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold tracking-tight">Igreja Inativa</h1>
                        <p className="text-muted-foreground">
                            Esta instituição está atualmente inativa no sistema.
                            Para retomar o acesso, entre em contato com o suporte técnico.
                        </p>
                    </div>
                    <div className="pt-4 flex flex-col gap-3">
                        <Button className="w-full" variant="outline" onClick={() => {
                            logout();
                            router.push(`/${slug}/login`);
                        }}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair e Tentar Outro Login
                        </Button>
                        <p className="text-xs text-muted-foreground">Suporte: suporte@igrejaapp.com.br</p>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
