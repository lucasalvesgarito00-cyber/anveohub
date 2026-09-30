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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      ai_actions: {
        Row: {
          action_type: string
          conversation_id: string
          created_at: string
          entity_id: string | null
          entity_type: string
          executed_at: string | null
          id: string
          payload: Json
          status: string
          user_id: string
        }
        Insert: {
          action_type: string
          conversation_id: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          executed_at?: string | null
          id?: string
          payload?: Json
          status?: string
          user_id: string
        }
        Update: {
          action_type?: string
          conversation_id?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          executed_at?: string | null
          id?: string
          payload?: Json
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_actions_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          channel: string | null
          cliente_id: string | null
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          external_conversation_id: string | null
          id: string
          last_inbound_at: string | null
          last_message_at: string | null
          last_outbound_at: string | null
          lead_id: string | null
          status: string
          title: string | null
          unread_count: number
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          channel?: string | null
          cliente_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          external_conversation_id?: string | null
          id?: string
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_outbound_at?: string | null
          lead_id?: string | null
          status?: string
          title?: string | null
          unread_count?: number
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          channel?: string | null
          cliente_id?: string | null
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          external_conversation_id?: string | null
          id?: string
          last_inbound_at?: string | null
          last_message_at?: string | null
          last_outbound_at?: string | null
          lead_id?: string | null
          status?: string
          title?: string | null
          unread_count?: number
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      ai_messages: {
        Row: {
          channel: string | null
          content: string
          conversation_id: string
          created_at: string
          delivered_at: string | null
          delivery_status: string | null
          direction: string | null
          error_message: string | null
          external_message_id: string | null
          failed_at: string | null
          id: string
          read_at: string | null
          role: string
          sent_at: string | null
          user_id: string
        }
        Insert: {
          channel?: string | null
          content: string
          conversation_id: string
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          direction?: string | null
          error_message?: string | null
          external_message_id?: string | null
          failed_at?: string | null
          id?: string
          read_at?: string | null
          role: string
          sent_at?: string | null
          user_id: string
        }
        Update: {
          channel?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          delivered_at?: string | null
          delivery_status?: string | null
          direction?: string | null
          error_message?: string | null
          external_message_id?: string | null
          failed_at?: string | null
          id?: string
          read_at?: string | null
          role?: string
          sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      atividades: {
        Row: {
          cliente_id: string | null
          created_at: string
          data: string
          descricao: string | null
          horario: string | null
          id: string
          lead_id: string | null
          status: string | null
          tarefa_id: string | null
          tipo: string
          titulo: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data: string
          descricao?: string | null
          horario?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
          tarefa_id?: string | null
          tipo: string
          titulo?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          horario?: string | null
          id?: string
          lead_id?: string | null
          status?: string | null
          tarefa_id?: string | null
          tipo?: string
          titulo?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "atividades_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "atividades_tarefa_id_fkey"
            columns: ["tarefa_id"]
            isOneToOne: false
            referencedRelation: "tarefas"
            referencedColumns: ["id"]
          },
        ]
      }
      clientes: {
        Row: {
          created_at: string
          data_fechamento: string | null
          email: string | null
          empresa: string | null
          id: string
          lead_id: string | null
          nome: string
          status: string
          telefone: string | null
          updated_at: string
          user_id: string
          valor_fechado: number | null
        }
        Insert: {
          created_at?: string
          data_fechamento?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          lead_id?: string | null
          nome: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id: string
          valor_fechado?: number | null
        }
        Update: {
          created_at?: string
          data_fechamento?: string | null
          email?: string | null
          empresa?: string | null
          id?: string
          lead_id?: string | null
          nome?: string
          status?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
          valor_fechado?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "clientes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          etapa: string | null
          id: string
          nome_contato: string | null
          nome_empresa: string | null
          observacoes: string | null
          origem: string | null
          prioridade: string | null
          proximo_follow_up: string | null
          responsavel: string | null
          segmento: string | null
          telefone_whatsapp: string | null
          updated_at: string
          user_id: string
          valor_potencial: number | null
          workspace_id: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          etapa?: string | null
          id?: string
          nome_contato?: string | null
          nome_empresa?: string | null
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          proximo_follow_up?: string | null
          responsavel?: string | null
          segmento?: string | null
          telefone_whatsapp?: string | null
          updated_at?: string
          user_id: string
          valor_potencial?: number | null
          workspace_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          etapa?: string | null
          id?: string
          nome_contato?: string | null
          nome_empresa?: string | null
          observacoes?: string | null
          origem?: string | null
          prioridade?: string | null
          proximo_follow_up?: string | null
          responsavel?: string | null
          segmento?: string | null
          telefone_whatsapp?: string | null
          updated_at?: string
          user_id?: string
          valor_potencial?: number | null
          workspace_id?: string | null
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          categoria: string
          conteudo: string
          created_at: string
          id: string
          titulo: string
          updated_at: string
          user_id: string
          workspace_id: string | null
        }
        Insert: {
          categoria: string
          conteudo: string
          created_at?: string
          id?: string
          titulo: string
          updated_at?: string
          user_id: string
          workspace_id?: string | null
        }
        Update: {
          categoria?: string
          conteudo?: string
          created_at?: string
          id?: string
          titulo?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      movimentacoes_financeiras: {
        Row: {
          categoria: string
          cliente_id: string | null
          created_at: string
          data: string
          data_inicio: string | null
          descricao: string | null
          id: string
          lead_id: string | null
          observacoes: string | null
          recorrente: boolean
          status: string
          status_recorrencia: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
          valor_mensal: number | null
        }
        Insert: {
          categoria: string
          cliente_id?: string | null
          created_at?: string
          data: string
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          recorrente?: boolean
          status: string
          status_recorrencia?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
          valor_mensal?: number | null
        }
        Update: {
          categoria?: string
          cliente_id?: string | null
          created_at?: string
          data?: string
          data_inicio?: string | null
          descricao?: string | null
          id?: string
          lead_id?: string | null
          observacoes?: string | null
          recorrente?: boolean
          status?: string
          status_recorrencia?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
          valor_mensal?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "movimentacoes_financeiras_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimentacoes_financeiras_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          job_title: string | null
          updated_at: string
          workspace_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          job_title?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          job_title?: string | null
          updated_at?: string
          workspace_id?: string | null
        }
        Relationships: []
      }
      tarefas: {
        Row: {
          cliente_id: string | null
          created_at: string
          data: string
          descricao: string | null
          horario: string | null
          id: string
          lead_id: string | null
          prioridade: string
          status: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id?: string | null
          created_at?: string
          data: string
          descricao?: string | null
          horario?: string | null
          id?: string
          lead_id?: string | null
          prioridade?: string
          status?: string
          tipo?: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string | null
          created_at?: string
          data?: string
          descricao?: string | null
          horario?: string | null
          id?: string
          lead_id?: string | null
          prioridade?: string
          status?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tarefas_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tarefas_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
