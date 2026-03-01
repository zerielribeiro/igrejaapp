'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Church, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import { useSearchParams } from 'next/navigation';

export default function LoginPage() {
    const params = useParams();
    const slug = params.slug as string;
    const router = useRouter();
    const searchParams = useSearchParams();
    const { login, isLoading } = useAuth();
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const redirectTo = searchParams ? searchParams.get('redirectTo') : null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const success = await login(email, password, slug);
            if (success) {
                toast.success('Login realizado com sucesso!');
                // Wait a micro-task to ensure state is flushed and middleware can see the cookie
                setTimeout(() => {
                    if (redirectTo) {
                        router.replace(redirectTo);
                    } else if (slug === 'superadmin') {
                        router.replace('/superadmin');
                    } else {
                        router.replace(`/${slug}/dashboard`);
                    }
                }, 200);
            }
        } catch (err) {
            console.error('Redirect error:', err);
            toast.error('Erro ao redirecionar após o login.');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
            <div className="w-full max-w-md animate-fade-in">
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
                            <Church className="h-7 w-7" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Igreja App</h1>
                    <p className="text-muted-foreground text-sm mt-1">Acesse o painel da sua igreja</p>
                </div>

                <Card className="shadow-xl border-0">
                    <CardHeader className="text-center pb-4">
                        <CardTitle className="text-lg">Entrar</CardTitle>
                        <CardDescription>Igreja: <span className="font-medium text-foreground">{slug}</span></CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">E-mail</Label>
                                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required disabled={isLoading} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password">Senha</Label>
                                <div className="relative">
                                    <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={isLoading} />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                            </div>
                            <Button type="submit" className="w-full bg-primary" disabled={isLoading}>
                                {isLoading ? 'Entrando...' : 'Entrar'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                <div className="text-center mt-6">
                    <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                        ← Voltar para o início
                    </Link>
                </div>
            </div>
        </div>
    );
}
