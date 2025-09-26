// dashboard.js (Updated and Corrected)

document.addEventListener("DOMContentLoaded", async () => {
  // Use the globally initialized Supabase client from createClient.js
  const supabase = window.supabase;
  const errorDisplay = document.getElementById("dashboard-error");

  // 1. Check if Supabase client is available
  if (!supabase) {
    console.error("Supabase client not initialized. Check script loading order in dashboard.html.");
    if (errorDisplay) {
        errorDisplay.textContent = "Critical configuration error. Please refresh.";
        errorDisplay.style.display = "flex";
    }
    return; // Stop execution if Supabase is not loaded
  }

  // 2. Check for an active user session
  let sessionData;
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!data.session) {
      // If no user is logged in, redirect to the sign-in page
      window.location.href = "signin.html";
      return;
    }
    sessionData = data.session;
  } catch (error) {
    console.error("Error getting session:", error);
    if (errorDisplay) {
        errorDisplay.textContent = "Could not verify session. Please sign in again.";
        errorDisplay.style.display = "flex";
    }
    // Delay redirect to allow user to see the message
    setTimeout(() => { window.location.href = "signin.html"; }, 2000);
    return;
  }

  const user = sessionData.user;

  // 3. Fetch user profile and joined school data
  let profileData;
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select(`*, schools (*)`) // Simplified select query
      .eq("id", user.id)
      .single(); // .single() is fine here, as a logged-in user MUST have a profile

    if (error) throw error;

    if (!data) {
        throw new Error("Your profile could not be found. Please contact support.");
    }
    
    profileData = data;

    // 4. Populate the page with the fetched data
    populateProfileData(profileData);
    
    // 5. Load players for the school
    if (profileData.schools?.id) {
        loadPlayers(profileData.schools.id);
    }

  } catch (error) {
    console.error("Error fetching profile:", error);
    if (errorDisplay) {
        errorDisplay.textContent = error.message || "Could not fetch your profile data.";
        errorDisplay.style.display = "flex";
    }
  }
});

/**
 * Populates the dashboard with user and school data.
 * @param {object} data The user profile object, including nested school data.
 */
function populateProfileData(data) {
  const schoolData = data.schools; // The nested school object

  // Default images to prevent broken links if URLs are missing
  const defaultProfilePic = "https://placehold.co/100x100/EFEFEF/333333?text=No+Photo";
  const defaultSchoolBadge = "https://placehold.co/150x150/EFEFEF/333333?text=No+Badge";
  
  // Populate sidebar
  document.getElementById("sidebar-user-name").textContent = data.full_name || "N/A";
  document.getElementById("sidebar-school-name").textContent = schoolData?.school_name || "N/A";
  document.getElementById("sidebar-profile-photo").src = data.profile_photo_url || defaultProfilePic;
  // Add an error handler for the image
  document.getElementById("sidebar-profile-photo").onerror = function() { this.src = defaultProfilePic; };


  // Helper function to safely set data on the page
  const setData = (field, value, fallback = "...") => {
    // Select all elements with the data-field attribute, not just the first one
    const elements = document.querySelectorAll(`[data-field="${field}"]`);
    if (elements.length > 0) {
        elements.forEach(el => {
            const finalValue = value || fallback;
            if (el.dataset.type === "image") {
                el.src = finalValue;
                el.onerror = function() { this.src = defaultSchoolBadge; };
            } else if (el.dataset.type === "link") {
                el.href = finalValue;
                el.textContent = value ? "View Document" : "No Document";
                if (!value) el.classList.add("disabled");
            } else if (el.dataset.type === "background") {
                 // Only set the background image if a valid URL is provided
                if (value) {
                    el.style.backgroundImage = `url('${finalValue}')`;
                }
            } else {
                el.textContent = finalValue;
            }
        });
    }
  };
  
  // Set the dynamic background for the whole page (faded)
  const dashboardContainer = document.querySelector('.dashboard-container');
  if (dashboardContainer && schoolData?.school_badge_url) {
    dashboardContainer.style.setProperty('--school-badge-bg', `url('${schoolData.school_badge_url}')`);
  }

  // Populate School Information
  setData("schoolName", schoolData?.school_name);
  setData("centerNumber", schoolData?.center_number);
  setData("schoolEmail", schoolData?.school_email);
  setData("region", schoolData?.region);
  setData("district", schoolData?.district);
  setData("schoolBadge", schoolData?.school_badge_url, defaultSchoolBadge);

  // Populate Representative Information
  setData("adminFullName", data.full_name);
  setData("nin", data.nin);
  setData("repEmail", data.email);
  setData("role", data.role);
  setData("contact1", data.contact_1);
  setData("qualifications", data.qualifications);
  setData("documents", data.documents_url);
}

