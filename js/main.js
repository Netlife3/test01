'use strict';

/* ==================== 打字机效果 ==================== */
const TYPING_WORDS = ['全栈开发者', 'UI/UX 设计师', '开源爱好者', '终身学习者'];
const typingEl = document.getElementById('typingText');

let wordIndex = 0;
let charIndex = 0;
let isDeleting = false;

function typeEffect() {
    const currentWord = TYPING_WORDS[wordIndex];

    if (isDeleting) {
        typingEl.textContent = currentWord.substring(0, charIndex - 1);
        charIndex--;
    } else {
        typingEl.textContent = currentWord.substring(0, charIndex + 1);
        charIndex++;
    }

    let speed = isDeleting ? 40 : 80;

    if (!isDeleting && charIndex === currentWord.length) {
        speed = 2000;
        isDeleting = true;
    } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        wordIndex = (wordIndex + 1) % TYPING_WORDS.length;
        speed = 400;
    }

    setTimeout(typeEffect, speed);
}

typeEffect();

/* ==================== 滚动进场动画（Intersection Observer） ==================== */
const revealElements = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
);

revealElements.forEach((el) => revealObserver.observe(el));

/* ==================== 数字递增动画 ==================== */
const statNumbers = document.querySelectorAll('.stat-num');

const statObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const target = parseInt(el.dataset.target);
                animateNumber(el, target);
                statObserver.unobserve(el);
            }
        });
    },
    { threshold: 0.5 }
);

statNumbers.forEach((el) => statObserver.observe(el));

function animateNumber(el, target) {
    const duration = 2000;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        // easeOutExpo
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        const current = Math.floor(eased * target);
        el.textContent = current + '+';

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            el.textContent = target + '+';
        }
    }

    requestAnimationFrame(update);
}

/* ==================== 导航栏滚动效果 ==================== */
const navbar = document.getElementById('navbar');

window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

/* ==================== 移动端菜单 ==================== */
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
});

// 点击导航链接后关闭菜单
document.querySelectorAll('.nav-link').forEach((link) => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
    });
});

/* ==================== 导航栏活动状态高亮 ==================== */
const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

function setActiveNav() {
    let current = '';

    sections.forEach((section) => {
        const top = section.offsetTop - 100;
        const bottom = top + section.offsetHeight;

        if (window.scrollY >= top && window.scrollY < bottom) {
            current = section.getAttribute('id');
        }
    });

    navLinkEls.forEach((link) => {
        link.style.color = link.getAttribute('href') === '#' + current
            ? 'var(--text-primary)'
            : '';
    });
}

window.addEventListener('scroll', setActiveNav);
