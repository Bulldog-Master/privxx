export const buildInfo = {
  version: (import.meta as any).env?.VITE_APP_VERSION ?? "0.2.0",
  build: (import.meta as any).env?.VITE_APP_BUILD ?? ""
};
