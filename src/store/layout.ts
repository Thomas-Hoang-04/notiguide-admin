"use client";

import { create } from "zustand";

interface LayoutState {
  pageGradientClass: string;
  setPageGradientClass: (cls: string) => void;
  clearPageGradientClass: () => void;
}

export const useLayoutStore = create<LayoutState>((set) => ({
  pageGradientClass: "",
  setPageGradientClass: (cls) => set({ pageGradientClass: cls }),
  clearPageGradientClass: () => set({ pageGradientClass: "" }),
}));
