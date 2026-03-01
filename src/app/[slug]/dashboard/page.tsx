'use client';

import { useState, useMemo } from 'react';
import { Users, ClipboardCheck, DollarSign, TrendingUp, AlertTriangle, Cake, ArrowUpRight, ArrowDownRight, UserCheck, MapPin, Phone, Clock as ClockIcon, ChevronRight, Wallet } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useAuth } from '@/lib/auth-context';
import { formatCurrency } from '@/lib/validators';

const COLORS = ['#1A2C5B', '#C9A84C', '#3B82F6', '#8B5CF6', '#EC4899'];

const chartConfig = {
    present: { label: 'Presentes', color: '#C9A84C' },
    absent: { label: 'Ausentes', color: '#1A2C5B' },
    value: { label: 'Valor' },
} satisfies ChartConfig;

export default function DashboardPage() {
    const { session, visitors, hasRole, members, transactions, attendanceSessions } = useAuth();
    const [visitorListOpen, setVisitorListOpen] = useState(false);

    const today = new Date().toISOString().split('T')[0];
    const todayVisitors = visitors.filter(v => v.session_date === today);

    const isAdminOrPastor = hasRole('admin', 'pastor');

    const activeMembers = members.filter(m => m.status === 'ativo').length;
    const totalMembers = members.length;

    // Compute financial summary from transactions
    const summary = useMemo(() => {
        const total_income = transactions.filter(t => t.type === 'entrada').reduce((sum, t) => sum + Number(t.amount), 0);
        const total_expense = transactions.filter(t => t.type === 'saida').reduce((sum, t) => sum + Number(t.amount), 0);
        return { total_income, total_expense, balance: total_income - total_expense };
    }, [transactions]);

    // Compute attendance data from sessions
    const lastSession = attendanceSessions.length > 0 ? attendanceSessions[0] : null;
    const lastPresent = lastSession?.total_present ?? 0;
    const lastAbsent = lastSession?.total_absent ?? 0;
    const lastTotal = lastPresent + lastAbsent;
    const lastPercentage = lastTotal > 0 ? Math.round((lastPresent / lastTotal) * 100) : 0;

    const pieData = [
        { name: 'Presentes', value: lastPresent, fill: '#C9A84C' },
        { name: 'Ausentes', value: lastAbsent, fill: '#1A2C5B' },
    ];

    // Build monthly attendance chart data from sessions
    const monthlyAttendance = useMemo(() => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const grouped: Record<string, { present: number; absent: number }> = {};

        // Ensure at least early months are represented or just the months with data
        attendanceSessions.forEach(s => {
            const d = new Date(s.session_date);
            const key = months[d.getMonth()];
            if (!grouped[key]) grouped[key] = { present: 0, absent: 0 };
            grouped[key].present += s.total_present;
            grouped[key].absent += s.total_absent;
        });

        const data = Object.entries(grouped).map(([month, data]) => ({ month, ...data }));
        return data.length > 0 ? data : months.slice(0, 6).map(m => ({ month: m, present: 0, absent: 0 }));
    }, [attendanceSessions]);

    // Build room attendance chart data
    const roomAttendance = useMemo(() => {
        const grouped: Record<string, { present: number; absent: number }> = {};
        attendanceSessions.forEach(s => {
            const room = s.room_name || 'Sem sala';
            if (!grouped[room]) grouped[room] = { present: 0, absent: 0 };
            grouped[room].present += s.total_present;
            grouped[room].absent += s.total_absent;
        });
        return Object.entries(grouped).map(([room, data]) => ({ room, ...data }));
    }, [attendanceSessions]);

    // Birthdays this month
    const birthdays = useMemo(() => {
        const currentMonth = new Date().getMonth();
        return members
            .filter(m => {
                if (!m.birth_date) return false;
                return new Date(m.birth_date).getMonth() === currentMonth;
            })
            .slice(0, 5);
    }, [members]);

    const stats = [
        { title: 'Total de Membros', value: totalMembers, subtitle: `${activeMembers} ativos`, icon: Users, trend: '', up: true, color: 'text-blue-500' },
        { title: 'Presença Último Culto', value: `${lastPercentage}%`, subtitle: `${lastPresent} de ${lastTotal}`, icon: ClipboardCheck, trend: '', up: true, color: 'text-emerald-500' },
        {
            title: 'Entradas (Mês)',
            value: `R$ ${formatCurrency(summary.total_income)}`,
            subtitle: 'Receitas totais do mês',
            icon: ArrowUpRight,
            color: 'text-emerald-500',
        },
        {
            title: 'Saídas (Mês)',
            value: `R$ ${formatCurrency(summary.total_expense)}`,
            subtitle: 'Despesas totais do mês',
            icon: ArrowDownRight,
            color: 'text-red-500',
        },
        {
            title: 'Saldo Atual',
            value: `R$ ${formatCurrency(summary.balance)}`,
            subtitle: 'Recurso disponível em caixa',
            icon: Wallet,
            color: summary.balance >= 0 ? 'text-blue-500' : 'text-red-600',
        },
    ];

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Dashboard</h1>
                <p className="text-muted-foreground mt-1">Visão geral da sua igreja</p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <Card key={stat.title} className={`animate-fade-in stagger-${i + 1} hover:shadow-lg transition-all duration-300`}>
                        <CardContent className="p-5">
                            <div className="flex items-start justify-between">
                                <div>
                                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                                    <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                                </div>
                                <div className={`p-2.5 rounded-xl bg-muted ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                            {stat.trend && (
                                <div className={`flex items-center gap-1 mt-3 text-xs ${stat.up ? 'text-emerald-600' : 'text-red-500'}`}>
                                    {stat.up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                    {stat.trend} vs mês anterior
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Today Visitors Card — admin/pastor only */}
            {isAdminOrPastor && (
                <button
                    onClick={() => setVisitorListOpen(true)}
                    className="w-full text-left group"
                    aria-label="Ver visitantes do dia"
                >
                    <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-blue-50/40 dark:from-blue-950/30 dark:to-blue-950/10 hover:shadow-md transition-all duration-200 group-hover:border-blue-300">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/40">
                                        <UserCheck className="h-6 w-6 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground">Visitantes Hoje</p>
                                        <p className="text-3xl font-bold text-blue-700">{todayVisitors.length}</p>
                                        {todayVisitors.length > 0 && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                Em {[...new Set(todayVisitors.map(v => v.room_name))].join(', ')}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 text-blue-600">
                                    <span className="text-xs font-medium hidden sm:block">
                                        {todayVisitors.length === 0 ? 'Nenhum visitante hoje' : 'Ver detalhes'}
                                    </span>
                                    <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </button>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Line Chart - Attendance over months */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="text-base">Presença por Mês</CardTitle>
                        <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[320px]">
                        <div className="h-[280px] w-full">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <LineChart data={monthlyAttendance} margin={{ left: 12, right: 12 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Line type="monotone" dataKey="present" stroke="#C9A84C" strokeWidth={2.5} dot={{ fill: '#C9A84C', r: 4 }} name="Presentes" />
                                    <Line type="monotone" dataKey="absent" stroke="#1A2C5B" strokeWidth={2.5} dot={{ fill: '#1A2C5B', r: 4 }} name="Ausentes" />
                                </LineChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Bar Chart - Room comparison */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="text-base">Presença por Sala</CardTitle>
                        <CardDescription>Último culto</CardDescription>
                    </CardHeader>
                    <CardContent className="min-h-[320px]">
                        <div className="h-[280px] w-full">
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <BarChart data={roomAttendance} margin={{ left: 12, right: 12 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="room" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="present" fill="#C9A84C" radius={[4, 4, 0, 0]} name="Presentes" />
                                    <Bar dataKey="absent" fill="#1A2C5B" radius={[4, 4, 0, 0]} name="Ausentes" />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pie Chart */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="text-base">Proporção de Presença</CardTitle>
                        <CardDescription>Último culto geral</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[220px] flex items-center justify-center">
                            <ChartContainer config={chartConfig}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Absent Alerts */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            Alertas de Faltas
                        </CardTitle>
                        <CardDescription>3+ faltas consecutivas</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma falta consecutiva registrada.</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Birthdays */}
                <Card className="animate-fade-in">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Cake className="h-4 w-4 text-pink-500" />
                            Aniversariantes do Mês
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {birthdays.length > 0 ? birthdays.map((member) => (
                                <div key={member.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                    <div>
                                        <p className="text-sm font-medium">{member.full_name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {member.birth_date ? new Date(member.birth_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' }) : ''}
                                        </p>
                                    </div>
                                    <span className="text-lg">🎂</span>
                                </div>
                            )) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Nenhum aniversariante este mês</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Visitor List Dialog */}
            {isAdminOrPastor && (
                <Dialog open={visitorListOpen} onOpenChange={setVisitorListOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <UserCheck className="h-5 w-5 text-blue-600" />
                                Visitantes de Hoje
                            </DialogTitle>
                            <DialogDescription>
                                {today ? new Date(today + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' }) : ''}
                                {' · '}{todayVisitors.length} visitante(s) registrado(s)
                            </DialogDescription>
                        </DialogHeader>
                        <div className="mt-2 max-h-[60vh] overflow-y-auto space-y-3 pr-1">
                            {todayVisitors.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="flex justify-center mb-3">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-muted">
                                            <UserCheck className="h-7 w-7 text-muted-foreground" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-medium">Nenhum visitante hoje</p>
                                    <p className="text-xs text-muted-foreground mt-1">Os visitantes cadastrados na chamada aparecerão aqui.</p>
                                </div>
                            ) : (
                                todayVisitors.map(v => (
                                    <div key={v.id} className="flex items-start gap-3 p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors">
                                        <Avatar className="h-10 w-10 shrink-0">
                                            <AvatarFallback className="bg-blue-100 text-blue-700 text-sm font-semibold">
                                                {v.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="text-sm font-semibold">{v.name}</p>
                                                <Badge variant="outline" className="text-xs shrink-0 bg-blue-50 text-blue-700 border-blue-200">
                                                    {v.room_name}
                                                </Badge>
                                            </div>
                                            {v.address && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                    <MapPin className="h-3 w-3 shrink-0" /> {v.address}
                                                </p>
                                            )}
                                            {v.phone && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <Phone className="h-3 w-3 shrink-0" /> {v.phone}
                                                </p>
                                            )}
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                                <ClockIcon className="h-3 w-3 shrink-0" />
                                                {new Date(v.registered_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}
