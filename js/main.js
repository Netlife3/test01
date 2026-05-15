'use strict';

/* ============================================================
   数据管理
   ============================================================ */
const STORAGE_KEY = 'personal_site_data';
const PASSWORD_KEY = 'personal_site_pwd';
const DEFAULT_PASSWORD = 'admin123';
const CLOUD_SYNC_KEY = 'personal_site_cloud';

function getCloudApiUrl() {
    return window.location.origin + '/api/data';
}

function isCloudSyncEnabled() {
    return localStorage.getItem(CLOUD_SYNC_KEY) === 'true';
}

async function loadFromCloud() {
    try {
        const res = await fetch(getCloudApiUrl());
        if (!res.ok) return null;
        const data = await res.json();
        // 必须有 name 字段才算有效数据
        if (data && typeof data === 'object' && data.name) {
            // 同步密码到本地
            if (data._pwd) {
                localStorage.setItem(PASSWORD_KEY, data._pwd);
            }
            // cache to localStorage
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            return data;
        }
    } catch (e) {
        // ignore — fall back to localStorage
    }
    return null;
}

async function saveToCloud(data) {
    try {
        // 附带密码，跨设备同步
        const payload = JSON.parse(JSON.stringify(data));
        payload._pwd = localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
        await fetch(getCloudApiUrl(), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
    } catch (e) {
        // silent fail — data is still saved locally
    }
}

const DEFAULT_DATA = {
    name: 'John Doe',
    greeting: '你好，我是',
    titles: ['全栈开发者', 'UI/UX 设计师', '开源爱好者', '终身学习者'],
    bio: '一名热爱创造的全栈开发者。我相信代码不仅是工具，更是表达思想和实现价值的语言。',
    avatar: '',
    aboutPhoto: '',
    siteSuffix: '个人主页',
    about: [
        '我是一名充满热情的全栈开发者，拥有 <strong>5 年</strong> 的 Web 开发经验。从像素级的前端界面到高并发后端服务，我享受构建完整产品的每一个环节。',
        '我相信技术是表达个人创造力的最佳媒介。每个项目都是一次独特的探索——用代码将想法转化为现实，用设计让体验更有温度。',
        '工作之余，我喜欢开源贡献、技术写作，以及探索 AI 与 Web 技术的交叉领域。'
    ],
    stats: [50, 30, 5],
    statLabels: ['完成项目', '合作客户', '年经验'],
    skills: [
        { name: '前端开发', tags: ['React', 'Vue', 'TypeScript', 'HTML5', 'CSS3', 'Tailwind'] },
        { name: '后端开发', tags: ['Node.js', 'Python', 'Go', 'PostgreSQL', 'MongoDB', 'Redis'] },
        { name: 'UI/UX 设计', tags: ['Figma', 'Sketch', '设计系统', '交互设计', '原型'] },
        { name: 'DevOps', tags: ['Docker', 'K8s', 'AWS', 'CI/CD', 'Nginx'] }
    ],
    projects: [
        { title: 'AI 智能助手平台', desc: '基于大语言模型的对话平台，支持多轮对话、知识库管理和上下文记忆。', tags: ['React', 'Python', 'LLM'], color1: '#667eea', color2: '#764ba2', cover: '' },
        { title: '全栈电商平台', desc: '完整的电商解决方案，包含商品管理、购物车、订单系统和在线支付。', tags: ['Next.js', 'Node.js', 'Stripe'], color1: '#f093fb', color2: '#f5576c', cover: '' },
        { title: '云原生监控平台', desc: '实时的服务器监控与告警系统，支持自定义仪表盘和多维度数据分析。', tags: ['Go', 'Prometheus', 'Docker'], color1: '#4facfe', color2: '#00f2fe', cover: '' }
    ],
    email: 'hello@johndoe.com',
    social: {
        github: '',
        weibo: '',
        zhihu: '',
        twitter: ''
    },
    timeline: [
        { period: '2023 - 至今', title: '高级全栈开发者', company: '某科技公司', desc: '负责核心产品架构设计与开发，带领团队完成技术升级。' },
        { period: '2021 - 2023', title: '全栈开发者', company: '某互联网公司', desc: '参与多个产品从0到1开发，主导前端架构重构。' },
        { period: '2019 - 2021', title: '初级开发者', company: '某创业公司', desc: '负责Web应用开发与维护，积累全栈开发经验。' }
    ]
};

function loadFromLocal() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.name) {
                return deepMerge(cloneData(DEFAULT_DATA), parsed);
            }
        }
    } catch (e) { /* ignore */ }
    return null;
}

async function loadData() {
    // 先尝试本地缓存（秒开）
    const local = loadFromLocal();
    if (local) {
        // 后台异步拉取云端数据，有更新再刷新
        syncFromCloudInBackground();
        return local;
    }
    // 无本地缓存：等待云端
    const cloudData = await loadFromCloud();
    if (cloudData) {
        return deepMerge(cloneData(DEFAULT_DATA), cloudData);
    }
    return cloneData(DEFAULT_DATA);
}

async function syncFromCloudInBackground() {
    try {
        const cloudData = await loadFromCloud();
        if (!cloudData) return;
        // 比较本地和云端是否一致
        const localRaw = localStorage.getItem(STORAGE_KEY);
        const cloudStr = JSON.stringify(cloudData);
        if (localRaw !== cloudStr) {
            currentData = deepMerge(cloneData(DEFAULT_DATA), cloudData);
            renderAll();
        }
    } catch (e) { /* silent */ }
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    const ts = Date.now();
    localStorage.setItem('last_updated', ts);
    document.getElementById('lastUpdated').textContent = '更新: ' + new Date(ts).toLocaleDateString('zh-CN');
    if (isCloudSyncEnabled()) {
        saveToCloud(data);
    }
}

function cloneData(obj) {
    return JSON.parse(JSON.stringify(obj));
}

