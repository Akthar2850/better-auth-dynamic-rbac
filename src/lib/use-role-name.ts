"use client";

import { useEffect, useState } from "react";

const cache: Record<string, string> = {};

export function useRoleName(roleId: string): string {
  const [name, setName] = useState(cache[roleId] ?? roleId);

  useEffect(() => {
    if (cache[roleId]) {
      setName(cache[roleId]);
      return;
    }

    let cancelled = false;

    fetch("/api/roles")
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        for (const role of data.roles) {
          cache[role.id] = role.name;
        }
        setName(cache[roleId] ?? roleId);
      })
      .catch(() => {
        // fallback to raw ID
      });

    return () => {
      cancelled = true;
    };
  }, [roleId]);

  return name;
}
