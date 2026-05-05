"use client";

import useSWR from "swr";
import { getProfile, type UserProfile } from "@/lib/api/users";

export function useProfile() {
  const { data, error, isLoading, isValidating, mutate } = useSWR<UserProfile>(
    "user-profile",
    getProfile,
    { revalidateOnFocus: true }
  );

  return {
    profile: data,
    error,
    isLoading,
    isValidating,
    mutate,
  };
}