function deepMerge(target, source) {
    const result = cloneData(target);
    for (const key of Object.keys(source)) {
        if (key in result) {
            if (Array.isArray(result[key]) && Array.isArray(source[key])) {
                result[key] = source[key];
            } else if (typeof result[key] === 'object' && result[key] !== null
                && typeof source[key] === 'object' && source[key] !== null) {
                result[key] = deepMerge(result[key], source[key]);
            } else {
                result[key] = source[key];
            }
        } else {
            result[key] = source[key];
        }
    }
    return result;
}

/* ============================================================
   页面渲染
   ============================================================ */
let currentData = null;

function renderAll() {
    document.title = currentData.name + (currentData.siteSuffix ? ' | ' + currentData.siteSuffix : '');
    renderLogo();
    renderFooter();
    renderHero();
    renderAbout();
    renderSkills();
    renderTimeline();
    renderProjects();
    renderContact();
    reobserveReveal();
    reobserveStats();
    reobserveTimeline();
}

function renderLogo() {
    const logo = document.getElementById('logo');
    const name = currentData.name.trim();
    const initials = name.split(/\s+/).map(w => w[0]).join('').toUpperCase().slice(0, 2) || 'JD';
    logo.textContent = '<' + initials + ' />';
}

function renderFooter() {
    document.getElementById('footerName').textContent = currentData.name;
}

function renderHero() {
    const d = currentData;
    document.querySelector('.hero-name').textContent = d.name;
    document.querySelector('.hero-greeting').textContent = d.greeting;
    document.querySelector('.hero-desc').textContent = d.bio;

    // avatar
    const placeholder = document.querySelector('.avatar-placeholder');
    if (d.avatar) {
        placeholder.innerHTML = `<img src="${d.avatar}" alt="avatar" style="width:100%;height:100%;border-radius:50%;object-fit:cover;">`;
        placeholder.style.background = 'none';
        placeholder.style.fontSize = '0';
    } else {
        placeholder.innerHTML = d.name.split(' ').map(w => w[0]).join('').slice(0, 2) || 'JD';
        placeholder.style.background = '';
        placeholder.style.fontSize = '';
    }

    // restart typing with new titles
    restartTyping(d.titles);
}

function renderAbout() {
    const d = currentData;
    const container = document.querySelector('.about-text');
    // remove old paragraphs except stats
    const paragraphs = container.querySelectorAll('p');
    paragraphs.forEach(p => p.remove());

    // insert before stats
    const statsEl = container.querySelector('.about-stats');
    d.about.forEach(text => {
        const p = document.createElement('p');
        p.innerHTML = text;
        container.insertBefore(p, statsEl);
    });

    // update stats
    const statNums = document.querySelectorAll('.stat-num');
    const statLabels = document.querySelectorAll('.stat-label');
    d.stats.forEach((val, i) => {
        if (statNums[i]) {
            statNums[i].dataset.target = val;
            statNums[i].textContent = '0';
        }
        if (statLabels[i]) {
            statLabels[i].textContent = d.statLabels[i] || '';
        }
    });

    // about photo
    const photoEl = document.querySelector('.photo-placeholder');
    if (d.aboutPhoto) {
        photoEl.innerHTML = `<img src="${d.aboutPhoto}" alt="about photo" style="width:100%;height:100%;object-fit:cover;">`;
    } else {
        photoEl.innerHTML = `
            <svg viewBox="0 0 100 100" fill="currentColor"><path d="M50 20c-8.3 0-15 6.7-15 15s6.7 15 15 15 15-6.7 15-15-6.7-15-15-15zm0 45c-16.6 0-30 6.7-30 15v5h60v-5c0-8.3-13.4-15-30-15z"/></svg>
            <span>你的照片</span>
        `;
    }
    // async Pretext magazine enhancement (desktop only)
    enhanceAboutMagazine();
}

/* ---- Pretext 杂志式双栏排版 ---- */
async function enhanceAboutMagazine() {
    const aboutGrid = document.querySelector('.about-grid');
    if (!aboutGrid || window.innerWidth < 968) return;
    // remove previous magazine layout if any
    const existing = aboutGrid.querySelector('.about-magazine');
    if (existing) existing.remove();
    // restore original layout
    const origText = aboutGrid.querySelector('.about-text');
    const origPhoto = aboutGrid.querySelector('.about-photo');
    if (origText) origText.style.display = '';
    if (origPhoto) origPhoto.style.display = '';

    try {
        const pretext = await import('https://unpkg.com/@chenglou/pretext/dist/layout.js');

        const d = currentData;
        const fullText = d.about.map(p => p.replace(/<[^>]*>/g, '')).join(' ');
        if (!fullText || fullText.length < 20) return;

        const font = '16px Inter';
        const lh = 28.8;

        // measure available width (container minus photo)
        const aboutTextEl = aboutGrid.querySelector('.about-text');
        const origDisplay = aboutTextEl.style.display;
        aboutTextEl.style.display = 'none'; // hide to measure available space
        const availW = aboutGrid.offsetWidth - 60;
        aboutTextEl.style.display = origDisplay;
        const colW = Math.floor((availW - 40) / 2);
        if (colW < 200) return;

        const prepared = pretext.prepare(fullText, font);
        const { lines } = pretext.layoutWithLines(prepared, colW, lh);
        if (!lines || lines.length < 3) return;

        // split into 2 balanced columns
        const half = Math.ceil(lines.length / 2);
        const col1Lines = lines.slice(0, half);
        const col2Lines = lines.slice(half);

        // build columns as HTML
        function linesToHtml(lineArr, dropCap) {
            const text = lineArr.map(l => l.text).join(' ');
            if (dropCap && text.length > 1) {
                return `<p><span class="drop-cap">${text.charAt(0)}</span>${text.slice(1)}</p>`;
            }
            return `<p>${text}</p>`;
        }

        const magDiv = document.createElement('div');
        magDiv.className = 'about-magazine';
        magDiv.innerHTML = `
            <div class="about-magazine-col">${linesToHtml(col1Lines, true)}</div>
            <div class="about-magazine-col">${linesToHtml(col2Lines, false)}</div>
        `;

        // hide original text, insert magazine layout before photo
        aboutTextEl.style.display = 'none';
        const photoEl = aboutGrid.querySelector('.about-photo');
        aboutGrid.insertBefore(magDiv, photoEl);
    } catch (e) {
        // Pretext unavailable — keep original layout
    }
}

