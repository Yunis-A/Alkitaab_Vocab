import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  // GitHub Pages serves the site under /<repo>/, so the deploy workflow sets VITE_BASE; locally it is "/".
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
});
