import { sbAdmin } from "@/lib/supabase-admin";

export async function ensureCustomerProfile(email: string, name: string) {
  const supabase = sbAdmin();

  // 1. Check profiles table first (O(1) indexed lookup)
  const { data: existingProfile, error: profileError } = (await supabase
    .from("profiles")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle()) as any;

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error checking profile:", profileError);
    throw new Error("Failed to check for existing user");
  }

  if (existingProfile) {
    return existingProfile.id;
  }

  // 2. Create user if not exists
  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm so they can login immediately (e.g. via magic link or password reset)
      user_metadata: {
        full_name: name,
        role: "customer",
      },
    });

  if (createError) {
    console.error("Error creating user:", createError);
    throw new Error(`Failed to create customer user: ${createError.message}`);
  }

  return newUser.user.id;
}

export async function ensureCatererUser(
  email: string,
  name: string,
  catererId: string
): Promise<string> {
  const supabase = sbAdmin();

  // 1. Check profiles table first (O(1) indexed lookup)
  const { data: existingProfile, error: profileError } = (await supabase
    .from("profiles")
    .select("id, role, caterer_id")
    .eq("email", email.toLowerCase())
    .maybeSingle()) as {
    data: { id: string; role: string; caterer_id: string | null } | null;
    error: any;
  };

  if (profileError && profileError.code !== "PGRST116") {
    console.error("Error checking profile:", profileError);
    throw new Error("Failed to check for existing user");
  }

  if (existingProfile) {
    const existingUser = { id: existingProfile.id };
    // Check if user already has a profile with a different role
    const { data: profileData } = (await supabase
      .from("profiles")
      .select("role, caterer_id")
      .eq("id", existingUser.id)
      .maybeSingle()) as {
      data: { role: string; caterer_id: string | null } | null;
    };

    if (profileData && profileData.role !== "caterer") {
      throw new Error(
        `This email already belongs to a ${profileData.role} user. Please use a different email address for the caterer.`
      );
    }
    // If they're already a caterer, just update the caterer_id link
    if (profileData && profileData.caterer_id !== catererId) {
      await supabase
        .from("profiles")
        // @ts-ignore - Type compatibility issue with @supabase/ssr
        .update({ caterer_id: catererId })
        .eq("id", existingProfile.id);
    }
    return existingProfile.id;
  }

  // 2. Create user if not exists
  const { data: newUser, error: createError } =
    await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm so they can login immediately via magic link
      user_metadata: {
        full_name: name,
      },
      app_metadata: {
        profile_seed: {
          role: "caterer",
          caterer_id: catererId,
        },
      },
    });

  if (createError) {
    console.error("Error creating caterer user:", createError);
    throw new Error(`Failed to create caterer user: ${createError.message}`);
  }

  return newUser.user.id;
}