function renderSkills() {
    const grid = document.querySelector('.skills-grid');
    grid.innerHTML = '';
    currentData.skills.forEach(skill => {
        const card = document.createElement('div');
        card.className = 'skill-card reveal';
        card.innerHTML = `
            <div class="skill-icon"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg></div>
            <h3>${escapeHtml(skill.name)}</h3>
            <div class="skill-tags">${skill.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>
        `;
        grid.appendChild(card);
    });
}

/* ============================================================
   时间线渲染
   ============================================================ */
function renderTimeline() {
    const container = document.getElementById('timelineContainer');
    if (!container) return;
    container.innerHTML = '';
    currentData.timeline.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.style.transitionDelay = (index * 0.1) + 's';
        div.innerHTML = `
            <div class="timeline-dot"></div>
            <div class="timeline-card">
                <span class="timeline-period">${escapeHtml(item.period)}</span>
                <h3>${escapeHtml(item.title)}</h3>
                <div class="timeline-company">${escapeHtml(item.company)}</div>
                <p>${escapeHtml(item.desc)}</p>
            </div>
        `;
        container.appendChild(div);
    });
}

let timelineObserver = null;

function reobserveTimeline() {
    if (timelineObserver) timelineObserver.disconnect();
    timelineObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        },
        { threshold: 0.15 }
    );
    document.querySelectorAll('.timeline-item').forEach(el => timelineObserver.observe(el));
}

function renderProjects() {
    const grid = document.querySelector('.projects-grid');
    grid.innerHTML = '';
    currentData.projects.forEach(proj => {
        const card = document.createElement('div');
        card.className = 'project-card reveal';
        const thumbText = proj.title.split(' ').map(w => w[0]).join('').slice(0, 6) || 'P';
        const hasCover = !!proj.cover;
        const thumbStyle = hasCover
            ? 'background: transparent; padding: 0; overflow: hidden;'
            : `background: linear-gradient(135deg, ${proj.color1 || '#667eea'}, ${proj.color2 || '#764ba2'});`;
        const thumbContent = hasCover
            ? `<img src="${proj.cover}" alt="${escapeHtml(proj.title)}" style="width:100%;height:100%;object-fit:cover;">`
            : `<span class="project-thumb-text">${escapeHtml(thumbText)}</span>`;
        card.innerHTML = `
            <div class="project-thumb" style="${thumbStyle}">
                ${thumbContent}
            </div>
            <div class="project-info">
                <h3>${escapeHtml(proj.title)}</h3>
                <p>${escapeHtml(proj.desc)}</p>
                <div class="project-tags">${proj.tags.map(t => `<span>${escapeHtml(t)}</span>`).join('')}</div>
                <div class="project-links"><a href="#" class="project-link">查看详情 →</a></div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function renderContact() {
    const d = currentData;
    // email — click to copy
    const emailEl = document.querySelector('.contact-email');
    emailEl.textContent = d.email;
    emailEl.onclick = function (e) {
        e.preventDefault();
        copyToClipboard(d.email);
    };

    // hero email icon
    const emailIcon = document.querySelector('[data-social="email"]');
    if (emailIcon) {
        emailIcon.onclick = function (e) {
            e.preventDefault();
            copyToClipboard(d.email);
        };
    }

    // social platforms
    const platforms = ['github', 'weibo', 'zhihu', 'twitter'];
    platforms.forEach(p => {
        let url = (d.social[p] || '').trim();
        // auto-prefix https:// if missing
        if (url && !/^https?:\/\//i.test(url)) {
            url = 'https://' + url;
        }
        document.querySelectorAll(`[data-social="${p}"]`).forEach(el => {
            el.href = url || '#';
            el.style.display = url ? '' : 'none';
            if (url) {
                el.target = '_blank';
                el.rel = 'noopener noreferrer';
            }
        });
    });
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

/* ============================================================
   剪贴板 + Toast 提示
   ============================================================ */
function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => showToast('已复制邮箱：' + text));
    } else {
        // fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('已复制邮箱：' + text);
    }
}

function showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast';
        toast.style.cssText = `
            position:fixed; bottom:100px; left:50%; transform:translateX(-50%);
            background:var(--accent-gradient); color:#fff;
            padding:14px 28px; border-radius:50px; font-size:0.9rem; font-weight:600;
            z-index:9999; opacity:0; transition:opacity 0.3s ease, transform 0.3s ease;
            pointer-events:none; white-space:nowrap;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(10px)';
    }, 2500);
}

/* ============================================================
   打字机效果（支持动态更新）
   ============================================================ */
let typingTimer = null;
let typingWordIndex = 0;
let typingCharIndex = 0;
let typingDeleting = false;
let typingWords = [];
const typingEl = document.getElementById('typingText');

function restartTyping(words) {
    if (typingTimer) {
        clearTimeout(typingTimer);
        typingTimer = null;
    }
    typingWords = words.length > 0 ? words : ['开发者'];
    typingWordIndex = 0;
    typingCharIndex = 0;
    typingDeleting = false;
    typeEffect();
}

function typeEffect() {
    const currentWord = typingWords[typingWordIndex] || '';

    if (typingDeleting) {
        typingEl.textContent = currentWord.substring(0, typingCharIndex - 1);
        typingCharIndex--;
    } else {
        typingEl.textContent = currentWord.substring(0, typingCharIndex + 1);
        typingCharIndex++;
    }

    let speed = typingDeleting ? 40 : 80;

    if (!typingDeleting && typingCharIndex === currentWord.length) {
        speed = 2000;
        typingDeleting = true;
    } else if (typingDeleting && typingCharIndex === 0) {
        typingDeleting = false;
        typingWordIndex = (typingWordIndex + 1) % typingWords.length;
        speed = 400;
    }

    typingTimer = setTimeout(typeEffect, speed);
}

/* ============================================================
   滚动动画
   ============================================================ */
