/**
 * ==============================================================================
 * FILE: src/main.ts (APPLICATION ENTRY POINT)
 * ==============================================================================
 * 
 * 🔰 BEGINNER GUIDE - WHAT DOES THIS FILE DO?
 * ------------------------------------------------------------------------------
 * When someone visits this website in their browser, this file (`main.ts`) is 
 * the FIRST TypeScript/JavaScript file that runs!
 * 
 * Think of `main.ts` as the "ignition key" of the application:
 * 1. It imports Vue's `createApp` function (the engine).
 * 2. It imports `App.vue` (the root visual layout containing all screens).
 * 3. It imports `index.css` (the styles and Tailwind CSS rules).
 * 4. It starts the app and mounts (attaches) it into the `<div id="app"></div>` 
 *    element inside `index.html`.
 * 
 * ------------------------------------------------------------------------------
 * 🛠️ HOW TO MAKE MANUAL CHANGES:
 * - If you install a new Vue plugin in the future (like Vue Router, Pinia store,
 *   or an icon library), you register it right here before `.mount('#app')`.
 *   Example:
 *     const app = createApp(App);
 *     app.use(myPlugin);
 *     app.mount('#app');
 * ==============================================================================
 */

// Step 1: Import the createApp function from Vue 3 core
import { createApp } from 'vue';

// Step 2: Import our main App component (which toggles between Public Website & Operations)
import App from './App.vue';

// Step 3: Import our global CSS styling (includes Tailwind CSS classes)
import './index.css';

// Step 4: Create the Vue app instance and attach it into the HTML element with id="app"
createApp(App).mount('#app');
