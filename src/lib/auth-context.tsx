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
    registerChurch: (data: NewChurchData) => Promise<boolean>;
    isLoading: boolean;
    hasRole: (...roles: UserRole[]) => boolean;
    changePassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
    // Churches (Super Admin)
    churches: Church[];
    updateChurchStatus: (id: string, isActive: boolean) => void;
    updateChurchData: (id: string, data: Partial<Church>) => Promise<{ success: boolean; error?: string }>;
    deleteChurch: (id: string) => Promise<{ success: boolean; error?: string }>;
    // Users CRUD
    addUser: (data: NewUserData) => void;
    updateUser: (id: string, data: Partial<User>) => void;
    deleteUser: (id: string) => void;
    // Rooms CRUD
    addRoom: (data: NewRoomData) => Promise<{ success: boolean, error?: string }>;
    updateRoom: (id: string, data: Partial<Room>) => Promise<{ success: boolean, error?: string }>;
    deleteRoom: (id: string) => Promise<{ success: boolean, error?: string }>;
    // Permissions CRUD
    updateRolePermission: (role: UserRole, modules: Record<string, boolean>) => void;
    // Visitors
    visitors: Visitor[];
    addVisitor: (data: NewVisitorData) => void;
    // Members
    members: Member[];
    addMember: (data: NewMemberData) => Promise<{ success: boolean, error?: string }>;
    updateMember: (id: string, data: Partial<Member>) => void;
    removeMember: (id: string) => void;
    // Financials
    transactions: FinancialTransaction[];
    addTransaction: (data: NewTransactionData) => void;
    categories: FinancialCategory[];
    addCategory: (data: NewCategoryData) => Promise<void>;
    updateCategory: (id: string, name: string) => Promise<void>;
    deleteCategory: (id: string) => Promise<void>;
    // Attendance
    attendanceSessions: AttendanceSession[];
    saveAttendanceSession: (data: NewAttendanceSessionData) => Promise<AttendanceSession | null>;
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
    const loadingIds = useRef<Set<string>>(new Set());

    // ── Load session on mount ─────────────────────────────────────
    useEffect(() => {
        const initSession = async () => {
            // Safety timeout: If session restoration takes more than 5 seconds, 
            // release the loading state so the user can at least try to log in manually.
            const timeoutId = setTimeout(() => {
                setIsLoading(false);
                console.log('Session initialization timed out, releasing loading state.');
            }, 5000);

            try {
                const { data: { session: authSession } } = await supabase.auth.getSession();
                if (authSession?.user) {
                    await loadUserSession(authSession.user.id);
                }
            } catch (err) {
                console.error('Error loading session:', err);
            } finally {
                clearTimeout(timeoutId);
                setIsLoading(false);
            }
        };
        initSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, authSession) => {
            if (event === 'SIGNED_IN' && authSession?.user) {
                await loadUserSession(authSession.user.id);
            } else if (event === 'SIGNED_OUT') {
                setSession(null);
                clearAllData();
            }
        });

        return () => subscription.unsubscribe();
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

    const loadUserSession = async (userId: string): Promise<boolean> => {
        if (loadingIds.current.has(userId)) return true;
        loadingIds.current.add(userId);

        try {
            // Reduced noise
            // console.log('Fetching profile for user:', userId);
            // 1. Get profile
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError || !profile) {
                if (profileError) {
                    console.error('loadUserSession: Profile fetch error:', profileError);
                    if (profileError.message?.includes('Failed to fetch') || profileError.message?.includes('timeout')) {
                        toast.error('Erro de conexão com o servidor. Verifique sua internet.');
                    } else {
                        toast.error('Erro ao carregar perfil: ' + profileError.message);
                    }
                } else {
                    console.warn('loadUserSession: Profile not found for user:', userId);
                    // If profile is missing (e.g. deleted), we should sign out
                    await supabase.auth.signOut();
                    setSession(null);
                    clearAllData();
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
                const { data: churchData, error: churchError } = await supabase
                    .from('churches')
                    .select('*')
                    .eq('id', user.church_id)
                    .single();

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

            // 3. Load church data
            await loadChurchData(user.church_id, user.role);
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
            const { data, error } = await supabase.auth.signInWithPassword({ email, password });

            if (error) {
                toast.error(error.message === 'Invalid login credentials'
                    ? 'Email ou senha incorretos'
                    : error.message);
                setIsLoading(false); // Immediate reset
                return false;
            }

            if (!data.user) return false;

            // Get the user's profile to check church association
            const { data: profile } = await supabase
                .from('profiles')
                .select('*, churches:church_id(*)')
                .eq('id', data.user.id)
                .single();

            if (!profile) {
                console.error('login: Profile not found for user ID:', data.user.id);
                toast.error('Perfil não encontrado no sistema.');
                await supabase.auth.signOut();
                setIsLoading(false);
                return false;
            }

            console.log('login: User authenticated, profile role:', profile.role);

            // Check if user belongs to the correct church (by slug)
            if (slug && slug !== 'superadmin' && profile.role !== 'super_admin') {
                const { data: church } = await supabase
                    .from('churches')
                    .select('*')
                    .eq('slug', slug)
                    .single();

                if (!church) {
                    toast.error('Igreja não encontrada.');
                    await supabase.auth.signOut();
                    return false;
                }

                if (!church.is_active) {
                    toast.error('Esta igreja está inativa. Entre em contato com o suporte.');
                    await supabase.auth.signOut();
                    return false;
                }

                if (profile.church_id !== church.id) {
                    toast.error('Você não tem acesso a esta igreja.');
                    await supabase.auth.signOut();
                    return false;
                }
            }

            // Session will be loaded via the onAuthStateChange listener
            const success = await loadUserSession(data.user.id);
            if (!success) {
                await supabase.auth.signOut();
                setIsLoading(false);
                return false;
            }
            return true;
        } catch (err: any) {
            console.error('Login exception:', err);
            const isNetworkError = err?.message?.includes('fetch') || err?.message?.includes('Network');
            toast.error(isNetworkError
                ? 'Sua conexão com o servidor falhou. Verifique sua rede.'
                : 'Ocorreu um erro inesperado ao fazer login.');
            setIsLoading(false);
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [supabase, loadUserSession]);

    const changePassword = useCallback(async (currentPassword: string, newPassword: string): Promise<boolean> => {
        try {
            // SECURITY FIX: Verify current password before changing
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) return false;

            const { error: verifyError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });
            if (verifyError) {
                toast.error('Senha atual incorreta.');
                return false;
            }

            if (newPassword.length < 6) {
                toast.error('A nova senha deve ter pelo menos 6 caracteres.');
                return false;
            }

            const { error } = await supabase.auth.updateUser({ password: newPassword });
            if (error) {
                console.error('Password change error:', error);
                toast.error('Erro ao alterar senha: ' + error.message);
                return false;
            }
            toast.success('Senha alterada com sucesso!');
            return true;
        } catch {
            toast.error('Erro inesperado ao alterar senha.');
            return false;
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

    const registerChurch = useCallback(async (data: NewChurchData) => {
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
                // Show the user-friendly error from the RPC
                const msg = rpcError?.message || 'Erro ao registrar igreja no servidor.';
                toast.error(msg);
                return false;
            }

            // FIX: Auto sign-in using proper async flow (no more setTimeout race condition)
            try {
                console.log('Attempting auto sign-in for:', data.email);
                const signInResult = await supabase.auth.signInWithPassword({
                    email: data.email,
                    password: data.password,
                });

                if (!signInResult.error && signInResult.data?.user) {
                    await loadUserSession(signInResult.data.user.id);
                    toast.success('Bem-vindo ao sistema!');
                }
            } catch (e) {
                console.error('Auto-login failed:', e);
                // Non-blocking: registration succeeded, user can login manually
            }

            return true;
        } catch (err: any) {
            console.error('Registration error details:', err);
            toast.error(err?.message || 'Erro inesperado ao registrar. Tente novamente.');
            return false;
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
            const allowedFields = ['name', 'cnpj', 'pastor', 'address', 'phone', 'email', 'website', 'description', 'logo_url'];
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
            return { success: false, error: err.message || 'Erro desconhecido ao atualizar os dados da igreja.' };
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
                return { success: false, error: msg };
            }

            // Remove church from local state
            setAllChurches(prev => prev.filter(c => c.id !== id));
            // Also remove related users/profiles from local state
            setAllUsers(prev => prev.filter(u => u.church_id !== id));

            return { success: true };
        } catch (err: any) {
            console.error('Exception in deleteChurch:', err);
            return { success: false, error: err.message || 'Erro inesperado ao excluir a igreja.' };
        }
    }, [supabase]);

    // ─── Users CRUD ───────────────────────────────────────────────
    const addUser = useCallback(async (data: NewUserData) => {
        if (!session) return;

        try {
            // Create user using the RPC to bypass email confirmation and slowness
            const { data: newProfile, error } = await supabase.rpc('admin_create_user', {
                p_email: data.email,
                p_password: data.password || 'temp123456',
                p_name: data.name,
                p_role: data.role,
                p_church_id: session.church.id
            });

            if (error || !newProfile) {
                console.error('Admin create user error:', error);
                toast.error('Erro ao criar usuário: ' + (error?.message || 'Erro desconhecido.'));
                throw error;
            }

            // The RPC returns the new profile as jsonb
            setAllUsers(prev => [...prev, mapProfile(newProfile as any)]);
            toast.success('Usuário criado com sucesso!');
        } catch (error) {
            console.error('Add user error:', error);
            throw error;
        }
    }, [session, supabase]);



    const updateUser = useCallback(async (id: string, data: Partial<User>) => {
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
                toast.error('Erro ao atualizar usuário: ' + (error.message || 'Erro desconhecido.'));
                throw error;
            }

            if (updatedProfile) {
                setAllUsers(prev => prev.map(u => u.id === id ? mapProfile(updatedProfile as any) : u));
            }
        } catch (error: any) {
            console.error('Update user catch error:', error);
            throw error;
        }
    }, [supabase]);

    const deleteUser = useCallback(async (id: string) => {
        // Use RPC to delete both profile and auth user
        const { error } = await supabase
            .rpc('delete_user_complete', { target_user_id: id });

        if (error) {
            console.error('Error deleting user:', error);
            // Try fallback delete if RPC fails (e.g. if function doesn't exist yet in user's instance)
            const { error: fallbackError } = await supabase
                .from('profiles')
                .delete()
                .eq('id', id);

            if (fallbackError) {
                toast.error('Erro ao excluir usuário: ' + (error.message || fallbackError.message));
                throw fallbackError;
            }
        }

        setAllUsers(prev => prev.filter(u => u.id !== id));
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
            return { success: false, error: err.message || 'Erro ao criar sala' };
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
            return { success: false, error: err.message || 'Erro ao atualizar sala' };
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
            return { success: false, error: err.message || 'Erro ao excluir sala' };
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
            return { success: false, error: err.message || 'Erro ao cadastrar membro' };
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
            toast.error('Erro ao atualizar membro: ' + (err.message || 'Erro desconhecido'));
            return { success: false, error: err.message || 'Erro ao atualizar membro' };
        }
    }, [session, supabase]);

    const removeMember = useCallback(async (id: string): Promise<{ success: boolean, error?: string }> => {
        if (!session) return { success: false, error: 'Sessão não encontrada' };
        try {
            const { error } = await supabase
                .from('members')
                .delete()
                .eq('id', id)
                .eq('church_id', session.church.id); // SECURITY FIX: filter by church_id

            if (error) throw error;
            setAllMembers(prev => prev.filter(m => m.id !== id));
            toast.success('Membro removido com sucesso.');
            return { success: true };
        } catch (err: any) {
            console.error('[removeMember] Error:', err);
            toast.error('Erro ao remover membro: ' + (err.message || 'Erro desconhecido'));
            return { success: false, error: err.message || 'Erro ao remover membro' };
        }
    }, [session, supabase]);

    // ─── Financials CRUD ──────────────────────────────────────────
    const addTransaction = useCallback(async (data: Omit<FinancialTransaction, 'id' | 'church_id' | 'created_at'>) => {
        if (!session) return;

        // Validation: amount must be positive
        if (!data.amount || data.amount <= 0) {
            toast.error('O valor da transação deve ser maior que zero.');
            return;
        }

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
            toast.success('Transação registrada com sucesso!');
        } else if (error) {
            console.error('[addTransaction] Error:', error);
            toast.error('Erro ao registrar transação: ' + (error.message || 'Erro desconhecido'));
        }
    }, [session, supabase]);

    const addCategory = useCallback(async (data: NewCategoryData) => {
        if (!session) return;
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
            toast.success('Categoria adicionada!');
        } else {
            toast.error('Erro ao adicionar categoria.');
        }
    }, [session, supabase]);

    const updateCategory = useCallback(async (id: string, name: string) => {
        if (!session) return;
        const { error } = await supabase
            .from('financial_categories')
            .update({ name })
            .eq('id', id)
            .eq('church_id', session.church.id); // SECURITY FIX: filter by church_id

        if (!error) {
            setAllCategories(prev => prev.map(c => c.id === id ? { ...c, name } : c));
            toast.success('Categoria atualizada!');
        } else {
            console.error('Error updating category:', error);
            toast.error('Erro ao atualizar categoria: ' + error.message);
        }
    }, [session, supabase]);

    const deleteCategory = useCallback(async (id: string) => {
        if (!session) return;
        const { error } = await supabase
            .from('financial_categories')
            .delete()
            .eq('id', id)
            .eq('church_id', session.church.id); // SECURITY FIX: filter by church_id

        if (!error) {
            setAllCategories(prev => prev.filter(c => c.id !== id));
            toast.success('Categoria excluída!');
        } else {
            console.error('Error deleting category:', error);
            toast.error('Erro ao excluir categoria: ' + error.message);
        }
    }, [session, supabase]);

    // ─── Attendance CRUD ──────────────────────────────────────────
    const saveAttendanceSession = useCallback(async (data: NewAttendanceSessionData): Promise<AttendanceSession | null> => {
        if (!session) throw new Error('Sessão não encontrada');

        // CRITICAL: Remove the `id` field from the payload.
        // When using onConflict with a UNIQUE constraint (church_id, room_id, session_date),
        // Supabase needs to match on those columns. If we pass `id: undefined`,
        // the DB generates a NEW random UUID which then conflicts with the UNIQUE constraint,
        // causing the upsert to fail silently.
        const { id: _removedId, ...dataWithoutId } = data;

        const payload = {
            ...dataWithoutId,
            church_id: session.church.id,
        };

        console.log('[saveAttendanceSession] Upserting payload:', JSON.stringify(payload, null, 2));

        const { data: newSession, error } = await supabase
            .from('attendance_sessions')
            .upsert(payload, { onConflict: 'church_id,room_id,session_date' })
            .select()
            .single();

        if (error) {
            console.error('[saveAttendanceSession] Supabase error:', error);
            throw new Error(error.message);
        }

        if (newSession) {
            console.log('[saveAttendanceSession] Success! Session ID:', newSession.id);
            setAllAttendanceSessions(prev => {
                const filtered = prev.filter(s => s.id !== newSession.id);
                return [...filtered, newSession as AttendanceSession];
            });
        }

        return (newSession as AttendanceSession) ?? null;
    }, [session, supabase]);


    // ─── Visitors ─────────────────────────────────────────────────
    const addVisitor = useCallback(async (data: NewVisitorData) => {
        if (!session) return;

        if (!data.name?.trim()) {
            toast.error('O nome do visitante é obrigatório.');
            return;
        }

        const { data: newVisitor, error } = await supabase
            .from('visitors')
            .insert({
                church_id: session.church.id,
                room_id: data.room_id,
                room_name: data.room_name,
                session_date: data.session_date,
                name: data.name.trim(),
                address: data.address?.trim() || null,
                phone: data.phone?.trim() || null,
            })
            .select()
            .single();

        if (!error && newVisitor) {
            setAllVisitors(prev => [...prev, newVisitor as Visitor]);
            toast.success('Visitante registrado com sucesso!');
        } else if (error) {
            console.error('[addVisitor] Error:', error);
            toast.error('Erro ao registrar visitante: ' + (error.message || 'Erro desconhecido'));
        }
    }, [session, supabase]);

    // ─── Permissions CRUD ─────────────────────────────────────────
    const updateRolePermission = useCallback(async (role: UserRole, modules: Record<string, boolean>) => {
        if (!session) return;

        const safeModules = role === 'admin'
            ? { ...modules, configuracoes: true }
            : modules;

        // Update in DB
        await supabase
            .from('role_permissions')
            .update({ modules: safeModules })
            .eq('church_id', session.church.id)
            .eq('role', role);

        setRolePermissions(prev =>
            prev.map(rp => {
                if (rp.role !== role) return rp;
                return { ...rp, modules: safeModules };
            })
        );
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