let revealObserver = null;

function reobserveReveal() {
    if (revealObserver) revealObserver.disconnect();

    revealObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                }
            });
        },
        { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));
}

/* 数字递增动画 */
let statObserver = null;

function reobserveStats() {
    if (statObserver) statObserver.disconnect();

    statObserver = new IntersectionObserver(
        (entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.target);
                    if (!isNaN(target)) animateNumber(el, target);
                    statObserver.unobserve(el);
                }
            });
        },
        { threshold: 0.5 }
    );

    document.querySelectorAll('.stat-num').forEach(el => statObserver.observe(el));
}

function animateNumber(el, target) {
    const duration = 2000;
    const start = performance.now();

    function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
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

/* ============================================================
   主题切换
   ============================================================ */
const THEME_KEY = 'site_theme';
const themeToggle = document.getElementById('themeToggle');

function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
}

function applyTheme(theme) {
    document.documentElement.classList.toggle('light', theme === 'light');
}

themeToggle.addEventListener('click', function () {
    const current = getSavedTheme();
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
});

/* ============================================================
   导航
   ============================================================ */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
});

const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navLinks.classList.toggle('open');
});
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        navLinks.classList.remove('open');
    });
});

const sections = document.querySelectorAll('section[id]');
const navLinkEls = document.querySelectorAll('.nav-link');

function setActiveNav() {
    let current = '';
    const atBottom = window.scrollY + window.innerHeight >= document.body.offsetHeight - 20;
    sections.forEach(section => {
        const top = section.offsetTop - 100;
        if (window.scrollY >= top) {
            current = section.getAttribute('id');
        }
    });
    // 页面滚动到底部时强制激活最后一个板块（联系）
    if (atBottom) {
        const last = sections[sections.length - 1];
        if (last) current = last.getAttribute('id');
    }
    navLinkEls.forEach(link => {
        link.classList.toggle('active', link.getAttribute('href') === '#' + current);
    });
}
window.addEventListener('scroll', setActiveNav);

/* ============================================================
   编辑面板
   ============================================================ */
const editToggle = document.getElementById('editToggle');
const editPanel = document.getElementById('editPanel');
const editOverlay = document.getElementById('editOverlay');
const editClose = document.getElementById('editClose');
const editSave = document.getElementById('editSave');
const editReset = document.getElementById('editReset');

function openPanel() {
    populateForm();
    editPanel.classList.add('open');
    editOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closePanel() {
    editPanel.classList.remove('open');
    editOverlay.classList.remove('active');
    document.body.style.overflow = '';
}

/* ---- 密码弹窗 ---- */
const pwdOverlay = document.getElementById('pwdOverlay');
const pwdModal = document.getElementById('pwdModal');
const pwdInput = document.getElementById('pwdInput');
const pwdError = document.getElementById('pwdError');
const pwdConfirm = document.getElementById('pwdConfirm');
const pwdCancel = document.getElementById('pwdCancel');

function closePwdModal() {
    pwdOverlay.classList.remove('active');
    pwdError.classList.remove('show');
}

function handlePwdSubmit() {
    const savedPwd = localStorage.getItem(PASSWORD_KEY) || DEFAULT_PASSWORD;
    const input = pwdInput.value.trim();
    if (input === savedPwd) {
        closePwdModal();
        openPanel();
    } else {
        pwdError.classList.add('show');
        pwdInput.value = '';
        pwdInput.focus();
    }
}

editToggle.addEventListener('click', function () {
    pwdInput.value = '';
    pwdError.classList.remove('show');
    pwdOverlay.classList.add('active');
    setTimeout(() => pwdInput.focus(), 100);
});
pwdConfirm.addEventListener('click', handlePwdSubmit);
pwdCancel.addEventListener('click', closePwdModal);
pwdOverlay.addEventListener('click', function (e) {
    if (e.target === pwdOverlay) closePwdModal();
});
pwdInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') handlePwdSubmit();
    if (e.key === 'Escape') closePwdModal();
});
editClose.addEventListener('click', closePanel);
editOverlay.addEventListener('click', closePanel);

/* ---- 填充表单 ---- */
function populateForm() {
    const d = currentData;
    document.getElementById('editName').value = d.name;
    document.getElementById('editSiteSuffix').value = d.siteSuffix || '';
    document.getElementById('editGreeting').value = d.greeting;
    document.getElementById('editTitles').value = d.titles.join(', ');
    document.getElementById('editBio').value = d.bio;
    document.getElementById('editAbout').value = d.about.join('\n');
    document.getElementById('editStats').value = d.stats.join(', ');
    document.getElementById('editStatsLabels').value = d.statLabels.join(', ');
    document.getElementById('editEmail').value = d.email;
    document.getElementById('editPassword').value = '';
    document.getElementById('editSocialGithub').value = d.social.github || '';
    document.getElementById('editSocialWeibo').value = d.social.weibo || '';
    document.getElementById('editSocialZhihu').value = d.social.zhihu || '';
    document.getElementById('editSocialTwitter').value = d.social.twitter || '';

    // avatar preview
    const preview = document.getElementById('avatarPreview');
    if (d.avatar) {
        preview.innerHTML = `<img src="${d.avatar}" alt="">`;
    } else {
        preview.innerHTML = '<span>点击上传图片</span>';
    }

    // about photo preview
    const aboutPreview = document.getElementById('aboutPhotoPreview');
    if (d.aboutPhoto) {
        aboutPreview.innerHTML = `<img src="${d.aboutPhoto}" alt="">`;
    } else {
        aboutPreview.innerHTML = '<span>点击上传</span>';
    }

    // skills
    const skillsContainer = document.getElementById('editSkillsContainer');
    skillsContainer.innerHTML = '';
    d.skills.forEach(s => addSkillItem(s.name, s.tags.join(', ')));

    // projects
    const projContainer = document.getElementById('editProjectsContainer');
    projContainer.innerHTML = '';
    d.projects.forEach(p => addProjectItem(p.title, p.desc, p.tags.join(', '), p.color1, p.color2, p.cover || ''));

    // cloud sync
    document.getElementById('editCloudSync').checked = isCloudSyncEnabled();
    updateCloudSyncStatus();

    // timeline
    const tlContainer = document.getElementById('editTimelineContainer');
    tlContainer.innerHTML = '';
    d.timeline.forEach(t => addTimelineItem(t.period, t.title, t.company, t.desc));
}

