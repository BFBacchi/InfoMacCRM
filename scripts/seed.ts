/**
 * @file Carga datos de demostración en Supabase usando la service role key.
 * Requiere `.env.local` con NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.
 * Uso: `npm run db:seed`
 */
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Crea un usuario confirmado o devuelve su id si ya existe.
 * @param email Correo único
 * @param password Contraseña temporal (solo dev)
 * @param fullName Nombre visible
 * @returns UUID del usuario en auth.users
 */
async function ensureUser(
  email: string,
  password: string,
  fullName: string,
): Promise<string> {
  const perPage = 200;
  let page = 1;
  let foundId: string | undefined;
  for (;;) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) {
      foundId = hit.id;
      break;
    }
    if (data.users.length < perPage) break;
    page += 1;
  }
  if (foundId) {
    await admin.from("profiles").update({ full_name: fullName, email }).eq("id", foundId);
    return foundId;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (error) throw error;
  const id = data.user!.id;
  await admin.from("profiles").update({ full_name: fullName, email }).eq("id", id);
  return id;
}

/**
 * Punto de entrada del seed: bases, clientes, usuarios, técnicos, tickets y garantías.
 */
async function main() {
  const { count: baseCount } = await admin.from("bases").select("*", { count: "exact", head: true });

  let bases: { id: string }[] = [];
  if (!baseCount) {
    const { data, error } = await admin
      .from("bases")
      .insert([
        {
          name: "Base CABA Cliente",
          city: "Buenos Aires",
          province: "CABA",
          type: "cliente",
          lat: -34.6037,
          lng: -58.3816,
        },
        {
          name: "Depósito INFOMAC Norte",
          city: "San Isidro",
          province: "Buenos Aires",
          type: "infomac",
          lat: -34.47,
          lng: -58.52,
        },
        {
          name: "Hub INFOMAC Córdoba",
          city: "Córdoba",
          province: "Córdoba",
          type: "infomac",
          lat: -31.42,
          lng: -64.18,
        },
      ])
      .select("id");
    if (error) throw error;
    bases = data ?? [];
  } else {
    const { data, error } = await admin.from("bases").select("id").limit(3);
    if (error) throw error;
    bases = data ?? [];
  }

  const baseCaba = bases[0]?.id;
  const baseNorte = bases[1]?.id;
  const baseCordoba = bases[2]?.id;

  const { count: clientCount } = await admin.from("clients").select("*", { count: "exact", head: true });
  let dellId: string;
  let lenovoId: string;
  if (!clientCount) {
    const { data, error } = await admin
      .from("clients")
      .insert([
        { name: "Dell Argentina", type: "dell", sla_hours: 24, contact_email: "sla@dell.example" },
        { name: "Lenovo Services", type: "lenovo", sla_hours: 48, contact_email: "ops@lenovo.example" },
      ])
      .select("id");
    if (error) throw error;
    dellId = data![0].id;
    lenovoId = data![1].id;
  } else {
    const { data, error } = await admin.from("clients").select("id, type").limit(10);
    if (error) throw error;
    const d = data?.find((c) => c.type === "dell");
    const l = data?.find((c) => c.type === "lenovo");
    if (!d || !l) throw new Error("Clientes Dell/Lenovo no encontrados; vacía la tabla clients o ejecuta migración limpia.");
    dellId = d.id;
    lenovoId = l.id;
  }

  const pass = "Demo1234!";
  const adminId = await ensureUser("admin@demo.infomac.local", pass, "Admin Demo");
  await admin.from("profiles").update({ role: "admin", base_id: baseCaba, is_superuser: true }).eq("id", adminId);

  const coord1 = await ensureUser("coord1@demo.infomac.local", pass, "María Coordinadora");
  const coord2 = await ensureUser("coord2@demo.infomac.local", pass, "Juan Coordinador");
  const coord3 = await ensureUser("coord3@demo.infomac.local", pass, "Ana Coordinadora");
  await admin
    .from("profiles")
    .update({ role: "coordinator", base_id: baseCaba })
    .in("id", [coord1, coord2, coord3]);

  const techProfiles: string[] = [];
  for (let i = 1; i <= 5; i++) {
    const id = await ensureUser(`tech${i}@demo.infomac.local`, pass, `Técnico ${i}`);
    techProfiles.push(id);
    await admin
      .from("profiles")
      .update({
        role: "technician",
        base_id: i <= 2 ? baseCaba : i <= 4 ? baseNorte : baseCordoba,
        phone: `11-6000-${1000 + i}`,
      })
      .eq("id", id);
  }

  const { count: techRowCount } = await admin.from("technicians").select("*", { count: "exact", head: true });
  if (!techRowCount) {
    for (let i = 0; i < techProfiles.length; i++) {
      const base = i <= 1 ? baseCaba : i <= 3 ? baseNorte : baseCordoba;
      await admin.from("technicians").insert({
        profile_id: techProfiles[i],
        base_id: base,
        specialty: i % 2 === 0 ? "Hardware" : "Logística",
        availability: true,
      });
    }
  }

  const { data: techRows } = await admin.from("technicians").select("id, profile_id");
  const techIds = (techRows ?? []).map((t) => t.id);
  if (techIds.length === 0) throw new Error("No hay filas en technicians");

  const { count: ticketCount } = await admin.from("tickets").select("*", { count: "exact", head: true });
  if (!ticketCount) {
    const statuses = [
      "sin_asignar",
      "asignado",
      "en_curso",
      "cerrado_operativo",
      "cerrado_definitivo",
    ] as const;
    const priorities = ["standard", "incidencia", "critico"] as const;
    const cities = [
      ["Buenos Aires", "CABA"],
      ["Rosario", "Santa Fe"],
      ["Córdoba", "Córdoba"],
      ["Mendoza", "Mendoza"],
      ["La Plata", "Buenos Aires"],
    ];

    const ticketRows = [];
    for (let i = 0; i < 10; i++) {
      const [city, prov] = cities[i % cities.length];
      const partsCycle = ["pendiente", "recibida", "no_aplica"] as const;
      ticketRows.push({
        client_id: i % 2 === 0 ? dellId : lenovoId,
        technician_id: i < 8 ? techIds[i % techIds.length] : null,
        coordinator_id: [coord1, coord2, coord3][i % 3],
        city,
        province: prov,
        task_type: "diagnostico",
        description: `Ticket demo ${i + 1}: visita programada — escenario de campo`,
        equipment_model: i % 2 === 0 ? "Dell Latitude 5540" : "Lenovo ThinkPad T14 Gen 3",
        end_user_location: `Usuario final: Av. Demo ${120 + i}, ${city}`,
        action_taken: i >= 7 ? "Reinstalación de sistema operativo" : "",
        parts_received_status: partsCycle[i % 3],
        priority: priorities[i % priorities.length],
        status: statuses[i % statuses.length],
        sla_hours: 48,
        received_at: new Date().toISOString(),
        base_cliente_id: baseCaba,
        base_infomac_id: baseNorte,
        km_cliente: 12 + i,
        km_infomac: 8 + i,
      });
    }

    const { data: tickets, error: tErr } = await admin.from("tickets").insert(ticketRows).select("id, ticket_number");
    if (tErr) throw tErr;

    const t0 = tickets![0].id;
    const t1 = tickets![1].id;

    const { error: wErr } = await admin.from("warranty_cases").insert([
      {
        ticket_id: t0,
        client_id: dellId,
        technician_id: techIds[0],
        part_description: "Motherboard XPS 15",
        part_status: "recibida",
        part_photo_url: null,
        return_status: "pendiente",
      },
      {
        ticket_id: t1,
        client_id: lenovoId,
        technician_id: techIds[1],
        part_description: "Pantalla ThinkPad T14",
        part_status: "pendiente",
        return_status: "pendiente",
      },
    ]);
    if (wErr) throw wErr;
  }

  console.log("Seed completado. Contraseña demo:", pass);
  console.log("  Admin: admin@demo.infomac.local");
  console.log("  Coordinadores: coord1@demo.infomac.local … coord3@…");
  console.log("  Técnicos: tech1@demo.infomac.local … tech5@…");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
