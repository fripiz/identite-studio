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
});
