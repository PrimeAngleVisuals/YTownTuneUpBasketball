/* ============================================================
   Y-TOWN TUNE UPS — JavaScript
   ============================================================ */

// ── NAVBAR SCROLL EFFECT ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
});

// ── MOBILE NAV TOGGLE ──
const navToggle = document.getElementById('navToggle');
const navLinks  = document.getElementById('navLinks');

navToggle.addEventListener('click', () => {
  navLinks.classList.toggle('open');
  const isOpen = navLinks.classList.contains('open');
  navToggle.setAttribute('aria-expanded', isOpen);
  document.body.style.overflow = isOpen ? 'hidden' : '';
});

navLinks.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    navLinks.classList.remove('open');
    document.body.style.overflow = '';
  });
});

// ── SCROLL REVEAL ──
const reveals = document.querySelectorAll(
  '.about-card, .player-card, .game-row, .jersey-showcase, .contact-grid, .about-quote'
);

reveals.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      // stagger children in grids
      const delay = entry.target.dataset.delay || 0;
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, delay);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

// stagger cards in grids
document.querySelectorAll('.about-card, .player-card').forEach((el, i) => {
  el.dataset.delay = i * 80;
});

reveals.forEach(el => observer.observe(el));

// ── STATS BAR DUPLICATE (seamless loop) ──
const track = document.querySelector('.stats-track');
if (track) {
  track.innerHTML += track.innerHTML;
}

// ── CONTACT FORM ──
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    btn.textContent = 'Message Received.';
    btn.style.background = '#1a5c00';
    btn.style.color = '#7fff7f';
    btn.disabled = true;
    setTimeout(() => {
      btn.textContent = 'Send It';
      btn.style.background = '';
      btn.style.color = '';
      btn.disabled = false;
      contactForm.reset();
    }, 4000);
  });
}

// ── SMOOTH ACTIVE NAV HIGHLIGHT ──
const sections = document.querySelectorAll('section[id]');
const navItems = document.querySelectorAll('.nav-links a');

const navObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navItems.forEach(a => a.style.color = '');
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.style.color = 'var(--orange)';
    }
  });
}, { threshold: 0.4 });

sections.forEach(s => navObserver.observe(s));
