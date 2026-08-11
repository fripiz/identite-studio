document.addEventListener('DOMContentLoaded', () => {
  // scroll reveal
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => io.observe(el));

  // sticky header shrink
  const header = document.getElementById('siteHeader');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) header.style.padding = '0';
    else header.style.padding = '';
  });

  // mobile nav toggle
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    navLinks.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  // before/after slider
  const baRange = document.getElementById('baRange');
  const baBefore = document.getElementById('baBefore');
  const baHandle = document.getElementById('baHandle');
  function updateSlider(v) {
    baBefore.style.clipPath = `inset(0 ${100 - v}% 0 0)`;
    baHandle.style.left = v + '%';
  }
  if (baRange) {
    baRange.addEventListener('input', e => updateSlider(e.target.value));
    updateSlider(baRange.value);
  }

  // scrollytelling sequence in "Aperçu"
  const scrollTrack = document.getElementById('scrollTrack');
  const slides = document.querySelectorAll('.scroll-slide');
  const railDots = document.querySelectorAll('.rail-dot');
  const railFill = document.getElementById('railFill');
  const railArrow = document.getElementById('railArrow');
  const scrollBounce = document.getElementById('scrollBounce');
  const steps = slides.length;

  function updateScrollytelling() {
    if (!scrollTrack || !steps) return;
    const rect = scrollTrack.getBoundingClientRect();
    const total = rect.height - window.innerHeight;
    let progress = total > 0 ? (-rect.top) / total : 0;
    progress = Math.max(0, Math.min(1, progress));

    const stepIndex = Math.min(steps - 1, Math.floor(progress * steps));

    slides.forEach(el => el.classList.toggle('active', Number(el.dataset.step) === stepIndex));
    railDots.forEach(el => el.classList.toggle('active', Number(el.dataset.step) === stepIndex));

    const pct = progress * 100;
    if (railFill) railFill.style.height = pct + '%';
    if (railArrow) railArrow.style.top = pct + '%';
    if (scrollBounce) scrollBounce.style.opacity = progress < 0.04 ? '1' : '0';
  }

  let ticking = false;
  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => { updateScrollytelling(); ticking = false; });
      ticking = true;
    }
  }
  if (scrollTrack) {
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', updateScrollytelling);
    updateScrollytelling();
  }
});
