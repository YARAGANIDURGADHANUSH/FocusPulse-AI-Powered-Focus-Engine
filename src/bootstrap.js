/**
 * BOOTSTRAP INITIALIZATION
 * This file ensures all app functions are properly exported to window
 * and initializes the app in a bulletproof way
 */

console.log('🔷 BOOTSTRAP: Starting initialization...');

// Create a global app state
window.focusPulseApp = {
  initialized: false,
  modules: {},
  functions: {},
  error: null,
};

// Wrap entire initialization
async function bootstrapApp() {
  try {
    console.log('📦 BOOTSTRAP: Importing main module...');
    
    const mainModule = await import('./main.js');
    
    console.log('✅ BOOTSTRAP: Main module imported');
    console.log('BOOTSTRAP: Module exports:', Object.keys(mainModule));
    
    // Store exported functions
    if (mainModule.startSession) {
      window.focusPulseApp.functions.startSession = mainModule.startSession;
      window.startFocus = mainModule.startSession;
      console.log('✓ startSession available as window.startFocus');
    } else {
      console.warn('⚠️ startSession not found in module');
    }
    
    if (mainModule.stopSession) {
      window.focusPulseApp.functions.stopSession = mainModule.stopSession;
      window.stopFocus = mainModule.stopSession;
      console.log('✓ stopSession available as window.stopFocus');
    } else {
      console.warn('⚠️ stopSession not found in module');
    }
    
    window.focusPulseApp.initialized = true;
    console.log('✅ BOOTSTRAP: App initialized successfully');
    console.log('✅ Ready to use app!');
    
    // Verify button functions are available
    console.log('=== BUTTON FUNCTION AVAILABILITY ===');
    console.log('window.startFocus:', typeof window.startFocus);
    console.log('window.stopFocus:', typeof window.stopFocus);
    console.log('=====================================');
    
  } catch (error) {
    console.error('❌ BOOTSTRAP FAILED:', error);
    console.error('Stack:', error.stack);
    window.focusPulseApp.error = error;
    window.focusPulseApp.initialized = false;
    
    // Display error on page
    document.body.innerHTML = `
      <div style="padding: 20px; background: #1a1f2e; color: #ff3b5c; font-family: monospace;">
        <h2>❌ FocusPulse Failed to Initialize</h2>
        <h3>Error:</h3>
        <pre>${error.message}</pre>
        <h3>Details:</h3>
        <pre>${error.stack}</pre>
        <p><strong>Check browser console (F12) for more information</strong></p>
      </div>
    `;
  }
}

// Start bootstrap when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📌 DOMContentLoaded event fired');
    bootstrapApp();
  });
} else {
  console.log('📌 DOM already loaded, starting bootstrap...');
  bootstrapApp();
}

console.log('🔷 BOOTSTRAP: Setup complete, waiting for DOM ready...');
