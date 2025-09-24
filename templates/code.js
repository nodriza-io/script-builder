/**
 * Prolibu Script Template - Simple Event Handler
 * Modify this template according to your needs
 */

const Events = require('../../../lib/vendors/Prolibu/EventManager');

(async function() {
  console.log('🚀 Script started');
  
  // Handle API Run events
  Events.on('ApiRun', async () => {
    console.log('📡 API Run event triggered');
    
    // Simulate some async work (replace with your logic)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('✅ API processing completed');
  });

  // Initialize the event system
  await Events.init();
  
  console.log('🏁 All events initialized and ready');
})();