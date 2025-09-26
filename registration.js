// registration.js (Updated and Corrected)

document.addEventListener("DOMContentLoaded", () => {
  // Check if the Supabase client was initialized by createClient.js
  if (!window.supabase || typeof window.supabase.auth?.signUp !== "function") {
    console.error(
      "Supabase client is not initialized correctly! Make sure createClient.js is loaded before this script."
    );
    // Alert the user and disable the form to prevent errors.
    alert(
      "A critical configuration error occurred. Please refresh the page or contact support."
    );
    const submitBtn = document.getElementById("submitBtn");
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Configuration Error";
    }
    return; // Stop execution of this script
  }

  // --- ELEMENT SELECTIONS ---
  const supabase = window.supabase;
  const form = document.getElementById("schoolRegistrationForm");
  const nextButtons = document.querySelectorAll(".next-step");
  const prevButtons = document.querySelectorAll(".prev-step");
  const formSteps = document.querySelectorAll(".form-step");
  const progressSteps = document.querySelectorAll(".progress-step");
  const submitBtn = document.getElementById("submitBtn");

  // Password related elements
  const passwordInput = document.getElementById("adminPassword");
  const confirmPasswordInput = document.getElementById("confirmPassword");
  const passwordToggles = document.querySelectorAll(".password-toggle");
  const strengthBar = document.querySelector(".strength-bar");
  const strengthText = document.querySelector(".strength-text");
  const passwordMatchError = document.getElementById("password-match-error");

  // All required fields for final validation
  const allRequiredInputs = form.querySelectorAll(
    "input[required], select[required]"
  );
  const termsCheckbox = document.getElementById("termsAccept");

  let currentStep = 1;

  // --- FORM NAVIGATION ---
  const updateFormSteps = () => {
    formSteps.forEach((step) => {
      step.classList.toggle(
        "active",
        parseInt(step.dataset.step) === currentStep
      );
    });
  };

  const updateProgressBar = () => {
    progressSteps.forEach((step, idx) => {
      const stepNum = idx + 1;
      step.classList.toggle("active", stepNum <= currentStep);
      step.classList.toggle("completed", stepNum < currentStep);
    });
  };

  nextButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const currentFormStep = form.querySelector(
        `.form-step[data-step="${currentStep}"]`
      );
      const requiredInputsInStep = currentFormStep.querySelectorAll(
        "input[required], select[required]"
      );
      let stepIsValid = true;

      requiredInputsInStep.forEach((input) => {
        input.style.borderColor = ""; // Reset border color
        if (!input.value.trim()) {
          stepIsValid = false;
          input.style.borderColor = "red"; // Highlight invalid field
        }
      });

      if (!stepIsValid) {
        alert("Please fill in all required fields in this step.");
        return;
      }

      if (currentStep === 2) {
        if (passwordInput.value !== confirmPasswordInput.value) {
          passwordMatchError.textContent = "Passwords do not match.";
          passwordMatchError.style.display = "block";
          return;
        }
        passwordMatchError.textContent = "";
        passwordMatchError.style.display = "none";
      }

      if (currentStep < 3) {
        currentStep++;
        updateFormSteps();
        updateProgressBar();
        if (currentStep === 3) {
          updateSummary();
        }
      }
    });
  });

  prevButtons.forEach((button) => {
    button.addEventListener("click", () => {
      if (currentStep > 1) {
        currentStep--;
        updateFormSteps();
        updateProgressBar();
      }
    });
  });

  // --- IMAGE & FILE PREVIEWS ---
  const fileInputs = document.querySelectorAll("input[type='file']");
  fileInputs.forEach((input) => {
    input.addEventListener("change", (e) => {
      const file = e.target.files[0];
      const fileLabelText =
        e.target.nextElementSibling.querySelector(".file-label-text");

      if (file) {
        fileLabelText.textContent = file.name;
        const previewId = e.target.dataset.preview;
        if (previewId) {
          const previewElement = document.getElementById(previewId);
          if (previewElement) {
            const reader = new FileReader();
            reader.onload = (event) => {
              previewElement.src = event.target.result;
              previewElement.style.display = "block";
            };
            reader.readAsDataURL(file);
          }
        }
      } else {
        fileLabelText.textContent = "Choose file..."; // Reset on cancel
      }
    });
  });

  // --- PASSWORD FEATURES ---
  passwordToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.previousElementSibling;
      const type =
        input.getAttribute("type") === "password" ? "text" : "password";
      input.setAttribute("type", type);
      toggle.classList.toggle("fa-eye");
      toggle.classList.toggle("fa-eye-slash");
    });
  });

  if (passwordInput) {
    passwordInput.addEventListener("input", () => {
      const password = passwordInput.value;
      let strength = 0;
      if (password.length >= 8) strength++;
      if (/[a-z]/.test(password)) strength++;
      if (/[A-Z]/.test(password)) strength++;
      if (/[0-9]/.test(password)) strength++;
      if (/[^a-zA-Z0-9]/.test(password)) strength++;

      let text = "Weak";
      let color = "#dc3545";
      let width = "20%";
      switch (strength) {
        case 2:
          text = "Fair";
          color = "#ffc107";
          width = "40%";
          break;
        case 3:
          text = "Good";
          color = "#ffc107";
          width = "60%";
          break;
        case 4:
          text = "Strong";
          color = "#28a745";
          width = "80%";
          break;
        case 5:
          text = "Very Strong";
          color = "#28a745";
          width = "100%";
          break;
      }
      strengthBar.style.width = password.length > 0 ? width : "0%";
      strengthBar.style.backgroundColor = color;
      strengthText.textContent = password.length > 0 ? `Strength: ${text}` : "";
    });
  }

  // --- SUMMARY & FINAL VALIDATION ---
  const updateSummary = () => {
    document.querySelectorAll("[data-summary]").forEach((field) => {
      const inputElement = document.getElementById(field.dataset.summary);
      if (inputElement) {
        let value = inputElement.value || "Not provided";
        if (inputElement.type === "file") {
          value = inputElement.files[0]?.name || "Not provided";
        }
        field.textContent = value;
      }
    });
  };

  const checkFormValidity = () => {
    let allValid = true;
    allRequiredInputs.forEach((input) => {
      if (!input.value.trim()) allValid = false;
    });
    submitBtn.disabled = !(allValid && termsCheckbox.checked);
  };

  allRequiredInputs.forEach((input) =>
    input.addEventListener("input", checkFormValidity)
  );
  termsCheckbox.addEventListener("change", checkFormValidity);

  // --- FORM SUBMISSION TO SUPABASE ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (submitBtn.disabled) return;

    submitBtn.disabled = true;
    submitBtn.textContent = "Submitting...";

    try {
      const repEmail = document.getElementById("repEmail").value;
      const password = document.getElementById("adminPassword").value;
      const schoolBadgeFile = document.getElementById("schoolBadge").files[0];
      const profilePhotoFile = document.getElementById("profilePhoto").files[0];
      const documentsFile = document.getElementById("documents").files[0];

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: repEmail,
        password,
      });
      if (authError) throw authError;
      const userId = authData.user.id;

      const uploadFile = async (file, bucket) => {
        if (!file) return null;
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(`${userId}/${Date.now()}_${file.name}`, file);
        if (error) throw error;
        return supabase.storage.from(bucket).getPublicUrl(data.path).data
          .publicUrl;
      };

      const [schoolBadgeUrl, profilePhotoUrl, documentsUrl] = await Promise.all(
        [
          uploadFile(schoolBadgeFile, "school_badges"),
          uploadFile(profilePhotoFile, "profile_photos"),
          uploadFile(documentsFile, "documents"),
        ]
      );

      const { data: schoolData, error: schoolError } = await supabase
        .from("schools")
        .insert({
          school_name: document.getElementById("schoolName").value,
          center_number: document.getElementById("centerNumber").value,
          school_email: document.getElementById("schoolEmail").value,
          region: document.getElementById("region").value,
          district: document.getElementById("district").value,
          school_badge_url: schoolBadgeUrl,
        })
        .select()
        .single();
      if (schoolError) throw schoolError;

      const { error: profileError } = await supabase.from("profiles").insert({
        id: userId,
        school_id: schoolData.id,
        full_name: document.getElementById("adminFullName").value,
        nin: document.getElementById("nin").value,
        email: repEmail,
        role: document.getElementById("role").value,
        contact_1: document.getElementById("contact1").value,
        qualifications: document.getElementById("qualifications").value,
        profile_photo_url: profilePhotoUrl,
        documents_url: documentsUrl,
      });
      if (profileError) throw profileError;

      alert(
        "Registration successful! Please check your email to confirm your account."
      );
      window.location.href = "signin.html";
    } catch (error) {
      console.error("Registration Error:", error);
      alert(`Error: ${error.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Registration";
    }
  });

  // --- INITIALIZE PAGE STATE ---
  updateProgressBar();
  checkFormValidity();
});
