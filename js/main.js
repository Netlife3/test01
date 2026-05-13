'use strict';

/* ============================================================
   数据管理
   ============================================================ */
const STORAGE_KEY = 'personal_site_data';
const PASSWORD_KEY = 'personal_site_pwd';
const DEFAULT_PASSWORD = 'admin123';

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
    }
};

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
            const parsed = JSON.parse(raw);
            // deep merge with defaults so new fields get filled in
            return deepMerge(cloneData(DEFAULT_DATA), parsed);
        }
    } catch (e) {
        // ignore corrupt data
    }
    return cloneData(DEFAULT_DATA);
}

function saveData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
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
let currentData = loadData();

function renderAll() {
    document.title = currentData.name + (currentData.siteSuffix ? ' | ' + currentData.siteSuffix : '');
    renderLogo();
    renderFooter();
    renderHero();
    renderAbout();
    renderSkills();
    renderProjects();
    renderContact();
    reobserveReveal();
    reobserveStats();
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
    sections.forEach(section => {
        const top = section.offsetTop - 100;
        const bottom = top + section.offsetHeight;
        if (window.scrollY >= top && window.scrollY < bottom) {
            current = section.getAttribute('id');
        }
    });
    navLinkEls.forEach(link => {
        link.style.color = link.getAttribute('href') === '#' + current
            ? 'var(--text-primary)' : '';
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
    const input = pwdInput.value;
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
}

/* ---- 动态添加技能/项目 ---- */
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
        if (!file) return;
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

/* ---- 头像上传 ---- */
document.getElementById('editAvatar').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (!file) return;
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
    if (!file) return;
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
        }
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
        renderAll();
        populateForm();
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

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const accent = getComputedStyle(document.documentElement)
            .getPropertyValue('--accent').trim() || '#6c5ce7';
        const accentRgb = hexToRgb(accent);

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
            ctx.fillStyle = `rgba(${accentRgb}, 0.4)`;
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
                    ctx.strokeStyle = `rgba(${accentRgb}, ${alpha})`;
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
   初始化
   ============================================================ */
renderAll();