/* ---- 动态添加技能/项目 ---- */
function addTimelineItem(period, title, company, desc) {
    const container = document.getElementById('editTimelineContainer');
    const div = document.createElement('div');
    div.className = 'edit-timeline-item';
    div.innerHTML = `
        <input class="tl-period" placeholder="时间段（如：2023 - 至今）" value="${escapeHtml(period || '')}">
        <input class="tl-title" placeholder="职位（如：高级全栈开发者）" value="${escapeHtml(title || '')}">
        <input class="tl-company" placeholder="公司名称" value="${escapeHtml(company || '')}">
        <input class="tl-desc" placeholder="简要描述" value="${escapeHtml(desc || '')}">
        <button class="edit-remove-btn" title="删除">×</button>
    `;
    div.querySelector('.edit-remove-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
}

function addSkillItem(name, tags) {
    const container = document.getElementById('editSkillsContainer');
    const div = document.createElement('div');
    div.className = 'edit-skill-item';
    div.innerHTML = `
        <input class="skill-name" placeholder="分类名称（如：前端开发）" value="${escapeHtml(name || '')}">
        <input class="skill-tags" placeholder="标签（逗号分隔）" value="${escapeHtml(tags || '')}">
        <button class="edit-remove-btn" title="删除">×</button>
    `;
    div.querySelector('.edit-remove-btn').addEventListener('click', () => div.remove());
    container.appendChild(div);
}

function addProjectItem(title, desc, tags, c1, c2, cover) {
    const container = document.getElementById('editProjectsContainer');
    const div = document.createElement('div');
    div.className = 'edit-project-item';
    const coverPreviewHtml = cover
        ? `<img src="${escapeHtml(cover)}" alt="">`
        : '<span>上传封面</span>';
    div.innerHTML = `
        <input class="proj-title" placeholder="项目名称" value="${escapeHtml(title || '')}">
        <input class="proj-desc" placeholder="项目简介" value="${escapeHtml(desc || '')}">
        <input class="proj-tags" placeholder="标签（逗号分隔）" value="${escapeHtml(tags || '')}">
        <div class="proj-cover-upload">
            <input type="file" class="proj-cover-input" accept="image/*">
            <div class="proj-cover-preview">${coverPreviewHtml}</div>
        </div>
        <input class="proj-color1" placeholder="渐变颜色1（如 #667eea）" value="${escapeHtml(c1 || '#667eea')}">
        <input class="proj-color2" placeholder="渐变颜色2（如 #764ba2）" value="${escapeHtml(c2 || '#764ba2')}">
        <button class="edit-remove-btn" title="删除">×</button>
    `;
    div.querySelector('.edit-remove-btn').addEventListener('click', () => div.remove());
    // cover upload preview
    const coverInput = div.querySelector('.proj-cover-input');
    const coverPreview = div.querySelector('.proj-cover-preview');
    coverInput.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file || !checkImageSize(file)) return;
        const reader = new FileReader();
        reader.onload = function (ev) {
            coverPreview.innerHTML = `<img src="${ev.target.result}" alt="">`;
        };
        reader.readAsDataURL(file);
    });
    container.appendChild(div);
}

document.getElementById('addSkill').addEventListener('click', () => addSkillItem('', ''));
document.getElementById('addProject').addEventListener('click', () => addProjectItem('', '', '', '', '', ''));
document.getElementById('addTimeline').addEventListener('click', () => addTimelineItem('', '', '', ''));

const MAX_IMAGE_SIZE = 500 * 1024; // 500KB

function checkImageSize(file) {
    if (file.size > MAX_IMAGE_SIZE) {
        const sizeMB = (file.size / 1024 / 1024).toFixed(1);
        showToast(`图片过大 (${sizeMB}MB)，建议压缩后上传`);
        return false;
    }
    return true;
}

/* ---- 头像上传 ---- */
document.getElementById('editAvatar').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file || !checkImageSize(file)) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        const preview = document.getElementById('avatarPreview');
        preview.innerHTML = `<img src="${ev.target.result}" alt="">`;
    };
    reader.readAsDataURL(file);
});

/* ---- 关于照片上传 ---- */
document.getElementById('editAboutPhoto').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file || !checkImageSize(file)) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        const preview = document.getElementById('aboutPhotoPreview');
        preview.innerHTML = `<img src="${ev.target.result}" alt="">`;
    };
    reader.readAsDataURL(file);
});

