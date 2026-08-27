"use client";

import { createContext, useContext, type ReactNode } from "react";

export type ProgressAdaptersImporter = () => Promise<unknown>;

let progressAdaptersPromise: Promise<unknown> | null = null;

/**
 * Keep the expensive progress registry behind one layout-owned import site.
 * Turbopack can then emit one lazy chunk for every consumer instead of one
 * copy per CourseShell route entry.
 */
export function loadPublishedProgressAdapters(): Promise<unknown> {
  if (!progressAdaptersPromise) {
    progressAdaptersPromise = import("./progress-adapters").catch((error: unknown) => {
      progressAdaptersPromise = null;
      throw error;
    });
  }
  return progressAdaptersPromise;
}

const ProgressAdaptersLoaderContext = createContext<ProgressAdaptersImporter>(
  loadPublishedProgressAdapters,
);

export default function ProgressAdaptersProvider({ children }: { readonly children: ReactNode }) {
  return (
    <ProgressAdaptersLoaderContext.Provider value={loadPublishedProgressAdapters}>
      {children}
    </ProgressAdaptersLoaderContext.Provider>
  );
}

export function useProgressAdaptersImporter(): ProgressAdaptersImporter {
  return useContext(ProgressAdaptersLoaderContext);
}
