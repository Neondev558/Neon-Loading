const isFiveM = !!window.invokeNative || window.location.protocol === 'nui:';

const $ = (id) => document.getElementById(id);
const asset = (path) => `../assets/${path}`;
const pad = (n) => String(n).padStart(2, '0');

const NEON_SECRET = 'nN7-neon$load-9f2Kx!auth';
const NEON_TIMEOUT = 8000;

let neonBooted = false;
let neonTimer = null;

function neonHash(str) {
    let h = 5381;
    for (let i = 0; i < str.length; i++) {
        h = (h * 33 + str.charCodeAt(i)) % 4294967296;
    }
    return h;
}

function neonAuthorize() {
    if (neonBooted) return;
    neonBooted = true;
    if (neonTimer) clearTimeout(neonTimer);
    document.body.classList.remove('is-gated');
    const lock = $('neonLock');
    if (lock) lock.remove();
    init();
}

function neonShowLock() {
    if (neonBooted || $('neonLock')) return;
    const lock = document.createElement('div');
    lock.id = 'neonLock';
    lock.className = 'neon-lock';
    lock.innerHTML = '<div class="neon-lock-card">'
        + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/><path d="M12 15v2"/></svg>'
        + '<b>Neon Loading</b>'
        + '<span>Bu loadscreen Neon.lua olmadan calismaz.</span>'
        + '</div>';
    document.body.appendChild(lock);
}

function neonBoot() {
    document.body.classList.add('is-gated');

    if (!isFiveM) {
        neonAuthorize();
        return;
    }

    window.addEventListener('message', (e) => {
        const data = e.data || {};
        if (neonBooted || data.type !== 'neon:auth') return;
        if (typeof data.key !== 'string' || typeof data.nonce !== 'string' || typeof data.resource !== 'string') return;
        const expected = String(neonHash(NEON_SECRET + data.nonce + data.resource));
        if (data.key === expected) neonAuthorize();
    });

    neonTimer = setTimeout(neonShowLock, NEON_TIMEOUT);
}

const ICONS = {
    play: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5z"/></svg>',
    pause: '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="5.5" y="4" width="4.5" height="16" rx="1"/><rect x="14" y="4" width="4.5" height="16" rx="1"/></svg>',
    prev: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20 5.2v13.6a1 1 0 0 1-1.55.83L9 13.4v5.1a1.5 1.5 0 0 1-3 0v-13a1.5 1.5 0 0 1 3 0v5.1l9.45-6.23A1 1 0 0 1 20 5.2z"/></svg>',
    next: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M4 5.2v13.6a1 1 0 0 0 1.55.83L15 13.4v5.1a1.5 1.5 0 0 0 3 0v-13a1.5 1.5 0 0 0-3 0v5.1L5.55 4.37A1 1 0 0 0 4 5.2z"/></svg>',
    volume: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor"/><path d="M15.5 9a4.2 4.2 0 0 1 0 6"/><path d="M18 6.5a7.6 7.6 0 0 1 0 11"/></svg>',
    mute: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor"/><path d="M16 9.5l5 5"/><path d="M21 9.5l-5 5"/></svg>',
};

const PHASES = {
    INIT_CORE: [0, 0.05],
    INIT_BEFORE_MAP_LOADED: [0.05, 0.22],
    MAP: [0.22, 0.62],
    INIT_AFTER_MAP_LOADED: [0.62, 0.84],
    INIT_SESSION: [0.84, 1],
};

let progressTarget = 0;
let progressShown = 0;
let phaseName = 'INIT_CORE';
let phaseCount = 0;
let mapDone = 0;

function setLoadingLabel(name) {
    const texts = Config.loadingTexts || {};
    const label = texts[name];
    if (label) $('loadingText').textContent = label;
}

function setPhaseProgress(name, fraction) {
    const range = PHASES[name];
    if (!range) return;
    const clamped = Math.min(1, Math.max(0, fraction));
    progressTarget = Math.max(progressTarget, range[0] + (range[1] - range[0]) * clamped);
}

const handlers = {
    startInitFunctionOrder(data) {
        phaseName = data.type;
        phaseCount = data.count;
        setLoadingLabel(phaseName);
        setPhaseProgress(phaseName, 0);
    },

    initFunctionInvoking(data) {
        if (phaseCount > 0) setPhaseProgress(phaseName, data.idx / phaseCount);
    },

    startDataFileEntries(data) {
        phaseName = 'MAP';
        phaseCount = data.count;
        mapDone = 0;
        setLoadingLabel('MAP');
        setPhaseProgress('MAP', 0);
    },

    performMapLoadFunction() {
        mapDone++;
        if (phaseCount > 0) setPhaseProgress('MAP', mapDone / phaseCount);
    },

    loadProgress(data) {
        if (typeof data.loadFraction === 'number') {
            progressTarget = Math.max(progressTarget, Math.min(1, data.loadFraction));
        }
    },
};

