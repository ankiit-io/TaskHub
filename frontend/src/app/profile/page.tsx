"use client";

import { useEffect, useState } from "react";

import { useSession } from "next-auth/react";

import { toast } from "sonner";

import { Camera, Loader2, Save, Shield, User } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  avatar_url?: string;
  display_name?: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();

  const [user, setUser] = useState<UserData | null>(null);

  const [displayName, setDisplayName] = useState("");

  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const [previewUrl, setPreviewUrl] = useState("");

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      fetchProfile();
    }
  }, [session]);

  async function fetchProfile() {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/user/${session?.user?.email}`,
      );

      const data = await res.json();

      setUser(data);

      setDisplayName(data.display_name || data.name || "");

      setPreviewUrl(data.avatar_url || data.avatar || "");
    } catch (error) {
      console.log(error);

      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  async function uploadAvatar() {
    if (!avatarFile) {
      return previewUrl;
    }

    const fileName = `${user?.id}_${Date.now()}`;

    const formData = new FormData();

    formData.append("file", avatarFile);

    const uploadRes = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/avatars/${fileName}`,
      {
        method: "POST",

        headers: {
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },

        body: formData,
      },
    );

    if (!uploadRes.ok) {
      throw new Error("Avatar upload failed");
    }

    return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${fileName}`;
  }

  async function saveProfile() {
    try {
      setSaving(true);

      let avatarUrl = previewUrl;

      if (avatarFile) {
        avatarUrl = await uploadAvatar();
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/${user?.id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            display_name: displayName,
            avatar_url: avatarUrl,
          }),
        },
      );

      if (!res.ok) {
        throw new Error();
      }

      const updated = await res.json();

      setUser(updated);

      setPreviewUrl(updated.avatar_url);

      setAvatarFile(null);
    } catch (error) {
      console.log(error);

      toast.error("Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-72 rounded-2xl bg-white/10" />

        <div className="h-[500px] rounded-[32px] bg-white/5 border border-white/10" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-5xl font-bold">Profile</h1>

        <p className="text-gray-400 mt-3 text-lg">Manage your account</p>
      </div>

      <div className="grid lg:grid-cols-[340px_1fr] gap-8">
        <div className="border border-white/10 bg-white/5 rounded-[32px] p-7 h-fit">
          <div className="flex flex-col items-center text-center">
            <div className="relative">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="avatar"
                  className="h-36 w-36 rounded-full object-cover border-4 border-white/10"
                />
              ) : (
                <div className="h-36 w-36 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-5xl font-bold">
                  {displayName?.charAt(0)}
                </div>
              )}

              <label className="absolute bottom-2 right-2 h-12 w-12 rounded-full bg-white text-black cursor-pointer flex items-center justify-center shadow-xl">
                <Camera className="h-5 w-5" />

                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];

                    if (!file) return;

                    setAvatarFile(file);

                    setPreviewUrl(URL.createObjectURL(file));
                  }}
                />
              </label>
            </div>

            <h2 className="text-3xl font-bold mt-6">{displayName}</h2>

            <p className="text-gray-400 mt-2">{user?.email}</p>

            <div className="mt-5 h-11 px-5 rounded-2xl border border-white/10 bg-white/5 flex items-center gap-2">
              {user?.role === "admin" ? (
                <>
                  <Shield className="h-4 w-4 text-red-400" />

                  <span className="text-sm">Admin</span>
                </>
              ) : (
                <>
                  <User className="h-4 w-4 text-blue-400" />

                  <span className="text-sm">Creator</span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="border border-white/10 bg-white/5 rounded-[32px] p-8 space-y-8">
          <div>
            <h2 className="text-3xl font-bold">Edit Profile</h2>

            <p className="text-gray-400 mt-2">
              Update your public profile information
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm text-gray-400">Display Name</label>

              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter display name"
                className="w-full h-14 rounded-2xl border border-white/10 bg-black/20 px-5 outline-none focus:border-white/20"
              />
            </div>

            <div className="space-y-3">
              <label className="text-sm text-gray-400">Email Address</label>

              <input
                disabled
                value={user?.email || ""}
                className="w-full h-14 rounded-2xl border border-white/10 bg-black/40 px-5 text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <button
            disabled={saving}
            onClick={saveProfile}
            className="h-14 px-7 rounded-2xl bg-white text-black font-semibold hover:opacity-90 transition-all flex items-center gap-3"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Save className="h-5 w-5" />
            )}

            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
