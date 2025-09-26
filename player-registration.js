// player-registration.js

document.addEventListener("DOMContentLoaded", () => {
    const supabase = window.supabase;
    const form = document.getElementById("playerRegistrationForm");
    const submitBtn = document.getElementById("submitBtn");
    const errorDisplay = document.getElementById("form-error-message");

    if (!supabase) {
        showError("Critical configuration error. Supabase client is not available.");
        if(submitBtn) submitBtn.disabled = true;
        return;
    }

    // --- DATE OF BIRTH SELECTORS POPULATION ---
    const daySelect = document.getElementById("dobDay");
    const monthSelect = document.getElementById("dobMonth");
    const yearSelect = document.getElementById("dobYear");
    const ageInput = document.getElementById("age");

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    
    // Populate Days (1-31)
    for (let i = 1; i <= 31; i++) {
        daySelect.innerHTML += `<option value="${i}">${i}</option>`;
    }

    // Populate Months
    months.forEach((month, index) => {
        monthSelect.innerHTML += `<option value="${index + 1}">${month}</option>`;
    });

    // Populate Years (e.g., from 1980 to current year)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear; i >= 1980; i--) {
        yearSelect.innerHTML += `<option value="${i}">${i}</option>`;
    }

    // --- AGE CALCULATION ---
    const calculateAge = () => {
        const day = daySelect.value;
        const month = monthSelect.value;
        const year = yearSelect.value;

        if (day && month && year) {
            const birthDate = new Date(year, month - 1, day);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            ageInput.value = age >= 0 ? age : "";
        }
    };

    [daySelect, monthSelect, yearSelect].forEach(el => el.addEventListener("change", calculateAge));

    // --- FILE PREVIEW ---
    const playerPhotoInput = document.getElementById("playerPhoto");
    playerPhotoInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        const fileLabelText = e.target.nextElementSibling.querySelector(".file-label-text");
        if (file) {
            fileLabelText.textContent = file.name;
            const previewElement = document.getElementById("photo-preview");
            if (previewElement) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    previewElement.src = event.target.result;
                    previewElement.style.display = "block";
                };
                reader.readAsDataURL(file);
            }
        }
    });

    const pleCertInput = document.getElementById("pleCertificate");
    pleCertInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        const fileLabelText = e.target.nextElementSibling.querySelector(".file-label-text");
        if (file) fileLabelText.textContent = file.name;
    });


    // --- FORM SUBMISSION ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        hideError();
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...';

        try {
            // Get school_id from the logged-in user's profile
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("You must be logged in to register a player.");

            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('school_id')
                .eq('id', user.id)
                .single();

            if (profileError || !profile) throw new Error("Could not find your associated school.");

            const schoolId = profile.school_id;

            // 1. Upload files
            const playerPhotoFile = document.getElementById("playerPhoto").files[0];
            const pleCertificateFile = document.getElementById("pleCertificate").files[0];
            
            const uploadFile = async (file, bucket) => {
                if (!file) return null;
                const { data, error } = await supabase.storage
                    .from(bucket)
                    .upload(`${user.id}/${Date.now()}_${file.name}`, file);
                if (error) throw error;
                return supabase.storage.from(bucket).getPublicUrl(data.path).data.publicUrl;
            };
            
            const [playerPhotoUrl, pleCertificateUrl] = await Promise.all([
                uploadFile(playerPhotoFile, "player_photos"),
                uploadFile(pleCertificateFile, "player_documents"),
            ]);

            // 2. Insert player data
            const dob = `${yearSelect.value}-${monthSelect.value}-${daySelect.value}`;
            const playerData = {
                school_id: schoolId,
                first_name: document.getElementById("firstName").value,
                middle_name: document.getElementById("middleName").value,
                last_name: document.getElementById("lastName").value,
                date_of_birth: dob,
                class_name: document.getElementById("className").value,
                lin: document.getElementById("lin").value,
                ple_index_number: document.getElementById("pleIndex").value,
                ple_year: document.getElementById("pleYear").value,
                parent_relationship: document.getElementById("parentRelationship").value,
                parent_names: document.getElementById("parentNames").value,
                parent_contact: document.getElementById("parentContact").value,
                parent_nin: document.getElementById("parentNin").value,
                parent_residence: document.getElementById("parentResidence").value,
                photo_url: playerPhotoUrl,
                ple_certificate_url: pleCertificateUrl,
            };

            const { error: insertError } = await supabase.from('players').insert(playerData);
            if(insertError) throw insertError;

            alert("Player registered successfully!");
            form.reset();
            document.getElementById("photo-preview").style.display = "none";
            ageInput.value = "";
            
        } catch (error) {
            console.error("Submission Error:", error);
            showError(error.message || "An unexpected error occurred.");
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = "Submit Player Registration";
        }
    });

    const showError = (message) => {
        errorDisplay.textContent = message;
        errorDisplay.style.display = 'block';
    };

    const hideError = () => {
        errorDisplay.style.display = 'none';
    };
});
