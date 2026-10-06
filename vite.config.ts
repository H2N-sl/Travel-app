/**
 * ==============================================================================
 * FILE: vite.config.ts (BUILD TOOL & LOCAL DEVELOPMENT SERVER CONFIGURATION)
 * ==============================================================================
 * 
 * 🔰 BEGINNER GUIDE - WHAT DOES THIS FILE DO?
 * ------------------------------------------------------------------------------
 * Vite is a super-fast modern frontend build tool.
 * This file tells Vite how to run your project:
 * 
 * 1. `plugins: [vue()]` -> Tells Vite to understand and compile `.vue` Single File Components.
 * 2. `server.host: '0.0.0.0'` -> Allows the dev server to accept connections from any local network IP.
 * 3. `server.port: 3000` -> Runs the local preview server on port 3000.
 * 4. `server.allowedHosts: true` -> Allows any host header (needed for cloud containers & preview URLs).
 * 
 * ------------------------------------------------------------------------------
 * 🛠️ HOW TO MAKE MANUAL CHANGES:
 * - If you ever want to proxy API requests to your Laravel backend (e.g. at http://127.0.0.1:8000),
 *   you can add a `proxy` section under `server`:
 *   ```ts
 *   server: {
 *     host: '0.0.0.0',
 *     port: 3000,
 *     proxy: {
 *       '/api': {
 *         target: 'http://127.0.0.1:8000',
 *         changeOrigin: true,
 *       }
 *     }
 *   }
 *   ```
 * ==============================================================================
 */

import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// Export Vite configuration
export default defineConfig({
  // Enable Vue 3 Single File Component support
  plugins: [vue()],

  // Development Server Configuration
  server: {
    host: '0.0.0.0', // Listen on all network addresses
    port: 3000,      // Port number for development
    allowedHosts: true, // Allow AI Studio web preview hostnames
  },
});
