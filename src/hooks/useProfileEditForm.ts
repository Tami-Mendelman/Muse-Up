"use client";

import { useEffect, useState } from "react";
import type { User } from "../services/userService";

export type EditFormState = {
  name: string;
  username: string;
  bio: string;
  location: string;
  profil_url: string;
};

export function useProfileEditForm(user: User | null | undefined) {
  const [form, setForm] = useState<EditFormState>({
    name: "",
    username: "",
    bio: "",
    location: "",
    profil_url: "",
  });
  useEffect(() => {
    if (!user) return;

    setForm({
      name: user.name ?? "",
      username: user.username ?? "",
      bio: user.bio ?? "",
      location: user.location ?? "",
      profil_url: user.profil_url ?? "",
    });
  }, [user]);

  return { form, setForm };
}
