'use client';

import { useState, useMemo } from 'react';
import { Check, X, UserPlus, Clock, Users, Save, MapPin, Phone, User } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import { useAuth } from '@/lib/auth-context';
import { mockAttendanceSessions } from '@/lib/mock-data';
import { toast } from 'sonner';

type AttendanceMap = Record<string, 'presente' | 'ausente' | null>;

interface VisitorFormData { name: string; address: string; phone: string; }
const emptyVisitor: VisitorFormData = { name: '', address: '', phone: '' };

export default function ChamadaPage() {
    const { rooms, visitors, addVisitor, members, attendanceSessions, addAttendanceSession } = useAuth();
    const activeRooms = rooms.filter(r => r.is_active);

    const [selectedRoom, setSelectedRoom] = useState(activeRooms[0]?.id ?? '');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [attendance, setAttendance] = useState<AttendanceMap>({});

    // Visitor modal state
    const [visitorModalOpen, setVisitorModalOpen] = useState(false);
    const [visitorForm, setVisitorForm] = useState<VisitorFormData>(emptyVisitor);
    const [savingVisitor, setSavingVisitor] = useState(false);

    const selectedRoomObj = activeRooms.find(r => r.id === selectedRoom);
    const selectedRoomName = selectedRoomObj?.name ?? '';

    const roomMembers = useMemo(
        () => members.filter(m => m.room_id === selectedRoom && m.status === 'ativo'),
        [selectedRoom, members]
    );

    // Visitors for this session (today + selected room)
    const sessionVisitors = useMemo(
        () => visitors.filter(v => v.room_id === selectedRoom && v.session_date === selectedDate),
        [visitors, selectedRoom, selectedDate]
    );

    const toggleAttendance = (memberId: string, status: 'presente' | 'ausente') => {
        setAttendance(prev => ({
            ...prev,
            [memberId]: prev[memberId] === status ? null : status,
        }));
    };

    const markedCount = Object.values(attendance).filter(Boolean).length;
    const presentCount = Object.values(attendance).filter(v => v === 'presente').length;
    const absentCount = Object.values(attendance).filter(v => v === 'ausente').length;

    const handleOpenVisitorModal = () => {
        setVisitorForm(emptyVisitor);
        setVisitorModalOpen(true);
    };

    const handleSaveVisitor = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!visitorForm.name.trim()) { toast.error('O nome é obrigatório.'); return; }
        setSavingVisitor(true);
        await new Promise(r => setTimeout(r, 300));
        addVisitor({
            name: visitorForm.name.trim(),
            address: visitorForm.address.trim(),
            phone: visitorForm.phone.trim(),
            room_id: selectedRoom,
            room_name: selectedRoomName,
            session_date: selectedDate,
        });
        toast.success(`Visitante "${visitorForm.name}" cadastrado com sucesso!`);
        setSavingVisitor(false);
        setVisitorModalOpen(false);
    };

    const finalize = () => {
        const presentIds = Object.entries(attendance)
            .filter(([_, status]) => status === 'presente')
            .map(([id]) => id);

        const absentIds = Object.entries(attendance)
            .filter(([_, status]) => status === 'ausente')
            .map(([id]) => id);

        addAttendanceSession({
            room_id: selectedRoom,
            room_name: selectedRoomName,
            session_date: selectedDate,
            present_member_ids: presentIds,
            absent_member_ids: absentIds,
            total_present: presentCount,
            total_absent: absentCount,
            finalized: true,
        });
        toast.success(`Chamada finalizada! ${presentCount} presentes, ${absentCount} ausentes, ${sessionVisitors.length} visitante(s).`);
    };

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Chamada de Presença</h1>
                <p className="text-muted-foreground mt-1">Registre a presença dos membros</p>
            </div>

            <Tabs defaultValue="registro">
                <TabsList>
                    <TabsTrigger value="registro">Novo Registro</TabsTrigger>
                    <TabsTrigger value="historico">Histórico</TabsTrigger>
                </TabsList>

                <TabsContent value="registro" className="space-y-4 mt-4">
                    {/* Selectors */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="flex flex-col sm:flex-row gap-3">
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Data</Label>
                                    <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} />
                                </div>
                                <div className="flex-1 space-y-1">
                                    <Label className="text-xs">Sala / Ministério</Label>
                                    <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                                        <SelectTrigger><SelectValue placeholder="Selecione uma sala" /></SelectTrigger>
                                        <SelectContent>
                                            {activeRooms.map(r => (
                                                <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-3">
                        <Card className="p-3 text-center">
                            <p className="text-2xl font-bold text-emerald-600">{presentCount}</p>
                            <p className="text-xs text-muted-foreground">Presentes</p>
                        </Card>
                        <Card className="p-3 text-center">
                            <p className="text-2xl font-bold text-red-500">{absentCount}</p>
                            <p className="text-xs text-muted-foreground">Ausentes</p>
                        </Card>
                        <Card className="p-3 text-center">
                            <p className="text-2xl font-bold text-blue-500">{sessionVisitors.length}</p>
                            <p className="text-xs text-muted-foreground">Visitantes</p>
                        </Card>
                    </div>

                    {/* Member List */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                {selectedRoomName}
                            </CardTitle>
                            <CardDescription>{roomMembers.length} membros • {markedCount} marcados</CardDescription>
                        </CardHeader>
                        <CardContent className="p-2 sm:p-4">
                            {roomMembers.length === 0 ? (
                                <p className="text-center text-sm text-muted-foreground py-4">
                                    Nenhum membro ativo nesta sala.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {roomMembers.map(member => (
                                        <div key={member.id} className="flex items-center gap-3 p-3 rounded-lg border transition-colors hover:bg-muted/30">
                                            <Avatar className="h-10 w-10 shrink-0">
                                                <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                    {getInitials(member.full_name)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium truncate">{member.full_name}</p>
                                                <p className="text-xs text-muted-foreground">{member.age_group}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant={attendance[member.id] === 'presente' ? 'default' : 'outline'}
                                                    className={`h-10 w-10 p-0 ${attendance[member.id] === 'presente' ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600' : ''}`}
                                                    onClick={() => toggleAttendance(member.id, 'presente')}
                                                >
                                                    <Check className="h-5 w-5" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant={attendance[member.id] === 'ausente' ? 'default' : 'outline'}
                                                    className={`h-10 w-10 p-0 ${attendance[member.id] === 'ausente' ? 'bg-red-600 hover:bg-red-700 text-white border-red-600' : ''}`}
                                                    onClick={() => toggleAttendance(member.id, 'ausente')}
                                                >
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Visitors */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base flex items-center gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Visitantes
                                    {sessionVisitors.length > 0 && (
                                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-xs ml-1">
                                            {sessionVisitors.length}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleOpenVisitorModal}
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                                >
                                    <UserPlus className="h-4 w-4 mr-1" />
                                    Registrar Visitante
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {sessionVisitors.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-3">
                                    Nenhum visitante registrado nesta sessão.
                                </p>
                            ) : (
                                <div className="space-y-2">
                                    {sessionVisitors.map(v => (
                                        <div key={v.id} className="flex items-start gap-3 p-3 rounded-lg border bg-blue-50/50 dark:bg-blue-950/20">
                                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-blue-600 shrink-0">
                                                <User className="h-4 w-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium">{v.name}</p>
                                                {v.address && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <MapPin className="h-3 w-3 shrink-0" /> {v.address}
                                                    </p>
                                                )}
                                                {v.phone && (
                                                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <Phone className="h-3 w-3 shrink-0" /> {v.phone}
                                                    </p>
                                                )}
                                            </div>
                                            <Badge variant="outline" className="text-xs shrink-0">{v.room_name}</Badge>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Finalize */}
                    <Button
                        onClick={finalize}
                        className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 h-12 text-base"
                        disabled={markedCount === 0}
                    >
                        <Save className="h-5 w-5 mr-2" />
                        Finalizar Chamada
                    </Button>
                </TabsContent>

                {/* History Tab */}
                <TabsContent value="historico" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Histórico de Chamadas
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Sala</TableHead>
                                        <TableHead className="text-center">Presentes</TableHead>
                                        <TableHead className="text-center">Ausentes</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {attendanceSessions.slice(0, 10).map(session => (
                                        <TableRow key={session.id}>
                                            <TableCell className="text-sm">{new Date(session.session_date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell className="text-sm">{session.room_name}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20">{session.total_present}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20">{session.total_absent}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Badge variant={session.finalized ? 'default' : 'secondary'} className="text-xs">
                                                    {session.finalized ? 'Finalizada' : 'Em andamento'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* ── Visitor Registration Modal ────────────────────────── */}
            <Dialog open={visitorModalOpen} onOpenChange={setVisitorModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                            Registrar Visitante
                        </DialogTitle>
                        <DialogDescription>
                            Cadastre os dados do visitante para a sessão de{' '}
                            <strong>{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR')}</strong>{' '}
                            em <strong>{selectedRoomName}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSaveVisitor} className="space-y-4 mt-2">
                        <div className="space-y-2">
                            <Label htmlFor="vis-name">
                                Nome <span className="text-destructive">*</span>
                            </Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="vis-name"
                                    className="pl-9"
                                    placeholder="Nome completo do visitante"
                                    value={visitorForm.name}
                                    onChange={e => setVisitorForm(p => ({ ...p, name: e.target.value }))}
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vis-address">Endereço</Label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="vis-address"
                                    className="pl-9"
                                    placeholder="Rua, número, bairro, cidade"
                                    value={visitorForm.address}
                                    onChange={e => setVisitorForm(p => ({ ...p, address: e.target.value }))}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="vis-phone">Telefone / WhatsApp</Label>
                            <div className="relative">
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="vis-phone"
                                    className="pl-9"
                                    placeholder="(00) 00000-0000"
                                    value={visitorForm.phone}
                                    onChange={e => setVisitorForm(p => ({ ...p, phone: e.target.value }))}
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setVisitorModalOpen(false)}>
                                Cancelar
                            </Button>
                            <Button
                                type="submit"
                                disabled={savingVisitor}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                {savingVisitor ? 'Salvando...' : 'Registrar Visitante'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
