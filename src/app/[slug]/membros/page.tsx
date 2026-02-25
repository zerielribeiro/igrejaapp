'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Search, Filter, UserPlus, FileDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

const PAGE_SIZE = 10;

const statusColors: Record<string, string> = {
    ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    inativo: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    visitante: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    transferido: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

export default function MembrosPage() {
    const params = useParams();
    const slug = params.slug as string;
    const { members, rooms } = useAuth();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [ageFilter, setAgeFilter] = useState('all');
    const [page, setPage] = useState(1);

    const filtered = useMemo(() => {
        return members.filter(m => {
            const matchSearch = m.full_name.toLowerCase().includes(search.toLowerCase()) || m.cpf.includes(search);
            const matchStatus = statusFilter === 'all' || m.status === statusFilter;
            const matchAge = ageFilter === 'all' || m.age_group === ageFilter;
            return matchSearch && matchStatus && matchAge;
        });
    }, [members, search, statusFilter, ageFilter]);

    const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
    const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Membros</h1>
                    <p className="text-muted-foreground mt-1">{filtered.length} membros encontrados</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast.info('Exportação em desenvolvimento')}>
                        <FileDown className="h-4 w-4 mr-1" /> Exportar
                    </Button>
                    <Link href={`/${slug}/membros/novo`}>
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            <UserPlus className="h-4 w-4 mr-1" /> Novo Membro
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Buscar por nome ou CPF..." className="pl-10" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                        </div>
                        <Select value={statusFilter} onValueChange={v => { setStatusFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todos os Status</SelectItem>
                                <SelectItem value="ativo">Ativo</SelectItem>
                                <SelectItem value="inativo">Inativo</SelectItem>
                                <SelectItem value="visitante">Visitante</SelectItem>
                                <SelectItem value="transferido">Transferido</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={ageFilter} onValueChange={v => { setAgeFilter(v); setPage(1); }}>
                            <SelectTrigger className="w-full sm:w-[160px]">
                                <SelectValue placeholder="Faixa Etária" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Idades</SelectItem>
                                <SelectItem value="Criança">Criança (0-12)</SelectItem>
                                <SelectItem value="Jovem">Jovem (13-17)</SelectItem>
                                <SelectItem value="Adulto">Adulto (18+)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]"></TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead className="hidden md:table-cell">Telefone</TableHead>
                                    <TableHead className="hidden lg:table-cell">Faixa Etária</TableHead>
                                    <TableHead className="hidden lg:table-cell">Sala</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {paginated.map((member) => {
                                    const room = rooms.find(r => r.id === member.room_id);
                                    return (
                                        <TableRow key={member.id} className="cursor-pointer hover:bg-muted/50 transition-colors">
                                            <TableCell>
                                                <Avatar className="h-9 w-9">
                                                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                                        {getInitials(member.full_name)}
                                                    </AvatarFallback>
                                                </Avatar>
                                            </TableCell>
                                            <TableCell>
                                                <Link href={`/${slug}/membros/${member.id}`} className="hover:underline">
                                                    <div>
                                                        <p className="font-medium text-sm">{member.full_name}</p>
                                                        <p className="text-xs text-muted-foreground">{member.email}</p>
                                                    </div>
                                                </Link>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell text-sm">{member.phone}</TableCell>
                                            <TableCell className="hidden lg:table-cell">
                                                <Badge variant="outline" className="text-xs">{member.age_group}</Badge>
                                            </TableCell>
                                            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">{room?.name || '—'}</TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[member.status]}`}>
                                                    {member.status}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </div>
                    {/* Pagination */}
                    <div className="flex items-center justify-between px-4 py-3 border-t">
                        <p className="text-sm text-muted-foreground">
                            Mostrando {(page - 1) * PAGE_SIZE + 1}-{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length}
                        </p>
                        <div className="flex gap-1">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => (
                                <Button key={i + 1} variant={page === i + 1 ? 'default' : 'outline'} size="icon" className="h-8 w-8 text-xs" onClick={() => setPage(i + 1)}>
                                    {i + 1}
                                </Button>
                            ))}
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
