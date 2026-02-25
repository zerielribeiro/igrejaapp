'use client';

import { useState, useMemo } from 'react';
import { FileDown, BarChart3, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { toast } from 'sonner';

const chartConfig = {
    present: { label: 'Presentes', color: '#C9A84C' },
    absent: { label: 'Ausentes', color: '#1A2C5B' },
} satisfies ChartConfig;

export default function RelatoriosPage() {
    const { members, attendanceSessions, rooms } = useAuth();
    const [period, setPeriod] = useState('6m');
    const [roomFilter, setRoomFilter] = useState('all');

    // ─── Filter Logic: Filtering Sessions ─────────────────────────
    const filteredSessions = useMemo(() => {
        let docs = [...attendanceSessions];

        // 1. Room Filter
        if (roomFilter !== 'all') {
            docs = docs.filter(s => s.room_id === roomFilter);
        }

        // 2. Period Filter
        const now = new Date();
        if (period === '1m') {
            const limit = new Date(now.setMonth(now.getMonth() - 1));
            docs = docs.filter(s => new Date(s.session_date) >= limit);
        } else if (period === '3m') {
            const limit = new Date(now.setMonth(now.getMonth() - 3));
            docs = docs.filter(s => new Date(s.session_date) >= limit);
        } else if (period === '6m') {
            const limit = new Date(now.setMonth(now.getMonth() - 6));
            docs = docs.filter(s => new Date(s.session_date) >= limit);
        } else if (period === '12m') {
            const limit = new Date(now.setFullYear(now.getFullYear() - 1));
            docs = docs.filter(s => new Date(s.session_date) >= limit);
        }

        return docs;
    }, [attendanceSessions, roomFilter, period]);

    // ─── Data Derivation: Monthly Evolution ────────────────────────
    const attendanceEvolution = useMemo(() => {
        const sortedSessions = [...filteredSessions].sort((a, b) =>
            new Date(a.session_date).getTime() - new Date(b.session_date).getTime()
        );

        const monthlyData: Record<string, { month: string, present: number, absent: number }> = {};

        sortedSessions.forEach(session => {
            const date = new Date(session.session_date);
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthLabel = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');

            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthLabel, present: 0, absent: 0 };
            }

            const presentCount = session.present_member_ids.length;
            const absentCount = session.absent_member_ids.length;

            monthlyData[monthKey].present += presentCount;
            monthlyData[monthKey].absent += absentCount;
        });

        return Object.values(monthlyData);
    }, [filteredSessions]);

    // ─── Data Derivation: Room Comparison ──────────────────────────
    const roomComparison = useMemo(() => {
        const roomStats: Record<string, { room: string, present: number, absent: number }> = {};

        filteredSessions.forEach(session => {
            const roomName = session.room_name || 'Sem Sala';
            if (!roomStats[roomName]) {
                roomStats[roomName] = { room: roomName, present: 0, absent: 0 };
            }
            roomStats[roomName].present += session.total_present;
            roomStats[roomName].absent += session.total_absent;
        });

        return Object.values(roomStats);
    }, [filteredSessions]);

    // ─── Data Derivation: Individual Frequency ────────────────────
    const memberRanking = useMemo(() => {
        return members.map(member => {
            let presentCount = 0;
            let totalPossible = 0;

            filteredSessions.forEach(session => {
                if (session.present_member_ids.includes(member.id)) {
                    presentCount++;
                    totalPossible++;
                } else if (session.absent_member_ids.includes(member.id)) {
                    totalPossible++;
                }
            });

            const frequency = totalPossible > 0 ? Math.round((presentCount / totalPossible) * 100) : 0;
            return {
                id: member.id,
                name: member.full_name,
                present: presentCount,
                absent: totalPossible - presentCount,
                frequency,
                total: totalPossible
            };
        }).sort((a, b) => b.frequency - a.frequency)
            .slice(0, 10);
    }, [members, filteredSessions]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Relatórios</h1>
                    <p className="text-muted-foreground mt-1">Análises detalhadas e exportação de dados</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => toast.info('Exportação PDF em desenvolvimento')}>
                        <FileDown className="h-4 w-4 mr-1" /> PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast.info('Exportação Excel em desenvolvimento')}>
                        <FileDown className="h-4 w-4 mr-1" /> Excel
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <Select value={period} onValueChange={setPeriod}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Período" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="1m">Último mês</SelectItem>
                                <SelectItem value="3m">Últimos 3 meses</SelectItem>
                                <SelectItem value="6m">Últimos 6 meses</SelectItem>
                                <SelectItem value="12m">Último ano</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={roomFilter} onValueChange={setRoomFilter}>
                            <SelectTrigger className="w-full sm:w-[180px]">
                                <SelectValue placeholder="Sala" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Todas as Salas</SelectItem>
                                {rooms.filter(r => r.is_active).map(r => (
                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Evolução de Presença</CardTitle>
                        <CardDescription>Tendência mensal de presenças</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            {attendanceEvolution.length > 0 ? (
                                <ChartContainer config={chartConfig}>
                                    <LineChart data={attendanceEvolution}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Line type="monotone" dataKey="present" stroke="#C9A84C" strokeWidth={2.5} name="Presentes" />
                                        <Line type="monotone" dataKey="absent" stroke="#1A2C5B" strokeWidth={2.5} name="Ausentes" />
                                    </LineChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                    Nenhum dado de chamada registrado
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Comparação por Sala</CardTitle>
                        <CardDescription>Frequência média por sala</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            {roomComparison.length > 0 ? (
                                <ChartContainer config={chartConfig}>
                                    <BarChart data={roomComparison}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                        <XAxis dataKey="room" tickLine={false} axisLine={false} tickMargin={8} />
                                        <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                        <ChartTooltip content={<ChartTooltipContent />} />
                                        <Bar dataKey="present" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Presentes" />
                                        <Bar dataKey="absent" fill="#1A2C5B" radius={[4, 4, 0, 0]} name="Ausentes" />
                                    </BarChart>
                                </ChartContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm italic">
                                    Nenhum dado de chamada registrado
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Members frequency table */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Frequência Individual</CardTitle>
                    <CardDescription>Ranking de presença dos membros</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Membro</TableHead>
                                <TableHead className="text-center">Presenças</TableHead>
                                <TableHead className="text-center">Faltas</TableHead>
                                <TableHead className="text-center">Frequência</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {memberRanking.length > 0 ? (
                                memberRanking.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="text-sm font-medium">{member.name}</TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20">{member.present}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge variant="outline" className="bg-red-50 text-red-700 dark:bg-red-900/20">{member.absent}</Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <div className="w-16 h-2 rounded-full bg-muted overflow-hidden">
                                                    <div className="h-full rounded-full bg-secondary" style={{ width: `${member.frequency}%` }} />
                                                </div>
                                                <span className="text-xs text-muted-foreground">{member.frequency}%</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                                        Nenhum registro de frequência encontrado
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
