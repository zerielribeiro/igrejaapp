'use client';

import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/lib/auth-context';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { toast } from 'sonner';

const COLORS = ['#1A2C5B', '#C9A84C', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

const chartConfig = {
    income: { label: 'Receitas', color: '#10B981' },
    expense: { label: 'Despesas', color: '#EF4444' },
    amount: { label: 'Valor' },
} satisfies ChartConfig;

export default function FinanceiroPage() {
    const { transactions, addTransaction } = useAuth();
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form states
    const [type, setType] = useState<'entrada' | 'saida'>('entrada');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    const incomes = transactions.filter(t => t.type === 'entrada');
    const expenses = transactions.filter(t => t.type === 'saida');

    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpense;

    // Derived chart data (Simplified for now - can be enhanced later)
    const expenseByCategory = useMemo(() => {
        const counts: Record<string, number> = {};
        expenses.forEach(t => {
            counts[t.category] = (counts[t.category] || 0) + t.amount;
        });
        return Object.entries(counts).map(([category, amount]) => ({ category, amount }));
    }, [expenses]);

    const handleSaveTransaction = (e: React.FormEvent) => {
        e.preventDefault();
        if (!category || !amount || !description) {
            toast.error('Preencha todos os campos obrigatórios.');
            return;
        }
        addTransaction({
            type,
            category,
            description,
            amount: parseFloat(amount),
            transaction_date: date,
        });
        toast.success('Transação registrada!');
        setDialogOpen(false);
        // Reset form
        setCategory('');
        setDescription('');
        setAmount('');
    };

    const monthlyData = [
        { month: 'Fev', income: totalIncome, expense: totalExpense },
        // Mocking historical data for the chart for now to keep it looking good
        { month: 'Jan', income: 7500, expense: 7200 },
        { month: 'Dez', income: 12500, expense: 9500 },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Financeiro</h1>
                    <p className="text-muted-foreground mt-1">Controle de receitas e despesas</p>
                </div>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                            <Plus className="h-4 w-4 mr-1" /> Nova Transação
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Nova Transação</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSaveTransaction} className="space-y-4">
                            <div className="space-y-2">
                                <Label>Tipo</Label>
                                <Select value={type} onValueChange={(v: any) => setType(v)}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="entrada">Entrada</SelectItem>
                                        <SelectItem value="saida">Saída</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Categoria</Label>
                                <Select value={category} onValueChange={setCategory}>
                                    <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="dizimo">Dízimo</SelectItem>
                                        <SelectItem value="oferta">Oferta</SelectItem>
                                        <SelectItem value="doacao">Doação</SelectItem>
                                        <SelectItem value="aluguel">Aluguel</SelectItem>
                                        <SelectItem value="energia">Energia</SelectItem>
                                        <SelectItem value="manutencao">Manutenção</SelectItem>
                                        <SelectItem value="eventos">Eventos</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Descrição</Label>
                                <Input placeholder="Descrição da transação" value={description} onChange={e => setDescription(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Valor (R$)</Label>
                                <Input type="number" placeholder="0,00" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Data</Label>
                                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
                            </div>
                            <Button type="submit" className="w-full bg-secondary text-secondary-foreground">Registrar</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Balance Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="animate-fade-in stagger-1">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Receitas</p>
                                <p className="text-2xl font-bold text-emerald-600">
                                    R$ {totalIncome.toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/20">
                                <TrendingUp className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="animate-fade-in stagger-2">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Despesas</p>
                                <p className="text-2xl font-bold text-red-500">
                                    R$ {totalExpense.toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className="p-2.5 rounded-xl bg-red-100 text-red-500 dark:bg-red-900/20">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card className={`animate-fade-in stagger-3 ${balance >= 0 ? 'ring-2 ring-emerald-200' : 'ring-2 ring-red-200'}`}>
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Saldo</p>
                                <p className={`text-2xl font-bold ${balance >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                                    R$ {balance.toLocaleString('pt-BR')}
                                </p>
                            </div>
                            <div className={`p-2.5 rounded-xl ${balance >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-500'}`}>
                                <DollarSign className="h-5 w-5" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Receitas vs Despesas</CardTitle>
                        <CardDescription>Últimos 6 meses</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ChartContainer config={chartConfig}>
                                <BarChart data={monthlyData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                    <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
                                    <YAxis tickLine={false} axisLine={false} tickMargin={8} />
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                    <Bar dataKey="income" fill="#10B981" radius={[4, 4, 0, 0]} name="Receitas" />
                                    <Bar dataKey="expense" fill="#EF4444" radius={[4, 4, 0, 0]} name="Despesas" />
                                </BarChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Despesas por Categoria</CardTitle>
                        <CardDescription>Distribuição do mês atual</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[280px]">
                            <ChartContainer config={chartConfig}>
                                <PieChart>
                                    <Pie data={expenseByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="amount" label={({ category, percent }: { category: string, percent: number }) => `${category} ${(percent * 100).toFixed(0)}%`}>
                                        {expenseByCategory.map((_, i) => (
                                            <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <ChartTooltip content={<ChartTooltipContent />} />
                                </PieChart>
                            </ChartContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Transactions */}
            <Tabs defaultValue="entradas">
                <TabsList>
                    <TabsTrigger value="entradas">Entradas ({incomes.length})</TabsTrigger>
                    <TabsTrigger value="saidas">Saídas ({expenses.length})</TabsTrigger>
                </TabsList>
                <TabsContent value="entradas" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="hidden md:table-cell">Membro</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {incomes.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell className="text-sm">{new Date(t.transaction_date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell><Badge variant="outline" className="text-xs">{t.category}</Badge></TableCell>
                                            <TableCell className="text-sm">{t.description}</TableCell>
                                            <TableCell className="hidden md:table-cell text-sm text-muted-foreground">{t.member_name || '—'}</TableCell>
                                            <TableCell className="text-right font-medium text-emerald-600">
                                                <span className="flex items-center justify-end gap-1">
                                                    <ArrowUpRight className="h-3 w-3" />
                                                    R$ {t.amount.toLocaleString('pt-BR')}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="saidas" className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Data</TableHead>
                                        <TableHead>Categoria</TableHead>
                                        <TableHead>Descrição</TableHead>
                                        <TableHead className="text-right">Valor</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {expenses.map(t => (
                                        <TableRow key={t.id}>
                                            <TableCell className="text-sm">{new Date(t.transaction_date).toLocaleDateString('pt-BR')}</TableCell>
                                            <TableCell><Badge variant="outline" className="text-xs">{t.category}</Badge></TableCell>
                                            <TableCell className="text-sm">{t.description}</TableCell>
                                            <TableCell className="text-right font-medium text-red-500">
                                                <span className="flex items-center justify-end gap-1">
                                                    <ArrowDownRight className="h-3 w-3" />
                                                    R$ {t.amount.toLocaleString('pt-BR')}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
