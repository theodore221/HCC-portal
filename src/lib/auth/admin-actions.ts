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
