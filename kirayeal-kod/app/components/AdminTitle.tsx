"use client";
import { useEffect, useState } from "react";
export default function AdminTitle() {
  const [title, setTitle] = useState("");
  useEffect(() => {
    let active = true;
    fetch("/api/account/profile", { cache: "no-store" }).then(r => r.json()).then(({ profile }) => {
      if (active && profile) setTitle(profile.staff_role === "leader" ? "Rəhbər paneli" : "Admin paneli");
    }).catch(() => { if (active) setTitle("Admin paneli"); });
    return () => { active = false; };
  }, []);
  return <h1 aria-live="polite">{title || " "}</h1>;
}
