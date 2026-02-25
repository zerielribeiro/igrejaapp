import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard, Users, ClipboardCheck, BarChart3,
    DollarSign, Settings, ChevronDown, Church, LogOut
} from 'lucide-react';
import {
    Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
    SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
    SidebarHeader, SidebarFooter, SidebarRail,
} from '@/components/ui/sidebar';
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
    const router = useRouter();
    const { session, logout, rolePermissions } = useAuth();

    const handleLogout = () => {
        logout();
        router.push(`/${slug}/login`);
    };

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

    const initials = session?.user.name
        .split(' ')
        .map(n => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase() || 'U';

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

            <SidebarFooter className="p-3">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-3 w-full rounded-lg p-2 text-left hover:bg-sidebar-accent transition-colors group-data-[collapsible=icon]:justify-center">
                            <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                                <span className="text-sm font-medium text-sidebar-foreground truncate">
                                    {session?.user.name}
                                </span>
                                <span className="text-xs text-sidebar-foreground/60 capitalize">
                                    {session?.user.role}
                                </span>
                            </div>
                            <ChevronDown className="h-4 w-4 text-sidebar-foreground/60 group-data-[collapsible=icon]:hidden" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent side="top" align="start" className="w-56">
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sair
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
