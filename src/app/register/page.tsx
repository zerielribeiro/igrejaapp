'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Church, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

export default function RegisterPage() {
    const router = useRouter();
    const { registerChurch } = useAuth();
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        churchName: '', pastor: '', slug: '', email: '', password: '', confirmPassword: '',
    });

    const generateSlug = (name: string) =>
        name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const handleChange = (field: string, value: string) => {
        const updates: Record<string, string> = { [field]: value };
        if (field === 'churchName') updates.slug = generateSlug(value);
        setFormData(prev => ({ ...prev, ...updates }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.password !== formData.confirmPassword) {
            toast.error('As senhas não coincidem.');
            return;
        }
        if (!formData.slug) {
            toast.error('O slug da igreja é obrigatório.');
            return;
        }
        setIsLoading(true);
        try {
            const success = await registerChurch({
                churchName: formData.churchName,
                slug: formData.slug,
                pastor: formData.pastor,
                email: formData.email,
                password: formData.password,
            });
            if (success) {
                toast.success('Igreja cadastrada com sucesso!');
                router.push(`/${formData.slug}/login`);
            }
        } catch (error) {
            console.error('Registration page error:', error);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
            <div className="w-full max-w-lg animate-fade-in">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                            <Church className="h-7 w-7" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Cadastrar minha Igreja</h1>
                    <p className="text-muted-foreground text-sm mt-1">Crie sua conta e comece a gerenciar sua igreja</p>
                </div>

                <Card className="shadow-xl border-0">
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="churchName">Nome da Igreja</Label>
                                <Input id="churchName" value={formData.churchName}
                                    onChange={e => handleChange('churchName', e.target.value)}
                                    placeholder="Ex: Igreja Batista Central" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="pastor">Pastor Titular / Responsável</Label>
                                <Input id="pastor" value={formData.pastor}
                                    onChange={e => handleChange('pastor', e.target.value)}
                                    placeholder="Ex: Pr. João Silva" required />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="slug">URL de acesso</Label>
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-muted-foreground whitespace-nowrap">igrejaapp.com/</span>
                                    <Input id="slug" value={formData.slug}
                                        onChange={e => handleChange('slug', e.target.value)}
                                        placeholder="minha-igreja" required />
                                </div>
                                <p className="text-xs text-muted-foreground">Gerado automaticamente. Não pode ser alterado após o cadastro.</p>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail do Administrador</Label>
                                <Input id="email" type="email" value={formData.email}
                                    onChange={e => handleChange('email', e.target.value)}
                                    placeholder="admin@suaigreja.com" required />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <Input id="password" type="password" value={formData.password}
                                        onChange={e => handleChange('password', e.target.value)}
                                        placeholder="••••••••" required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                                    <Input id="confirmPassword" type="password" value={formData.confirmPassword}
                                        onChange={e => handleChange('confirmPassword', e.target.value)}
                                        placeholder="••••••••" required />
                                </div>
                            </div>
                            <Button type="submit" disabled={isLoading}
                                className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90">
                                {isLoading ? 'Criando conta...' : 'Cadastrar Igreja'}
                                {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center mt-6 space-y-2">
                    <p className="text-sm text-muted-foreground">
                        Já tem uma conta?{' '}
                        <Link href="/igreja-batista-central/login" className="text-primary hover:underline">
                            Fazer login
                        </Link>
                    </p>
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors block">
                        ← Voltar para o início
                    </Link>
                </div>
            </div>
        </div>
    );
}