/* ---- 保存 ---- */
editSave.addEventListener('click', () => {
    const data = {
        name: document.getElementById('editName').value.trim() || 'John Doe',
        siteSuffix: document.getElementById('editSiteSuffix').value.trim(),
        greeting: document.getElementById('editGreeting').value.trim() || '你好，我是',
        titles: document.getElementById('editTitles').value.split(',').map(s => s.trim()).filter(Boolean),
        bio: document.getElementById('editBio').value.trim(),
        avatar: document.getElementById('avatarPreview').querySelector('img')?.src || '',
        aboutPhoto: document.getElementById('aboutPhotoPreview').querySelector('img')?.src || '',
        about: document.getElementById('editAbout').value.split('\n').map(s => s.trim()).filter(Boolean),
        stats: document.getElementById('editStats').value.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
        statLabels: document.getElementById('editStatsLabels').value.split(',').map(s => s.trim()).filter(Boolean),
        skills: [],
        projects: [],
        email: document.getElementById('editEmail').value.trim(),
        social: {
            github: document.getElementById('editSocialGithub').value.trim(),
            weibo: document.getElementById('editSocialWeibo').value.trim(),
            zhihu: document.getElementById('editSocialZhihu').value.trim(),
            twitter: document.getElementById('editSocialTwitter').value.trim()
        },
        timeline: []
    };

    document.querySelectorAll('#editSkillsContainer .edit-skill-item').forEach(item => {
        const name = item.querySelector('.skill-name').value.trim();
        const tags = item.querySelector('.skill-tags').value.split(',').map(s => s.trim()).filter(Boolean);
        if (name) data.skills.push({ name, tags });
    });

    document.querySelectorAll('#editProjectsContainer .edit-project-item').forEach(item => {
        const title = item.querySelector('.proj-title').value.trim();
        const desc = item.querySelector('.proj-desc').value.trim();
        const tags = item.querySelector('.proj-tags').value.split(',').map(s => s.trim()).filter(Boolean);
        const color1 = item.querySelector('.proj-color1').value.trim() || '#667eea';
        const color2 = item.querySelector('.proj-color2').value.trim() || '#764ba2';
        const coverImg = item.querySelector('.proj-cover-preview img');
        const cover = coverImg ? coverImg.src : '';
        if (title) data.projects.push({ title, desc, tags, color1, color2, cover });
    });

    document.querySelectorAll('#editTimelineContainer .edit-timeline-item').forEach(item => {
        const period = item.querySelector('.tl-period').value.trim();
        const title = item.querySelector('.tl-title').value.trim();
        const company = item.querySelector('.tl-company').value.trim();
        const desc = item.querySelector('.tl-desc').value.trim();
        if (period && title) data.timeline.push({ period, title, company, desc });
    });

    // save password if set
    const pwd = document.getElementById('editPassword').value.trim();
    if (pwd) {
        localStorage.setItem(PASSWORD_KEY, pwd);
    }

    currentData = data;
    saveData(data);
    renderAll();
    closePanel();
});

/* ---- 恢复默认 ---- */
editReset.addEventListener('click', () => {
    if (confirm('确定恢复默认设置？当前所有自定义内容将丢失。')) {
        localStorage.removeItem(STORAGE_KEY);
        localStorage.removeItem(PASSWORD_KEY);
        currentData = cloneData(DEFAULT_DATA);
        if (isCloudSyncEnabled()) {
            saveToCloud(currentData);
        }
        renderAll();
        populateForm();
    }
});

/* ---- 导出/导入数据 ---- */
document.getElementById('exportData').addEventListener('click', function () {
    const data = currentData;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio-data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('数据已导出');
});

document.getElementById('importData').addEventListener('click', function () {
    document.getElementById('importFileInput').click();
});

document.getElementById('importFileInput').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (ev) {
        try {
            const imported = JSON.parse(ev.target.result);
            // validate basic structure
            if (!imported.name && !imported.titles) {
                throw new Error('无效的数据格式');
            }
            currentData = deepMerge(cloneData(DEFAULT_DATA), imported);
            saveData(currentData);
            if (isCloudSyncEnabled()) {
                saveToCloud(currentData);
            }
            renderAll();
            populateForm();
            showToast('数据导入成功');
        } catch (err) {
            showToast('导入失败：文件格式不正确');
        }
    };
    reader.readAsText(file);
    // reset so same file can be imported again
    this.value = '';
});

/* ---- 云端同步 ---- */
let _cloudApiAvailable = true;

async function checkCloudApi() {
    try {
        const res = await fetch(getCloudApiUrl(), { method: 'HEAD' });
        _cloudApiAvailable = res.ok;
    } catch (e) {
        _cloudApiAvailable = false;
    }
    if (!_cloudApiAvailable) {
        document.getElementById('editCloudSync').disabled = true;
        document.getElementById('cloudSyncStatus').textContent = '不可用（需后端 API）';
    }
}

function updateCloudSyncStatus() {
    const enabled = isCloudSyncEnabled();
    const el = document.getElementById('cloudSyncStatus');
    if (!_cloudApiAvailable) {
        el.textContent = '不可用（需后端 API）';
        return;
    }
    el.textContent = enabled ? '已开启' : '已关闭';
}

document.getElementById('editCloudSync').addEventListener('change', function () {
    if (!_cloudApiAvailable) {
        this.checked = false;
        showToast('云端同步不可用：需要部署后端 API');
        return;
    }
    if (this.checked) {
        localStorage.setItem(CLOUD_SYNC_KEY, 'true');
        updateCloudSyncStatus();
        // immediately push current data to cloud
        saveToCloud(currentData);
        showToast('云端同步已开启，数据已上传');
    } else {
        localStorage.setItem(CLOUD_SYNC_KEY, 'false');
        updateCloudSyncStatus();
        showToast('云端同步已关闭');
    }
});

/* ============================================================
   动态粒子背景
   ============================================================ */
