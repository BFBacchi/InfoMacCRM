export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = "admin" | "coordinator" | "technician";
export type BaseType = "cliente" | "infomac";
export type ClientType = "dell" | "lenovo" | "other";
export type TaskType =
  | "masterizacion"
  | "reemplazo"
  | "diagnostico"
  | "relevamiento"
  | "otro";
export type PriorityLevel = "standard" | "incidencia" | "critico";
export type TicketStatus =
  | "sin_asignar"
  | "asignado"
  | "en_curso"
  | "cerrado_operativo"
  | "cerrado_definitivo";
export type TicketPartsReceived = "recibida" | "pendiente" | "no_aplica";
export type PartStatus = "pendiente" | "recibida" | "incorrecta" | "devuelta";
export type ReturnStatus = "pendiente" | "en_proceso" | "completada";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          role: UserRole;
          is_superuser: boolean;
          phone: string | null;
          avatar_url: string | null;
          base_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id: string };
        Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Relationships: [];
      };
      bases: {
        Row: {
          id: string;
          name: string;
          city: string;
          province: string;
          type: BaseType;
          lat: number | null;
          lng: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["bases"]["Row"], "id" | "created_at" | "updated_at"> &
          Partial<Pick<Database["public"]["Tables"]["bases"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["bases"]["Row"]>;
        Relationships: [];
      };
      clients: {
        Row: {
          id: string;
          name: string;
          type: ClientType;
          sla_hours: number;
          contact_email: string | null;
          contact_phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["clients"]["Row"], "id" | "created_at" | "updated_at"> &
          Partial<Pick<Database["public"]["Tables"]["clients"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["clients"]["Row"]>;
        Relationships: [];
      };
      technicians: {
        Row: {
          id: string;
          profile_id: string;
          base_id: string | null;
          specialty: string | null;
          availability: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["technicians"]["Row"], "id" | "created_at" | "updated_at"> &
          Partial<Pick<Database["public"]["Tables"]["technicians"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["technicians"]["Row"]>;
        Relationships: [];
      };
      tickets: {
        Row: {
          id: string;
          ticket_number: string;
          client_id: string;
          technician_id: string | null;
          coordinator_id: string | null;
          city: string;
          province: string;
          task_type: TaskType;
          description: string;
          priority: PriorityLevel;
          status: TicketStatus;
          sla_hours: number;
          received_at: string | null;
          scheduled_at: string | null;
          attended_at: string | null;
          closed_at: string | null;
          km_cliente: number | null;
          base_cliente_id: string | null;
          km_infomac: number | null;
          base_infomac_id: string | null;
          notes: string | null;
          equipment_model: string;
          end_user_location: string;
          action_taken: string;
          parts_received_status: TicketPartsReceived;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          ticket_number?: string;
          client_id: string;
          technician_id?: string | null;
          coordinator_id?: string | null;
          city: string;
          province: string;
          task_type?: TaskType;
          description?: string;
          priority?: PriorityLevel;
          status?: TicketStatus;
          sla_hours?: number;
          received_at?: string | null;
          scheduled_at?: string | null;
          attended_at?: string | null;
          closed_at?: string | null;
          km_cliente?: number | null;
          base_cliente_id?: string | null;
          km_infomac?: number | null;
          base_infomac_id?: string | null;
          notes?: string | null;
          equipment_model?: string;
          end_user_location?: string;
          action_taken?: string;
          parts_received_status?: TicketPartsReceived;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["tickets"]["Row"]>;
        Relationships: [];
      };
      warranty_cases: {
        Row: {
          id: string;
          ticket_id: string;
          client_id: string;
          technician_id: string | null;
          part_description: string;
          part_status: PartStatus;
          part_received_at: string | null;
          part_photo_url: string | null;
          return_status: ReturnStatus;
          return_date: string | null;
          return_photo_url: string | null;
          return_remito_url: string | null;
          sla_complied: boolean | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          ticket_id: string;
          client_id: string;
          technician_id?: string | null;
          part_description: string;
          part_status?: PartStatus;
          part_received_at?: string | null;
          part_photo_url?: string | null;
          return_status?: ReturnStatus;
          return_date?: string | null;
          return_photo_url?: string | null;
          return_remito_url?: string | null;
          sla_complied?: boolean | null;
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["warranty_cases"]["Row"]>;
        Relationships: [];
      };
      ticket_history: {
        Row: {
          id: string;
          ticket_id: string;
          user_id: string | null;
          action: string;
          previous_value: string | null;
          new_value: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["ticket_history"]["Row"], "id" | "created_at"> &
          Partial<Pick<Database["public"]["Tables"]["ticket_history"]["Row"], "id">>;
        Update: never;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          ticket_id: string | null;
          type: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["notifications"]["Row"], "id" | "created_at"> &
          Partial<Pick<Database["public"]["Tables"]["notifications"]["Row"], "id">>;
        Update: Partial<Pick<Database["public"]["Tables"]["notifications"]["Row"], "read">>;
        Relationships: [];
      };
      attachments: {
        Row: {
          id: string;
          ticket_id: string | null;
          warranty_case_id: string | null;
          url: string;
          file_type: string;
          uploaded_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["attachments"]["Row"], "id" | "created_at"> &
          Partial<Pick<Database["public"]["Tables"]["attachments"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["attachments"]["Row"]>;
        Relationships: [];
      };
      notification_settings: {
        Row: { id: string; key: string; enabled: boolean; updated_at: string };
        Insert: Omit<Database["public"]["Tables"]["notification_settings"]["Row"], "id" | "updated_at"> &
          Partial<Pick<Database["public"]["Tables"]["notification_settings"]["Row"], "id">>;
        Update: Partial<Database["public"]["Tables"]["notification_settings"]["Row"]>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
  };
}

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Ticket = Database["public"]["Tables"]["tickets"]["Row"];
export type WarrantyCase = Database["public"]["Tables"]["warranty_cases"]["Row"];
