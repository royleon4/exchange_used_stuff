import { createContext, useContext, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { PublicUser } from "../../../shared/types";

type AuthContextValue = {
  user: PublicUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => api<{ user: PublicUser | null }>("/api/auth/me"),
    staleTime: 5 * 60 * 1000,
  });

  return (
    <AuthContext.Provider
      value={{
        user: query.data?.user ?? null,
        isLoading: query.isLoading,
        refresh: async () => {
          await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        },
        logout: async () => {
          await api<void>("/api/auth/logout", { method: "POST" });
          queryClient.setQueryData(["auth", "me"], { user: null });
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