// Player Management Functions
async function loadPlayers(schoolId) {
    const supabase = window.supabase;
    if (!supabase || !schoolId) return;

    try {
        const { data: players, error } = await supabase
            .from('players')
            .select('*') // Select all columns from players table
            .eq('school_id', schoolId)
            .order('full_name');

        if (error) throw error;

        // Group players by gender and age category
        const groupedPlayers = {
            boys: {
                u20: players.filter(p => p.gender === 'male' && p.age_category === 'U20'),
                u17: players.filter(p => p.gender === 'male' && p.age_category === 'U17'),
                u15: players.filter(p => p.gender === 'male' && p.age_category === 'U15')
            },
            girls: {
                u20: players.filter(p => p.gender === 'female' && p.age_category === 'U20'),
                u17: players.filter(p => p.gender === 'female' && p.age_category === 'U17'),
                u15: players.filter(p => p.gender === 'female' && p.age_category === 'U15')
            }
        };

        renderPlayers(groupedPlayers);
    } catch (error) {
        console.error('Error loading players:', error);
        // Show error in each player grid
        document.querySelectorAll('.players-grid').forEach(grid => {
            grid.innerHTML = '<div class="error">Failed to load players.</div>';
        });
    }
}

function renderPlayers(groupedPlayers) {
    // Helper function to render a single player card
    function createPlayerCard(player) {
        // Only show the photo if it exists, otherwise use the placeholder
        const photoUrl = player.photo_url ? player.photo_url : 'https://placehold.co/80x80/EFEFEF/333333?text=No+Photo';
        return `
            <div class="player-card">
                <div class="player-photo-container">
                    <img src="${photoUrl}" 
                         alt="Photo of ${player.full_name}" 
                         class="player-photo"
                         onerror="this.src='https://placehold.co/80x80/EFEFEF/333333?text=No+Photo'">
                </div>
                <h4 class="player-name">${player.full_name}</h4>
                <div class="player-info">
                    <p>Age: ${player.age || 'N/A'}</p>
                    <p>Position: ${player.position || 'N/A'}</p>
                </div>
                <div class="player-actions">
                    <button class="edit-btn" onclick="editPlayer('${player.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" onclick="deletePlayer('${player.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }

    // Render boys teams
    ['u20', 'u17', 'u15'].forEach(category => {
        const grid = document.getElementById(`boys-${category}`);
        const players = groupedPlayers.boys[category];
        if (grid) {
            grid.innerHTML = players.length > 0
                ? players.map(createPlayerCard).join('') 
                : '<div class="no-players">No players registered in this category.</div>';
        }
    });

    // Render girls teams
    ['u20', 'u17', 'u15'].forEach(category => {
        const grid = document.getElementById(`girls-${category}`);
        const players = groupedPlayers.girls[category];
        if (grid) {
            grid.innerHTML = players.length > 0
                ? players.map(createPlayerCard).join('') 
                : '<div class="no-players">No players registered in this category.</div>';
        }
    });
}

// Filter players based on gender
document.getElementById('playerFilter')?.addEventListener('change', (e) => {
    const value = e.target.value;
    const boysSection = document.getElementById('boysTeams');
    const girlsSection = document.getElementById('girlsTeams');

    if (!boysSection || !girlsSection) return;

    if (value === 'all') {
        boysSection.style.display = 'block';
        girlsSection.style.display = 'block';
    } else if (value === 'boys') {
        boysSection.style.display = 'block';
        girlsSection.style.display = 'none';
    } else if (value === 'girls') {
        boysSection.style.display = 'none';
        girlsSection.style.display = 'block';
    }
});

// Edit player function
function editPlayer(playerId) {
    // Redirect to player registration page with player ID for editing
    window.location.href = `player-registration.html?edit=${playerId}`;
}

// Delete player function
async function deletePlayer(playerId) {
    const supabase = window.supabase;
    if (!supabase) return;

    if (confirm('Are you sure you want to delete this player? This action cannot be undone.')) {
        try {
            const { error } = await supabase
                .from('players')
                .delete()
                .eq('id', playerId);

            if (error) throw error;
            
            // This is a simple but effective way to refresh: find the card and remove it
            const cardToRemove = document.querySelector(`button[onclick="deletePlayer('${playerId}')"]`).closest('.player-card');
            if(cardToRemove) cardToRemove.remove();

        } catch (error) {
            console.error('Error deleting player:', error);
            alert('Failed to delete player. Please try again.');
        }
    }
}