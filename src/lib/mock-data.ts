import {
    Church, User, Member, Room, AttendanceSession, AttendanceRecord,
    FinancialTransaction, Notification, MonthlyAttendance, RoomAttendance,
    FinancialSummary
} from './types';

// ═══ CHURCHES ═══
export const mockChurches: Church[] = [
    {
        id: 'ch-001', name: 'Igreja Batista Central', slug: 'igreja-batista-central',
        cnpj: '12.345.678/0001-90', city: 'São Paulo', state: 'SP',
        address: 'Rua da Consolação, 1000, Centro', phone: '(11) 3456-7890',
        pastor: 'Pr. Carlos Eduardo Silva', admin_name: 'Carlos Eduardo Silva', admin_email: 'carlos@igrejabatista.com',
        plan: 'premium', is_active: true,
        created_at: '2024-01-15', members_count: 245,
    },
    {
        id: 'ch-002', name: 'Comunidade Evangélica Nova Vida', slug: 'nova-vida',
        cnpj: '98.765.432/0001-10', city: 'Rio de Janeiro', state: 'RJ',
        address: 'Av. Brasil, 500, Madureira', phone: '(21) 2345-6789',
        pastor: 'Pr. Roberto Santos', admin_name: 'Roberto Santos', admin_email: 'roberto@novavida.com',
        plan: 'basic', is_active: true,
        created_at: '2024-03-20', members_count: 120,
    },
    {
        id: 'ch-003', name: 'Igreja Metodista Renovada', slug: 'metodista-renovada',
        cnpj: '11.222.333/0001-44', city: 'Belo Horizonte', state: 'MG',
        address: 'Rua Paraná, 200, Savassi', phone: '(31) 3333-4444',
        pastor: 'Pra. Fernanda Lima', admin_name: 'Fernanda Lima', admin_email: 'fernanda@metodista.com',
        plan: 'free', is_active: false,
        created_at: '2024-06-01', members_count: 58,
    },
];

// ═══ USERS ═══
export const mockUsers: User[] = [
    { id: 'u-001', church_id: 'ch-001', name: 'Carlos Eduardo Silva', email: 'carlos@igrejabatista.com', role: 'admin', is_active: true, created_at: '2024-01-15' },
    { id: 'u-002', church_id: 'ch-001', name: 'Maria Santos', email: 'maria@igrejabatista.com', role: 'secretary', is_active: true, created_at: '2024-02-10' },
    { id: 'u-003', church_id: 'ch-001', name: 'João Oliveira', email: 'joao@igrejabatista.com', role: 'treasurer', is_active: true, created_at: '2024-02-15' },
    { id: 'u-004', church_id: 'ch-001', name: 'Ana Paula Costa', email: 'ana@igrejabatista.com', role: 'pastor', is_active: true, created_at: '2024-03-01' },
    { id: 'u-005', church_id: 'ch-002', name: 'Roberto Santos', email: 'roberto@novavida.com', role: 'admin', is_active: true, created_at: '2024-03-20' },
    { id: 'u-super', church_id: '', name: 'Super Admin', email: 'zeriel@gmail.com', password: 'admin123', role: 'super_admin', is_active: true, created_at: '2024-01-01' },
];

// ═══ ROOMS ═══
export const mockRooms: Room[] = [
    { id: 'r-001', church_id: 'ch-001', name: 'Culto Geral', age_group: 'Adulto', is_active: true },
    { id: 'r-002', church_id: 'ch-001', name: 'Escola Bíblica Dominical', age_group: 'Adulto', is_active: true },
    { id: 'r-003', church_id: 'ch-001', name: 'Jovens & Adolescentes', age_group: 'Jovem', is_active: true },
    { id: 'r-004', church_id: 'ch-001', name: 'Ministério Infantil', age_group: 'Criança', is_active: true },
    { id: 'r-005', church_id: 'ch-001', name: 'Grupo de Mulheres', age_group: 'Adulto', is_active: true },
    { id: 'r-006', church_id: 'ch-001', name: 'Grupo de Homens', age_group: 'Adulto', is_active: false },
];

// ═══ MEMBERS ═══
const memberNames = [
    'Ana Beatriz Ferreira', 'Pedro Henrique Costa', 'Juliana de Souza', 'Lucas Gabriel Santos',
    'Mariana Alves Ribeiro', 'Rafael Augusto Lima', 'Camila Oliveira', 'Thiago Rodrigues',
    'Fernanda Martins', 'Gabriel Silva Neto', 'Isabela Carvalho', 'Matheus Pereira',
    'Larissa Gonçalves', 'Vinícius Barbosa', 'Letícia Nascimento', 'Bruno Cardoso',
    'Amanda Teixeira', 'Felipe Moreira', 'Carolina Mendes', 'Gustavo Rocha',
    'Patrícia Araújo', 'Diego Soares', 'Renata Monteiro', 'André Campos',
    'Natália Correia', 'Leonardo Pinto', 'Vanessa Dias', 'Hugo Fonseca',
    'Bianca Ramos', 'Ricardo Lopes',
];

