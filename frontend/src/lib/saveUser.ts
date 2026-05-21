import { supabase } from "./supabase";

export async function saveUser(user: any) {
  const { data: existingUser } = await supabase
    .from("users")
    .select("*")
    .eq("email", user.email)
    .single();

  if (existingUser) return;

  await supabase.from("users").insert([
    {
      name: user.name,
      email: user.email,
      avatar: user.image,
      provider: "google",
      role: user.email === "ankitrajpurohit10875@gmail.com" ? "admin" : "user",
    },
  ]);
}
