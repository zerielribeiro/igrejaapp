import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, ClipboardCheck, BarChart3,
    DollarSign, Settings, Church
} from 'lucide-react';
import {
    Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
    SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
    SidebarHeader, SidebarRail,
} from '@/components/ui/sidebar';
import { useAuth } from '@/lib/auth-context';

// Map each menu item to its permission module key
const menuItems = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/dashboard', moduleKey: 'dashboard' },
    { title: 'Membros', icon: Users, path: '/membros', moduleKey: 'membros' },
    { title: 'Chamada', icon: ClipboardCheck, path: '/chamada', moduleKey: 'chamada' },
    { title: 'Relatórios', icon: BarChart3, path: '/relatorios', moduleKey: 'relatorios' },
    { title: 'Financeiro', icon: DollarSign, path: '/financeiro', moduleKey: 'financeiro' },
    { title: 'Configurações', icon: Settings, path: '/configuracoes', moduleKey: 'configuracoes' },
];

export function AppSidebar({ slug }: { slug: string }) {
    const pathname = usePathname();
    const { session, rolePermissions } = useAuth();

    // Find the permission set for the current user's role
    const userRole = session?.user.role;
    const userRolePermissions = rolePermissions.find(rp => rp.role === userRole);

    const filteredItems = menuItems.filter(item => {
        if (!userRole) return false;
        // super_admin sees everything
        if (userRole === 'super_admin') return true;
        // Use dynamic permissions if available, fall back to no access
        if (userRolePermissions) {
            return userRolePermissions.modules[item.moduleKey] === true;
        }
        return false;
    });

    return (
        <Sidebar collapsible="icon" className="border-r-0">
            <SidebarHeader className="p-4">
                <Link href={`/${slug}/dashboard`} className="flex items-center gap-3 group-data-[collapsible=icon]:justify-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
                        <Church className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col group-data-[collapsible=icon]:hidden">
                        <span className="text-sm font-semibold text-sidebar-foreground truncate max-w-[160px]">
                            {session?.church.name || 'Igreja App'}
                        </span>
                        <span className="text-xs text-sidebar-foreground/60">
                            Gestão Eclesiástica
                        </span>
                    </div>
                </Link>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel className="text-sidebar-foreground/50 text-xs uppercase tracking-wider">
                        Menu Principal
                    </SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {filteredItems.map((item) => {
                                const fullPath = `/${slug}${item.path}`;
                                const isActive = pathname === fullPath || pathname.startsWith(fullPath + '/');
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className="transition-all duration-200"
                                        >
                                            <Link href={fullPath}>
                                                <item.icon className="h-4 w-4" />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarRail />
        </Sidebar>
    );
}