window.addEventListener('message', (e) => {
    const data = e.data || {};
    const handler = handlers[data.eventName];
    if (handler) handler(data);
});

function renderProgress() {
    progressShown += (progressTarget - progressShown) * 0.07;
    if (progressTarget - progressShown < 0.0005) progressShown = progressTarget;
    const pct = progressShown * 100;
    $('barFill').style.width = `${pct}%`;
    $('loadingPercent').textContent = Math.floor(pct);
    if (progressShown >= 0.995) setLoadingLabel('DONE');
    requestAnimationFrame(renderProgress);
}

function startDemoProgress() {
    const order = ['INIT_CORE', 'INIT_BEFORE_MAP_LOADED', 'MAP', 'INIT_AFTER_MAP_LOADED', 'INIT_SESSION'];
    let step = 0;
    setInterval(() => {
        step = (step + 1) % 260;
        if (step === 0) {
            progressTarget = 0;
            progressShown = 0;
        }
        const fraction = Math.min(1, step / 220);
        const current = order.find((name) => fraction <= PHASES[name][1]) || 'INIT_SESSION';
        setLoadingLabel(current);
        progressTarget = fraction;
    }, 120);
}

function initBranding() {
    const branding = Config.branding || {};
    const title = (branding.title || '').trim();
    const words = title.split(/\s+/).filter(Boolean);
    const lines = words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [title];
    const titleEl = $('brandingTitle');
    titleEl.textContent = '';
    lines.forEach((text, i) => {
        const line = document.createElement('span');
        line.className = i === lines.length - 1 && lines.length > 1 ? 'line line-outline' : 'line';
        const inner = document.createElement('span');
        inner.textContent = text;
        inner.style.setProperty('--d', `${0.45 + i * 0.14}s`);
        line.appendChild(inner);
        titleEl.appendChild(line);
    });

    $('brandMini').textContent = title;
    $('brandSub').textContent = branding.subtitle || '';
    $('announcementText').textContent = branding.tooltipText || '';

    const logo = $('logoImage');
    logo.onerror = () => {
        logo.style.display = 'none';
    };
    logo.src = asset('images/logo.jpg');
}

function initTips() {
    const tips = (Config.tips || []).filter(Boolean);
    const tipEl = $('tipText');
    if (tips.length === 0) {
        tipEl.style.display = 'none';
        return;
    }
    const inner = document.createElement('span');
    inner.textContent = tips[0];
    tipEl.appendChild(inner);
    if (tips.length < 2) return;
    let index = 0;
    setInterval(() => {
        tipEl.classList.add('is-swapping');
        setTimeout(() => {
            index = (index + 1) % tips.length;
            inner.textContent = tips[index];
            tipEl.classList.remove('is-swapping');
        }, 500);
    }, Config.tipInterval || 6000);
}

function initSlideshow() {
    const files = (Config.imageFiles || []).filter(Boolean);
    const meter = $('slideMeter');
    if (Config.useVideoBackground || files.length === 0) {
        meter.style.display = 'none';
        return;
    }

    const interval = Config.slideInterval || 5000;
    const layers = Array.from(document.querySelectorAll('.bg-layer'));
    const fill = $('slideFill');
    document.documentElement.style.setProperty('--slide', `${interval + 1800}ms`);
    fill.style.setProperty('--slide', `${interval}ms`);
    $('slideTotal').textContent = pad(files.length);

    let index = -1;
    let front = 0;

    const show = (nextIndex) => {
        const url = asset(`images/${files[nextIndex]}`);
        const img = new Image();
        img.onload = () => {
            const incoming = layers[1 - front];
            const outgoing = layers[front];
            incoming.style.backgroundImage = `url("${url}")`;
            incoming.classList.remove('drift-a', 'drift-b');
            void incoming.offsetWidth;
            incoming.classList.add(nextIndex % 2 === 0 ? 'drift-a' : 'drift-b', 'is-active');
            outgoing.classList.remove('is-active');
            front = 1 - front;
            index = nextIndex;
            $('slideIndex').textContent = pad(nextIndex + 1);
            fill.classList.remove('is-running');
            void fill.offsetWidth;
            fill.classList.add('is-running');
        };
        img.onerror = () => {
            index = nextIndex;
        };
        img.src = url;
    };

    show(0);
    if (files.length > 1) {
        setInterval(() => show((index + 1) % files.length), interval);
    }
}

