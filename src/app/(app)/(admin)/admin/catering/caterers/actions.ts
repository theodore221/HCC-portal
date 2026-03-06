// @ts-nocheck
"use server";

import { sbServer } from "@/lib/supabase-server";
import { sbAdmin } from "@/lib/supabase-admin";
import { ensureCatererUser } from "@/lib/auth/admin-actions";
import { sendCatererInvitation } from "@/lib/email/send-caterer-invitation";
import { revalidateTag } from "next/cache";
import { CACHE_TAGS } from "@/lib/cache";
import type { TablesInsert, TablesUpdate } from "@/lib/database.types";

export async function createCaterer(data: TablesInsert<"caterers">) {
  const supabase = await sbServer();

  // @ts-ignore - Type compatibility issue with @supabase/ssr
  const { data: caterer, error } = await supabase
    .from("caterers")
    // @ts-ignore
    .insert(data)
    .select()
    .single();

  if (error) throw error;

  // If email provided, create user and send invitation
  if (caterer?.email) {
    try {
      const userId = await ensureCatererUser(caterer.email, caterer.name, caterer.id);

      const adminSupabase = sbAdmin();
      await adminSupabase
        .from("caterers")
        // @ts-ignore
        .update({ user_id: userId })
        .eq("id", caterer.id);

      const { data: linkData, error: linkError } =
        await adminSupabase.auth.admin.generateLink({
          type: "magiclink",
          email: caterer.email,
          options: {
            redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback`,
          },
        });

      if (linkError) throw new Error(`Failed to generate magic link: ${linkError.message}`);

      await sendCatererInvitation({
        catererName: caterer.name,
        catererEmail: caterer.email,
        magicLinkUrl: linkData.properties.action_link,
      });
    } catch (emailError) {
      console.error("Error sending caterer invitation:", emailError);
    }
  }

  revalidateTag(CACHE_TAGS.CATERING_OPTIONS);
}

export async function updateCaterer(id: string, data: TablesUpdate<"caterers">) {
  const supabase = await sbServer();
  // @ts-ignore
  const { error } = await supabase.from("caterers").update(data).eq("id", id);
  if (error) throw error;
  revalidateTag(CACHE_TAGS.CATERING_OPTIONS);
}

export async function deleteCaterer(id: string) {
  const supabase = await sbServer();
  const { error } = await supabase.from("caterers").delete().eq("id", id);
  if (error) throw error;
  revalidateTag(CACHE_TAGS.CATERING_OPTIONS);
}

export async function reinviteCaterer(id: string) {
  const supabase = await sbServer();
  const { data: caterer, error } = await supabase
    .from("caterers")
    .select("id, name, email")
    .eq("id", id)
    .single();

  if (error || !caterer) throw new Error("Caterer not found");
  if (!caterer.email) throw new Error("Caterer has no email address");

  const adminSupabase = sbAdmin();

  try {
    const userId = await ensureCatererUser(caterer.email, caterer.name, caterer.id);

    await adminSupabase
      .from("caterers")
      // @ts-ignore
      .update({ user_id: userId })
      .eq("id", caterer.id);

    const { data: linkData, error: linkError } =
      await adminSupabase.auth.admin.generateLink({
        type: "magiclink",
        email: caterer.email,
        options: {
          redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/auth/callback`,
        },
      });

    if (linkError) throw new Error(`Failed to generate magic link: ${linkError.message}`);

    await sendCatererInvitation({
      catererName: caterer.name,
      catererEmail: caterer.email,
      magicLinkUrl: linkData.properties.action_link,
    });
  } catch (err) {
    console.error("Error re-inviting caterer:", err);
    throw err;
  }
}
