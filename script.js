document.addEventListener("DOMContentLoaded", () => {
  // ======== STICKY NAVBAR & SCROLL EFFECT ========
  const navbar = document.getElementById("navbar");
  if (navbar) {
    window.addEventListener("scroll", () => {
      if (window.scrollY > 50) {
        navbar.classList.add("scrolled");
      } else {
        navbar.classList.remove("scrolled");
      }
    });
  }

  // ======== MOBILE HAMBURGER MENU ========
  const hamburger = document.querySelector(".hamburger");
  const navMenu = document.querySelector(".nav-menu");

  if (hamburger && navMenu) {
    const navLinks = document.querySelectorAll(".nav-links a");
    hamburger.addEventListener("click", () => {
      navMenu.classList.toggle("active");
      hamburger.querySelector("i").classList.toggle("fa-bars");
      hamburger.querySelector("i").classList.toggle("fa-times");
    });

    // Close menu when a link is clicked
    navLinks.forEach((link) => {
      link.addEventListener("click", () => {
        if (navMenu.classList.contains("active")) {
          navMenu.classList.remove("active");
          hamburger.querySelector("i").classList.add("fa-bars");
          hamburger.querySelector("i").classList.remove("fa-times");
        }
      });
    });
  }

  // ======== SCROLL-TRIGGERED ANIMATIONS ========
  const revealElements = document.querySelectorAll(".reveal");
  if (revealElements.length > 0) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    revealElements.forEach((el) => {
      revealObserver.observe(el);
    });
  }

  // ======== ANIMATED COUNTERS ========
  const statsSection = document.querySelector(".stats");
  if (statsSection) {
    const counters = document.querySelectorAll(".counter");
    let hasAnimated = false;

    const countUp = () => {
      counters.forEach((counter) => {
        const target = +counter.getAttribute("data-target");
        const duration = 2000; // 2 seconds
        let current = 0;
        const increment = target / (duration / 10);

        const updateCount = () => {
          current += increment;
          if (current < target) {
            counter.innerText = Math.ceil(current);
            setTimeout(updateCount, 10);
          } else {
            counter.innerText = target;
          }
        };
        updateCount();
      });
      hasAnimated = true;
    };

    const statsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !hasAnimated) {
            countUp();
          }
        });
      },
      { threshold: 0.5 }
    );

    statsObserver.observe(statsSection);
  }

  // ======== GALLERY LIGHTBOX (UPDATED WITH CHECK) ========
  const lightbox = document.getElementById("lightbox");
  const galleryItems = document.querySelectorAll(".gallery-item");

  // This 'if' block is the fix. It checks if gallery elements exist before using them.
  if (lightbox && galleryItems.length > 0) {
    const lightboxImg = document.getElementById("lightbox-img");
    const closeBtn = document.querySelector(".lightbox-close");

    galleryItems.forEach((item) => {
      item.addEventListener("click", () => {
        const imgSrc = item.querySelector("img").src;
        lightboxImg.src = imgSrc;
        lightbox.classList.add("active");
      });
    });

    const closeLightbox = () => {
      lightbox.classList.remove("active");
    };

    if (closeBtn) {
      closeBtn.addEventListener("click", closeLightbox);
    }

    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });
  }

  // ======== MOBILE DROPDOWN FIX FOR 'MORE' MENU ========
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    const toggle = dropdown.querySelector('.dropdown-toggle');
    if (toggle) {
      toggle.addEventListener('click', function(e) {
        e.preventDefault();
        // Close other open dropdowns
        dropdowns.forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
        dropdown.classList.toggle('open');
      });
    }
  });
  // Close dropdown when clicking outside
  document.addEventListener('click', function(e) {
    dropdowns.forEach(dropdown => {
      if (!dropdown.contains(e.target)) {
        dropdown.classList.remove('open');
      }
    });
  });
});
