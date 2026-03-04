'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Church as ChurchIcon, CheckCircle2, AlertCircle, Loader2, User, CreditCard, Calendar, Phone, MapPin, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { createClient } from '@/lib/supabase/client';
import { normalizeName, formatCPF, formatPhone, isValidCPF, isReasonableDate } from '@/lib/validators';

const INITIAL_FORM_DATA = {
    full_name: '',
    cpf: '',
    birth_date: '',
    phone: '',
    address: '',
    baptism_date: '',
    profession_faith_date: ''
};

export default function PublicRegistrationPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [churchInfo, setChurchInfo] = useState<{ name: string; registrationEnabled: boolean } | null>(null);
    const [success, setSuccess] = useState(false);

    const [formData, setFormData] = useState(INITIAL_FORM_DATA);

    const supabase = createClient();

    useEffect(() => {
        async function loadChurch() {
            try {
                const { data, error } = await supabase.rpc('get_church_registration_status', { p_slug: slug });

                if (error) throw error;

                if (data && data.length > 0) {
                    const church = data[0];
                    if (!church.is_active) {
                        toast.error('Esta igreja está inativa no sistema.');
                        return;
                    }
                    setChurchInfo({
                        name: church.church_name,
                        registrationEnabled: church.registration_enabled
                    });
                } else {
                    toast.error('Igreja não encontrada.');
                }
            } catch (error) {
                console.error('Error loading church info:', error);
                toast.error('Erro ao carregar informações da igreja.');
            } finally {
                setIsLoading(false);
            }
        }

        if (slug) loadChurch();
    }, [slug, supabase]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;

        // Apply masks in real-time
        let maskedValue = value;
        if (id === 'cpf') {
            maskedValue = formatCPF(value);
        } else if (id === 'phone') {
            maskedValue = formatPhone(value);
        }

        setFormData(prev => ({ ...prev, [id]: maskedValue }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // 1. Validar CPF
        if (!isValidCPF(formData.cpf)) {
            toast.error('O CPF informado é inválido.');
            setIsSubmitting(false);
            return;
        }

        // 2. Validar Data de Nascimento
        if (!isReasonableDate(formData.birth_date)) {
            toast.error('Data de nascimento inválida (deve ser entre 1900 e hoje).');
            setIsSubmitting(false);
            return;
        }

        // 3. Validar Datas de Batismo e Fé (se informadas)
        const birthDate = new Date(formData.birth_date);

        if (formData.baptism_date) {
            const baptismDate = new Date(formData.baptism_date);
            if (baptismDate < birthDate) {
                toast.error('A data de batismo não pode ser anterior ao nascimento.');
                setIsSubmitting(false);
                return;
            }
            if (baptismDate > new Date()) {
                toast.error('A data de batismo não pode ser no futuro.');
                setIsSubmitting(false);
                return;
            }
        }

        if (formData.profession_faith_date) {
            const faithDate = new Date(formData.profession_faith_date);
            if (faithDate < birthDate) {
                toast.error('A data de profissão de fé não pode ser anterior ao nascimento.');
                setIsSubmitting(false);
                return;
            }
            if (faithDate > new Date()) {
                toast.error('A data de profissão de fé não pode ser no futuro.');
                setIsSubmitting(false);
                return;
            }
        }

        try {
            const { data, error } = await supabase.rpc('public_register_member', {
                p_slug: slug,
                p_full_name: normalizeName(formData.full_name),
                p_cpf: formData.cpf.replace(/\D/g, ''), // Send only digits
                p_birth_date: formData.birth_date,
                p_phone: formData.phone.replace(/\D/g, ''), // Send only digits
                p_address: formData.address,
                p_baptism_date: formData.baptism_date || null,
                p_profession_faith_date: formData.profession_faith_date || null
            });

            if (error) {
                toast.error(error.message || 'Erro ao realizar cadastro.');
                return;
            }

            if (data?.success) {
                setSuccess(true);
                toast.success('Cadastro realizado com sucesso!');
            }
        } catch (error: any) {
            console.error('Registration error:', error);
            toast.error(error.message || 'Ocorreu um erro inesperado.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando formulário...</p>
                </div>
            </div>
        );
    }

    if (!churchInfo || !churchInfo.registrationEnabled) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
                <Card className="max-w-md w-full shadow-2xl border-0 animate-in fade-in zoom-in duration-300">
                    <CardHeader className="text-center pb-8">
                        <div className="mx-auto h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                            <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <CardTitle className="text-2xl font-bold">Cadastro Encerrado</CardTitle>
                        <CardDescription className="text-base mt-2 whitespace-pre-wrap text-center">
                            {churchInfo
                                ? `O formulário de cadastro para a ${churchInfo.name} não está mais recebendo respostas.`
                                : "Esta igreja não foi encontrada ou o link está incorreto."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Caso acredite que isso seja um erro, entre em contato com o administrador da sua igreja.
                        </p>
                        <Button variant="outline" className="w-full" onClick={() => router.push('/')}>
                            Voltar ao início
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
                <Card className="max-w-md w-full shadow-2xl border-0 animate-in fade-in zoom-in duration-500">
                    <CardHeader className="text-center pb-8">
                        <div className="mx-auto h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
                            <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
                        </div>
                        <CardTitle className="text-3xl font-bold text-green-600 dark:text-green-400">Sucesso!</CardTitle>
                        <CardDescription className="text-lg mt-3 text-center">
                            Seu cadastro na <strong>{churchInfo.name}</strong> foi realizado com sucesso.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="text-center space-y-6">
                        <p className="text-muted-foreground">
                            Seja bem-vindo(a)! Seus dados foram enviados para a secretaria da igreja.
                        </p>
                        <div className="pt-4 flex flex-col sm:flex-row gap-3">
                            <Button
                                className="flex-1 h-12 text-base font-medium"
                                onClick={() => {
                                    setFormData(INITIAL_FORM_DATA);
                                    setSuccess(false);
                                }}
                            >
                                Fazer outro cadastro
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 h-12 text-base font-medium"
                                onClick={() => router.push('/')}
                            >
                                Sair
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4 md:p-8">
            <div className="max-w-2xl w-full mx-auto space-y-8 animate-in slide-in-from-bottom-4 duration-700">
                <header className="text-center space-y-4">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-xl mb-2">
                        <ChurchIcon className="h-8 w-8" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{churchInfo.name}</h1>
                        <p className="text-xl text-muted-foreground">Formulário de Cadastro de Membro</p>
                    </div>
                </header>

                <Card className="shadow-2xl border-0 overflow-hidden">
                    <div className="h-2 bg-primary w-full" />
                    <CardHeader className="space-y-1 pt-8 px-8 text-center md:text-left">
                        <CardTitle className="text-2xl font-bold">Seus Dados</CardTitle>
                        <CardDescription className="text-base text-muted-foreground/80">
                            Preencha as informações abaixo para completar seu registro.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="full_name" className="text-sm font-semibold flex items-center gap-2">
                                        <User className="h-4 w-4 text-primary" /> Nome Completo
                                    </Label>
                                    <Input
                                        id="full_name"
                                        placeholder="Digite seu nome completo"
                                        value={formData.full_name}
                                        onChange={handleChange}
                                        required
                                        className="h-12 text-base focus-visible:ring-primary shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="cpf" className="text-sm font-semibold flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-primary" /> CPF
                                    </Label>
                                    <Input
                                        id="cpf"
                                        placeholder="000.000.000-00"
                                        value={formData.cpf}
                                        onChange={handleChange}
                                        required
                                        className="h-12 text-base shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="birth_date" className="text-sm font-semibold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" /> Data de Nascimento
                                    </Label>
                                    <Input
                                        id="birth_date"
                                        type="date"
                                        value={formData.birth_date}
                                        onChange={handleChange}
                                        required
                                        className="h-12 text-base shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="phone" className="text-sm font-semibold flex items-center gap-2">
                                        <Phone className="h-4 w-4 text-primary" /> Telefone / WhatsApp
                                    </Label>
                                    <Input
                                        id="phone"
                                        placeholder="(00) 00000-0000"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="h-12 text-base shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label htmlFor="address" className="text-sm font-semibold flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-primary" /> Endereço Completo
                                    </Label>
                                    <Input
                                        id="address"
                                        placeholder="Rua, número, bairro, cidade..."
                                        value={formData.address}
                                        onChange={handleChange}
                                        className="h-12 text-base shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="baptism_date" className="text-sm font-semibold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" /> Data de Batismo
                                    </Label>
                                    <Input
                                        id="baptism_date"
                                        type="date"
                                        value={formData.baptism_date}
                                        onChange={handleChange}
                                        className="h-12 text-base shadow-sm"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="profession_faith_date" className="text-sm font-semibold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" /> Data de Profissão de Fé
                                    </Label>
                                    <Input
                                        id="profession_faith_date"
                                        type="date"
                                        value={formData.profession_faith_date}
                                        onChange={handleChange}
                                        className="h-12 text-base shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="pt-6">
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="w-full h-14 text-lg font-bold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                            Enviando dados...
                                        </>
                                    ) : (
                                        <>
                                            Finalizar Cadastro
                                            <ArrowRight className="ml-2 h-5 w-5" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <footer className="text-center pt-8">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} {churchInfo.name} — Desenvolvido por <Link href="/" className="hover:text-primary transition-colors">Igreja App</Link>
                    </p>
                </footer>
            </div>
        </div>
    );
}
