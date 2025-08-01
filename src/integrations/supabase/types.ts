export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          name: string
          notes: string | null
          project_id: string | null
          type: string | null
          url: string
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name: string
          notes?: string | null
          project_id?: string | null
          type?: string | null
          url: string
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          name?: string
          notes?: string | null
          project_id?: string | null
          type?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "assets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          attendees: Json | null
          category: string | null
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          is_all_day: boolean | null
          location: string | null
          microsoft_event_id: string
          start_time: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          attendees?: Json | null
          category?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          microsoft_event_id: string
          start_time: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          attendees?: Json | null
          category?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          is_all_day?: boolean | null
          location?: string | null
          microsoft_event_id?: string
          start_time?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          created_by: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      nonnegotiables: {
        Row: {
          created_at: string
          created_by: string | null
          custom_frequency: string | null
          description: string | null
          frequency: string | null
          id: string
          is_active: boolean | null
          project_id: string | null
          reminder_time: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          custom_frequency?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          reminder_time?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          custom_frequency?: string | null
          description?: string | null
          frequency?: string | null
          id?: string
          is_active?: boolean | null
          project_id?: string | null
          reminder_time?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "nonnegotiables_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "nonnegotiables_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      outlook_connections: {
        Row: {
          access_token: string
          created_at: string
          display_name: string | null
          email: string
          id: string
          is_active: boolean
          microsoft_user_id: string
          refresh_token: string
          token_expires_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          is_active?: boolean
          microsoft_user_id: string
          refresh_token: string
          token_expires_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          is_active?: boolean
          microsoft_user_id?: string
          refresh_token?: string
          token_expires_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_companies: {
        Row: {
          close_date: string | null
          company_name: string
          created_at: string | null
          created_by: string
          current_round: Database["public"]["Enums"]["round_enum"]
          id: string
          next_steps: string | null
          raise_amount_usd: number | null
          sector: Database["public"]["Enums"]["sector_enum"] | null
          status: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          close_date?: string | null
          company_name: string
          created_at?: string | null
          created_by: string
          current_round: Database["public"]["Enums"]["round_enum"]
          id?: string
          next_steps?: string | null
          raise_amount_usd?: number | null
          sector?: Database["public"]["Enums"]["sector_enum"] | null
          status: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          close_date?: string | null
          company_name?: string
          created_at?: string | null
          created_by?: string
          current_round?: Database["public"]["Enums"]["round_enum"]
          id?: string
          next_steps?: string | null
          raise_amount_usd?: number | null
          sector?: Database["public"]["Enums"]["sector_enum"] | null
          status?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      pipeline_notes: {
        Row: {
          body: string | null
          created_at: string | null
          created_by: string
          id: string
          pipeline_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          pipeline_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          pipeline_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_notes_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "pipeline_companies"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          color: string | null
          context: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          context?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          project_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          project_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_items: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          favicon: string | null
          hostname: string | null
          id: string
          image: string | null
          is_read: boolean | null
          project_id: string | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          favicon?: string | null
          hostname?: string | null
          id?: string
          image?: string | null
          is_read?: boolean | null
          project_id?: string | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          favicon?: string | null
          hostname?: string | null
          id?: string
          image?: string | null
          is_read?: boolean | null
          project_id?: string | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_items_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category_id: string | null
          completed: boolean | null
          completed_at: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_quick_task: boolean | null
          priority: string | null
          project_id: string | null
          scheduled_for: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_quick_task?: boolean | null
          priority?: string | null
          project_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          completed?: boolean | null
          completed_at?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_quick_task?: boolean | null
          priority?: string | null
          project_id?: string | null
          scheduled_for?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      round_enum:
        | "Seed"
        | "Series A"
        | "Series B"
        | "Series C"
        | "Series D"
        | "Series E"
        | "Series F+"
      sector_enum:
        | "Lending"
        | "Payments"
        | "DevOps"
        | "Sales Enablement"
        | "Wealth"
        | "Real Estate"
        | "Consumer"
        | "Capital Markets"
        | "Blockchain"
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
    Enums: {
      round_enum: [
        "Seed",
        "Series A",
        "Series B",
        "Series C",
        "Series D",
        "Series E",
        "Series F+",
      ],
      sector_enum: [
        "Lending",
        "Payments",
        "DevOps",
        "Sales Enablement",
        "Wealth",
        "Real Estate",
        "Consumer",
        "Capital Markets",
        "Blockchain",
      ],
    },
  },
} as const
