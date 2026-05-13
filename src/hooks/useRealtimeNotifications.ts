"use client";

import { useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

/**
 * Suscribe cambios en `notifications` para un usuario y ejecuta un callback.
 * @param supabase Cliente browser Supabase.
 * @param userId UUID del perfil.
 * @param onChange Invocado en INSERT/UPDATE/DELETE.
 * @returns Función de limpieza para desuscribir.
 */
export function subscribeUserNotifications(
  supabase: SupabaseClient<Database>,
  userId: string,
  onChange: () => void,
): () => void {
  const channel = supabase
    .channel(`notifications-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
      () => {
        onChange();
      },
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

/**
 * Hook que mantiene una suscripción Realtime a las notificaciones del usuario.
 * @param supabase Cliente Supabase.
 * @param userId ID de perfil.
 * @param onChange Callback al recibir eventos.
 */
export function useRealtimeNotifications(
  supabase: SupabaseClient<Database>,
  userId: string,
  onChange: () => void,
): void {
  useEffect(() => {
    return subscribeUserNotifications(supabase, userId, onChange);
  }, [supabase, userId, onChange]);
}
