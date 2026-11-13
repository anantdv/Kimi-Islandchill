import { create } from "zustand";

export const useSession = create((set) => ({
  user: null,
  bootstrap: null,
  setSession: (user, bootstrap) => set({ user, bootstrap }),
  clear: () => set({ user: null, bootstrap: null }),
}));
