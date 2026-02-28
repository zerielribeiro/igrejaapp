'use client';

import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Plus, ArrowUpRight, ArrowDownRight, Settings, Trash2, Edit2, Check, X } from 'lucide-react';
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
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const COLORS = ['#1A2C5B', '#C9A84C', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F59E0B'];

const chartConfig = {
    income: { label: 'Receitas', color: '#10B981' },
    expense: { label: 'Despesas', color: '#EF4444' },
    amount: { label: 'Valor' },
} satisfies ChartConfig;

export default function FinanceiroPage() {
    const { transactions, addTransaction, categories, addCategory, updateCategory, deleteCategory } = useAuth();
    const [dialogOpen, setDialogOpen] = useState(false);
    const [manageDialogOpen, setManageDialogOpen] = useState(false);

    // Category management states
    const [newCatNames, setNewCatNames] = useState({ entrada: '', saida: '' });
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [editingCatName, setEditingCatName] = useState('');

    // Form states
    const [type, setType] = useState<'entrada' | 'saida'>('entrada');
    const [category, setCategory] = useState('');
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    // Deletion states
    const [catToDelete, setCatToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const filteredCategories = useMemo(() =>
        categories.filter(c => c.type === type)
        , [categories, type]);

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

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            toast.error('O valor deve ser maior que zero.');
            return;
        }

        // Find the category name from id if it was selected from list
        // Actually, our category state holds the name currently in UI but we should use IDs or names.
        // Looking at database schema, category is a text field. So we use names.

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

    const handleAddCategory = async (typeToAdd: 'entrada' | 'saida') => {
        const name = newCatNames[typeToAdd];
        if (!name.trim()) return;
        await addCategory({
            name: name.trim(),
            type: typeToAdd
        });
        setNewCatNames(prev => ({ ...prev, [typeToAdd]: '' }));
    };

    const handleUpdateCategory = async (id: string) => {
        if (!editingCatName.trim()) return;
        try {
            await updateCategory(id, editingCatName.trim());
            setEditingCatId(null);
        } catch (err) {
            console.error('Frontend error updating cat:', err);
        }
    };

    const confirmDeleteCategory = async () => {
        if (!catToDelete) return;
        setIsDeleting(true);
        try {
            console.log('Disparando exclusão da categoria:', catToDelete);
            await deleteCategory(catToDelete);
            console.log('Exclusão concluída no frontend');
        } catch (err) {
            console.error('Erro ao chamar deleteCategory:', err);
        } finally {
            setIsDeleting(false);
            setCatToDelete(null);
        }
    };

    // Build real monthly data from transactions
    const monthlyData = useMemo(() => {
        const months: Record<string, { income: number; expense: number }> = {};
        transactions.forEach(t => {
            const d = new Date(t.transaction_date);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (!months[key]) months[key] = { income: 0, expense: 0 };
            if (t.type === 'entrada') months[key].income += t.amount;
            else months[key].expense += t.amount;
        });
        return Object.entries(months)
            .sort((a, b) => a[0].localeCompare(b[0]))
            .slice(-6)
            .map(([key, val]) => {
                const [y, m] = key.split('-');
                const label = new Date(parseInt(y), parseInt(m) - 1).toLocaleDateString('pt-BR', { month: 'short' });
                return { month: label, ...val };
            });
    }, [transactions]);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Financeiro</h1>
                    <p className="text-muted-foreground mt-1">Controle de receitas e despesas</p>
                </div>
                <div className="flex gap-2">
                    <Dialog open={manageDialogOpen} onOpenChange={setManageDialogOpen}>
                        <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                                <Settings className="h-4 w-4 mr-1" /> Categorias
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Gerenciar Categorias</DialogTitle>
                                <CardDescription>Exclua categorias que não são mais necessárias</CardDescription>
                            </DialogHeader>
                            <Tabs defaultValue="entrada">
                                <TabsList className="w-full">
                                    <TabsTrigger value="entrada" className="flex-1">Entradas</TabsTrigger>
                                    <TabsTrigger value="saida" className="flex-1">Saídas</TabsTrigger>
                                </TabsList>
                                {(['entrada', 'saida'] as const).map(t => (
                                    <TabsContent key={t} value={t} className="mt-4 space-y-4">
                                        <div className="flex gap-2 p-1">
                                            <Input
                                                placeholder="Nome da nova categoria..."
                                                value={newCatNames[t]}
                                                onChange={e => setNewCatNames(prev => ({ ...prev, [t]: e.target.value }))}
                                                className="flex-1 h-9 text-sm"
                                            />
                                            <Button type="button" size="sm" onClick={() => handleAddCategory(t)}>
                                                <Plus className="h-4 w-4 mr-1" /> Add
                                            </Button>
                                        </div>

                                        <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
                                            {categories.filter(c => c.type === t).map(cat => (
                                                <div key={cat.id} className="flex items-center justify-between p-2 rounded-lg border bg-muted/30 group">
                                                    {editingCatId === cat.id ? (
                                                        <div className="flex-1 flex gap-2 items-center">
                                                            <Input
                                                                size={1}
                                                                value={editingCatName}
                                                                onChange={e => setEditingCatName(e.target.value)}
                                                                className="h-8 text-sm flex-1"
                                                                autoFocus
                                                            />
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-emerald-600" onClick={() => handleUpdateCategory(cat.id)}>
                                                                <Check className="h-4 w-4" />
                                                            </Button>
                                                            <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => setEditingCatId(null)}>
                                                                <X className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <span className="text-sm font-medium">{cat.name}</span>
                                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-blue-500"
                                                                    onClick={() => {
                                                                        setEditingCatId(cat.id);
                                                                        setEditingCatName(cat.name);
                                                                    }}
                                                                >
                                                                    <Edit2 className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 text-red-500"
                                                                    onClick={() => setCatToDelete(cat.id)}
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </TabsContent>
                                ))}
                            </Tabs>
                        </DialogContent>
                    </Dialog>

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
                                    <Select value={type} onValueChange={(v: any) => {
                                        setType(v);
                                        setCategory(''); // Reset category when type changes
                                    }}>
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
                                        <SelectTrigger className="w-full"><SelectValue placeholder="Selecione" /></SelectTrigger>
                                        <SelectContent>
                                            {filteredCategories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Descrição</Label>
                                    <Input placeholder="Descrição da transação" value={description} onChange={e => setDescription(e.target.value)} />
                                </div>
                                <div className="space-y-2">
                                    <Label>Valor (R$)</Label>
                                    <Input type="number" placeholder="0,00" step="0.01" min="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
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
            {/* Modal de Confirmação de Exclusão */}
            <AlertDialog open={!!catToDelete} onOpenChange={(open) => !open && setCatToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Tem certeza que deseja excluir?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta categoria será removida. As transações que já usam esta categoria
                            <span className="font-semibold text-foreground"> não </span> serão excluídas,
                            mas você não poderá selecionar esta categoria para novos lançamentos.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDeleteCategory();
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Excluindo...' : 'Sim, Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
