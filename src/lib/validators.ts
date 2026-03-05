'use client';

// ─── CPF ────────────────────────────────────────────────────
export function formatCPF(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

export function isValidCPF(cpf: string): boolean {
    const digits = cpf.replace(/\D/g, '');
    if (digits.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(digits)) return false; // all same digits

    let sum = 0;
    for (let i = 0; i < 9; i++) sum += parseInt(digits[i]) * (10 - i);
    let check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    if (parseInt(digits[9]) !== check) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) sum += parseInt(digits[i]) * (11 - i);
    check = 11 - (sum % 11);
    if (check >= 10) check = 0;
    if (parseInt(digits[10]) !== check) return false;

    return true;
}

// ─── CNPJ ───────────────────────────────────────────────────
export function formatCNPJ(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    return digits
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function isValidCNPJ(cnpj: string): boolean {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14) return false;
    if (/^(\d)\1{13}$/.test(digits)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    let sum = 0;
    for (let i = 0; i < 12; i++) sum += parseInt(digits[i]) * weights1[i];
    let check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(digits[12]) !== check) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) sum += parseInt(digits[i]) * weights2[i];
    check = sum % 11 < 2 ? 0 : 11 - (sum % 11);
    if (parseInt(digits[13]) !== check) return false;

    return true;
}

// ─── Phone ──────────────────────────────────────────────────
export function formatPhone(value: string): string {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits.replace(/(\d{0,2})/, '($1');
    if (digits.length <= 7) return digits.replace(/(\d{2})(\d{0,5})/, '($1) $2');
    if (digits.length <= 10) return digits.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
    return digits.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
}

import { AgeGroup } from './types';

// ─── Dates ──────────────────────────────────────────────────
export function calculateAgeGroup(birthDate: string): AgeGroup {
    const today = new Date();
    const birth = new Date(birthDate + 'T12:00:00');
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
        age--;
    }

    if (age < 4) return 'Bebê';
    if (age < 12) return 'Criança';
    if (age < 18) return 'Adolescente';
    if (age < 30) return 'Jovem';
    if (age < 60) return 'Adulto';
    return 'Idoso';
}

export function isDateInPast(dateStr: string): boolean {
    const date = new Date(dateStr + 'T12:00:00');
    return date <= new Date();
}

export function isReasonableDate(dateStr: string): boolean {
    const date = new Date(dateStr + 'T12:00:00');
    const minDate = new Date('1900-01-01');
    return date >= minDate && date <= new Date();
}

// ─── Amount & Currency ──────────────────────────────────────
export function isValidAmount(value: string | number): boolean {
    const num = typeof value === 'string' ? parseFloat(value.replace(/\./g, '').replace(',', '.')) : value;
    return !isNaN(num) && num > 0 && isFinite(num);
}

export function formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

/**
 * Masks a string input into a currency format: 0,00 -> 0,01 -> 1,25 -> 1.250,50
 */
export function maskCurrency(value: string): string {
    const digits = value.replace(/\D/g, '');
    const number = (parseInt(digits) || 0) / 100;
    return number.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
}

export function parseCurrency(value: string): number {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
}

// ─── Name Normalization ─────────────────────────────────────
/**
 * Normalizes a name to Title Case, keeping Portuguese prepositions in lowercase.
 * Example: "JOÃO DA SILVA" -> "João da Silva"
 */
export function normalizeName(name: string): string {
    if (!name) return '';
    const prepositions = ['de', 'da', 'do', 'dos', 'das', 'e'];
    return name
        .trim()
        .toLowerCase()
        .split(/\s+/)
        .map((word, index) => {
            if (index > 0 && prepositions.includes(word)) {
                return word;
            }
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}

// ─── Error Handling ─────────────────────────────────────────
/**
 * Translates technical database error messages (unique constraints, etc.)
 * to user-friendly messages in Portuguese.
 */
export function getFriendlyErrorMessage(error: any): string {
    if (!error) return 'Ocorreu um erro inesperado.';

    // Convert error to string if it's an object from Supabase/PostgREST
    const message = typeof error === 'string' ? error : (error.message || '');
    const details = typeof error === 'string' ? '' : (error.details || '');

    // Map constraints and error patterns
    if (message.includes('members_church_id_cpf_key') || details.includes('members_church_id_cpf_key')) {
        return 'Este CPF já está cadastrado em nossa igreja.';
    }

    if (message.includes('churches_slug_key') || details.includes('churches_slug_key')) {
        return 'Este link (identificador) já está sendo usado por outra igreja.';
    }

    if (message.includes('financial_categories_church_id_name_type_key') || details.includes('financial_categories_church_id_name_type_key')) {
        return 'Uma categoria com este nome e tipo já existe.';
    }

    if (message.includes('unique_church_room_date') || details.includes('unique_church_room_date')) {
        return 'Já existe uma chamada registrada para esta sala nesta data.';
    }

    // Default messages for common patterns
    if (message.includes('JWT')) {
        return 'Sua sessão expirou. Por favor, faça login novamente.';
    }

    if (message.includes('network') || message.includes('fetch')) {
        return 'Erro de conexão. Verifique sua internet.';
    }

    return message || 'Ocorreu um erro ao processar sua solicitação.';
}
