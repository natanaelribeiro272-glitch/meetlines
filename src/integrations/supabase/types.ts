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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      custom_links: {
        Row: {
          color: string | null
          created_at: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          organizer_id: string
          sort_order: number | null
          title: string
          updated_at: string | null
          url: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          organizer_id: string
          sort_order?: number | null
          title: string
          updated_at?: string | null
          url: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          organizer_id?: string
          sort_order?: number | null
          title?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_links_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      event_claim_requests: {
        Row: {
          created_at: string | null
          id: string
          message: string | null
          organizer_id: string
          platform_event_id: string
          reviewed_at: string | null
          reviewed_by_admin_id: string | null
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message?: string | null
          organizer_id: string
          platform_event_id: string
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string | null
          organizer_id?: string
          platform_event_id?: string
          reviewed_at?: string | null
          reviewed_by_admin_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_claim_requests_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_claim_requests_platform_event_id_fkey"
            columns: ["platform_event_id"]
            isOneToOne: false
            referencedRelation: "platform_events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_comments: {
        Row: {
          content: string
          created_at: string
          event_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          event_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          event_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      event_likes: {
        Row: {
          created_at: string
          event_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      event_registrations: {
        Row: {
          attendance_confirmed: boolean | null
          attendance_confirmed_at: string | null
          created_at: string | null
          event_id: string
          id: string
          registration_data: Json | null
          status: string | null
          updated_at: string | null
          user_email: string
          user_id: string
          user_name: string
          user_phone: string | null
        }
        Insert: {
          attendance_confirmed?: boolean | null
          attendance_confirmed_at?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          registration_data?: Json | null
          status?: string | null
          updated_at?: string | null
          user_email: string
          user_id: string
          user_name: string
          user_phone?: string | null
        }
        Update: {
          attendance_confirmed?: boolean | null
          attendance_confirmed_at?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          registration_data?: Json | null
          status?: string | null
          updated_at?: string | null
          user_email?: string
          user_id?: string
          user_name?: string
          user_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string | null
          created_at: string | null
          current_attendees: number | null
          description: string | null
          end_date: string
          event_date: string
          form_fields: Json | null
          id: string
          image_url: string | null
          interests: string[] | null
          is_live: boolean | null
          location: string
          location_link: string | null
          max_attendees: number | null
          organizer_id: string
          requires_registration: boolean | null
          status: string | null
          ticket_link: string | null
          ticket_price: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date: string
          event_date: string
          form_fields?: Json | null
          id?: string
          image_url?: string | null
          interests?: string[] | null
          is_live?: boolean | null
          location: string
          location_link?: string | null
          max_attendees?: number | null
          organizer_id: string
          requires_registration?: boolean | null
          status?: string | null
          ticket_link?: string | null
          ticket_price?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          current_attendees?: number | null
          description?: string | null
          end_date?: string
          event_date?: string
          form_fields?: Json | null
          id?: string
          image_url?: string | null
          interests?: string[] | null
          is_live?: boolean | null
          location?: string
          location_link?: string | null
          max_attendees?: number | null
          organizer_id?: string
          requires_registration?: boolean | null
          status?: string | null
          ticket_link?: string | null
          ticket_price?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      followers: {
        Row: {
          created_at: string
          id: string
          organizer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organizer_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organizer_id?: string
          user_id?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          created_at: string
          friend_id: string
          id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          friend_id: string
          id?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          friend_id?: string
          id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      generations: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          image_url: string | null
          project_id: string
          prompt: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          image_url?: string | null
          project_id: string
          prompt: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          image_url?: string | null
          project_id?: string
          prompt?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          event_id: string | null
          id: string
          message: string
          organizer_id: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          id?: string
          message: string
          organizer_id: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string | null
          id?: string
          message?: string
          organizer_id?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      organizer_photos: {
        Row: {
          caption: string | null
          created_at: string | null
          event_id: string | null
          id: string
          is_active: boolean | null
          organizer_id: string
          photo_url: string
          session_name: string | null
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          organizer_id: string
          photo_url: string
          session_name?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          event_id?: string | null
          id?: string
          is_active?: boolean | null
          organizer_id?: string
          photo_url?: string
          session_name?: string | null
          sort_order?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      organizer_stats: {
        Row: {
          average_rating: number
          created_at: string
          events_count: number
          followers_count: number
          id: string
          organizer_id: string
          total_ratings: number
          updated_at: string
        }
        Insert: {
          average_rating?: number
          created_at?: string
          events_count?: number
          followers_count?: number
          id?: string
          organizer_id: string
          total_ratings?: number
          updated_at?: string
        }
        Update: {
          average_rating?: number
          created_at?: string
          events_count?: number
          followers_count?: number
          id?: string
          organizer_id?: string
          total_ratings?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organizer_stats_organizer_id_fkey"
            columns: ["organizer_id"]
            isOneToOne: true
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      organizers: {
        Row: {
          avatar_url: string | null
          category: string | null
          cover_image_url: string | null
          created_at: string | null
          id: string
          instagram_url: string | null
          is_page_active: boolean | null
          location_url: string | null
          notify_event_reminders: boolean | null
          notify_new_registrations: boolean | null
          page_description: string | null
          page_subtitle: string | null
          page_title: string
          playlist_url: string | null
          preferred_theme: string | null
          primary_color: string | null
          public_page_visible: boolean | null
          show_contact: boolean | null
          show_events: boolean | null
          show_instagram: boolean | null
          show_location: boolean | null
          show_playlist: boolean | null
          show_statistics: boolean | null
          show_website: boolean | null
          show_whatsapp: boolean | null
          theme: string | null
          updated_at: string | null
          user_id: string
          username: string
          website_url: string | null
          whatsapp_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          is_page_active?: boolean | null
          location_url?: string | null
          notify_event_reminders?: boolean | null
          notify_new_registrations?: boolean | null
          page_description?: string | null
          page_subtitle?: string | null
          page_title: string
          playlist_url?: string | null
          preferred_theme?: string | null
          primary_color?: string | null
          public_page_visible?: boolean | null
          show_contact?: boolean | null
          show_events?: boolean | null
          show_instagram?: boolean | null
          show_location?: boolean | null
          show_playlist?: boolean | null
          show_statistics?: boolean | null
          show_website?: boolean | null
          show_whatsapp?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
          username: string
          website_url?: string | null
          whatsapp_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          category?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          id?: string
          instagram_url?: string | null
          is_page_active?: boolean | null
          location_url?: string | null
          notify_event_reminders?: boolean | null
          notify_new_registrations?: boolean | null
          page_description?: string | null
          page_subtitle?: string | null
          page_title?: string
          playlist_url?: string | null
          preferred_theme?: string | null
          primary_color?: string | null
          public_page_visible?: boolean | null
          show_contact?: boolean | null
          show_events?: boolean | null
          show_instagram?: boolean | null
          show_location?: boolean | null
          show_playlist?: boolean | null
          show_statistics?: boolean | null
          show_website?: boolean | null
          show_whatsapp?: boolean | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
          username?: string
          website_url?: string | null
          whatsapp_url?: string | null
        }
        Relationships: []
      }
      platform_events: {
        Row: {
          approval_status: string | null
          auto_generated: boolean | null
          category: string | null
          claimed_by_organizer_id: string | null
          created_at: string | null
          created_by_admin_id: string
          description: string | null
          end_date: string
          event_date: string
          id: string
          image_url: string | null
          location: string
          location_link: string | null
          max_attendees: number | null
          organizer_name: string
          source_data: Json | null
          status: string | null
          ticket_link: string | null
          ticket_price: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          approval_status?: string | null
          auto_generated?: boolean | null
          category?: string | null
          claimed_by_organizer_id?: string | null
          created_at?: string | null
          created_by_admin_id: string
          description?: string | null
          end_date: string
          event_date: string
          id?: string
          image_url?: string | null
          location: string
          location_link?: string | null
          max_attendees?: number | null
          organizer_name: string
          source_data?: Json | null
          status?: string | null
          ticket_link?: string | null
          ticket_price?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          approval_status?: string | null
          auto_generated?: boolean | null
          category?: string | null
          claimed_by_organizer_id?: string | null
          created_at?: string | null
          created_by_admin_id?: string
          description?: string | null
          end_date?: string
          event_date?: string
          id?: string
          image_url?: string | null
          location?: string
          location_link?: string | null
          max_attendees?: number | null
          organizer_name?: string
          source_data?: Json | null
          status?: string | null
          ticket_link?: string | null
          ticket_price?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_events_claimed_by_organizer_id_fkey"
            columns: ["claimed_by_organizer_id"]
            isOneToOne: false
            referencedRelation: "organizers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age: number | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          facebook_url: string | null
          find_friends_visible: boolean | null
          id: string
          instagram_url: string | null
          interest: Database["public"]["Enums"]["user_interest"] | null
          latitude: number | null
          linkedin_url: string | null
          location: string | null
          location_updated_at: string | null
          longitude: number | null
          notes: string | null
          notes_visible: boolean | null
          phone: string | null
          relationship_status:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          role: Database["public"]["Enums"]["user_role"] | null
          tiktok_url: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          username: string | null
          website: string | null
          youtube_url: string | null
        }
        Insert: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          facebook_url?: string | null
          find_friends_visible?: boolean | null
          id?: string
          instagram_url?: string | null
          interest?: Database["public"]["Enums"]["user_interest"] | null
          latitude?: number | null
          linkedin_url?: string | null
          location?: string | null
          location_updated_at?: string | null
          longitude?: number | null
          notes?: string | null
          notes_visible?: boolean | null
          phone?: string | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Update: {
          age?: number | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          facebook_url?: string | null
          find_friends_visible?: boolean | null
          id?: string
          instagram_url?: string | null
          interest?: Database["public"]["Enums"]["user_interest"] | null
          latitude?: number | null
          linkedin_url?: string | null
          location?: string | null
          location_updated_at?: string | null
          longitude?: number | null
          notes?: string | null
          notes_visible?: boolean | null
          phone?: string | null
          relationship_status?:
            | Database["public"]["Enums"]["relationship_status"]
            | null
          role?: Database["public"]["Enums"]["user_role"] | null
          tiktok_url?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          website?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          prompt: string | null
          style: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          prompt?: string | null
          style?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          prompt?: string | null
          style?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_messages: {
        Row: {
          created_at: string | null
          id: string
          is_admin_reply: boolean | null
          message: string
          read: boolean | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_admin_reply?: boolean | null
          message: string
          read?: boolean | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_admin_reply?: boolean | null
          message?: string
          read?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      user_likes: {
        Row: {
          created_at: string
          from_user_id: string
          id: string
          to_user_id: string
        }
        Insert: {
          created_at?: string
          from_user_id: string
          id?: string
          to_user_id: string
        }
        Update: {
          created_at?: string
          from_user_id?: string
          id?: string
          to_user_id?: string
        }
        Relationships: []
      }
      user_messages: {
        Row: {
          content: string
          created_at: string
          from_user_id: string
          id: string
          read: boolean
          to_user_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          from_user_id: string
          id?: string
          read?: boolean
          to_user_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          from_user_id?: string
          id?: string
          read?: boolean
          to_user_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      check_username_available: {
        Args: { current_organizer_id: string; username_to_check: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      update_organizer_stats: {
        Args: { org_id: string }
        Returns: undefined
      }
      user_confirmed_attendance_in_event: {
        Args: { _event_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      relationship_status:
        | "solteiro"
        | "namorando"
        | "casado"
        | "relacionamento_aberto"
        | "preferencia_nao_informar"
      user_interest: "namoro" | "network" | "curtição" | "amizade" | "casual"
      user_role: "user" | "organizer"
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
      app_role: ["admin", "moderator", "user"],
      relationship_status: [
        "solteiro",
        "namorando",
        "casado",
        "relacionamento_aberto",
        "preferencia_nao_informar",
      ],
      user_interest: ["namoro", "network", "curtição", "amizade", "casual"],
      user_role: ["user", "organizer"],
    },
  },
} as const