function initVideoBackground() {
    if (!Config.useVideoBackground) return;
    const video = document.createElement('video');
    video.src = asset(`video/${Config.videoFile || 'freestockvideo.mp4'}`);
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    $('videoContainer').appendChild(video);
    video.play().catch(() => {});
}

function initials(name) {
    const parts = String(name || '').trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    const first = parts[0][0] || '';
    const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toLocaleUpperCase('tr-TR');
}

function buildMember(member, number, delay) {
    const li = document.createElement('li');
    li.className = 'member';
    if (member.color) li.style.setProperty('--role', member.color);
    li.style.setProperty('--d', `${delay}s`);

    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    if (member.image) {
        const img = document.createElement('img');
        img.alt = '';
        img.onerror = () => {
            avatar.textContent = initials(member.name);
        };
        img.src = /^(https?:)?\/\//i.test(member.image) ? member.image : asset(`team/${member.image}`);
        avatar.appendChild(img);
    } else {
        avatar.textContent = initials(member.name);
    }

    const text = document.createElement('div');
    text.className = 'member-text';
    const name = document.createElement('span');
    name.className = 'member-name';
    name.textContent = member.name || '';
    const role = document.createElement('span');
    role.className = 'member-role';
    role.textContent = member.role || '';
    text.appendChild(name);
    text.appendChild(role);

    const idx = document.createElement('span');
    idx.className = 'member-index';
    idx.textContent = pad(number);

    li.appendChild(avatar);
    li.appendChild(text);
    li.appendChild(idx);
    return li;
}

function initTeam() {
    const team = Config.team || {};
    const members = (team.members || []).filter((m) => m && m.name);
    const panel = $('team');
    if (!team.active || members.length === 0) {
        panel.classList.add('is-hidden');
        return;
    }

    $('teamTitle').textContent = team.title || 'Ekip';
    $('teamSubtitle').textContent = team.subtitle || '';
    $('teamCount').textContent = pad(members.length);

    const perPage = Math.max(1, team.perPage || 5);
    const pageCount = Math.ceil(members.length / perPage);
    const list = $('teamList');
    const pages = $('teamPages');
    const dots = [];

    if (pageCount > 1) {
        for (let i = 0; i < pageCount; i++) {
            const dot = document.createElement('i');
            pages.appendChild(dot);
            dots.push(dot);
        }
    }

    let page = 0;
    let lit = 0;
    let rows = [];

    const renderPage = (first) => {
        list.textContent = '';
        const start = page * perPage;
        rows = members.slice(start, start + perPage).map((member, i) => {
            const row = buildMember(member, start + i + 1, (first ? 0.9 : 0.05) + i * 0.09);
            list.appendChild(row);
            return row;
        });
        dots.forEach((dot, i) => dot.classList.toggle('is-on', i === page));
        lit = 0;
        rows.forEach((row, i) => row.classList.toggle('is-lit', i === 0));
    };

    renderPage(true);

    setInterval(() => {
        if (rows.length === 0) return;
        lit = (lit + 1) % rows.length;
        rows.forEach((row, i) => row.classList.toggle('is-lit', i === lit));
    }, 1800);

    if (pageCount > 1) {
        setInterval(() => {
            page = (page + 1) % pageCount;
            renderPage(false);
        }, team.pageInterval || 8000);
    }
}

function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return '0:00';
    const total = Math.floor(seconds);
    return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

