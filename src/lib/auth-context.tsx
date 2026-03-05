'use client';

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode, useRef } from 'react';
import {
    AuthSession, User, Room, Church, UserRole, Visitor,
    Member, FinancialTransaction, AttendanceSession, FinancialCategory,
    NewUserData, NewRoomData, NewVisitorData, NewChurchData,
    NewMemberData, NewTransactionData, NewAttendanceSessionData, NewCategoryData
} from './types';
import { toast } from 'sonner';
import { createClient } from './supabase/client';
import { getFriendlyErrorMessage } from './validators';
import type { SupabaseClient } from '@supabase/supabase-js';

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

interface AuthContextType {
    session: AuthSession | null;
    users: User[];
    rooms: Room[];
    rolePermissions: RolePermission[];
    login: (email: string, password: string, slug?: string) => Promise<boolean>;
    logout: () => void;
    registerChurch: (data: NewChurchData) => Promise<{ success: boolean; error?: string }>;
    isLoading: boolean;
    hasRole: (...roles: UserRole[]) => boolean;
    changePassword: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    // Churches (Super Admin)
    churches: Church[];
    updateChurchStatus: (id: string, isActive: boolean) => void;
    updateChurchData: (id: string, data: Partial<Church>) => Promise<{ success: boolean; error?: string }>;
    deleteChurch: (id: string) => Promise<{ success: boolean; error?: string }>;
    // Users CRUD
    addUser: (data: NewUserData) => Promise<{ success: boolean; error?: string }>;
    updateUser: (id: string, data: Partial<User>) => Promise<{ success: boolean; error?: string }>;
    deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;
    // Rooms CRUD
    addRoom: (data: NewRoomData) => Promise<{ success: boolean, error?: string }>;
    updateRoom: (id: string, data: Partial<Room>) => Promise<{ success: boolean, error?: string }>;
    deleteRoom: (id: string) => Promise<{ success: boolean, error?: string }>;
    // Permissions CRUD
    updateRolePermission: (role: UserRole, modules: Record<string, boolean>) => Promise<{ success: boolean; error?: string }>;
    // Visitors
    visitors: Visitor[];
    addVisitor: (data: NewVisitorData) => Promise<{ success: boolean; error?: string }>;
    // Members
    members: Member[];
    addMember: (data: NewMemberData) => Promise<{ success: boolean, error?: string }>;
    updateMember: (id: string, data: Partial<Member>) => Promise<{ success: boolean, error?: string }>;
    removeMember: (id: string) => Promise<{ success: boolean, error?: string }>;
    // Financials
    transactions: FinancialTransaction[];
    addTransaction: (data: NewTransactionData) => Promise<{ success: boolean, error?: string }>;
    categories: FinancialCategory[];
    addCategory: (data: NewCategoryData) => Promise<{ success: boolean, error?: string }>;
    updateCategory: (id: string, name: string) => Promise<{ success: boolean, error?: string }>;
    deleteCategory: (id: string) => Promise<{ success: boolean, error?: string }>;
    // Attendance
    attendanceSessions: AttendanceSession[];
    saveAttendanceSession: (data: NewAttendanceSessionData) => Promise<{ success: boolean, error?: string, data?: AttendanceSession }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helper: Map DB row to app type ────────────────────────────────
function mapProfile(row: Record<string, unknown>): User {
    return {
        id: row.id as string,
        church_id: (row.church_id as string) || '',
        name: row.name as string,
        email: row.email as string,
        role: row.role as UserRole,
        is_active: row.is_active as boolean,
        avatar: row.avatar as string | undefined,
        created_at: row.created_at as string,
    };
}

function mapChurch(row: Record<string, unknown>): Church {
    return {
        id: row.id as string,
        name: row.name as string,
        slug: row.slug as string,
        cnpj: (row.cnpj as string) || '',
        city: (row.city as string) || '',
        state: (row.state as string) || '',
        address: (row.address as string) || '',
        phone: (row.phone as string) || '',
        pastor: (row.pastor as string) || '',
        admin_name: (row.admin_name as string) || '',
        admin_email: (row.admin_email as string) || '',
        logo: row.logo as string | undefined,
        plan: (row.plan as Church['plan']) || 'free',
        is_active: row.is_active as boolean,
        created_at: row.created_at as string,
        members_count: (row.members_count as number) || 0,
    };
}

// ─── Provider ─────────────────────────────────────────────────────
export function AuthProvider({ children }: { children: ReactNode }) {
    const [supabase] = useState<SupabaseClient>(() => createClient());
    const [session, setSession] = useState<AuthSession | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Data states
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [allChurches, setAllChurches] = useState<Church[]>([]);
    const [allRooms, setAllRooms] = useState<Room[]>([]);
    const [allVisitors, setAllVisitors] = useState<Visitor[]>([]);
    const [allMembers, setAllMembers] = useState<Member[]>([]);
    const [allTransactions, setAllTransactions] = useState<FinancialTransaction[]>([]);
    const [allCategories, setAllCategories] = useState<FinancialCategory[]>([]);
    const [allAttendanceSessions, setAllAttendanceSessions] = useState<AttendanceSession[]>([]);
    const [rolePermissions, setRolePermissions] = useState<RolePermission[]>(defaultRolePermissions);

    // Track which user ID is currently being loaded to prevent race conditions
    const loadingIds = useRef<Set<string>>(new Set());
    const initialLoadDone = useRef(false);
    // Track if session data is already loaded to avoid re-loading on TOKEN_REFRESHED
    const sessionLoadedRef = useRef(false);

    // ── Load session on mount ─────────────────────────────────────
    useEffect(() => {
        let isMounted = true;

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, authSession) => {
            if (!isMounted) return;
            console.log(`Auth event: ${event}`, authSession?.user?.email);

            if (event === 'INITIAL_SESSION') {
                if (authSession?.user) {
                    await loadUserSession(authSession.user.id);
                } else {
                    initialLoadDone.current = true;
                    setIsLoading(false);
                }
            } else if (event === 'SIGNED_IN' && authSession?.user) {
                if (sessionLoadedRef.current || loadingIds.current.has(authSession.user.id)) {
                    console.log(`Auth event: SIGNED_IN ignored (already ${sessionLoadedRef.current ? 'loaded' : 'loading'})`);
                    return;
                }
                // FIX: ignorar SIGNED_IN durante inicialização — INITIAL_SESSION cuida disso
                if (!initialLoadDone.current) {
                    console.log('Auth event: SIGNED_IN ignored (INITIAL_SESSION pending)');
                    return;
                }
                await loadUserSession(authSession.user.id);
            } else if (event === 'TOKEN_REFRESHED' && authSession?.user) {
                console.log('Auth event: TOKEN_REFRESHED — session kept alive');
                // FIX: garantir que a sessão não seja perdida após refresh longo
                if (!sessionLoadedRef.current && !loadingIds.current.has(authSession.user.id)) {
                    await loadUserSession(authSession.user.id);
                }
            } else if (event === 'SIGNED_OUT') {
                sessionLoadedRef.current = false;
                initialLoadDone.current = false;
                setSession(null);
                clearAllData();
                setIsLoading(false);
            } else if (event === 'USER_UPDATED' && authSession?.user) {
                sessionLoadedRef.current = false;
                await loadUserSession(authSession.user.id);
            }
        });

        // Safety net: if nothing resolved after 6s, force-check and unblock
        const timeoutId = setTimeout(async () => {
            // If already loaded or ALREADY loading something else, don't force a check
            if (!isMounted || sessionLoadedRef.current || initialLoadDone.current || loadingIds.current.size > 0) {
                return;
            }

            console.log('Session timeout (6s) — forcing session check...');
            try {
                const { data: { session: s } } = await supabase.auth.getSession();
                if (!isMounted || sessionLoadedRef.current) return;
                if (s?.user) {
                    await loadUserSession(s.user.id, true);
                } else {
                    initialLoadDone.current = true;
                    setIsLoading(false);
                }
            } catch {
                if (isMounted) { initialLoadDone.current = true; setIsLoading(false); }
            }
        }, 6000);

        return () => {
            isMounted = false;
            subscription.unsubscribe();
            clearTimeout(timeoutId);
            loadingIds.current.clear();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const clearAllData = () => {
        setAllUsers([]);
        setAllChurches([]);
        setAllRooms([]);
        setAllVisitors([]);
        setAllMembers([]);
        setAllTransactions([]);
        setAllCategories([]);
        setAllAttendanceSessions([]);
        setRolePermissions(defaultRolePermissions);
    };

    const loadUserSession = async (userId: string, isFallback = false): Promise<boolean> => {
        if (loadingIds.current.has(userId)) {
            console.log(`loadUserSession: Already loading for user: ${userId} ${isFallback ? '(fallback call ignored)' : ''}`);
            return true;
        }
        loadingIds.current.add(userId);
        setIsLoading(true);
        const startTime = Date.now();

        // Internal helper for queries with timeout
        const fetchWithTimeout = async <T,>(promise: Promise<{ data: T | null; error: any }> | any, timeoutMs = 5000): Promise<{ data: T | null; error: any }> => {
            const timeoutPromise = new Promise<{ data: null; error: any }>((_, reject) =>
                setTimeout(() => reject(new Error('Query timeout')), timeoutMs)
            );
            return Promise.race([promise, timeoutPromise]);
        };

        try {
            console.log('loadUserSession: Fetching profile for user:', userId);
            // 1. Get profile with internal timeout
            const profilePromise = supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            const { data: profile, error: profileError } = await fetchWithTimeout<any>(profilePromise)
                .catch(err => {
                    console.error('loadUserSession: Profile fetch timed out or failed:', err);
                    return { data: null, error: err };
                });

            if (profileError || !profile) {
                if (profileError) {
                    console.error('loadUserSession: Profile fetch error:', profileError);
                    // If it's a 406 or Not Found, the profile might be missing
                    if (profileError.code === 'PGRST116') {
                        console.warn('loadUserSession: Profile not found for user:', userId);
                        await supabase.auth.signOut();
                    } else if (profileError.message?.includes('Failed to fetch') || profileError.message?.includes('timeout')) {
                        toast.error('Erro de conexão com o servidor. Verifique sua internet.');
                    }
                }
                return false;
            }

            console.log('loadUserSession: Profile loaded successfully:', profile.email, 'Role:', profile.role);

            const user = mapProfile(profile);
            // console.log('Profile loaded:', user.name);

            // 2. Get church
            let church: Church;
            if (user.role === 'super_admin') {
                church = {
                    id: 'system', name: 'Sistema Central', slug: 'superadmin',
                    cnpj: '', city: '', state: '', address: '', phone: '',
                    pastor: '', admin_name: 'Super Admin', admin_email: user.email,
                    plan: 'premium', is_active: true, created_at: '', members_count: 0,
                };
                // Load all churches for super admin
                const { data: churches, error: chError } = await supabase.from('churches').select('*');
                if (chError) console.error('Error loading churches for super admin:', chError);
                if (churches) setAllChurches(churches.map(mapChurch));
            } else {
                // Fetch church with internal timeout
                const churchPromise = supabase
                    .from('churches')
                    .select('*')
                    .eq('id', user.church_id)
                    .single();

                const { data: churchData, error: churchError } = await fetchWithTimeout<any>(churchPromise)
                    .catch(err => {
                        console.error('loadUserSession: Church fetch timed out or failed:', err);
                        return { data: null, error: err };
                    });

                if (churchError || !churchData) {
                    console.error('Church not found:', churchError);
                    if (churchError?.message?.includes('fetch')) {
                        toast.error('Erro de rede ao carregar dados da igreja.');
                    } else {
                        toast.error('Igreja não encontrada para este usuário.');
                    }
                    return false;
                }
                church = mapChurch(churchData);
                setAllChurches([church]);
            }

            setSession({ user, church });
            // Mark session as loaded so TOKEN_REFRESHED / SIGNED_IN won't trigger a full reload
            sessionLoadedRef.current = true;

            // 3. Load church data in BACKGROUND (don't await) 
            // This prevents the UI from freezing if one of the 8 queries is slow.
            loadChurchData(user.church_id, user.role).catch(err => {
                console.warn('loadUserSession: Background data loading failed:', err);
            });

            console.log(`loadUserSession: Basic session ready in ${Date.now() - startTime}ms`);
            return true;
        } catch (err: any) {
            console.error('Exception in loadUserSession:', err);
            const isConn = err?.message?.includes('fetch') || err?.message?.includes('Network');
            toast.error(isConn
                ? 'Sua conexão com o banco de dados falhou.'
                : 'Erro ao processar sessão do usuário.');
            return false;
        } finally {
            loadingIds.current.delete(userId);
            initialLoadDone.current = true;
            setIsLoading(false);
        }
    };

    const loadChurchData = async (churchId: string, role: UserRole) => {
        if (role === 'super_admin') {
            // Super admin loads all profiles
            const { data: profiles } = await supabase.from('profiles').select('*');
            if (profiles) setAllUsers(profiles.map(mapProfile));
            return;
        }

        // Load data for the user's church
        const [profilesRes, roomsRes, membersRes, transactionsRes, attendanceRes, visitorsRes, permissionsRes, categoriesRes] = await Promise.all([
            supabase.from('profiles').select('*').eq('church_id', churchId),
            supabase.from('rooms').select('*').eq('church_id', churchId),
            supabase.from('members').select('*').eq('church_id', churchId),
            supabase.from('financial_transactions').select('*').eq('church_id', churchId).order('transaction_date', { ascending: false }),
            supabase.from('attendance_sessions').select('*').eq('church_id', churchId).order('session_date', { ascending: false }),
            supabase.from('visitors').select('*').eq('church_id', churchId),
            supabase.from('role_permissions').select('*').eq('church_id', churchId),
            supabase.from('financial_categories').select('*').eq('church_id', churchId).order('name'),
        ]);

        if (profilesRes.data) setAllUsers(profilesRes.data.map(mapProfile));
        if (roomsRes.data) setAllRooms(roomsRes.data as Room[]);
        if (membersRes.data) setAllMembers(membersRes.data as Member[]);
        if (transactionsRes.data) setAllTransactions(transactionsRes.data as FinancialTransaction[]);
        if (attendanceRes.data) setAllAttendanceSessions(attendanceRes.data as AttendanceSession[]);
        if (visitorsRes.data) setAllVisitors(visitorsRes.data as Visitor[]);
        if (permissionsRes.data && permissionsRes.data.length > 0) {
            setRolePermissions(permissionsRes.data as RolePermission[]);
        }
        if (categoriesRes.data) setAllCategories(categoriesRes.data as FinancialCategory[]);
        console.log('loadChurchData: Background all-data fetch completed.');
    };

    // ── Derived state for current church ──────────────────────────
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

    const categories = useMemo(() =>
        session ? allCategories.filter(c => c.church_id === session.church.id) : []
        , [session, allCategories]);

    const attendanceSessions = useMemo(() =>
        session ? allAttendanceSessions.filter(s => s.church_id === session.church.id) : []
        , [session, allAttendanceSessions]);

    // ─── Auth ─────────────────────────────────────────────────────
    const login = useCallback(async (email: string, password: string, slug?: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            console.log('Login attempt for:', email);
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                toast.error(error.message === 'Invalid login credentials'
                    ? 'Email ou senha incorretos'
                    : error.message);
                setIsLoading(false);
                return false;
            }

            if (!data.user) {
                setIsLoading(false);
                return false;
            }

            // We explicitly load the session here to ensure redirect happens only after data is ready
            const success = await loadUserSession(data.user.id);
            return success;
        } catch (err: any) {
            console.error('Login exception:', err);
            toast.error('Ocorreu um erro inesperado ao fazer login.');
            setIsLoading(false);
            return false;
        }
        // No setIsLoading(false) in finally here because loadUserSession or the redirect will handle it
    }, [supabase, loadUserSession]);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) return { success: false, error: 'Usuário não autenticado.' };

            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            if (verifyError) {
                return { success: false, error: 'Senha atual incorreta.' };
            }

            if (newPassword.length < 6) {
                return { success: false, error: 'A nova senha deve ter pelo menos 6 caracteres.' };
            }

            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                console.error('Password change error:', error);
                return { success: false, error: getFriendlyErrorMessage(error) };
            }
            return { success: true };
        } catch (err: any) {
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [supabase]);

    const logout = useCallback(async () => {
        await supabase.auth.signOut();
        setSession(null);
        clearAllData();
    }, [supabase]);

    const hasRole = useCallback((...roles: UserRole[]) => {
        if (!session) return false;
        return roles.includes(session.user.role);
    }, [session]);

    const registerChurch = useCallback(async (data: NewChurchData): Promise<{ success: boolean; error?: string }> => {
        try {
            // Use the RPC for atomic and fast registration
            const { data: newChurch, error: rpcError } = await supabase.rpc('register_new_church', {
                p_email: data.email,
                p_password: data.password,
                p_church_name: data.churchName,
                p_slug: data.slug,
                p_pastor: data.pastor
            });

            if (rpcError || !newChurch) {
                console.error('Registration RPC error:', rpcError);
                return { success: false, error: getFriendlyErrorMessage(rpcError) };
            }

            // Auto sign-in
            try {
                const signInResult = await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password,
                });

                if (!signInResult.error && signInResult.data?.user) {
                    await loadUserSession(signInResult.data.user.id);
                }
            } catch (e) {
                console.error('Auto-login failed:', e);
            }

            return { success: true };
        } catch (err: any) {
            console.error('Registration error details:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [supabase, loadUserSession]);


    const updateChurchStatus = useCallback(async (id: string, isActive: boolean) => {
        const { error } = await supabase
            .from('churches')
            .update({ is_active: isActive })
            .eq('id', id);

        if (!error) {
            setAllChurches(prev => prev.map(c => c.id === id ? { ...c, is_active: isActive } : c));
        }
    }, [supabase]);

    const updateChurchData = useCallback(async (id: string, data: Partial<Church>): Promise<{ success: boolean; error?: string }> => {
        try {
            // SECURITY FIX: Whitelist allowed fields to prevent slug/plan/is_active injection
            const allowedFields = ['name', 'cnpj', 'pastor', 'address', 'phone', 'email', 'website', 'description', 'logo_url', 'member_registration_enabled'];
            const sanitizedData: Record<string, unknown> = {};
            for (const key of allowedFields) {
                if (key in data) {
                    sanitizedData[key] = (data as Record<string, unknown>)[key];
                }
            }

            if (Object.keys(sanitizedData).length === 0) {
                return { success: false, error: 'Nenhum campo válido para atualizar.' };
            }

            const { error } = await supabase
                .from('churches')
                .update(sanitizedData)
                .eq('id', id);

            if (error) throw error;

            setAllChurches(prev => prev.map(c => c.id === id ? { ...c, ...sanitizedData } : c));

            // Also update the current session if it's the active church
            setSession(prev => {
                if (prev && prev.church.id === id) {
                    return { ...prev, church: { ...prev.church, ...sanitizedData } };
                }
                return prev;
            });

            return { success: true };
        } catch (err: any) {
            console.error('Error updating church data:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [supabase]);

    const deleteChurch = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data: result, error } = await supabase.rpc('delete_church_cascade', {
                p_church_id: id,
            });

            if (error) {
                console.error('deleteChurch RPC error:', error);
                return { success: false, error: error.message };
            }

            if (!result?.success) {
                const msg = result?.error || 'Erro ao excluir a igreja.';
                console.error('deleteChurch failed:', msg);
                return { success: false, error: getFriendlyErrorMessage(msg) };
            }

            // Remove church from local state
            setAllChurches(prev => prev.filter(c => c.id !== id));
            // Also remove related users/profiles from local state
            setAllUsers(prev => prev.filter(u => u.church_id !== id));

            return { success: true };
        } catch (err: any) {
            console.error('Exception in deleteChurch:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [supabase]);

    // ─── Users CRUD ───────────────────────────────────────────────
    const addUser = useCallback(async (data: NewUserData): Promise<{ success: boolean; error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada.' };

        try {
            const { data: newProfile, error } = await supabase.rpc('admin_create_user', {
                p_email: data.email,
                p_password: data.password || 'temp123456',
                p_name: data.name,
                p_role: data.role,
                p_church_id: session.church.id
            });

            if (error || !newProfile) {
                console.error('Admin create user error:', error);
                return { success: false, error: getFriendlyErrorMessage(error) };
            }

            setAllUsers(prev => [...prev, mapProfile(newProfile as any)]);
            return { success: true };
        } catch (error: any) {
            console.error('Add user error:', error);
            return { success: false, error: getFriendlyErrorMessage(error) };
        }
    }, [session, supabase]);



    const updateUser = useCallback(async (id: string, data: Partial<User>): Promise<{ success: boolean; error?: string }> => {
        try {
            const { data: updatedProfile, error } = await supabase.rpc('admin_update_user', {
                p_user_id: id,
                p_email: data.email,
                p_name: data.name,
                p_role: data.role,
                p_is_active: data.is_active
            });

            if (error) {
                console.error('Error updating user via RPC:', error);
                return { success: false, error: getFriendlyErrorMessage(error) };
            }

            if (updatedProfile) {
                setAllUsers(prev => prev.map(u => u.id === id ? mapProfile(updatedProfile as any) : u));
            }
            return { success: true };
        } catch (error: any) {
            console.error('Update user catch error:', error);
            return { success: false, error: getFriendlyErrorMessage(error) };
        }
    }, [supabase]);

    const deleteUser = useCallback(async (id: string): Promise<{ success: boolean; error?: string }> => {
        try {
            const { error } = await supabase.rpc('delete_user_complete', { target_user_id: id });

            if (error) {
                console.error('Error deleting user:', error);
                const { error: fallbackError } = await supabase
                    .from('profiles')
                    .delete()
                    .eq('id', id);

                if (fallbackError) {
                    return { success: false, error: getFriendlyErrorMessage(fallbackError) };
                }
            }

            setAllUsers(prev => prev.filter(u => u.id !== id));
            return { success: true };
        } catch (error: any) {
            return { success: false, error: getFriendlyErrorMessage(error) };
        }
    }, [supabase]);



    // ─── Rooms CRUD ───────────────────────────────────────────────
    const addRoom = useCallback(async (data: NewRoomData): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Usuário não autenticado' };

        try {
            const { data: newRoom, error } = await supabase
                .from('rooms')
                .insert({
                    church_id: session.church.id,
                    name: data.name,
                    age_group: data.age_group,
                    is_active: true,
                })
                .select()
                .single();

            if (error) throw error;
            if (newRoom) {
                setAllRooms(prev => [...prev, newRoom as Room]);
                return { success: true };
            }
            return { success: false, error: 'Erro desconhecido ao criar sala' };
        } catch (err: any) {
            console.error('[addRoom] Error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    const updateRoom = useCallback(async (id: string, data: Partial<Room>): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada' };
        try {
            const { error } = await supabase
                .from('rooms')
                .update(data)
                .eq('id', id)
                .eq('church_id', session.church.id); // SECURITY FIX: filter by church_id

            if (error) throw error;
            setAllRooms(prev => prev.map(r => r.id === id ? { ...r, ...data } : r));
            return { success: true };
        } catch (err: any) {
            console.error('[updateRoom] Error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    const deleteRoom = useCallback(async (id: string): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada' };

        // Check if room has active members
        const membersInRoom = allMembers.filter(m => m.room_id === id && m.status === 'ativo');
        if (membersInRoom.length > 0) {
            return { success: false, error: `Esta sala possui ${membersInRoom.length} membro(s) ativo(s). Remova ou transfira os membros antes de excluir.` };
        }

        try {
            const { error } = await supabase
                .from('rooms')
                .delete()
                .eq('id', id)
                .eq('church_id', session.church.id); // SECURITY FIX: filter by church_id

            if (error) throw error;
            setAllRooms(prev => prev.filter(r => r.id !== id));
            return { success: true };
        } catch (err: any) {
            console.error('[deleteRoom] Error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase, allMembers]);

    // ─── Members CRUD ─────────────────────────────────────────────
    const addMember = useCallback(async (data: Omit<Member, 'id' | 'church_id' | 'created_at'>): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Usuário não autenticado' };

        try {
            const { data: newMember, error } = await supabase
                .from('members')
                .insert({
                    ...data,
                    church_id: session.church.id,
                })
                .select()
                .single();

            if (error) throw error;
            if (newMember) {
                setAllMembers(prev => [...prev, newMember as Member]);
                return { success: true };
            }
            return { success: false, error: 'Erro desconhecido ao cadastrar membro' };
        } catch (err: any) {
            console.error('[addMember] Error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    const updateMember = useCallback(async (id: string, data: Partial<Member>): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada' };
        try {
            const { error } = await supabase
                .from('members')
                .update(data)
                .eq('id', id)
                .eq('church_id', session.church.id); // SECURITY FIX: filter by church_id

            if (error) throw error;
            setAllMembers(prev => prev.map(m => m.id === id ? { ...m, ...data } : m));
            return { success: true };
        } catch (err: any) {
            console.error('[updateMember] Error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    const removeMember = useCallback(async (id: string): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada' };
        try {
            console.log(`[removeMember] Attempting to remove member ${id} for church ${session.church.id}`);
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', id)
                .eq('church_id', session.church.id);

            if (error) {
                console.error('[removeMember] Supabase Error:', error);
                throw error;
            }

            setAllMembers(prev => prev.filter(m => m.id !== id));
            return { success: true };
        } catch (err: any) {
            console.error('[removeMember] Full Error Object:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    // ─── Financials CRUD ──────────────────────────────────────────
    const addTransaction = useCallback(async (data: Omit<FinancialTransaction, 'id' | 'church_id' | 'created_at'>): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada' };

        // Validation: amount must be positive
        if (!data.amount || data.amount <= 0) {
            return { success: false, error: 'O valor da transação deve ser maior que zero.' };
        }

        try {
            const { data: newTx, error } = await supabase
                .from('financial_transactions')
                .insert({
                    ...data,
                    church_id: session.church.id,
                })
                .select()
                .single();

            if (!error && newTx) {
                setAllTransactions(prev => [...prev, newTx as FinancialTransaction]);
                return { success: true };
            }
            if (error) throw error;
            return { success: false, error: 'Erro desconhecido ao registrar transação' };
        } catch (err: any) {
            console.error('[addTransaction] Error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    const addCategory = useCallback(async (data: NewCategoryData): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada' };
        try {
            const { data: newCat, error } = await supabase
                .from('financial_categories')
                .insert({
                    church_id: session.church.id,
                    name: data.name,
                    type: data.type,
                })
                .select()
                .single();

            if (!error && newCat) {
                setAllCategories(prev => [...prev, newCat as FinancialCategory]);
                return { success: true };
            }
            if (error) throw error;
            return { success: false, error: 'Erro desconhecido ao adicionar categoria' };
        } catch (err: any) {
            console.error('[addCategory] Error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    const updateCategory = useCallback(async (id: string, name: string): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada' };
        try {
            const { error } = await supabase
                .from('financial_categories')
                .update({ name })
                .eq('id', id)
                .eq('church_id', session.church.id);

            if (error) throw error;
            setAllCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
            return { success: true };
        } catch (err: any) {
            console.error('[updateCategory] Error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    const deleteCategory = useCallback(async (id: string): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada' };
        try {
            const { error } = await supabase
                .from('financial_categories')
                .delete()
                .eq('id', id)
                .eq('church_id', session.church.id);

            if (error) throw error;
            setAllCategories(prev => prev.filter(c => c.id !== id));
            return { success: true };
        } catch (err: any) {
            console.error('[deleteCategory] Error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    // ─── Attendance CRUD ──────────────────────────────────────────
    const saveAttendanceSession = useCallback(async (data: NewAttendanceSessionData): Promise<{ success: boolean, error?: string, data?: AttendanceSession }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada' };

        try {
            // CRITICAL: Remove the `id` field from the payload.
            const { id: _removedId, ...dataWithoutId } = data;

            const payload = {
                ...dataWithoutId,
                church_id: session.church.id,
            };

            const { data: newSession, error } = await supabase
                .from('attendance_sessions')
                .upsert(payload, { onConflict: 'church_id,room_id,session_date' })
                .select()
                .single();

            if (error) throw error;

            if (newSession) {
                setAllAttendanceSessions(prev => {
                    const filtered = prev.filter(s => s.id !== newSession.id);
                    return [...filtered, newSession as AttendanceSession];
                });
                return { success: true, data: newSession as AttendanceSession };
            }
            return { success: false, error: 'Erro desconhecido ao salvar chamada' };
        } catch (err: any) {
            console.error('[saveAttendanceSession] Error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);


    // ─── Visitors ─────────────────────────────────────────────────
    const addVisitor = useCallback(async (data: NewVisitorData): Promise<{ success: boolean; error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada.' };

        try {
            const { data: newVisitor, error } = await supabase
                .from('visitors')
                .insert([{
                    church_id: session.church.id,
                    room_id: data.room_id,
                    room_name: data.room_name,
                    session_date: data.session_date,
                    name: data.name.trim(),
                    address: data.address?.trim() || null,
                    phone: data.phone?.trim() || null,
                }])
                .select()
                .single();

            if (error) {
                console.error('[addVisitor] Error:', error);
                return { success: false, error: getFriendlyErrorMessage(error) };
            }

            setAllVisitors(prev => [...prev, newVisitor as Visitor]);
            return { success: true };
        } catch (err: any) {
            console.error('[addVisitor] Catch error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    // ─── Permissions CRUD ─────────────────────────────────────────
    const updateRolePermission = useCallback(async (role: UserRole, modules: Record<string, boolean>): Promise<{ success: boolean; error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada.' };

        try {
            const safeModules = role === 'admin'
                ? { ...modules, configuracoes: true }
                : modules;

            // Update in DB
            const { error } = await supabase
                .from('role_permissions')
                .update({ modules: safeModules })
                .eq('church_id', session.church.id)
                .eq('role', role);

            if (error) {
                console.error('[updateRolePermission] Error:', error);
                return { success: false, error: getFriendlyErrorMessage(error) };
            }

            setRolePermissions(prev =>
                prev.map(rp => {
                    if (rp.role !== role) return rp;
                    return { ...rp, modules: safeModules };
                })
            );
            return { success: true };
        } catch (err: any) {
            console.error('[updateRolePermission] Catch error:', err);
            return { success: false, error: getFriendlyErrorMessage(err) };
        }
    }, [session, supabase]);

    return (
        <AuthContext.Provider value={{
            session, users, rooms, rolePermissions, visitors,
            login, logout, registerChurch, isLoading, hasRole, changePassword,
            churches: allChurches, updateChurchStatus,
            updateChurchData, deleteChurch,
            addUser, updateUser, deleteUser,
            addRoom, updateRoom, deleteRoom,
            updateRolePermission,
            addVisitor,
            members, addMember, updateMember, removeMember,
            transactions, addTransaction,
            categories, addCategory, updateCategory, deleteCategory,
            attendanceSessions, saveAttendanceSession,
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
