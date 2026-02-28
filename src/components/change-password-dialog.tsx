'use client';

import { useState } from 'react';
import { KeyRound, Eye, EyeOff } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

interface ChangePasswordDialogProps {
    trigger?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function ChangePasswordDialog({ trigger, open, onOpenChange }: ChangePasswordDialogProps) {
    const { changePassword } = useAuth();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [internalOpen, setInternalOpen] = useState(false);

    const isControlled = open !== undefined && onOpenChange !== undefined;
    const isOpen = isControlled ? open : internalOpen;
    const setIsOpen = isControlled ? onOpenChange : setInternalOpen;

    const handleSubmit = async () => {
        if (!newPassword || !confirmPassword) {
            toast.error('Preencha os campos de nova senha');
            return;
        }
        if (newPassword.length < 6) {
            toast.error('A nova senha deve ter pelo menos 6 caracteres');
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        setIsLoading(true);
        try {
            const success = await changePassword(currentPassword, newPassword);
            if (success) {
                toast.success('Senha alterada com sucesso!');
                setIsOpen(false);
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error('Erro ao alterar senha. Verifique sua conexão.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5 text-primary" />
                        Alterar Senha
                    </DialogTitle>
                    <DialogDescription>
                        Escolha uma nova senha segura para sua conta.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="current">Senha Atual (opcional)</Label>
                        <div className="relative">
                            <Input
                                id="current"
                                type={showCurrentPassword ? 'text' : 'password'}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                placeholder="Sua senha atual"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            >
                                {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="new">Nova Senha</Label>
                        <div className="relative">
                            <Input
                                id="new"
                                type={showNewPassword ? 'text' : 'password'}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Mínimo 6 caracteres"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={() => setShowNewPassword(!showNewPassword)}
                            >
                                {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                        </div>
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="confirm">Confirmar Nova Senha</Label>
                        <Input
                            id="confirm"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Repita a nova senha"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => setIsOpen(false)}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? 'Alterando...' : 'Alterar Senha'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
