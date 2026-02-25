'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import {
    AuthSession, User, Room, Church, UserRole, Visitor,
    Member, FinancialTransaction, AttendanceSession,
    NewUserData, NewRoomData, NewVisitorData, NewChurchData,
    NewMemberData, NewTransactionData, NewAttendanceSessionData
} from './types';
import {
    mockUsers, mockChurches, mockRooms, mockMembers, mockTransactions, mockAttendanceSessions
} from './mock-data';
import { toast } from 'sonner';

// ─── localStorage keys ────────────────────────────────────────────
const LS_SESSION = 'ig_session';
const LS_PERMISSIONS = 'ig_permissions';
const LS_USERS = 'ig_users';
const LS_CHURCHES = 'ig_churches';
const LS_ROOMS = 'ig_rooms';
const LS_VISITORS = 'ig_visitors';
const LS_MEMBERS = 'ig_members';
const LS_TRANSACTIONS = 'ig_transactions';
const LS_ATTENDANCE = 'ig_attendance';

function lsGet<T>(key: string, fallback: T): T {
    if (typeof window === 'undefined') return fallback;
    try {
        const raw = localStorage.getItem(key);
        return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
        return fallback;
    }
}

function lsSet(key: string, value: unknown) {
    if (typeof window === 'undefined') return;
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* quota */ }
}

// ─── Permission Groups ────────────────────────────────────────────
export interface RolePermission {
    role: UserRole;
    label: string;
    modules: Record<string, boolean>;
}

export const defaultRolePermissions: RolePermission[] = [
    {
        role: 'admin',
        label: 'Administrador',
        modules: { dashboard: true, membros: true, chamada: true, relatorios: true, financeiro: true, configuracoes: true },
    },
    {
        role: 'pastor',
        label: 'Pastor',
        modules: { dashboard: true, membros: true, chamada: true, relatorios: true, financeiro: false, configuracoes: false },
    },
    {
        role: 'secretary',
        label: 'Secretário(a)',
        modules: { dashboard: true, membros: true, chamada: true, relatorios: true, financeiro: false, configuracoes: false },
    },
    {
        role: 'treasurer',
        label: 'Tesoureiro(a)',
        modules: { dashboard: true, membros: false, chamada: false, relatorios: true, financeiro: true, configuracoes: false },
    },
];

// Types moved to types.ts

interface AuthContextType {
    session: AuthSession | null;
    users: User[];
    rooms: Room[];
    rolePermissions: RolePermission[];
    login: (email: string, password: string, slug?: string) => Promise<boolean>;
    logout: () => void;
    registerChurch: (data: NewChurchData) => void;
    isLoading: boolean;
    hasRole: (...roles: UserRole[]) => boolean;
    changePassword: (currentPassword: string, newPassword: string) => boolean;
    // Churches (Super Admin)
    churches: Church[];
    updateChurchStatus: (id: string, isActive: boolean) => void;
    // Users CRUD
    addUser: (data: NewUserData) => void;
    updateUser: (id: string, data: Partial<User>) => void;
    deleteUser: (id: string) => void;
    // Rooms CRUD
    addRoom: (data: NewRoomData) => void;
    updateRoom: (id: string, data: Partial<Room>) => void;
    deleteRoom: (id: string) => void;
    // Permissions CRUD
    updateRolePermission: (role: UserRole, modules: Record<string, boolean>) => void;
    // Visitors
    visitors: Visitor[];
    addVisitor: (data: NewVisitorData) => void;
    // Members
    members: Member[];
    addMember: (data: NewMemberData) => void;
    updateMember: (id: string, data: Partial<Member>) => void;
    removeMember: (id: string) => void;
    // Financials
    transactions: FinancialTransaction[];
    addTransaction: (data: NewTransactionData) => void;
    // Attendance
    attendanceSessions: AttendanceSession[];
    addAttendanceSession: (data: NewAttendanceSessionData) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    // ── Hydrate from localStorage (runs only on client) ───────────
    const [session, setSession] = useState<AuthSession | null>(() =>
        lsGet<AuthSession | null>(LS_SESSION, null)
    );
    const [isLoading, setIsLoading] = useState(false);