function initPlayer() {
    const playlist = (Config.playlist || []).filter((t) => t && t.file);
    const player = $('player');
    const audio = $('audio');
    if (playlist.length === 0) {
        player.classList.add('is-hidden');
        return;
    }

    const texts = Object.assign({
        playing: 'Şu an çalıyor',
        paused: 'Duraklatıldı',
        missing: 'Müzik dosyası bulunamadı',
    }, Config.playerTexts || {});

    const playBtn = $('playPauseBtn');
    const nextBtn = $('nextBtn');
    const prevBtn = $('prevBtn');
    const muteBtn = $('muteBtn');
    const slider = $('volumeSlider');
    const volumeText = $('volumeText');
    const label = $('trackLabel');
    const seekTrack = $('seekTrack');
    const seekFill = $('seekFill');

    let trackIndex = 0;
    let failures = 0;
    let userPaused = false;
    let broken = false;

    playBtn.innerHTML = ICONS.play;
    nextBtn.innerHTML = ICONS.next;
    prevBtn.innerHTML = ICONS.prev;
    muteBtn.innerHTML = ICONS.volume;
    label.textContent = texts.paused;
    if (playlist.length < 2) {
        nextBtn.classList.add('is-hidden');
        prevBtn.classList.add('is-hidden');
    }

    const applyVolume = (value) => {
        const v = Math.min(100, Math.max(0, Number(value) || 0));
        audio.volume = v / 100;
        slider.value = v;
        slider.style.setProperty('--v', `${v}%`);
        volumeText.textContent = v;
    };

    const disc = $('disc');
    const cover = $('discCover');
    cover.addEventListener('error', () => disc.classList.remove('has-cover'));
    cover.addEventListener('load', () => disc.classList.add('has-cover'));

    const setCover = (value) => {
        disc.classList.remove('has-cover');
        if (!value) {
            cover.removeAttribute('src');
            return;
        }
        cover.src = /^(https?:)?\/\//i.test(value) ? value : asset(`images/${value}`);
    };

    const loadTrack = (index) => {
        trackIndex = (index + playlist.length) % playlist.length;
        const track = playlist[trackIndex];
        $('songTitle').textContent = track.name || '';
        $('artistName').textContent = track.artist || '';
        setCover(track.cover);
        seekFill.style.width = '0%';
        $('timeNow').textContent = '0:00';
        $('timeTotal').textContent = '0:00';
        audio.src = asset(`audio/${track.file}`);
        audio.load();
        if (!userPaused) audio.play().catch(() => {});
    };

    const nextTrack = () => loadTrack(trackIndex + 1);
    const prevTrack = () => loadTrack(trackIndex - 1);

    audio.addEventListener('error', () => {
        failures++;
        if (failures >= playlist.length) {
            broken = true;
            player.classList.remove('is-playing');
            player.classList.add('is-error');
            label.textContent = texts.missing;
            return;
        }
        nextTrack();
    });
    audio.addEventListener('loadedmetadata', () => {
        failures = 0;
        $('timeTotal').textContent = formatTime(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
        $('timeNow').textContent = formatTime(audio.currentTime);
        if (audio.duration > 0) {
            seekFill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
        }
    });
    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('play', () => {
        playBtn.innerHTML = ICONS.pause;
        player.classList.add('is-playing');
        label.textContent = texts.playing;
    });
    audio.addEventListener('pause', () => {
        playBtn.innerHTML = ICONS.play;
        player.classList.remove('is-playing');
        if (!broken) label.textContent = texts.paused;
    });

    playBtn.addEventListener('click', () => {
        if (broken) return;
        if (audio.paused) {
            userPaused = false;
            audio.play().catch(() => {});
        } else {
            userPaused = true;
            audio.pause();
        }
    });
    nextBtn.addEventListener('click', nextTrack);
    prevBtn.addEventListener('click', prevTrack);
    muteBtn.addEventListener('click', () => {
        audio.muted = !audio.muted;
        muteBtn.innerHTML = audio.muted ? ICONS.mute : ICONS.volume;
    });
    slider.addEventListener('input', () => applyVolume(slider.value));
    seekTrack.addEventListener('click', (e) => {
        if (broken || !(audio.duration > 0)) return;
        const rect = seekTrack.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
        audio.currentTime = ratio * audio.duration;
    });

    applyVolume(Config.volume === undefined ? 30 : Config.volume);
    loadTrack(0);

    const resume = (e) => {
        if (e.target && e.target.closest && e.target.closest('.player')) return;
        if (!userPaused && !broken && audio.paused) audio.play().catch(() => {});
    };
    document.addEventListener('pointerdown', resume, { once: true });
    document.addEventListener('keydown', resume, { once: true });
}

function initParallax() {
    const root = document.documentElement;
    let tx = 0;
    let ty = 0;
    let x = 0;
    let y = 0;
    window.addEventListener('mousemove', (e) => {
        tx = (e.clientX / window.innerWidth) * 2 - 1;
        ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
    const tick = () => {
        x += (tx - x) * 0.06;
        y += (ty - y) * 0.06;
        root.style.setProperty('--px', x.toFixed(4));
        root.style.setProperty('--py', y.toFixed(4));
        requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
}

function init() {
    initBranding();
    initTips();
    initVideoBackground();
    initSlideshow();
    initTeam();
    initPlayer();
    initParallax();
    setLoadingLabel('INIT_CORE');
    requestAnimationFrame(renderProgress);
    if (!isFiveM) startDemoProgress();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', neonBoot);
} else {
    neonBoot();
}
