'use client';

import Link from 'next/link';
import { Church, Users, ClipboardCheck, BarChart3, DollarSign, Shield, ArrowRight, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  { icon: Users, title: 'Gestão de Membros', desc: 'Cadastro completo com foto, documentos, classificação por faixa etária e muito mais.' },
  { icon: ClipboardCheck, title: 'Chamada Digital', desc: 'Interface otimizada para celular. Registre presenças com rapidez e praticidade.' },
  { icon: BarChart3, title: 'Relatórios Inteligentes', desc: 'Dashboards com gráficos, alertas de faltas e exportação em PDF/Excel.' },
  { icon: DollarSign, title: 'Controle Financeiro', desc: 'Dízimos, ofertas, despesas organizadas com gráficos e relatórios mensais.' },
  { icon: Shield, title: 'Multi-Tenant Seguro', desc: 'Cada igreja com dados isolados. Máxima segurança e privacidade.' },
  { icon: Star, title: 'Fácil de Usar', desc: 'Design moderno, responsivo e intuitivo. Funciona em qualquer dispositivo.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-4 md:px-6 h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Church className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'var(--font-display)' }}>Igreja App</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/igreja-batista-central/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="bg-secondary text-secondary-foreground hover:bg-secondary/90">
                Cadastrar Igreja
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative">
          <div className="max-w-3xl mx-auto text-center animate-fade-in">
            <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm">
              ✨ Plataforma #1 de Gestão Eclesiástica
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6" style={{ fontFamily: 'var(--font-display)' }}>
              Gestão completa para sua{' '}
              <span className="text-secondary">igreja</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Membros, presenças, finanças e relatórios em um só lugar.
              Simples, seguro e projetado para igrejas de todos os tamanhos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 px-8 text-base">
                  Cadastrar minha Igreja
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/igreja-batista-central/dashboard">
                <Button size="lg" variant="outline" className="px-8 text-base">
                  Ver Demo
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: 'var(--font-display)' }}>
              Tudo que sua igreja precisa
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Ferramentas poderosas e fáceis de usar para cada área da administração eclesiástica.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <Card key={feature.title} className={`animate-fade-in stagger-${i + 1} border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-1`}>
                <CardHeader>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-8">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Church className="h-5 w-5 text-primary" />
            <span className="font-bold" style={{ fontFamily: 'var(--font-display)' }}>Igreja App</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 Igreja App. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