    const [allUsers, setAllUsers] = useState<User[]>(() =>
        lsGet<User[]>(LS_USERS, [...mockUsers])
    );
    const [allChurches, setAllChurches] = useState<Church[]>(() =>
        lsGet<Church[]>(LS_CHURCHES, [...mockChurches])
    );
    const [allRooms, setAllRooms] = useState<Room[]>(() =>
        lsGet<Room[]>(LS_ROOMS, [...mockRooms])
    );
    const [allVisitors, setAllVisitors] = useState<Visitor[]>(() =>
        lsGet<Visitor[]>(LS_VISITORS, [])
    );
    const [allMembers, setAllMembers] = useState<Member[]>(() =>
        lsGet<Member[]>(LS_MEMBERS, [...mockMembers])
    );
    const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>(() =>
        lsGet<FinancialTransaction[]>(LS_TRANSACTIONS, [...mockTransactions])
    );
    const [allAttendanceSessions, setAllAttendanceSessions] = useState<AttendanceSession[]>(() =>
        lsGet<AttendanceSession[]>(LS_ATTENDANCE, [...mockAttendanceSessions])
    );
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(() =>
        lsGet<RolePermission[]>(LS_PERMISSIONS, defaultRolePermissions)
    );

    // ── Persist to localStorage on every change ───────────────────
    useEffect(() => { lsSet(LS_SESSION, session); }, [session]);
    useEffect(() => { lsSet(LS_PERMISSIONS, rolePermissions); }, [rolePermissions]);
    useEffect(() => { lsSet(LS_USERS, allUsers); }, [allUsers]);
    useEffect(() => { lsSet(LS_CHURCHES, allChurches); }, [allChurches]);
    useEffect(() => { lsSet(LS_ROOMS, allRooms); }, [allRooms]);
    useEffect(() => { lsSet(LS_VISITORS, allVisitors); }, [allVisitors]);
    useEffect(() => { lsSet(LS_MEMBERS, allMembers); }, [allMembers]);
    useEffect(() => { lsSet(LS_TRANSACTIONS, allTransactions); }, [allTransactions]);
    useEffect(() => { lsSet(LS_ATTENDANCE, allAttendanceSessions); }, [allAttendanceSessions]);

