// ═══ Igreja App - Type Definitions ═══

export type UserRole = 'super_admin' | 'admin' | 'pastor' | 'secretary' | 'treasurer';
export type MemberStatus = 'ativo' | 'inativo' | 'visitante' | 'transferido';
export type AgeGroup = 'Criança' | 'Jovem' | 'Adulto';
export type AttendanceStatus = 'presente' | 'ausente';
export type TransactionType = 'entrada' | 'saida';
export type PlanType = 'free' | 'basic' | 'premium' | 'enterprise';

// ─── New Data Inputs ──────────────────────────────────────────────
export interface NewUserData { name: string; email: string; role: UserRole; password?: string; }
export interface NewRoomData { name: string; age_group: string; capacity?: number; }
export interface NewChurchData { churchName: string; slug: string; pastor: string; email: string; password: string; }
export interface NewVisitorData { name: string; address: string; phone: string; room_id: string; room_name: string; session_date: string; }
export interface NewMemberData extends Omit<Member, 'id' | 'church_id' | 'created_at'> { }
export interface NewTransactionData extends Omit<FinancialTransaction, 'id' | 'church_id' | 'created_at'> { }
export interface NewAttendanceSessionData extends Omit<AttendanceSession, 'id' | 'church_id' | 'created_at'> { id?: string; }
export interface NewCategoryData { name: string; type: TransactionType; }

export interface Visitor {
    id: string;
    church_id: string;
    room_id: string;
    room_name: string;
    session_date: string; // YYYY-MM-DD
    name: string;
    address: string;
    phone: string;
    registered_at: string;
}

export interface Church {
    id: string;
    name: string;
    slug: string;
    cnpj: string;
    city: string;
    state: string;
    address: string;
    phone: string;
    pastor: string;
    admin_name: string;
    admin_email: string;
    logo?: string;
    plan: PlanType;
    is_active: boolean;
    created_at: string;
    members_count?: number;
}

export interface User {
    id: string;
    church_id: string;
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    is_active: boolean;
    avatar?: string;
    created_at: string;
}

export interface Member {
    id: string;
    church_id: string;
    room_id: string;
    full_name: string;
    photo?: string;
    cpf: string;
    birth_date: string;
    phone: string;
    email: string;
    address: string;
    baptism_date?: string;
    join_date: string;
    age_group: AgeGroup;
    status: MemberStatus;
    created_at: string;
}

export interface Room {
    id: string;
    church_id: string;
    name: string;
    age_group: AgeGroup;
    is_active: boolean;
}

export interface AttendanceSession {
    id: string;
    church_id: string;
    room_id: string;
    room_name?: string;
    session_date: string;
    present_member_ids: string[];
    absent_member_ids: string[];
    total_present: number;
    total_absent: number;
    finalized: boolean;
    created_at: string;
}

export interface AttendanceRecord {
    id: string;
    church_id: string;
    session_id: string;
    member_id: string;
    member_name?: string;
    status: AttendanceStatus;
    is_visitor: boolean;
    visitor_name?: string;
}

export interface FinancialTransaction {
    id: string;
    church_id: string;
    member_id?: string;
    member_name?: string;
    type: TransactionType;
    category: string;
    description: string;
    amount: number;
    transaction_date: string;
    created_at: string;
}

export interface FinancialCategory {
    id: string;
    church_id: string;
    name: string;
    type: TransactionType;
    created_at: string;
}

export interface Notification {
    id: string;
    church_id: string;
    user_id: string;
    type: string;
    message: string;
    is_read: boolean;
    created_at: string;
}

export interface AuthSession {
    user: User;
    church: Church;
}

export interface MonthlyAttendance {
    month: string;
    present: number;
    absent: number;
}

export interface RoomAttendance {
    room: string;
    present: number;
    absent: number;
}

export interface FinancialSummary {
    total_income: number;
    total_expense: number;
    balance: number;
    income_by_category: { category: string; amount: number }[];
    expense_by_category: { category: string; amount: number }[];
    monthly_data: { month: string; income: number; expense: number }[];
}
