export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
    // Allows to automatically instantiate createClient with right options
    // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
    __InternalSupabase: {
        PostgrestVersion: "14.4"
    }
    public: {
        Tables: {
            attendance_sessions: {
                Row: {
                    absent_member_ids: string[] | null
                    church_id: string
                    created_at: string
                    finalized: boolean
                    id: string
                    present_member_ids: string[] | null
                    room_id: string | null
                    room_name: string | null
                    session_date: string
                    total_absent: number
                    total_present: number
                }
                Insert: {
                    absent_member_ids?: string[] | null
                    church_id: string
                    created_at?: string
                    finalized?: boolean
                    id?: string
                    present_member_ids?: string[] | null
                    room_id?: string | null
                    room_name?: string | null
                    session_date: string
                    total_absent?: number
                    total_present?: number
                }
                Update: {
                    absent_member_ids?: string[] | null
                    church_id?: string
                    created_at?: string
                    finalized?: boolean
                    id?: string
                    present_member_ids?: string[] | null
                    room_id?: string | null
                    room_name?: string | null
                    session_date?: string
                    total_absent?: number
                    total_present?: number
                }
                Relationships: [
                    {
                        foreignKeyName: "attendance_sessions_church_id_fkey"
                        columns: ["church_id"]
                        isOneToOne: false
                        referencedRelation: "churches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "attendance_sessions_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            churches: {
                Row: {
                    address: string | null
                    admin_email: string | null
                    admin_name: string | null
                    city: string | null
                    cnpj: string | null
                    created_at: string
                    id: string
                    is_active: boolean
                    logo: string | null
                    members_count: number | null
                    name: string
                    pastor: string | null
                    phone: string | null
                    plan: string
                    slug: string
                    state: string | null
                }
                Insert: {
                    address?: string | null
                    admin_email?: string | null
                    admin_name?: string | null
                    city?: string | null
                    cnpj?: string | null
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    logo?: string | null
                    members_count?: number | null
                    name: string
                    pastor?: string | null
                    phone?: string | null
                    plan?: string
                    slug: string
                    state?: string | null
                }
                Update: {
                    address?: string | null
                    admin_email?: string | null
                    admin_name?: string | null
                    city?: string | null
                    cnpj?: string | null
                    created_at?: string
                    id?: string
                    is_active?: boolean
                    logo?: string | null
                    members_count?: number | null
                    name?: string
                    pastor?: string | null
                    phone?: string | null
                    plan?: string
                    slug?: string
                    state?: string | null
                }
                Relationships: []
            }
            financial_transactions: {
                Row: {
                    amount: number
                    category: string
                    church_id: string
                    created_at: string
                    description: string | null
                    id: string
                    member_id: string | null
                    member_name: string | null
                    transaction_date: string
                    type: string
                }
                Insert: {
                    amount?: number
                    category: string
                    church_id: string
                    created_at?: string
                    description?: string | null
                    id?: string
                    member_id?: string | null
                    member_name?: string | null
                    transaction_date?: string
                    type: string
                }
                Update: {
                    amount?: number
                    category?: string
                    church_id?: string
                    created_at?: string
                    description?: string | null
                    id?: string
                    member_id?: string | null
                    member_name?: string | null
                    transaction_date?: string
                    type?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "financial_transactions_church_id_fkey"
                        columns: ["church_id"]
                        isOneToOne: false
                        referencedRelation: "churches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "financial_transactions_member_id_fkey"
                        columns: ["member_id"]
                        isOneToOne: false
                        referencedRelation: "members"
                        referencedColumns: ["id"]
                    },
                ]
            }
            members: {
                Row: {
                    address: string | null
                    age_group: string
                    baptism_date: string | null
                    birth_date: string | null
                    church_id: string
                    cpf: string | null
                    created_at: string
                    email: string | null
                    full_name: string
                    id: string
                    join_date: string | null
                    phone: string | null
                    photo: string | null
                    room_id: string | null
                    status: string
                }
                Insert: {
                    address?: string | null
                    age_group: string
                    baptism_date?: string | null
                    birth_date?: string | null
                    church_id: string
                    cpf?: string | null
                    created_at?: string
                    email?: string | null
                    full_name: string
                    id?: string
                    join_date?: string | null
                    phone?: string | null
                    photo?: string | null
                    room_id?: string | null
                    status?: string
                }
                Update: {
                    address?: string | null
                    age_group?: string
                    baptism_date?: string | null
                    birth_date?: string | null
                    church_id?: string
                    cpf?: string | null
                    created_at?: string
                    email?: string | null
                    full_name?: string
                    id?: string
                    join_date?: string | null
                    phone?: string | null
                    photo?: string | null
                    room_id?: string | null
                    status?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "members_church_id_fkey"
                        columns: ["church_id"]
                        isOneToOne: false
                        referencedRelation: "churches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "members_room_id_fkey"
                        columns: ["room_id"]
                        isOneToOne: false
                        referencedRelation: "rooms"
                        referencedColumns: ["id"]
                    },
                ]
            }
            notifications: {
                Row: {
                    church_id: string
                    created_at: string
                    id: string
                    is_read: boolean
                    message: string
                    type: string
                    user_id: string | null
                }
                Insert: {
                    church_id: string
                    created_at?: string
                    id?: string
                    is_read?: boolean
                    message: string
                    type?: string
                    user_id?: string | null
                }
                Update: {
                    church_id?: string
                    created_at?: string
                    id?: string
                    is_read?: boolean
                    message?: string
                    type?: string
                    user_id?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "notifications_church_id_fkey"
                        columns: ["church_id"]
                        isOneToOne: false
                        referencedRelation: "churches"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "notifications_user_id_fkey"
                        columns: ["user_id"]
                        isOneToOne: false
                        referencedRelation: "profiles"
                        referencedColumns: ["id"]
                    },
                ]
            }
            profiles: {
                Row: {
                    avatar: string | null
                    church_id: string | null
                    created_at: string
                    email: string
                    id: string
                    is_active: boolean
                    name: string
                    role: string
                }
                Insert: {
                    avatar?: string | null
                    church_id?: string | null
                    created_at?: string
                    email: string
                    id: string
                    is_active?: boolean
                    name: string
                    role?: string
                }
                Update: {
                    avatar?: string | null
                    church_id?: string | null
                    created_at?: string
                    email?: string
                    id?: string
                    is_active?: boolean
                    name?: string
                    role?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "profiles_church_id_fkey"
                        columns: ["church_id"]
                        isOneToOne: false
                        referencedRelation: "churches"
                        referencedColumns: ["id"]
                    },
                ]
            }
            role_permissions: {
                Row: {
                    church_id: string
                    id: string
                    label: string
                    modules: Json
                    role: string
                }
                Insert: {
                    church_id: string
                    id?: string
                    label: string
                    modules?: Json
                    role: string
                }
                Update: {
                    church_id?: string
                    id?: string
                    label?: string
                    modules?: Json
                    role?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "role_permissions_church_id_fkey"
                        columns: ["church_id"]
                        isOneToOne: false
                        referencedRelation: "churches"
                        referencedColumns: ["id"]
                    },
                ]
            }
            rooms: {
                Row: {
                    age_group: string
                    church_id: string
                    id: string
                    is_active: boolean
                    name: string
                }
                Insert: {
                    age_group: string
                    church_id: string
                    id?: string
                    is_active?: boolean
                    name: string
                }
                Update: {
                    age_group?: string
                    church_id?: string
                    id?: string
                    is_active?: boolean
                    name?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "rooms_church_id_fkey"
                        columns: ["church_id"]
                        isOneToOne: false
                        referencedRelation: "churches"
                        referencedColumns: ["id"]
                    },
                ]
            }
            visitors: {
                Row: {
                    address: string | null
                    church_id: string
                    id: string
                    name: string
                    phone: string | null
                    registered_at: string
                    room_id: string | null
                    room_name: string | null
                    session_date: string | null
                }
                Insert: {
                    address?: string | null
                    church_id: string
                    id?: string
                    name: string
                    phone?: string | null
                    registered_at?: string
                    room_id?: string | null
                    room_name?: string | null
                    session_date?: string | null
                }
                Update: {
                    address?: string | null
                    church_id?: string
                    id?: string
                    name?: string
                    phone?: string | null
                    registered_at?: string
                    room_id?: string | null
                    room_name?: string | null
                    session_date?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "visitors_church_id_fkey"
                        columns: ["church_id"]
                        isOneToOne: false
                        referencedRelation: "churches"
                        referencedColumns: ["id"]
                    },
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            get_my_church_id: { Args: never; Returns: string }
            is_super_admin: { Args: never; Returns: boolean }
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
    DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
            Row: infer R
        }
    ? R
    : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R
        }
    ? R
    : never
    : never

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Insert: infer I
    }
    ? I
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
    }
    ? I
    : never
    : never

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
    TableName extends DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
        Update: infer U
    }
    ? U
    : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
    }
    ? U
    : never
    : never

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
    EnumName extends DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals
    }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
    public: {
        Enums: {},
    },
} as const
