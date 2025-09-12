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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      diet_plans: {
        Row: {
          active: boolean
          created_at: string
          daily_calories: number | null
          daily_carbs: number | null
          daily_fat: number | null
          daily_protein: number | null
          description: string | null
          id: string
          name: string
          personal_trainer_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_protein?: number | null
          description?: string | null
          id?: string
          name: string
          personal_trainer_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          daily_calories?: number | null
          daily_carbs?: number | null
          daily_fat?: number | null
          daily_protein?: number | null
          description?: string | null
          id?: string
          name?: string
          personal_trainer_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "diet_plans_personal_trainer_id_fkey"
            columns: ["personal_trainer_id"]
            isOneToOne: false
            referencedRelation: "personal_trainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "diet_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_categories: {
        Row: {
          created_at: string
          emoji: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          emoji?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          emoji?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      exercise_completions: {
        Row: {
          completed_at: string
          id: string
          notes: string | null
          reps_completed: number[] | null
          sets_completed: number | null
          student_id: string
          weight_used: number | null
          workout_exercise_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          notes?: string | null
          reps_completed?: number[] | null
          sets_completed?: number | null
          student_id: string
          weight_used?: number | null
          workout_exercise_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          notes?: string | null
          reps_completed?: number[] | null
          sets_completed?: number | null
          student_id?: string
          weight_used?: number | null
          workout_exercise_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exercise_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercise_completions_workout_exercise_id_fkey"
            columns: ["workout_exercise_id"]
            isOneToOne: false
            referencedRelation: "workout_exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      exercises: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          equipment: string[] | null
          id: string
          instructions: string | null
          muscle_groups: string[] | null
          name: string
          personal_trainer_id: string | null
          youtube_video_url: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          equipment?: string[] | null
          id?: string
          instructions?: string | null
          muscle_groups?: string[] | null
          name: string
          personal_trainer_id?: string | null
          youtube_video_url?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          equipment?: string[] | null
          id?: string
          instructions?: string | null
          muscle_groups?: string[] | null
          name?: string
          personal_trainer_id?: string | null
          youtube_video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exercises_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "exercise_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exercises_personal_trainer_id_fkey"
            columns: ["personal_trainer_id"]
            isOneToOne: false
            referencedRelation: "personal_trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_completions: {
        Row: {
          completed_at: string
          id: string
          meal_id: string
          notes: string | null
          student_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          meal_id: string
          notes?: string | null
          student_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          meal_id?: string
          notes?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_completions_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meal_completions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      meal_foods: {
        Row: {
          calories: number | null
          carbs: number | null
          created_at: string
          fat: number | null
          food_name: string
          id: string
          meal_id: string
          notes: string | null
          protein: number | null
          quantity: number
          unit: string
        }
        Insert: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          food_name: string
          id?: string
          meal_id: string
          notes?: string | null
          protein?: number | null
          quantity: number
          unit: string
        }
        Update: {
          calories?: number | null
          carbs?: number | null
          created_at?: string
          fat?: number | null
          food_name?: string
          id?: string
          meal_id?: string
          notes?: string | null
          protein?: number | null
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "meal_foods_meal_id_fkey"
            columns: ["meal_id"]
            isOneToOne: false
            referencedRelation: "meals"
            referencedColumns: ["id"]
          },
        ]
      }
      meals: {
        Row: {
          created_at: string
          diet_plan_id: string
          id: string
          name: string
          order_index: number
          time_of_day: string | null
        }
        Insert: {
          created_at?: string
          diet_plan_id: string
          id?: string
          name: string
          order_index: number
          time_of_day?: string | null
        }
        Update: {
          created_at?: string
          diet_plan_id?: string
          id?: string
          name?: string
          order_index?: number
          time_of_day?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meals_diet_plan_id_fkey"
            columns: ["diet_plan_id"]
            isOneToOne: false
            referencedRelation: "diet_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_trainers: {
        Row: {
          active: boolean
          auth_user_id: string | null
          birth_date: string
          cpf: string
          created_at: string
          cref: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          specializations: string[] | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          auth_user_id?: string | null
          birth_date: string
          cpf: string
          created_at?: string
          cref?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          specializations?: string[] | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          auth_user_id?: string | null
          birth_date?: string
          cpf?: string
          created_at?: string
          cref?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          specializations?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      students: {
        Row: {
          active: boolean
          birth_date: string | null
          created_at: string
          email: string | null
          goals: string[] | null
          height: number | null
          id: string
          medical_restrictions: string | null
          name: string
          personal_trainer_id: string
          phone: string | null
          student_number: string | null
          unique_link_token: string
          updated_at: string
          weight: number | null
        }
        Insert: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          email?: string | null
          goals?: string[] | null
          height?: number | null
          id?: string
          medical_restrictions?: string | null
          name: string
          personal_trainer_id: string
          phone?: string | null
          student_number?: string | null
          unique_link_token: string
          updated_at?: string
          weight?: number | null
        }
        Update: {
          active?: boolean
          birth_date?: string | null
          created_at?: string
          email?: string | null
          goals?: string[] | null
          height?: number | null
          id?: string
          medical_restrictions?: string | null
          name?: string
          personal_trainer_id?: string
          phone?: string | null
          student_number?: string | null
          unique_link_token?: string
          updated_at?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "students_personal_trainer_id_fkey"
            columns: ["personal_trainer_id"]
            isOneToOne: false
            referencedRelation: "personal_trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          order_index: number
          reps_max: number | null
          reps_min: number | null
          rest_seconds: number | null
          sets: number
          weight_kg: number | null
          workout_session_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id?: string
          notes?: string | null
          order_index: number
          reps_max?: number | null
          reps_min?: number | null
          rest_seconds?: number | null
          sets?: number
          weight_kg?: number | null
          workout_session_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          order_index?: number
          reps_max?: number | null
          reps_min?: number | null
          rest_seconds?: number | null
          sets?: number
          weight_kg?: number | null
          workout_session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_exercises_workout_session_id_fkey"
            columns: ["workout_session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_plans: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration_weeks: number
          frequency_per_week: number
          id: string
          name: string
          personal_trainer_id: string
          student_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_weeks?: number
          frequency_per_week?: number
          id?: string
          name: string
          personal_trainer_id: string
          student_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_weeks?: number
          frequency_per_week?: number
          id?: string
          name?: string
          personal_trainer_id?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "personal_trainers_auth_user_id_fkey"
            columns: ["auth_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_personal_trainer_id_fkey"
            columns: ["personal_trainer_id"]
            isOneToOne: false
            referencedRelation: "personal_trainers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workout_plans_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          day_of_week: number
          description: string | null
          id: string
          name: string
          workout_plan_id: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          description?: string | null
          id?: string
          name: string
          workout_plan_id: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          description?: string | null
          id?: string
          name?: string
          workout_plan_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_workout_plan_id_fkey"
            columns: ["workout_plan_id"]
            isOneToOne: false
            referencedRelation: "workout_plans"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_student_link_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_student_context: {
        Args: { context_key: string }
        Returns: string
      }
      is_trainer_or_student_access: {
        Args: { student_id: string; trainer_id: string }
        Returns: boolean
      }
      set_student_context: {
        Args: { student_number?: string; student_token?: string }
        Returns: Json
      }
      verify_student_access: {
        Args: { student_num: string }
        Returns: Json
      }
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
