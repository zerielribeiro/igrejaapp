'use client';

import { useState, useEffect } from 'react';
import { Shield, Church, Users, Activity, ToggleLeft, ToggleRight, Search, BarChart3, KeyRound, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

export default function SuperAdminPage() {
    const { session, isLoading, churches, updateChurchStatus, logout, changePassword } = useAuth();
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    // Security Guard: Only super_admin can see this page
    useEffect(() => {
        if (!isLoading) {
            if (!session) {
                console.log('SuperAdminPage: No session, redirecting...');
                router.push('/superadmin/login');
            } else if (session.user.role !== 'super_admin') {
                console.warn('SuperAdminPage: Not a super_admin:', session.user.role);
                router.push('/');
            }
        }
    }, [session, isLoading, router]);

    if (isLoading || !session || session.user.role !== 'super_admin') {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Carregando painel...</p>
                </div>
            </div>
        );
    }

    const filteredChurches = churches.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.slug.includes(search.toLowerCase()) ||
        c.admin_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.admin_email?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = [
        { title: 'Total de Igrejas', value: churches.length, icon: Church, color: 'text-blue-500' },
        { title: 'Igrejas Ativas', value: churches.filter(c => c.is_active).length, icon: Activity, color: 'text-emerald-500' },
        { title: 'Total de Membros', value: churches.reduce((acc, c) => acc + (c.members_count || 0), 0), icon: Users, color: 'text-amber-500' },
        { title: 'Planos Premium', value: churches.filter(c => c.plan === 'premium').length, icon: Shield, color: 'text-purple-500' },
    ];

    const handleLogout = () => {
        logout();
        router.push('/superadmin/login');
        toast.success('Logout realizado');
    };

    const handleToggleStatus = (id: string, currentStatus: boolean, name: string) => {
        updateChurchStatus(id, !currentStatus);
        toast.success(`Igreja "${name}" ${!currentStatus ? 'ativada' : 'desativada'}!`);
    };

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error('Preencha todos os campos');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('A nova senha deve ter pelo menos 6 caracteres');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }
        const success = await changePassword(currentPassword, newPassword);
        if (success) {
            toast.success('Senha alterada com sucesso!');
            setPasswordDialogOpen(false);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } else {
            toast.error('Senha atual incorreta');
        }
    };

    const planColors: Record<string, string> = {
        free: 'bg-gray-100 text-gray-700',
        basic: 'bg-blue-100 text-blue-700',
        premium: 'bg-amber-100 text-amber-700',
        enterprise: 'bg-purple-100 text-purple-700',
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 h-14">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                            <Shield className="h-5 w-5" />
                        </div>
                        <div>
                            <span className="text-sm font-bold">Super Admin</span>
                            <p className="text-xs text-muted-foreground">Igreja App</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Dialog open={passwordDialogOpen} onOpenChange={(open) => { setPasswordDialogOpen(open); if (!open) { setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); } }}>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="gap-1.5">
                                    <KeyRound className="h-4 w-4" /> Alterar Senha
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Alterar Senha</DialogTitle>
                                    <DialogDescription>Preencha os campos abaixo para alterar sua senha de acesso.</DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="current-password">Senha Atual</Label>
                                        <div className="relative">
                                            <Input
                                                id="current-password"
                                                type={showCurrentPassword ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={e => setCurrentPassword(e.target.value)}
                                                placeholder="Digite sua senha atual"
                                            />
                                            <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>
                                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="new-password">Nova Senha</Label>
                                        <div className="relative">
                                            <Input
                                                id="new-password"
                                                type={showNewPassword ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={e => setNewPassword(e.target.value)}
                                                placeholder="Mínimo 6 caracteres"
                                            />
                                            <Button type="button" variant="ghost" size="sm" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0" onClick={() => setShowNewPassword(!showNewPassword)}>
                                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={e => setConfirmPassword(e.target.value)}
                                            placeholder="Repita a nova senha"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setPasswordDialogOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleChangePassword}>Salvar Senha</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        <Button variant="ghost" size="sm" onClick={handleLogout}>Sair</Button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 md:px-6 py-8 space-y-6">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Painel Administrativo</h1>
                    <p className="text-muted-foreground mt-1">Gerencie todas as igrejas e planos</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {stats.map((stat, i) => (
                        <Card key={stat.title} className={`animate-fade-in stagger-${i + 1}`}>
                            <CardContent className="p-5">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">{stat.title}</p>
                                        <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    </div>
                                    <div className={`p-2.5 rounded-xl bg-muted ${stat.color}`}>
                                        <stat.icon className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Church List */}
                <Card>
                    <CardHeader>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <div>
                                <CardTitle className="text-base">Igrejas Cadastradas</CardTitle>
                                <CardDescription>{filteredChurches.length} igrejas encontradas</CardDescription>
                            </div>
                            <div className="relative w-full sm:w-[280px]">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Buscar igreja..." className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Igreja</TableHead>
                                    <TableHead>Administrador</TableHead>
                                    <TableHead className="hidden md:table-cell text-xs font-bold uppercase text-muted-foreground">E-mail Admin</TableHead>
                                    <TableHead className="hidden lg:table-cell">Membros</TableHead>
                                    <TableHead>Plano</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredChurches.map(church => (
                                    <TableRow key={church.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-sm">{church.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">/{church.slug}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm font-medium">{church.admin_name}</p>
                                            <p className="text-[10px] text-muted-foreground">{church.city} / {church.state}</p>
                                        </TableCell>
                                        <TableCell className="hidden md:table-cell">
                                            <p className="text-xs text-muted-foreground">{church.admin_email}</p>
                                        </TableCell>
                                        <TableCell className="hidden lg:table-cell text-sm">{church.members_count}</TableCell>
                                        <TableCell>
                                            <Badge className={`text-xs ${planColors[church.plan]}`}>{church.plan}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={church.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                                {church.is_active ? 'Ativa' : 'Inativa'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleToggleStatus(church.id, church.is_active, church.name)}
                                                className="text-xs"
                                            >
                                                {church.is_active ? 'Desativar' : 'Ativar'}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
