/**
 * Show a toast notification
 * @param {string} message
 * @param {number} duration 
 */
function showToast(message, duration = 3000) {
  const toast = document.getElementById('toast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// Smooth page entrance 
document.addEventListener('DOMContentLoaded', () => {
  // Ripple effect on buttons
  document.querySelectorAll('.auth-submit-btn, .course-card, .djcare-buy-btn, .order-confirm-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.cssText = `
        position:absolute;
        border-radius:50%;
        background:rgba(255,255,255,0.35);
        width:${size}px;
        height:${size}px;
        left:${e.clientX - rect.left - size / 2}px;
        top:${e.clientY - rect.top - size / 2}px;
        transform:scale(0);
        animation:rippleAnim 0.5s ease-out forwards;
        pointer-events:none;
      `;
      if (!document.querySelector('#rippleStyle')) {
        const style = document.createElement('style');
        style.id = 'rippleStyle';
        style.textContent = `@keyframes rippleAnim { to { transform:scale(2.5); opacity:0; } }`;
        document.head.appendChild(style);
      }
      const pos = window.getComputedStyle(this).position;
      if (pos === 'static') this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      setTimeout(() => ripple.remove(), 500);
    });
  });

  // Active nav link highlight
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.navbar-links a').forEach(link => {
    if (link.getAttribute('href') === currentPage) {
      link.style.textDecoration = 'underline';
      link.style.opacity = '1';
    }
  });

  // Intersection observer for scroll animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(el => {
      if (el.isIntersecting) {
        el.target.style.opacity = '1';
        el.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.service-section, .courses-section, .djcare-section, .values-section, .about-card, .team-member').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(24px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  // Search button handler
  const searchBtn = document.getElementById('searchBtn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const q = prompt('Rechercher sur Djalissa :');
      if (q && q.trim()) showToast(`🔍 Recherche : "${q}"`);
    });
  }

  // Update navbar profile icon with user's photo if available
  const profilePic = sessionStorage.getItem('profilePic');
  if (profilePic && profilePic !== 'undefined' && profilePic !== '') {
    document.querySelectorAll('.navbar-icon-btn').forEach(btn => {
      if (btn.getAttribute('onclick') && btn.getAttribute('onclick').includes('sessionStorage.getItem')) {
        btn.innerHTML = `<img src="http://localhost:5000${profilePic}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;" alt="Profile">`;
        btn.style.padding = '0';
        btn.style.border = '2px solid #A855F7';
        btn.style.overflow = 'hidden';
      }
    });
  }
});
