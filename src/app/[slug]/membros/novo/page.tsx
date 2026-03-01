'use client';

import { useState, useMemo } from 'react';
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
import { formatCPF, isValidCPF, formatPhone, calculateAgeGroup, isReasonableDate, normalizeName } from '@/lib/validators';

export default function NovoMembroPage() {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();
    const { rooms, addMember } = useAuth();

    // Form states
    const [name, setName] = useState('');
    const [cpf, setCpf] = useState('');
    const [birth, setBirth] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [address, setAddress] = useState('');
    const [baptism, setBaptism] = useState('');
    const [join, setJoin] = useState(new Date().toISOString().split('T')[0]);
    const [roomId, setRoomId] = useState('unassigned');
    const [status, setStatus] = useState<'ativo' | 'inativo' | 'visitante' | 'transferido'>('ativo');

    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auto-calculate age group from birth date
    const ageGroup = useMemo(() => {
        if (!birth) return 'Adulto';
        return calculateAgeGroup(birth);
    }, [birth]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !birth || !join) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }

        // Validate CPF if provided
        if (cpf && !isValidCPF(cpf)) {
            toast.error('CPF inválido. Verifique os dígitos.');
            return;
        }

        // Validate birth date is reasonable
        if (!isReasonableDate(birth)) {
            toast.error('Data de nascimento inválida. Deve ser entre 1900 e hoje.');
            return;
        }

        // Validate baptism date
        if (baptism) {
            if (!isReasonableDate(baptism)) {
                toast.error('Data de batismo inválida.');
                return;
            }
            if (new Date(baptism) < new Date(birth)) {
                toast.error('Data de batismo não pode ser anterior à data de nascimento.');
                return;
            }
        }

        // Validate join date
        if (new Date(join) < new Date(birth)) {
            toast.error('Data de ingresso não pode ser anterior à data de nascimento.');
            return;
        }

        setIsSubmitting(true);

        const payload = {
            full_name: normalizeName(name),
            cpf: cpf ? cpf.replace(/\D/g, '') : '',
            birth_date: birth,
            phone: phone.replace(/\D/g, ''),
            email: email.trim().toLowerCase(),
            address: address.trim(),
            baptism_date: baptism || undefined,
            join_date: join,
            room_id: roomId === 'unassigned' ? null : roomId,
            status,
            age_group: ageGroup,
        };

        const { success, error } = await addMember(payload as any);

        setIsSubmitting(false);

        if (success) {
            toast.success('Membro cadastrado com sucesso!');
            router.push(`/${slug}/membros`);
        } else {
            toast.error(error || 'Erro ao cadastrar membro.');
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center gap-3">
                <Link href={`/${slug}/membros`}>
                    <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                </Link>
                <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Novo Membro</h1>
            </div>

            <Card className="animate-fade-in">
                <CardContent className="p-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="sm:col-span-2 space-y-2">
                                <Label htmlFor="name">Nome Completo *</Label>
                                <Input id="name" placeholder="Nome completo do membro" required value={name} onChange={e => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="cpf">CPF</Label>
                                <Input id="cpf" placeholder="000.000.000-00" value={cpf} onChange={e => setCpf(formatCPF(e.target.value))} maxLength={14} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="birth">Data de Nascimento *</Label>
                                <Input id="birth" type="date" required value={birth} onChange={e => setBirth(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="phone">Telefone</Label>
                                <Input id="phone" placeholder="(00) 00000-0000" value={phone} onChange={e => setPhone(formatPhone(e.target.value))} maxLength={15} />
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
                                <Input id="baptism" type="date" value={baptism} onChange={e => setBaptism(e.target.value)} max={new Date().toISOString().split('T')[0]} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="join">Data de Ingresso *</Label>
                                <Input id="join" type="date" required value={join} onChange={e => setJoin(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Faixa Etária</Label>
                                <Input value={ageGroup} disabled className="bg-muted" />
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
                            <Link href={`/${slug}/membros`}>
                                <Button type="button" variant="outline">Cancelar</Button>
                            </Link>
                            <Button type="submit" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" disabled={isSubmitting}>
                                <Save className="h-4 w-4 mr-1" /> {isSubmitting ? 'Salvando...' : 'Salvar Membro'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
