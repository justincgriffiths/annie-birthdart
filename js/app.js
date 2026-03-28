// app.js -- Navigation, interactions, animations
// Tab system is DOM-driven: no hardcoded IDs array
(function() {

/* DOM-driven tab discovery */
const tabs = document.querySelectorAll('.nav-bar .tab');
const ids = Array.from(tabs).map(t => t.dataset.page);
const pages = new Map(ids.map(id => [id, document.getElementById(id)]));
const appEl = document.querySelector('.app');
let cur = ids[0];
let busy = false;

/* --- Page transitions --- */

function goTo(targetId, dir) {
    if (targetId === cur || !pages.has(targetId) || busy) return;
    busy = true;
    const curIdx = ids.indexOf(cur);
    const targetIdx = ids.indexOf(targetId);
    dir = dir ?? (targetIdx > curIdx ? 1 : -1);

    const f = pages.get(cur);
    const t = pages.get(targetId);

    tabs.forEach(b => b.classList.toggle('active', b.dataset.page === targetId));
    t.querySelectorAll('.si').forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(18px)';
    });

    if (typeof gsap !== 'undefined') {
        gsap.to(f, {
            opacity: 0, x: -36 * dir, duration: 0.22, ease: 'power2.in',
            onComplete() {
                f.classList.remove('active'); f.style.zIndex = ''; gsap.set(f, { x: 0 });
                t.classList.add('active'); t.scrollTop = 0;
                gsap.fromTo(t, { opacity: 0, x: 36 * dir }, {
                    opacity: 1, x: 0, duration: 0.28, ease: 'power2.out',
                    onComplete() { busy = false; reveal(targetId); }
                });
            }
        });
    } else {
        f.classList.remove('active'); t.classList.add('active'); t.scrollTop = 0;
        t.querySelectorAll('.si').forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
        busy = false;
    }

    cur = targetId;
    history.replaceState(null, null, '#' + targetId);
}

function goByOffset(offset, dir) {
    const i = ids.indexOf(cur);
    const n = i + offset;
    if (n >= 0 && n < ids.length) goTo(ids[n], dir);
}

function reveal(id) {
    const items = document.querySelectorAll('#' + id + ' .si');
    if (typeof gsap !== 'undefined') gsap.fromTo(items, { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease: 'power2.out' });
    else items.forEach(el => { el.style.opacity = '1'; el.style.transform = 'none'; });
}

/* --- Event listeners --- */

/* Tab clicks */
tabs.forEach(t => t.addEventListener('click', () => goTo(t.dataset.page)));

/* Hash routing */
window.addEventListener('load', () => {
    document.querySelector('.snake-body')?.classList.add('drawn');
    const hash = location.hash.replace('#', '');
    if (hash && ids.includes(hash) && hash !== ids[0]) {
        pages.get(ids[0]).classList.remove('active');
        tabs.forEach(b => b.classList.toggle('active', b.dataset.page === hash));
        const t = pages.get(hash);
        t.classList.add('active'); t.scrollTop = 0;
        cur = hash;
        reveal(hash);
    } else { reveal(ids[0]); }
});

window.addEventListener('hashchange', () => {
    const hash = location.hash.replace('#', '');
    if (ids.includes(hash)) goTo(hash);
});

/* Resume toggle */
document.querySelectorAll('.toggle-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const m = btn.dataset.mode;
        document.querySelectorAll('.toggle-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('resume-pro').classList.toggle('active', m === 'pro');
        document.getElementById('resume-college').classList.toggle('active', m === 'college');
    });
});

/* Swipe detection */
let sx = 0, sy = 0, swipeTarget = null;
appEl.addEventListener('touchstart', e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; swipeTarget = e.target; }, { passive: true });
appEl.addEventListener('touchend', e => {
    if (swipeTarget && swipeTarget.closest('.photo-strip')) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) goByOffset(dx < 0 ? 1 : -1, dx < 0 ? 1 : -1);
}, { passive: true });

/* Keyboard navigation */
document.addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') goByOffset(1, 1);
    if (e.key === 'ArrowLeft') goByOffset(-1, -1);
});

/* Gift reveal */
const giftBtn = document.getElementById('gift-reveal-btn');
const giftPanel = document.getElementById('gift-reveal-panel');
const giftCoda = document.getElementById('gift-coda');

function spawnConfetti() {
    const c = document.createElement('div'); c.className = 'gift-confetti'; c.setAttribute('aria-hidden', 'true');
    const colors = ['#ffb81c', '#d4a843', '#f0e6d0', '#c94530', '#ffdb58'];
    for (let i = 0; i < 40; i++) {
        const s = document.createElement('span');
        s.style.left = Math.random() * 100 + '%'; s.style.top = '-10px';
        s.style.background = colors[i % colors.length];
        s.style.width = (4 + Math.random() * 8) + 'px'; s.style.height = (4 + Math.random() * 8) + 'px';
        s.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        s.style.animation = 'confettiFall ' + (1.5 + Math.random() * 2) + 's ease-out ' + (Math.random() * 0.4) + 's forwards';
        c.appendChild(s);
    }
    document.body.appendChild(c);
    setTimeout(() => c.remove(), 4000);
}

if (giftBtn && giftPanel) giftBtn.addEventListener('click', function() {
    giftBtn.setAttribute('aria-expanded', 'true');
    giftPanel.setAttribute('aria-hidden', 'false');
    var vIframe = document.getElementById('gift-video-iframe');
    if (vIframe && vIframe.dataset.src) vIframe.src = vIframe.dataset.src;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (typeof gsap !== 'undefined' && !prefersReduced) {
        gsap.to(giftBtn, { opacity: 0, scale: 0.8, duration: 0.3, ease: 'power2.in', onComplete() { giftBtn.classList.add('revealed'); } });
        giftPanel.classList.add('open');
        gsap.to(giftPanel, { maxHeight: 800, opacity: 1, duration: 0.6, delay: 0.2, ease: 'power2.out', onComplete() {
            giftPanel.style.maxHeight = 'none';
            spawnConfetti();
            const card = giftPanel.querySelector('.expo-card');
            if (card) gsap.fromTo(card, { scale: 0.9 }, { scale: 1, duration: 0.5, ease: 'elastic.out(1,0.4)' });
            if (giftCoda) gsap.to(giftCoda, { opacity: 1, duration: 0.5, delay: 0.3, ease: 'power2.out' });
        }});
    } else {
        giftBtn.classList.add('revealed');
        giftPanel.classList.add('open');
        giftPanel.style.maxHeight = 'none';
        giftPanel.style.opacity = '1';
        if (giftCoda) giftCoda.style.opacity = '1';
    }
});

})();