function calcAgeGroup(birthDate: string): 'Criança' | 'Jovem' | 'Adulto' {
    const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
    if (age <= 12) return 'Criança';
    if (age <= 17) return 'Jovem';
    return 'Adulto';
}

export const mockMembers: Member[] = memberNames.map((name, i) => {
    const year = 2000 - (i * 2) + (i % 3 === 0 ? 15 : 0);
    const birthDate = `${year}-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`;
    const rooms = ['r-001', 'r-002', 'r-003', 'r-004', 'r-005'];
    return {
        id: `m-${String(i + 1).padStart(3, '0')}`,
        church_id: 'ch-001',
        room_id: rooms[i % rooms.length],
        full_name: name,
        cpf: `${String(100 + i).slice(0, 3)}.${String(200 + i).slice(0, 3)}.${String(300 + i).slice(0, 3)}-${String(10 + (i % 90)).padStart(2, '0')}`,
        birth_date: birthDate,
        phone: `(11) 9${String(8000 + i).slice(0, 4)}-${String(1000 + i).slice(0, 4)}`,
        email: `${name.split(' ')[0].toLowerCase()}${i}@email.com`,
        address: `Rua ${['das Flores', 'São João', 'XV de Novembro', 'Independência', 'Santos Dumont'][i % 5]}, ${100 + i}`,
        baptism_date: i % 3 !== 0 ? `${year + 15}-06-15` : undefined,
        join_date: `2023-${String((i % 12) + 1).padStart(2, '0')}-01`,
        age_group: calcAgeGroup(birthDate),
        status: i % 10 === 0 ? 'inativo' : i % 15 === 0 ? 'visitante' : 'ativo',
        created_at: '2024-01-15',
    };
});

// ═══ ATTENDANCE ═══
export const mockAttendanceSessions: AttendanceSession[] = [
    { id: 'as-001', church_id: 'ch-001', room_id: 'r-001', room_name: 'Culto Geral', session_date: '2026-02-23', present_member_ids: [], absent_member_ids: [], total_present: 180, total_absent: 45, finalized: true, created_at: '2026-02-23' },
    { id: 'as-002', church_id: 'ch-001', room_id: 'r-002', room_name: 'Escola Bíblica Dominical', session_date: '2026-02-23', present_member_ids: [], absent_member_ids: [], total_present: 85, total_absent: 35, finalized: true, created_at: '2026-02-23' },
    { id: 'as-003', church_id: 'ch-001', room_id: 'r-003', room_name: 'Jovens & Adolescentes', session_date: '2026-02-23', present_member_ids: [], absent_member_ids: [], total_present: 42, total_absent: 8, finalized: true, created_at: '2026-02-23' },
    { id: 'as-004', church_id: 'ch-001', room_id: 'r-001', room_name: 'Culto Geral', session_date: '2026-02-16', present_member_ids: [], absent_member_ids: [], total_present: 175, total_absent: 50, finalized: true, created_at: '2026-02-16' },
    { id: 'as-005', church_id: 'ch-001', room_id: 'r-004', room_name: 'Ministério Infantil', session_date: '2026-02-23', present_member_ids: [], absent_member_ids: [], total_present: 28, total_absent: 7, finalized: true, created_at: '2026-02-23' },
];

export const mockAttendanceRecords: AttendanceRecord[] = mockMembers.slice(0, 20).map((m, i) => ({
    id: `ar-${String(i + 1).padStart(3, '0')}`,
    church_id: 'ch-001',
    session_id: 'as-001',
    member_id: m.id,
    member_name: m.full_name,
    status: i % 4 === 0 ? 'ausente' : 'presente',
    is_visitor: false,
}));

// ═══ FINANCIAL ═══
const incomeCategories = ['Dízimo', 'Oferta', 'Doação', 'Campanha Missionária', 'Venda de Materiais'];
const expenseCategories = ['Energia Elétrica', 'Água', 'Aluguel', 'Manutenção', 'Eventos', 'Material de Escritório', 'Missões', 'Assistência Social'];

