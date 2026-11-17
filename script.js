(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Nav: solid on scroll, mobile menu
  const nav = document.getElementById('nav');
  const toggle = document.getElementById('nav-toggle');
  const fab = document.querySelector('.fab');
  const onScroll = () => {
    const y = window.scrollY;
    nav.classList.toggle('is-solid', y > 60);
    fab.classList.toggle('is-visible', y > window.innerHeight * 0.6);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  const setMenu = (open) => {
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
  };
  toggle.addEventListener('click', () => setMenu(!nav.classList.contains('is-open')));
  document.querySelectorAll('#nav-links a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('is-open')) setMenu(false); });

  // Scroll reveal
  const reveals = document.querySelectorAll('.reveal');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    reveals.forEach(el => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    reveals.forEach(el => io.observe(el));
  }

  // Counters
  const counters = document.querySelectorAll('[data-count]');
  const runCounter = el => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const start = performance.now(), dur = 2000;
    const tick = now => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.6 });
    counters.forEach(c => cio.observe(c));
  } else counters.forEach(c => { c.textContent = c.dataset.count; });

  // Parallax
  const parallax = [...document.querySelectorAll('[data-parallax]')];
  if (!reduceMotion && parallax.length) {
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      parallax.forEach(img => {
        const rect = img.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        const offset = (rect.top + rect.height / 2 - vh / 2) * -parseFloat(img.dataset.parallax);
        img.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  // Testimonials
  const slides = [...document.querySelectorAll('.words__slide')];
  const dotsWrap = document.getElementById('words-dots');
  let current = 0, timer;
  const dots = slides.map((_, i) => {
    const b = document.createElement('button');
    b.setAttribute('role', 'tab');
    b.setAttribute('aria-label', `Testimonial ${i + 1} of ${slides.length}`);
    b.addEventListener('click', () => { go(i); restart(); });
    dotsWrap.appendChild(b);
    return b;
  });
  const go = i => {
    current = (i + slides.length) % slides.length;
    slides.forEach((s, j) => {
      s.classList.toggle('is-active', j === current);
      s.setAttribute('aria-hidden', String(j !== current));
    });
    dots.forEach((d, j) => d.setAttribute('aria-selected', String(j === current)));
  };
  const restart = () => {
    clearInterval(timer);
    if (!reduceMotion) timer = setInterval(() => go(current + 1), 7000);
  };
  document.getElementById('words-prev').addEventListener('click', () => { go(current - 1); restart(); });
  document.getElementById('words-next').addEventListener('click', () => { go(current + 1); restart(); });
  const words = document.getElementById('reviews');
  words.addEventListener('mouseenter', () => clearInterval(timer));
  words.addEventListener('mouseleave', restart);
  words.addEventListener('focusin', () => clearInterval(timer));
  let wx = null;
  words.addEventListener('touchstart', e => { wx = e.touches[0].clientX; }, { passive: true });
  words.addEventListener('touchend', e => {
    if (wx === null) return;
    const dx = e.changedTouches[0].clientX - wx;
    if (Math.abs(dx) > 40) { go(current + (dx < 0 ? 1 : -1)); restart(); }
    wx = null;
  });
  go(0); restart();

  // Lightbox
  const items = [...document.querySelectorAll('.gallery__item')];
  const lb = document.getElementById('lightbox');
  const lbImg = document.getElementById('lb-img');
  const lbCap = document.getElementById('lb-cap');
  let lbIndex = 0, lastFocus = null;
  const show = i => {
    lbIndex = (i + items.length) % items.length;
    const img = items[lbIndex].querySelector('img');
    lbImg.src = img.currentSrc || img.src;
    lbImg.alt = img.alt;
    lbCap.textContent = img.alt;
  };
  const openLb = i => {
    lastFocus = document.activeElement;
    show(i);
    lb.hidden = false;
    requestAnimationFrame(() => lb.classList.add('is-open'));
    document.body.style.overflow = 'hidden';
    document.getElementById('lb-close').focus();
  };
  const closeLb = () => {
    lb.classList.remove('is-open');
    document.body.style.overflow = '';
    setTimeout(() => { lb.hidden = true; }, reduceMotion ? 0 : 400);
    if (lastFocus) lastFocus.focus();
  };
  items.forEach((btn, i) => {
    btn.setAttribute('aria-label', `Open photo: ${btn.querySelector('img').alt}`);
    btn.addEventListener('click', () => openLb(i));
  });
  document.getElementById('lb-close').addEventListener('click', closeLb);
  document.getElementById('lb-prev').addEventListener('click', () => show(lbIndex - 1));
  document.getElementById('lb-next').addEventListener('click', () => show(lbIndex + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') show(lbIndex - 1);
    else if (e.key === 'ArrowRight') show(lbIndex + 1);
    else if (e.key === 'Tab') {
      const f = [...lb.querySelectorAll('button')];
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  let tx = null;
  lb.addEventListener('touchstart', e => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 40) show(lbIndex + (dx < 0 ? 1 : -1));
    tx = null;
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