(function () {
    const canvas = document.getElementById('particleCanvas');
    const ctx = canvas.getContext('2d');
    let particles = [];
    let mouse = { x: -9999, y: -9999 };

    function resize() {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resize);
    resize();

    const COUNT = 100;
    const CONNECT_DIST = 140;
    const MOUSE_RADIUS = 200;

    for (let i = 0; i < COUNT; i++) {
        particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.5,
            vy: (Math.random() - 0.5) * 0.5,
            r: Math.random() * 2 + 1
        });
    }

    document.addEventListener('mousemove', function (e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
    });
    document.addEventListener('mouseleave', function () {
        mouse.x = -9999;
        mouse.y = -9999;
    });
    // touch support for mobile
    document.addEventListener('touchmove', function (e) {
        const t = e.touches[0];
        mouse.x = t.clientX;
        mouse.y = t.clientY;
    });
    document.addEventListener('touchend', function () {
        mouse.x = -9999;
        mouse.y = -9999;
    });

    let accentRgbCache = '108,92,231';

    function updateAccentCache() {
        const accent = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent').trim() || '#6c5ce7';
        accentRgbCache = hexToRgb(accent);
    }
    updateAccentCache();

    // 主题切换时更新粒子颜色缓存
    const themeToggleBtn = document.getElementById('themeToggle');
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', function () {
            setTimeout(updateAccentCache, 100);
        });
    }

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (let i = 0; i < particles.length; i++) {
            const p = particles[i];

            // mouse repulsion
            const dx = p.x - mouse.x;
            const dy = p.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < MOUSE_RADIUS && dist > 0) {
                const force = (MOUSE_RADIUS - dist) / MOUSE_RADIUS * 0.6;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }

            // damping
            p.vx *= 0.98;
            p.vy *= 0.98;

            p.x += p.vx;
            p.y += p.vy;

            // wrap around edges
            if (p.x < -10) p.x = canvas.width + 10;
            if (p.x > canvas.width + 10) p.x = -10;
            if (p.y < -10) p.y = canvas.height + 10;
            if (p.y > canvas.height + 10) p.y = -10;

            // draw particle
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${accentRgbCache}, 0.4)`;
            ctx.fill();

            // connections
            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];
                const cx = p.x - p2.x;
                const cy = p.y - p2.y;
                const cd = Math.sqrt(cx * cx + cy * cy);
                if (cd < CONNECT_DIST) {
                    const alpha = (1 - cd / CONNECT_DIST) * 0.3;
                    ctx.beginPath();
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(p2.x, p2.y);
                    ctx.strokeStyle = `rgba(${accentRgbCache}, ${alpha})`;
                    ctx.lineWidth = 0.6;
                    ctx.stroke();
                }
            }
        }

        requestAnimationFrame(animate);
    }

    function hexToRgb(hex) {
        const val = hex.replace('#', '');
        return parseInt(val.substring(0, 2), 16) + ',' +
               parseInt(val.substring(2, 4), 16) + ',' +
               parseInt(val.substring(4, 6), 16);
    }

    animate();
})();

/* ============================================================
   访问量与最后更新
   ============================================================ */
function updateVisitCount() {
    const key = 'site_visits';
    let count = parseInt(localStorage.getItem(key) || '0');
    count++;
    localStorage.setItem(key, count);
    document.getElementById('visitCount').textContent = '访问: ' + count;
}

function updateLastUpdated() {
    const ts = localStorage.getItem('last_updated');
    if (ts) {
        const d = new Date(parseInt(ts));
        document.getElementById('lastUpdated').textContent = '更新: ' + d.toLocaleDateString('zh-CN');
    }
}

/* ============================================================
   2048 游戏
   ============================================================ */
(function() {
    const SIZE = 4;
    let grid, score, over, won, keepPlaying;
    let touchStartX, touchStartY;

    const $ = id => document.getElementById(id);
    const tilesEl = $('gridTiles');
    const scoreEl = $('gameScore');
    const bestEl = $('gameBest');
    const msgEl = $('gameMessage');
    const msgTextEl = $('gameMessageText');
    const overlay = $('gameOverlay');

    const COLORS = {
        2:    { bg: '#f0e6ff', text: '#5a4bd1' },
        4:    { bg: '#e0ccff', text: '#5a4bd1' },
        8:    { bg: '#c9a8ff', text: '#ffffff' },
        16:   { bg: '#b080ff', text: '#ffffff' },
        32:   { bg: '#9c5cff', text: '#ffffff' },
        64:   { bg: '#8538ff', text: '#ffffff' },
        128:  { bg: '#6c1ad9', text: '#ffffff' },
        256:  { bg: '#a29bfe', text: '#ffffff' },
        512:  { bg: '#7c6cf0', text: '#ffffff' },
        1024: { bg: '#6c5ce7', text: '#ffffff' },
        2048: { bg: '#ffd700', text: '#5a4bd1' },
        4096: { bg: '#ff6b6b', text: '#ffffff' },
    };

    function getLayout() {
        const w = tilesEl.offsetWidth || 320;
        const gap = 6;
        return { cellSize: (w - gap * (SIZE - 1)) / SIZE, gap };
    }

    function getColor(val) {
        return COLORS[val] || { bg: '#1a0d5e', text: '#ffffff' };
    }

    function clone(g) { return g.map(r => [...r]); }

    function init() {
        grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
        score = 0;
        over = false;
        won = false;
        keepPlaying = false;
        addRandomTile();
        addRandomTile();
        updateScore();
        hideMessage();
        render(null);
    }

    function addRandomTile() {
        const empty = [];
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++)
                if (grid[r][c] === 0) empty.push({ r, c });
        if (empty.length === 0) return null;
        const { r, c } = empty[Math.floor(Math.random() * empty.length)];
        grid[r][c] = Math.random() < 0.9 ? 2 : 4;
        return r + ',' + c;
    }

    function slideRow(row) {
        let arr = row.filter(v => v !== 0);
        let merged = Array(arr.length).fill(false);
        let gain = 0;
        for (let i = 0; i < arr.length - 1; i++) {
            if (arr[i] === arr[i + 1]) {
                arr[i] *= 2;
                gain += arr[i];
                merged[i] = true;
                arr[i + 1] = 0;
            }
        }
        arr = arr.filter(v => v !== 0);
        while (arr.length < SIZE) arr.push(0);
        return { arr, gain };
    }

    function moveLeft() {
        let moved = false;
        let gain = 0;
        for (let r = 0; r < SIZE; r++) {
            const orig = [...grid[r]];
            const result = slideRow(grid[r]);
            grid[r] = result.arr;
            gain += result.gain;
            if (orig.join(',') !== grid[r].join(',')) moved = true;
        }
        return { moved, gain };
    }

    function moveRight() {
        let moved = false;
        let gain = 0;
        for (let r = 0; r < SIZE; r++) {
            const orig = [...grid[r]];
            grid[r].reverse();
            const result = slideRow(grid[r]);
            grid[r] = result.arr;
            grid[r].reverse();
            gain += result.gain;
            if (orig.join(',') !== grid[r].join(',')) moved = true;
        }
        return { moved, gain };
    }

    function moveUp() {
        let moved = false;
        let gain = 0;
        for (let c = 0; c < SIZE; c++) {
            const col = grid.map(r => r[c]);
            const orig = [...col];
            const result = slideRow(col);
            gain += result.gain;
            for (let r = 0; r < SIZE; r++) grid[r][c] = result.arr[r];
            if (orig.join(',') !== col.join(',')) moved = true;
        }
        return { moved, gain };
    }

    function moveDown() {
        let moved = false;
        let gain = 0;
        for (let c = 0; c < SIZE; c++) {
            let col = grid.map(r => r[c]);
            const orig = [...col];
            col.reverse();
            const result = slideRow(col);
            col = result.arr;
            col.reverse();
            gain += result.gain;
            for (let r = 0; r < SIZE; r++) grid[r][c] = col[r];
            if (orig.join(',') !== col.join(',')) moved = true;
        }
        return { moved, gain };
    }

    function move(dir) {
        if (over || (won && !keepPlaying)) return;
        const fns = { left: moveLeft, right: moveRight, up: moveUp, down: moveDown };
        const { moved, gain } = fns[dir]();
        if (!moved) return;
        score += gain;
        updateScore();
        const newPos = addRandomTile();
        render(newPos);
        if (checkWin()) return;
        if (checkOver()) showMessage('游戏结束', false);
    }

    function checkWin() {
        if (won) return false;
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++)
                if (grid[r][c] === 2048) {
                    won = true;
                    showMessage('你赢了！', true);
                    return true;
                }
        return false;
    }

    function checkOver() {
        for (let r = 0; r < SIZE; r++)
            for (let c = 0; c < SIZE; c++) {
                if (grid[r][c] === 0) return false;
                if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return false;
                if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return false;
            }
        over = true;
        return true;
    }

    function render(newTilePos) {
        tilesEl.innerHTML = '';
        const { cellSize, gap } = getLayout();
        for (let r = 0; r < SIZE; r++) {
            for (let c = 0; c < SIZE; c++) {
                const val = grid[r][c];
                if (val === 0) continue;
                const colors = getColor(val);
                const tile = document.createElement('div');
                tile.className = 'game-tile';
                tile.textContent = val;
                const fontSize = val >= 1000 ? Math.floor(cellSize * 0.3)
                    : val >= 100 ? Math.floor(cellSize * 0.36)
                    : Math.floor(cellSize * 0.46);
                tile.style.cssText = [
                    `width:${cellSize}px`, `height:${cellSize}px`,
                    `left:${c * (cellSize + gap)}px`, `top:${r * (cellSize + gap)}px`,
                    `background:${colors.bg}`, `color:${colors.text}`,
                    `font-size:${fontSize}px`,
                    `border-radius:6px`
                ].join(';');
                if (newTilePos === r + ',' + c) tile.classList.add('pop');
                tilesEl.appendChild(tile);
            }
        }
    }

    function updateScore() {
        scoreEl.textContent = score;
        if (score > parseInt(localStorage.getItem('game_best') || '0')) {
            localStorage.setItem('game_best', score);
        }
        bestEl.textContent = localStorage.getItem('game_best') || '0';
    }

    function showMessage(text, isWin) {
        msgEl.style.display = 'flex';
        msgTextEl.textContent = text;
        msgTextEl.style.color = isWin ? '#ffd700' : 'var(--text-primary)';
    }

    function hideMessage() { msgEl.style.display = 'none'; }

    // Keyboard
    document.addEventListener('keydown', function(e) {
        if (!overlay.classList.contains('active')) return;
        const map = {
            ArrowLeft: 'left', ArrowRight: 'right',
            ArrowUp: 'up', ArrowDown: 'down'
        };
        const dir = map[e.key];
        if (dir) { e.preventDefault(); move(dir); }
    });

    // Touch swipe
    tilesEl.addEventListener('touchstart', function(e) {
        const t = e.touches[0];
        touchStartX = t.clientX;
        touchStartY = t.clientY;
    }, { passive: true });

    tilesEl.addEventListener('touchend', function(e) {
        if (!touchStartX) return;
        const dx = e.changedTouches[0].clientX - touchStartX;
        const dy = e.changedTouches[0].clientY - touchStartY;
        const absDx = Math.abs(dx), absDy = Math.abs(dy);
        if (Math.max(absDx, absDy) < 20) return;
        if (absDx > absDy) move(dx > 0 ? 'right' : 'left');
        else move(dy > 0 ? 'down' : 'up');
        touchStartX = touchStartY = null;
    }, { passive: true });

    // Continue button after win
    $('gameContinue').addEventListener('click', function() {
        keepPlaying = true;
        hideMessage();
    });

    // Open / close
    $('gameTrigger').addEventListener('click', function() {
        overlay.classList.add('active');
        init();
        document.body.style.overflow = 'hidden';
    });

    function closeGame() {
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    $('gameClose').addEventListener('click', closeGame);
    $('gameCloseBtn').addEventListener('click', closeGame);
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeGame();
    });
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && overlay.classList.contains('active')) closeGame();
    });

    $('gameNewBtn').addEventListener('click', init);
})();

/* ============================================================
   初始化
   ============================================================ */
(async function init() {
    try {
        // ?reset 参数：清除本地缓存，从云端重新加载
        if (window.location.search.indexOf('reset') > -1) {
            localStorage.removeItem(STORAGE_KEY);
            localStorage.removeItem(CLOUD_SYNC_KEY);
            // 去掉参数，避免重复清除
            try {
                var cleanUrl = window.location.href.replace(/[?&]reset\b[^&]*/g, '').replace(/[?&]$/, '').replace(/\?$/, '');
                window.history.replaceState(null, '', cleanUrl);
            } catch (_) {}
        }
    } catch (_) {}
    updateVisitCount();
    updateLastUpdated();
    currentData = await loadData();
    renderAll();
    // 渲染完成后显示页面，消除默认内容闪烁
    document.getElementById('page-content').classList.add('ready');
    // restore cloud sync toggle state
    document.getElementById('editCloudSync').checked = isCloudSyncEnabled();
    updateCloudSyncStatus();
    checkCloudApi();
    // 页脚版本标记（调试用，部署后可删除）
    try {
        var v = document.createElement('span');
        v.textContent = ' v13';
        v.style.cssText = 'font-size:0.6rem;opacity:0.3';
        document.querySelector('.footer-meta').appendChild(v);
    } catch (_) {}
})();
