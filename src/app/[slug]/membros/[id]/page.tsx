'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, MapPin, Calendar, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function MemberDetailPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;
    const memberId = params.id as string;
    const { members, rooms, removeMember } = useAuth();

    const member = members.find(m => m.id === memberId);

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

    const room = rooms.find(r => r.id === member.room_id);
    const initials = member.full_name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    const infoItems = [
        { icon: Phone, label: 'Telefone', value: member.phone },
        { icon: Mail, label: 'E-mail', value: member.email },
        { icon: MapPin, label: 'Endereço', value: member.address },
        { icon: Calendar, label: 'Nascimento', value: new Date(member.birth_date).toLocaleDateString('pt-BR') },
        { icon: Calendar, label: 'Data de Ingresso', value: new Date(member.join_date).toLocaleDateString('pt-BR') },
        { icon: Calendar, label: 'Batismo', value: member.baptism_date ? new Date(member.baptism_date).toLocaleDateString('pt-BR') : 'Não informado' },
    ];

    const handleDelete = () => {
        if (confirm('Tem certeza que deseja excluir este membro?')) {
            removeMember(member.id);
            toast.success('Membro excluído com sucesso');
            router.push(`/${slug}/membros`);
        }
    };

    return (
        <div className="space-y-6 max-w-3xl">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <Link href={`/${slug}/membros`}>
                        <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Detalhes do Membro</h1>
                </div>
                <div className="flex gap-2">
                    <Button variant="destructive" size="sm" onClick={handleDelete}>
                        <Trash2 className="h-4 w-4 mr-1" /> Excluir
                    </Button>
                    <Link href={`/${slug}/membros/${member.id}/editar`}>
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            <Edit className="h-4 w-4 mr-1" /> Editar
                        </Button>
                    </Link>
                </div>
            </div>

            <Card className="animate-fade-in">
                <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                        <Avatar className="h-20 w-20 shrink-0">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xl">{initials}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                            <div className="flex items-start justify-between flex-wrap gap-2">
                                <div>
                                    <h2 className="text-xl font-bold">{member.full_name}</h2>
                                    <p className="text-sm text-muted-foreground">CPF: {member.cpf}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline">{member.age_group}</Badge>
                                    <Badge className={member.status === 'ativo' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}>
                                        {member.status}
                                    </Badge>
                                </div>
                            </div>
                            <Separator className="my-4" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {infoItems.map(item => (
                                    <div key={item.label} className="flex items-start gap-3">
                                        <item.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                                        <div>
                                            <p className="text-xs text-muted-foreground">{item.label}</p>
                                            <p className="text-sm font-medium">{item.value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Separator className="my-4" />
                            <div className="flex items-center gap-2 text-sm">
                                <span className="text-muted-foreground">Sala:</span>
                                <Badge variant="secondary">{room?.name || 'Não atribuído'}</Badge>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