export const mockTransactions: FinancialTransaction[] = [
    // Incomes
    ...Array.from({ length: 15 }, (_, i) => ({
        id: `ft-in-${String(i + 1).padStart(3, '0')}`,
        church_id: 'ch-001',
        member_id: i < 10 ? mockMembers[i].id : undefined,
        member_name: i < 10 ? mockMembers[i].full_name : undefined,
        type: 'entrada' as const,
        category: incomeCategories[i % incomeCategories.length],
        description: `${incomeCategories[i % incomeCategories.length]} - ${['Janeiro', 'Fevereiro'][i % 2]} 2026`,
        amount: [500, 150, 1000, 200, 350, 800, 250, 100, 450, 600, 300, 750, 180, 900, 550][i],
        transaction_date: `2026-${String((i % 2) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`,
        created_at: '2026-01-01',
    })),
    // Expenses
    ...Array.from({ length: 10 }, (_, i) => ({
        id: `ft-ex-${String(i + 1).padStart(3, '0')}`,
        church_id: 'ch-001',
        type: 'saida' as const,
        category: expenseCategories[i % expenseCategories.length],
        description: `${expenseCategories[i % expenseCategories.length]} - ${['Janeiro', 'Fevereiro'][i % 2]}`,
        amount: [1200, 280, 3500, 450, 800, 150, 600, 350, 1200, 280][i],
        transaction_date: `2026-${String((i % 2) + 1).padStart(2, '0')}-${String((i % 28) + 5).padStart(2, '0')}`,
        created_at: '2026-01-01',
    })),
];

// ═══ NOTIFICATIONS ═══
export const mockNotifications: Notification[] = [
    { id: 'n-001', church_id: 'ch-001', user_id: 'u-001', type: 'alert', message: '3 membros com faltas consecutivas', is_read: false, created_at: '2026-02-24' },
    { id: 'n-002', church_id: 'ch-001', user_id: 'u-001', type: 'info', message: '5 aniversariantes esta semana', is_read: false, created_at: '2026-02-24' },
    { id: 'n-003', church_id: 'ch-001', user_id: 'u-001', type: 'financial', message: 'Relatório financeiro de Janeiro disponível', is_read: true, created_at: '2026-02-01' },
];

// ═══ CHART DATA ═══
export const mockMonthlyAttendance: MonthlyAttendance[] = [
    { month: 'Set', present: 165, absent: 40 },
    { month: 'Out', present: 172, absent: 38 },
    { month: 'Nov', present: 180, absent: 35 },
    { month: 'Dez', present: 195, absent: 30 },
    { month: 'Jan', present: 175, absent: 50 },
    { month: 'Fev', present: 180, absent: 45 },
];

export const mockRoomAttendance: RoomAttendance[] = [
    { room: 'Culto Geral', present: 180, absent: 45 },
    { room: 'EBD', present: 85, absent: 35 },
    { room: 'Jovens', present: 42, absent: 8 },
    { room: 'Infantil', present: 28, absent: 7 },
    { room: 'Mulheres', present: 35, absent: 10 },
];

export const mockFinancialSummary: FinancialSummary = {
    total_income: 7080,
    total_expense: 8810,
    balance: -1730,
    income_by_category: [
        { category: 'Dízimo', amount: 3200 },
        { category: 'Oferta', amount: 1800 },
        { category: 'Doação', amount: 1200 },
        { category: 'Campanha', amount: 580 },
        { category: 'Outros', amount: 300 },
    ],
    expense_by_category: [
        { category: 'Aluguel', amount: 3500 },
        { category: 'Energia', amount: 1200 },
        { category: 'Manutenção', amount: 450 },
        { category: 'Eventos', amount: 800 },
        { category: 'Missões', amount: 600 },
        { category: 'Água', amount: 280 },
        { category: 'Outros', amount: 500 },
    ],
    monthly_data: [
        { month: 'Set', income: 8500, expense: 6200 },
        { month: 'Out', income: 9200, expense: 7100 },
        { month: 'Nov', income: 8800, expense: 6800 },
        { month: 'Dez', income: 12500, expense: 9500 },
        { month: 'Jan', income: 7500, expense: 7200 },
        { month: 'Fev', income: 7080, expense: 8810 },
    ],
};

// ═══ BIRTHDAYS (this month) ═══
export const mockBirthdays = mockMembers
    .filter(m => {
        const month = new Date(m.birth_date).getMonth();
        return month === new Date().getMonth();
    })
    .slice(0, 5);

// ═══ ABSENT ALERTS ═══
export const mockAbsentAlerts = [
    { member: mockMembers[0], consecutive_absences: 4 },
    { member: mockMembers[5], consecutive_absences: 3 },
    { member: mockMembers[12], consecutive_absences: 3 },
];
