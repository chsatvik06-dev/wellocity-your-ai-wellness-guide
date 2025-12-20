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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_logs: {
        Row: {
          ai_response: string
          chat_type: string
          created_at: string
          id: string
          user_id: string | null
          user_message: string
        }
        Insert: {
          ai_response: string
          chat_type: string
          created_at?: string
          id?: string
          user_id?: string | null
          user_message: string
        }
        Update: {
          ai_response?: string
          chat_type?: string
          created_at?: string
          id?: string
          user_id?: string | null
          user_message?: string
        }
        Relationships: []
      }
      daily_micronutrients: {
        Row: {
          calcium: number | null
          created_at: string
          date: string
          id: string
          iron: number | null
          magnesium: number | null
          user_id: string
          vitamin_a: number | null
          vitamin_b12: number | null
          vitamin_c: number | null
          vitamin_d: number | null
          zinc: number | null
        }
        Insert: {
          calcium?: number | null
          created_at?: string
          date: string
          id?: string
          iron?: number | null
          magnesium?: number | null
          user_id: string
          vitamin_a?: number | null
          vitamin_b12?: number | null
          vitamin_c?: number | null
          vitamin_d?: number | null
          zinc?: number | null
        }
        Update: {
          calcium?: number | null
          created_at?: string
          date?: string
          id?: string
          iron?: number | null
          magnesium?: number | null
          user_id?: string
          vitamin_a?: number | null
          vitamin_b12?: number | null
          vitamin_c?: number | null
          vitamin_d?: number | null
          zinc?: number | null
        }
        Relationships: []
      }
      feedback: {
        Row: {
          category: string
          comment: string | null
          created_at: string
          id: string
          rating: number
          user_id: string
        }
        Insert: {
          category: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          user_id: string
        }
        Update: {
          category?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
        }
        Relationships: []
      }
      menopause_profiles: {
        Row: {
          age: number | null
          bone_density_concern: boolean | null
          created_at: string
          fatigue_level: string | null
          gender: string | null
          hormonal_changes: string | null
          hot_flash_severity: string | null
          id: string
          stage: string
          symptoms: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          bone_density_concern?: boolean | null
          created_at?: string
          fatigue_level?: string | null
          gender?: string | null
          hormonal_changes?: string | null
          hot_flash_severity?: string | null
          id?: string
          stage?: string
          symptoms?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          bone_density_concern?: boolean | null
          created_at?: string
          fatigue_level?: string | null
          gender?: string | null
          hormonal_changes?: string | null
          hot_flash_severity?: string | null
          id?: string
          stage?: string
          symptoms?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      menstrual_cycles: {
        Row: {
          created_at: string
          cycle_length: number | null
          end_date: string | null
          flow_intensity: string | null
          id: string
          mood: string | null
          notes: string | null
          start_date: string
          symptoms: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_length?: number | null
          end_date?: string | null
          flow_intensity?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          start_date: string
          symptoms?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_length?: number | null
          end_date?: string | null
          flow_intensity?: string | null
          id?: string
          mood?: string | null
          notes?: string | null
          start_date?: string
          symptoms?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      nutrition_logs: {
        Row: {
          calcium: number | null
          calories: number | null
          carbs: number | null
          fats: number | null
          food_name: string
          id: string
          iron: number | null
          logged_at: string
          magnesium: number | null
          meal_type: string
          protein: number | null
          quantity: number | null
          unit: string | null
          user_id: string
          vitamin_a: number | null
          vitamin_b12: number | null
          vitamin_c: number | null
          vitamin_d: number | null
          zinc: number | null
        }
        Insert: {
          calcium?: number | null
          calories?: number | null
          carbs?: number | null
          fats?: number | null
          food_name: string
          id?: string
          iron?: number | null
          logged_at?: string
          magnesium?: number | null
          meal_type: string
          protein?: number | null
          quantity?: number | null
          unit?: string | null
          user_id: string
          vitamin_a?: number | null
          vitamin_b12?: number | null
          vitamin_c?: number | null
          vitamin_d?: number | null
          zinc?: number | null
        }
        Update: {
          calcium?: number | null
          calories?: number | null
          carbs?: number | null
          fats?: number | null
          food_name?: string
          id?: string
          iron?: number | null
          logged_at?: string
          magnesium?: number | null
          meal_type?: string
          protein?: number | null
          quantity?: number | null
          unit?: string | null
          user_id?: string
          vitamin_a?: number | null
          vitamin_b12?: number | null
          vitamin_c?: number | null
          vitamin_d?: number | null
          zinc?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          created_at: string
          dietary_preferences: string[] | null
          fitness_goals: string[] | null
          gender: string | null
          health_conditions: string[] | null
          height: number | null
          id: string
          name: string | null
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          age?: number | null
          created_at?: string
          dietary_preferences?: string[] | null
          fitness_goals?: string[] | null
          gender?: string | null
          health_conditions?: string[] | null
          height?: number | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          age?: number | null
          created_at?: string
          dietary_preferences?: string[] | null
          fitness_goals?: string[] | null
          gender?: string | null
          health_conditions?: string[] | null
          height?: number | null
          id?: string
          name?: string | null
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: []
      }
      teen_mood_logs: {
        Row: {
          id: string
          logged_at: string
          mood_label: string
          mood_value: number
          notes: string | null
          user_id: string
        }
        Insert: {
          id?: string
          logged_at?: string
          mood_label: string
          mood_value: number
          notes?: string | null
          user_id: string
        }
        Update: {
          id?: string
          logged_at?: string
          mood_label?: string
          mood_value?: number
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      weight_history: {
        Row: {
          id: string
          recorded_at: string
          user_id: string
          weight: number
        }
        Insert: {
          id?: string
          recorded_at?: string
          user_id: string
          weight: number
        }
        Update: {
          id?: string
          recorded_at?: string
          user_id?: string
          weight?: number
        }
        Relationships: []
      }
      workout_logs: {
        Row: {
          calories_burned: number | null
          completed_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          user_id: string
          workout_type: string
        }
        Insert: {
          calories_burned?: number | null
          completed_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          user_id: string
          workout_type: string
        }
        Update: {
          calories_burned?: number | null
          completed_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          user_id?: string
          workout_type?: string
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
