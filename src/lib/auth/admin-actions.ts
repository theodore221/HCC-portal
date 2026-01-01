import { sbAdmin } from "@/lib/supabase-admin";

export async function ensureCustomerProfile(email: string, name: string) {
  const supabase = sbAdmin();

  // 1. Check if user exists
  const {
    data: { users },
    error: searchError,
  } = await supabase.auth.admin.listUsers();

  if (searchError) {
    console.error("Error listing users:", searchError);
    throw new Error("Failed to check for existing user");
  }

  // Note: listUsers() is paginated but for now we assume small user base or we should use listUsers({ page: 1, perPage: 1000 })
  // or better yet, try to create and catch error, but we want to link if exists.
  // Actually, listUsers doesn't support filtering by email directly in all versions, but let's check.
  // A better way might be to try to get the user by email if possible, but admin api usually lists.
  // Let's iterate.

  const existingUser = users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    // Ensure they have a profile (triggers should handle this, but just in case)
    // We can return the ID.
    return existingUser.id;
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

  // 1. Check if user exists
  const {
    data: { users },
    error: searchError,
  } = await supabase.auth.admin.listUsers();

  if (searchError) {
    console.error("Error listing users:", searchError);
    throw new Error("Failed to check for existing user");
  }

  const existingUser = users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  );

  if (existingUser) {
    // Check if user already has a profile with a different role
    const { data: existingProfile } = (await supabase
      .from("profiles")
      .select("role, caterer_id")
      .eq("id", existingUser.id)
      .maybeSingle()) as {
      data: { role: string; caterer_id: string | null } | null;
    };

    if (existingProfile) {
      // User already has a profile
      if (existingProfile.role !== "caterer") {
        throw new Error(
          `This email already belongs to a ${existingProfile.role} user. Please use a different email address for the caterer.`
        );
      }
      // If they're already a caterer, just update the caterer_id link
      if (existingProfile.caterer_id !== catererId) {
        await supabase
          .from("profiles")
          // @ts-ignore - Type compatibility issue with @supabase/ssr
          .update({ caterer_id: catererId })
          .eq("id", existingUser.id);
      }
      return existingUser.id;
    }

    // User exists but no profile - update metadata for when they first log in
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      existingUser.id,
      {
        app_metadata: {
          profile_seed: {
            role: "caterer",
            caterer_id: catererId,
          },
        },
      }
    );

    if (updateError) {
      console.error("Error updating user metadata:", updateError);
      throw new Error(
        `Failed to update caterer user: ${updateError.message}`
      );
    }

    return existingUser.id;
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
