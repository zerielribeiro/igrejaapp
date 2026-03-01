'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { formatCPF, formatPhone, normalizeName, calculateAgeGroup } from '@/lib/validators';

export default function EditarMembroPage() {
    const params = useParams();
    const slug = params.slug as string;
    const memberId = params.id as string;
    const router = useRouter();
    const { rooms, members, updateMember } = useAuth();

    const member = members.find(m => m.id === memberId);

    // Form states
    const [name, setName] = useState(member?.full_name || '');
    const [cpf, setCpf] = useState(member?.cpf || '');
    const [birth, setBirth] = useState(member?.birth_date || '');
    const [phone, setPhone] = useState(member?.phone || '');
    const [email, setEmail] = useState(member?.email || '');
    const [address, setAddress] = useState(member?.address || '');
    const [baptism, setBaptism] = useState(member?.baptism_date || '');
    const [join, setJoin] = useState(member?.join_date || '');
    const [roomId, setRoomId] = useState(member?.room_id || 'unassigned');
    const [status, setStatus] = useState<'ativo' | 'inativo' | 'visitante' | 'transferido'>(
        (member?.status as any) || 'ativo'
    );


    // Populate form when member data is available
    useEffect(() => {
        if (member) {
            setName(member.full_name || '');
            setCpf(member.cpf || '');
            setBirth(member.birth_date || '');
            setPhone(member.phone || '');
            setEmail(member.email || '');
            setAddress(member.address || '');
            setBaptism(member.baptism_date || '');
            setJoin(member.join_date || '');
            setRoomId(member.room_id || 'unassigned');
            setStatus(member.status || 'ativo');
        }
    }, [member]);

    if (!member) {
        return (
            <div className="text-center py-20">
                <p className="text-muted-foreground">Membro não encontrado.</p>
                <Link href={`/${slug}/membros`}>
                    <Button variant="outline" className="mt-4">Voltar</Button>
                </Link>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !birth || !join || !roomId) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }

        const ageGroup = calculateAgeGroup(birth);

        updateMember(memberId, {
            full_name: normalizeName(name),
            cpf: cpf ? cpf.replace(/\D/g, '') : '',
            birth_date: birth,
            phone: phone.replace(/\D/g, ''),
            email: email.trim().toLowerCase(),
            address: address.trim(),
            baptism_date: baptism || undefined,
            join_date: join,
            room_id: roomId,
            status,
            age_group: ageGroup,
        });

        toast.success('Membro atualizado com sucesso!');
        router.push(`/${slug}/membros/${memberId}`);
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href={`/${slug}/membros/${memberId}`}>
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Editar Membro</h1>
            </div>

            <Card className="animate-fade-in">
                <CardContent className="p-6">
                    {/* Key property forces re-render if the member data loads after initial mount */}
                    <form onSubmit={handleSubmit} className="space-y-6" key={member.id}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 space-y-2">
                                <Label htmlFor="name">Nome Completo *</Label>
                                <Input id="name" placeholder="Nome completo do membro" required value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input id="cpf" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birth">Data de Nascimento *</Label>
                                <Input id="birth" type="date" required value={birth} onChange={e => setBirth(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input id="phone" placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" placeholder="email@exemplo.com" value={email} onChange={e => setEmail(e.target.value)} />
                            </div>
                            <div className="sm:col-span-2 space-y-2">
                                <Label htmlFor="address">Endereço</Label>
                                <Input id="address" placeholder="Rua, número, bairro, cidade" value={address} onChange={e => setAddress(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="baptism">Data de Batismo</Label>
                                <Input id="baptism" type="date" value={baptism} onChange={e => setBaptism(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="join">Data de Ingresso *</Label>
                                <Input id="join" type="date" required value={join} onChange={e => setJoin(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Sala *</Label>
                                <Select value={roomId} onValueChange={setRoomId}>
                                    <SelectTrigger><SelectValue placeholder="Selecione uma sala" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="unassigned">Sem sala / Não atribuída</SelectItem>
                                        {rooms.filter(r => r.is_active).map(r => (
                                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ativo">Ativo</SelectItem>
                                        <SelectItem value="inativo">Inativo</SelectItem>
                                        <SelectItem value="visitante">Visitante</SelectItem>
                                        <SelectItem value="transferido">Transferido</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <Link href={`/${slug}/membros/${memberId}`}>
                                <Button type="button" variant="outline">Cancelar</Button>
                            </Link>
                            <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                                <Save className="h-4 w-4 mr-1" /> Salvar Alterações
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