    // ── Sync session user/church if allUsers or allChurches changed
    // (e.g. admin updated their own name → session reflects instantly)
    useEffect(() => {
        if (!session) return;
        const freshUser = allUsers.find(u => u.id === session.user.id);
        const freshChurch = allChurches.find(c => c.id === session.church.id);
        if (!freshUser || !freshChurch) return;
        const userChanged = JSON.stringify(freshUser) !== JSON.stringify(session.user);
        const churchChanged = JSON.stringify(freshChurch) !== JSON.stringify(session.church);
        if (userChanged || churchChanged) {
            setSession({ user: freshUser, church: freshChurch });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allUsers, allChurches]);

    // ── Derived state for current church (Memoized for performance) ──
    const users = useMemo(() =>
        session ? allUsers.filter(u => u.church_id === session.church.id) : []
        , [session, allUsers]);

    const rooms = useMemo(() =>
        session ? allRooms.filter(r => r.church_id === session.church.id) : []
        , [session, allRooms]);

    const visitors = useMemo(() =>
        session ? allVisitors.filter(v => v.church_id === session.church.id) : []
        , [session, allVisitors]);

    const members = useMemo(() =>
        session ? allMembers.filter(m => m.church_id === session.church.id) : []
        , [session, allMembers]);

    const transactions = useMemo(() =>
        session ? allTransactions.filter(t => t.church_id === session.church.id) : []
        , [session, allTransactions]);

    const attendanceSessions = useMemo(() =>
        session ? allAttendanceSessions.filter(s => s.church_id === session.church.id) : []
        , [session, allAttendanceSessions]);

    // ─── Auth ─────────────────────────────────────────────────────
    const login = useCallback(async (email: string, password: string, slug?: string): Promise<boolean> => {
        setIsLoading(true);
        await new Promise(r => setTimeout(r, 400));

        // Read latest users/churches from LS so newly registered churches work
        const latestUsers = lsGet<User[]>(LS_USERS, [...mockUsers]);
        const latestChurches = lsGet<Church[]>(LS_CHURCHES, [...mockChurches]);

        let user: User | undefined;
        if (!slug || slug === 'superadmin') {
            // Super Admin login — no slug needed
            user = latestUsers.find(u => u.email === email && u.role === 'super_admin');
        } else {
            const church = latestChurches.find(c => c.slug === slug);
            if (church) {
                if (!church.is_active) {
                    setIsLoading(false);
                    toast.error('Esta igreja está inativa. Entre em contato com o suporte.');
                    return false;
                }
                user = latestUsers.find(u => u.email === email && u.church_id === church.id);
            }
        }

        if (user) {
            // Validate password if user has one set
            if (user.password && user.password !== password) {
                setIsLoading(false);
                toast.error('Senha incorreta');
                return false;
            }
            // For super_admin with no church_id, use a synthetic church object
            const church = user.church_id
                ? (latestChurches.find(c => c.id === user!.church_id) || latestChurches[0])
                : { id: 'system', name: 'Sistema Central', slug: 'superadmin', cnpj: '', city: '', state: '', address: '', phone: '', pastor: '', admin_name: 'Super Admin', admin_email: user.email, plan: 'premium' as const, is_active: true, created_at: '', members_count: 0 };
            const newSession = { user, church };
            setSession(newSession);
            setIsLoading(false);
            return true;
        }
        setIsLoading(false);
        return false;
    }, []);

    const changePassword = useCallback((currentPassword: string, newPassword: string): boolean => {
        if (!session) return false;
        const user = allUsers.find(u => u.id === session.user.id);
        if (!user) return false;
        // Validate current password
        if (user.password && user.password !== currentPassword) {
            return false;
        }
        // Update password
        setAllUsers(prev => prev.map(u => u.id === session.user.id ? { ...u, password: newPassword } : u));
        return true;
    }, [session, allUsers]);

    const logout = useCallback(() => {
        setSession(null);
    }, []);

    const hasRole = useCallback((...roles: UserRole[]) => {
        if (!session) return false;
        return roles.includes(session.user.role);
    }, [session]);

    const registerChurch = useCallback((data: NewChurchData) => {
        const newChurchId = `ch-${Date.now()}`;
        const newChurch: Church = {
            id: newChurchId,
            name: data.churchName,
            slug: data.slug,
            cnpj: '',
            city: '',
            state: '',
            address: '',
            phone: '',
            pastor: data.pastor,
            admin_name: data.pastor,
            admin_email: data.email,
            plan: 'free',
            is_active: true,
            created_at: new Date().toISOString().split('T')[0],
            members_count: 0,
        };
        const adminUser: User = {
            id: `u-${Date.now()}`,
            church_id: newChurchId,
            name: data.pastor,
            email: data.email,
            role: 'admin',
            is_active: true,
            created_at: new Date().toISOString().split('T')[0],
        };

        setAllChurches(prev => [...prev, newChurch]);
        setAllUsers(prev => [...prev, adminUser]);
        setSession({ user: adminUser, church: newChurch });
    }, []);

    const updateChurchStatus = useCallback((id: string, isActive: boolean) => {
        setAllChurches(prev => prev.map(c => c.id === id ? { ...c, is_active: isActive } : c));
    }, []);

    // ─── Users CRUD ───────────────────────────────────────────────
    const addUser = useCallback((data: NewUserData) => {
        if (!session) return;
        const newUser: User = {
            id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            church_id: session.church.id,
            name: data.name,
            email: data.email,
            role: data.role,
            is_active: true,
            created_at: new Date().toISOString().split('T')[0],
        };
        setAllUsers(prev => [...prev, newUser]);
    }, [session]);

    const updateUser = useCallback((id: string, data: Partial<User>) => {
        setAllUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
    }, []);

    const deleteUser = useCallback((id: string) => {
        setAllUsers(prev => prev.filter(u => u.id !== id));
    }, []);

    // ─── Rooms CRUD ───────────────────────────────────────────────
    const addRoom = useCallback((data: NewRoomData) => {
        if (!session) return;
        const newRoom: Room = {
            id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            church_id: session.church.id,
            name: data.name,
            age_group: data.age_group as Room['age_group'],
            is_active: true,
        };
        setAllRooms(prev => [...prev, newRoom]);
    }, [session]);

    const updateRoom = useCallback((id: string, data: Partial<Room>) => {
        setAllRooms(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
    }, []);

    const deleteRoom = useCallback((id: string) => {
        setAllRooms(prev => prev.filter(r => r.id !== id));
    }, []);
    // ─── Members CRUD ─────────────────────────────────────────────
    const addMember = useCallback((data: Omit<Member, 'id' | 'church_id' | 'created_at'>) => {
        if (!session) return;
        const newMember: Member = {
            ...data,
            id: `m-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            church_id: session.church.id,
            created_at: new Date().toISOString(),
        };
        setAllMembers(prev => [...prev, newMember]);
    }, [session]);

    const updateMember = useCallback((id: string, data: Partial<Member>) => {
        setAllMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
    }, []);

    const removeMember = useCallback((id: string) => {
        setAllMembers(prev => prev.filter(m => m.id !== id));
    }, []);

    // ─── Financials CRUD ──────────────────────────────────────────
    const addTransaction = useCallback((data: Omit<FinancialTransaction, 'id' | 'church_id' | 'created_at'>) => {
        if (!session) return;
        const newTx: FinancialTransaction = {
            ...data,
            id: `ft-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            church_id: session.church.id,
            created_at: new Date().toISOString(),
        };
        setAllTransactions(prev => [...prev, newTx]);
    }, [session]);

    // ─── Attendance CRUD ──────────────────────────────────────────
    const addAttendanceSession = useCallback((data: Omit<AttendanceSession, 'id' | 'church_id' | 'created_at'>) => {
        if (!session) return;
        const newSession: AttendanceSession = {
            ...data,
            id: `as-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            church_id: session.church.id,
            created_at: new Date().toISOString(),
        };
        setAllAttendanceSessions(prev => [...prev, newSession]);
    }, [session]);

    // ─── Visitors ─────────────────────────────────────────────────
    const addVisitor = useCallback((data: NewVisitorData) => {
        if (!session) return;
        const v: Visitor = {
            id: `vis-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            church_id: session.church.id,
            room_id: data.room_id,
            room_name: data.room_name,
            session_date: data.session_date,
            name: data.name,
            address: data.address,
            phone: data.phone,
            registered_at: new Date().toISOString(),
        };
        setAllVisitors(prev => [...prev, v]);
    }, [session]);

    // ─── Permissions CRUD ─────────────────────────────────────────
    const updateRolePermission = useCallback((role: UserRole, modules: Record<string, boolean>) => {
        setRolePermissions(prev =>
            prev.map(rp => {
                if (rp.role !== role) return rp;
                // Admins always keep configuracoes access — prevent lockout
                const safeModules = role === 'admin'
                    ? { ...modules, configuracoes: true }
                    : modules;
                return { ...rp, modules: safeModules };
            })
        );
    }, []);

    return (
        <AuthContext.Provider value={{
            session, users, rooms, rolePermissions, visitors,
            login, logout, registerChurch, isLoading, hasRole, changePassword,
            churches: allChurches, updateChurchStatus,
            addUser, updateUser, deleteUser,
            addRoom, updateRoom, deleteRoom,
            updateRolePermission,
            addVisitor,
            members, addMember, updateMember, removeMember,
            transactions, addTransaction,
            attendanceSessions, addAttendanceSession,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}
