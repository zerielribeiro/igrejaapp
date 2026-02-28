'use client';

import { useState, useEffect } from 'react';
import {
    UserPlus, Pencil, Trash2, Plus, Church, Save, Shield,
    ToggleLeft, ToggleRight, ChevronDown, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
    DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel,
    AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth, RolePermission } from '@/lib/auth-context';
import { User, Room, UserRole } from '@/lib/types';
import { toast } from 'sonner';

// ─── Constants ────────────────────────────────────────────────────
const roleLabels: Record<string, string> = {
    admin: 'Administrador',
    pastor: 'Pastor',
    secretary: 'Secretário(a)',
    treasurer: 'Tesoureiro(a)',
};

const moduloLabels: Record<string, string> = {
    dashboard: 'Dashboard',
    membros: 'Membros',
    chamada: 'Chamada',
    relatorios: 'Relatórios',
    financeiro: 'Financeiro',
    configuracoes: 'Configurações',
};

const ageGroups = ['Adulto', 'Jovem', 'Criança'];

const initials = (name: string) =>
    name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

// ─── Sub-components ───────────────────────────────────────────────

function UserDialog({
    open, onOpenChange, user, onSave,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    user?: User | null;
    onSave: (data: { name: string; email: string; role: UserRole, password?: string }) => void;
}) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState<UserRole>('secretary');
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (open) {
            setName(user?.name ?? '');
            setEmail(user?.email ?? '');
            setRole(user?.role ?? 'secretary');
            setPassword('');
        }
    }, [open, user]);

    const handleOpen = (v: boolean) => {
        if (!v) {
            // Clear on close
            setName('');
            setEmail('');
            setPassword('');
        }
        onOpenChange(v);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email) { toast.error('Preencha todos os campos.'); return; }

        onSave({
            name,
            email,
            role,
            ...(user ? {} : { password: password || undefined })
        });

        // Clear explicitly after success
        setName('');
        setEmail('');
        setPassword('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{user ? 'Editar Usuário' : 'Adicionar Usuário'}</DialogTitle>
                    <DialogDescription>
                        {user ? 'Atualize as informações do usuário.' : 'Preencha os dados para adicionar um novo usuário ao sistema.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label>Nome Completo</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maria Santos" required />
                    </div>
                    <div className="space-y-2">
                        <Label>E-mail</Label>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="usuario@igrejabatista.com" required />
                    </div>
                    {!user && (
                        <div className="space-y-2">
                            <Label>Senha Provisória</Label>
                            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Será alterada no primeiro acesso" />
                            <p className="text-xs text-muted-foreground">O usuário deverá alterar a senha no primeiro login.</p>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Perfil de Acesso</Label>
                        <Select value={role} onValueChange={v => setRole(v as UserRole)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pastor">Pastor</SelectItem>
                                <SelectItem value="secretary">Secretário(a)</SelectItem>
                                <SelectItem value="treasurer">Tesoureiro(a)</SelectItem>
                                <SelectItem value="admin">Administrador</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            {user ? 'Salvar Alterações' : 'Adicionar Usuário'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RoomDialog({
    open, onOpenChange, room, onSave,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    room?: Room | null;
    onSave: (data: { name: string; age_group: string }) => void;
}) {
    const [name, setName] = useState('');
    const [ageGroup, setAgeGroup] = useState<import('@/lib/types').AgeGroup>('Adulto');

    useEffect(() => {
        if (open) {
            setName(room?.name ?? '');
            setAgeGroup(room?.age_group ?? 'Adulto');
        }
    }, [open, room]);

    const handleOpen = (v: boolean) => {
        if (!v) {
            setName('');
            setAgeGroup('Adulto');
        }
        onOpenChange(v);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name) { toast.error('O nome é obrigatório.'); return; }
        onSave({ name, age_group: ageGroup });
        setName('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={handleOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{room ? 'Editar Sala' : 'Nova Sala'}</DialogTitle>
                    <DialogDescription>
                        {room ? 'Atualize os dados da sala.' : 'Preencha as informações da nova sala ou ministério.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    <div className="space-y-2">
                        <Label>Nome da Sala / Ministério</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Culto Geral" required />
                    </div>
                    <div className="space-y-2">
                        <Label>Faixa Etária</Label>
                        <Select value={ageGroup} onValueChange={v => setAgeGroup(v as import('@/lib/types').AgeGroup)}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {ageGroups.map(ag => <SelectItem key={ag} value={ag}>{ag}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            {room ? 'Salvar Alterações' : 'Criar Sala'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function PermissionsDialog({
    open, onOpenChange, rp, onSave,
}: {
    open: boolean;
    onOpenChange: (v: boolean) => void;
    rp: RolePermission;
    onSave: (modules: Record<string, boolean>) => void;
}) {
    const [modules, setModules] = useState<Record<string, boolean>>({ ...rp.modules });

    // Resync when the rp prop changes (different role was clicked)
    const toggle = (key: string) => {
        // Prevent disabling configuracoes for admins
        if (rp.role === 'admin' && key === 'configuracoes') return;
        setModules(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Dialog open={open} onOpenChange={v => { if (v) setModules({ ...rp.modules }); onOpenChange(v); }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Editar Permissões — {rp.label}</DialogTitle>
                    <DialogDescription>Defina quais módulos este perfil pode acessar.</DialogDescription>
                </DialogHeader>
                <div className="space-y-1 mt-2">
                    {Object.entries(moduloLabels).map(([key, label]) => {
                        const isLocked = rp.role === 'admin' && key === 'configuracoes';
                        return (
                            <div key={key} className="flex items-center justify-between py-2.5 border-b last:border-0">
                                <div>
                                    <span className="text-sm font-medium">{label}</span>
                                    {isLocked && (
                                        <p className="text-xs text-muted-foreground">Obrigatório para Administrador</p>
                                    )}
                                </div>
                                <Switch
                                    checked={modules[key] ?? false}
                                    onCheckedChange={() => toggle(key)}
                                    disabled={isLocked}
                                    aria-label={`Permissão ${label}`}
                                />
                            </div>
                        );
                    })}
                </div>
                <DialogFooter className="mt-4">
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button className="bg-secondary text-secondary-foreground hover:bg-secondary/90"
                        onClick={() => { onSave(modules); onOpenChange(false); }}>
                        Salvar Permissões
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ChurchDataForm() {
    const { session, updateChurchData } = useAuth();
    const [name, setName] = useState(session?.church.name || '');
    const [cnpj, setCnpj] = useState(session?.church.cnpj || '');
    const [pastor, setPastor] = useState(session?.church.pastor || '');
    const [address, setAddress] = useState(session?.church.address || '');
    const [city, setCity] = useState(session?.church.city || '');
    const [phone, setPhone] = useState(session?.church.phone || '');
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (session?.church) {
            setName(session.church.name || '');
            setCnpj(session.church.cnpj || '');
            setPastor(session.church.pastor || '');
            setAddress(session.church.address || '');
            setCity(session.church.city || '');
            setPhone(session.church.phone || '');
        }
    }, [session?.church]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.church.id) return;
        setIsSaving(true);
        try {
            const { success, error } = await updateChurchData(session.church.id, {
                name, cnpj, pastor, address, city, phone
            });
            if (success) {
                toast.success('Dados atualizados com sucesso!');
            } else {
                toast.error(error || 'Erro ao atualizar dados da igreja.');
            }
        } catch (err: any) {
            console.error('Submit error:', err);
            toast.error('Erro ao conectar com o servidor.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
            <div className="space-y-2">
                <Label>Nome da Igreja</Label>
                <Input value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0001-00" />
            </div>
            <div className="space-y-2">
                <Label>Pastor Titular</Label>
                <Input value={pastor} onChange={e => setPastor(e.target.value)} />
            </div>
            <div className="space-y-2">
                <Label>Endereço</Label>
                <Input value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input value={city} onChange={e => setCity(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
            </div>
            <Button type="submit" disabled={isSaving} className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                <Save className="h-4 w-4 mr-1" /> {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
        </form>
    );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function ConfiguracoesPage() {
    const { session, users, rooms, rolePermissions, addUser, updateUser, deleteUser, addRoom, updateRoom, deleteRoom, updateRolePermission } = useAuth();

    // User dialog state
    const [userDialogOpen, setUserDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

    // Room dialog state
    const [roomDialogOpen, setRoomDialogOpen] = useState(false);
    const [editingRoom, setEditingRoom] = useState<Room | null>(null);
    const [deleteRoomId, setDeleteRoomId] = useState<string | null>(null);

    // Permissions dialog state
    const [permDialogOpen, setPermDialogOpen] = useState(false);
    const [editingRolePermission, setEditingRolePermission] = useState<RolePermission | null>(null);

    // ─── User handlers
    const handleAddUser = () => { setEditingUser(null); setUserDialogOpen(true); };
    const handleEditUser = (u: User) => { setEditingUser(u); setUserDialogOpen(true); };
    const handleSaveUser = async (data: { name: string; email: string; role: UserRole, password?: string }) => {
        try {
            if (editingUser) {
                // Remove password from payload when updating, just in case
                const { password, ...updateData } = data;
                await updateUser(editingUser.id, updateData);
                toast.success('Usuário atualizado com sucesso!');
            } else {
                await addUser(data);
                toast.success('Usuário adicionado com sucesso!');
            }
            setUserDialogOpen(false);
        } catch (error) {
            // Error toast handled by AuthContext
        }
    };
    const handleDeleteUser = (id: string) => { setDeleteUserId(id); };
    const confirmDeleteUser = async () => {
        if (deleteUserId) {
            try {
                await deleteUser(deleteUserId);
                toast.success('Usuário removido.');
                setDeleteUserId(null);
            } catch (error) {
                // Error toast handled by AuthContext
            }
        }
    };


    // ─── Room handlers
    const handleAddRoom = () => { setEditingRoom(null); setRoomDialogOpen(true); };
    const handleEditRoom = (r: Room) => { setEditingRoom(r); setRoomDialogOpen(true); };
    const handleSaveRoom = async (data: { name: string; age_group: string }) => {
        const typedData = { name: data.name, age_group: data.age_group as import('@/lib/types').AgeGroup };
        let successPath = false;
        let errorMessage = '';

        if (editingRoom) {
            const { success, error } = await updateRoom(editingRoom.id, typedData);
            successPath = success;
            errorMessage = error || 'Erro ao atualizar sala.';
        } else {
            const { success, error } = await addRoom(typedData);
            successPath = success;
            errorMessage = error || 'Erro ao criar sala.';
        }

        if (successPath) {
            toast.success(editingRoom ? 'Sala atualizada com sucesso!' : 'Sala criada com sucesso!');
        } else {
            toast.error(errorMessage);
        }
    };
    const handleDeleteRoom = (id: string) => { setDeleteRoomId(id); };
    const confirmDeleteRoom = async () => {
        if (deleteRoomId) {
            const { success, error } = await deleteRoom(deleteRoomId);
            if (success) {
                toast.success('Sala removida com sucesso!');
            } else {
                toast.error(error || 'Erro ao remover sala.');
            }
            setDeleteRoomId(null);
        }
    };

    // ─── Permission handlers
    const handleEditPermission = (rp: RolePermission) => { setEditingRolePermission(rp); setPermDialogOpen(true); };
    const handleSavePermissions = (modules: Record<string, boolean>) => {
        if (editingRolePermission) {
            updateRolePermission(editingRolePermission.role, modules);
            toast.success('Permissões atualizadas!');
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Configurações</h1>
                <p className="text-muted-foreground mt-1">Gerencie usuários, permissões, salas e dados da sua igreja</p>
            </div>

            <Tabs defaultValue="usuarios">
                <TabsList className="flex-wrap h-auto gap-1">
                    <TabsTrigger value="usuarios">Usuários</TabsTrigger>
                    <TabsTrigger value="permissoes">Permissões</TabsTrigger>
                    <TabsTrigger value="salas">Salas</TabsTrigger>
                    <TabsTrigger value="igreja">Dados da Igreja</TabsTrigger>
                </TabsList>

                {/* ── USUÁRIOS ────────────────────────────────── */}
                <TabsContent value="usuarios" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{users.length} usuário(s) cadastrado(s)</p>
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={handleAddUser}>
                            <UserPlus className="h-4 w-4 mr-1" /> Adicionar Usuário
                        </Button>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-10"></TableHead>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>E-mail</TableHead>
                                        <TableHead>Perfil</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                                                Nenhum usuário cadastrado ainda.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {users.map(user => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {initials(user.name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell className="font-medium text-sm">{user.name}</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">{roleLabels[user.role] || user.role}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={async () => {
                                                        const newStatus = !user.is_active;
                                                        try {
                                                            await updateUser(user.id, { is_active: newStatus });
                                                            toast.success(`Usuário ${newStatus ? 'ativado' : 'desativado'} com sucesso.`);
                                                        } catch (error) {
                                                            // Error toast handled by AuthContext
                                                        }
                                                    }}
                                                    className="flex items-center gap-1.5"
                                                    title="Clique para alternar"
                                                >
                                                    {user.is_active
                                                        ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                                                        : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                                                    <span className={`text-xs font-medium ${user.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                                        {user.is_active ? 'Ativo' : 'Inativo'}
                                                    </span>
                                                </button>
                                            </TableCell>

                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditUser(user)} title="Editar">
                                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8"
                                                        disabled={user.id === session?.user.id}
                                                        onClick={() => handleDeleteUser(user.id)} title="Excluir">
                                                        <Trash2 className="h-4 w-4 text-destructive/70" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── PERMISSÕES ──────────────────────────────── */}
                <TabsContent value="permissoes" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">Configure os módulos acessíveis para cada perfil de usuário</p>
                    </div>
                    <div className="grid gap-4">
                        {rolePermissions.filter(rp => rp.role !== 'super_admin').map(rp => (
                            <Card key={rp.role}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                                <Shield className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">{rp.label}</CardTitle>
                                                <CardDescription className="text-xs">
                                                    {Object.values(rp.modules).filter(Boolean).length} de {Object.keys(rp.modules).length} módulos ativos
                                                </CardDescription>
                                            </div>
                                        </div>
                                        <Button size="sm" variant="outline" onClick={() => handleEditPermission(rp)}>
                                            <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(rp.modules).map(([key, allowed]) => (
                                            <Badge
                                                key={key}
                                                variant={allowed ? 'default' : 'outline'}
                                                className={`text-xs gap-1 ${allowed
                                                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                                                    : 'text-muted-foreground'}`}
                                            >
                                                {allowed ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                                                {moduloLabels[key]}
                                            </Badge>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* ── SALAS ───────────────────────────────────── */}
                <TabsContent value="salas" className="mt-4 space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">{rooms.length} sala(s) cadastrada(s)</p>
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={handleAddRoom}>
                            <Plus className="h-4 w-4 mr-1" /> Nova Sala
                        </Button>
                    </div>
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nome</TableHead>
                                        <TableHead>Faixa Etária</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Ações</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rooms.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                                                Nenhuma sala cadastrada. Crie sua primeira sala acima.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {rooms.map(room => (
                                        <TableRow key={room.id}>
                                            <TableCell className="font-medium text-sm">{room.name}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">{room.age_group}</Badge>
                                            </TableCell>
                                            <TableCell>
                                                <button
                                                    onClick={() => { updateRoom(room.id, { is_active: !room.is_active }); toast.success(`Sala ${room.is_active ? 'desativada' : 'ativada'}.`); }}
                                                    className="flex items-center gap-1.5"
                                                    title="Clique para alternar"
                                                >
                                                    {room.is_active
                                                        ? <ToggleRight className="h-5 w-5 text-emerald-500" />
                                                        : <ToggleLeft className="h-5 w-5 text-muted-foreground" />}
                                                    <span className={`text-xs font-medium ${room.is_active ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                                                        {room.is_active ? 'Ativa' : 'Inativa'}
                                                    </span>
                                                </button>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-1">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEditRoom(room)} title="Editar">
                                                        <Pencil className="h-4 w-4 text-muted-foreground" />
                                                    </Button>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteRoom(room.id)} title="Excluir">
                                                        <Trash2 className="h-4 w-4 text-destructive/70" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── DADOS DA IGREJA ─────────────────────────── */}
                <TabsContent value="igreja" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Church className="h-4 w-4" /> Dados da Igreja
                            </CardTitle>
                            <CardDescription>Informações principais visíveis para membros e relatórios.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ChurchDataForm />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ── Dialogs ──────────────────────────────────────── */}
            <UserDialog
                open={userDialogOpen}
                onOpenChange={setUserDialogOpen}
                user={editingUser}
                onSave={handleSaveUser}
            />

            <RoomDialog
                open={roomDialogOpen}
                onOpenChange={setRoomDialogOpen}
                room={editingRoom}
                onSave={handleSaveRoom}
            />

            {editingRolePermission && (
                <PermissionsDialog
                    open={permDialogOpen}
                    onOpenChange={setPermDialogOpen}
                    rp={editingRolePermission}
                    onSave={handleSavePermissions}
                />
            )}

            {/* Delete User Confirm */}
            <AlertDialog open={!!deleteUserId} onOpenChange={v => !v && setDeleteUserId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O usuário perderá acesso imediato ao sistema.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteUser} className="bg-destructive hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Delete Room Confirm */}
            <AlertDialog open={!!deleteRoomId} onOpenChange={v => !v && setDeleteRoomId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir Sala</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação removerá a sala permanentemente. Os registros de chamada associados serão mantidos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDeleteRoom} className="bg-destructive hover:bg-destructive/90">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
