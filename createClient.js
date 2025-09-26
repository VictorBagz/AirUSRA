// Initialize Supabase client
(function() {
    // Supabase config (keys and URL)
    const SUPABASE_URL = "https://yoerbisfayganfuuvfgc.supabase.co";
    const SUPABASE_ANON_KEY =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvZXJiaXNmYXlnYW5mdXV2ZmdjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NTU0MzcsImV4cCI6MjA3NDQzMTQzN30.f8iMGd8qgXMWgj4XLwfuHdBgx3TrVb6P9QuRNlszEU0";
    
    // Wait for the document to be ready
    document.addEventListener('DOMContentLoaded', function() {

    // Function to initialize Supabase client
    function initSupabase() {
        if (typeof supabase !== 'undefined') {
            try {
                const { createClient } = supabase;
                window.supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                console.log("Supabase client initialized successfully");
                return true;
            } catch (error) {
                console.error("Error initializing Supabase client:", error);
                return false;
            }
        }
        return false;
    }

    // Try to initialize immediately
    if (!initSupabase()) {
        // If failed, wait for the script to load and try again
        window.addEventListener('load', () => {
            const maxAttempts = 10;
            let attempts = 0;
            
            const initInterval = setInterval(() => {
                attempts++;
                if (initSupabase()) {
                    clearInterval(initInterval);
                } else if (attempts >= maxAttempts) {
                    clearInterval(initInterval);
                    console.error("Failed to initialize Supabase client after multiple attempts");
                }
            }, 500);
        });
    }
    });
})();


