(function () {
    const SUPA_URL = 'https://ncgpeftflcvlvedmpfno.supabase.co';
    const SUPA_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5jZ3BlZnRmbGN2bHZlZG1wZm5vIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1ODU3OTUsImV4cCI6MjA4OTE2MTc5NX0.-5kdnQhtjg_4nebCeReHEE-rYZAulSlQYjA0M2LK5Zg';
  
    let SESSION_ID = sessionStorage.getItem('portfolio_session');
    if (!SESSION_ID) {
      SESSION_ID = Math.random().toString(36).slice(2, 7).toUpperCase();
      sessionStorage.setItem('portfolio_session', SESSION_ID);
    }
  
    window.logEvent = async function (eventName, page) {
      try {
        await fetch(`${SUPA_URL}/rest/v1/visits`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPA_KEY,
            'Authorization': `Bearer ${SUPA_KEY}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ event_name: eventName, page, session_id: SESSION_ID })
        });
      } catch (e) { console.log('event log failed', e); }
    };
  
    const page = document.body.dataset.navActive || 'unknown';
    window.logEvent('page_view', page);
  })();