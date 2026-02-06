const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. CONFIGURATION & ÉTAT DU JEU ---
let score = 0;
let gameOver = false;
const ASSETS_PATH = './'; 

let assets = { player: null, enemy: null, boss: null };

// Variables pour le fond étoilé (Parallax)
let stars = [];
let starsBack = [];

let player = { x: 0, y: 0, w: 60, h: 60 };
let bullets = [];
let enemies = [];
let bossBullets = [];
let boss = { x: 0, y: -200, w: 180, h: 120, hp: 50, active: false };

// --- 2. GESTION DES ASSETS (RESIZE & LOAD) ---

function createResizedAsset(img, targetW, targetH) {
    const offscreenCanvas = document.createElement('canvas');
    offscreenCanvas.width = targetW;
    offscreenCanvas.height = targetH;
    const offCtx = offscreenCanvas.getContext('2d');
    offCtx.drawImage(img, 0, 0, targetW, targetH);
    return offscreenCanvas;
}

const imgSources = {
    player: { src: 'vaisseau.png', w: 60, h: 60 },
    enemy: { src: 'ennemi.png', w: 45, h: 45 },
    boss: { src: 'boss.png', w: 180, h: 120 }
};

const sndLaser = new Audio(ASSETS_PATH + 'laser.mp3');
const sndExplosion = new Audio(ASSETS_PATH + 'explosion.mp3');
const bgMusic = new Audio(ASSETS_PATH + 'boss-music.mp3');
bgMusic.loop = true;

let loadedCount = 0;
const totalImages = Object.keys(imgSources).length;

for (let key in imgSources) {
    const img = new Image();
    img.src = ASSETS_PATH + imgSources[key].src;
    img.onload = () => {
        assets[key] = createResizedAsset(img, imgSources[key].w, imgSources[key].h);
        loadedCount++;
        if (loadedCount === totalImages) init();
    };
    img.onerror = () => { // Fallback si image manquante
        console.error("Erreur chargement:", img.src);
        loadedCount++;
        if (loadedCount === totalImages) init();
    };
}

// --- 3. INITIALISATION & ÉTOILES ---

function initStars() {
    stars = []; starsBack = [];
    for (let i = 0; i < 50; i++) {
        stars.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 2 + 1, speed: Math.random() * 3 + 2 });
        starsBack.push({ x: Math.random() * canvas.width, y: Math.random() * canvas.height, size: Math.random() * 1 + 0.5, speed: Math.random() * 1 + 0.5 });
    }
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.w / 2;
    player.y = canvas.height - 100;
    initStars();
}

function init() {
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(draw);
}

// --- 4. CONTRÔLES ---

function move(e) {
    if (gameOver) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    player.x = clientX - player.w / 2;
    player.y = clientY - player.h / 2;
    if (bgMusic.paused) bgMusic.play().catch(() => {});
}

window.addEventListener('touchmove', (e) => { e.preventDefault(); move(e); }, { passive: false });
window.addEventListener('mousemove', move);

setInterval(() => {
    if (!gameOver) {
        bullets.push({ x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 12 });
        const s = sndLaser.cloneNode(); s.volume = 0.15; s.play();
    }
}, 250);

// --- 5. LOGIQUE ---

function update() {
    if (gameOver) return;

    // Défilement des étoiles
    [stars, starsBack].forEach(group => {
        group.forEach(s => {
            s.y += s.speed;
            if (s.y > canvas.height) { s.y = -10; s.x = Math.random() * canvas.width; }
        });
    });

    if (score >= 200 && !boss.active) { boss.active = true; boss.x = canvas.width / 2 - boss.w / 2; }

    bullets.forEach((b, i) => { b.y -= 10; if (b.y < -20) bullets.splice(i, 1); });

    if (Math.random() < 0.03 && !boss.active) {
        enemies.push({ x: Math.random() * (canvas.width - 40), y: -50, w: 45, h: 45 });
    }

    enemies.forEach((en, i) => {
        en.y += 4;
        if (rectIntersect(player, en)) endGame();
        if (en.y > canvas.height) enemies.splice(i, 1);
    });

    if (boss.active) {
        if (boss.y < 80) boss.y += 1;
        boss.x += Math.sin(Date.now() / 600) * 5;
        if (Date.now() % 1500 < 20) {
            for (let i = 0; i < 10; i++) {
                let angle = (Math.PI * 2 / 10) * i;
                bossBullets.push({ x: boss.x + boss.w/2, y: boss.y + boss.h/2, vx: Math.cos(angle)*5, vy: Math.sin(angle)*5 });
            }
        }
    }

    bossBullets.forEach((bb, i) => {
        bb.x += bb.vx; bb.y += bb.vy;
        if (rectIntersect(player, {x: bb.x - 5, y: bb.y - 5, w: 10, h: 10})) endGame();
        if (bb.y > canvas.height || bb.y < 0 || bb.x < 0 || bb.x > canvas.width) bossBullets.splice(i, 1);
    });

    bullets.forEach((b, bi) => {
        enemies.forEach((en, ei) => {
            if (rectIntersect(b, en)) {
                enemies.splice(ei, 1); bullets.splice(bi, 1);
                score += 10; updateScoreUI();
                const s = sndExplosion.cloneNode(); s.volume = 0.2; s.play();
            }
        });
        if (boss.active && rectIntersect(b, boss)) {
            bullets.splice(bi, 1); boss.hp--;
            if (boss.hp <= 0) { score += 1000; updateScoreUI(); endGame(true); }
        }
    });
}

function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
}

function updateScoreUI() { document.getElementById('scoreVal').innerText = score; }

function endGame(win = false) {
    gameOver = true; bgMusic.pause();
    document.getElementById('leaderboard').style.display = 'block';
    document.getElementById('msgStatus').innerText = win ? "VICTOIRE !" : "GAME OVER";
    document.getElementById('finalScore').innerText = score;
    let scores = JSON.parse(localStorage.getItem('shmupScores') || '[]');
    scores.push(score); scores.sort((a, b) => b - a);
    scores = scores.slice(0, 5); localStorage.setItem('shmupScores', JSON.stringify(scores));
    document.getElementById('list').innerHTML = scores.map((v, i) => `<p>${i+1}. ${v} PTS</p>`).join('');
}

// --- 6. RENDU ---

function draw() {
    ctx.fillStyle = '#050505'; // Fond
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Dessin des étoiles (Parallax)
    ctx.fillStyle = '#444';
    starsBack.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));
    ctx.fillStyle = '#fff';
    stars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));

    if (!gameOver) {
        if (assets.player) ctx.drawImage(assets.player, player.x, player.y);
        ctx.fillStyle = '#0ff';
        bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        enemies.forEach(en => { if (assets.enemy) ctx.drawImage(assets.enemy, en.x, en.y); });
        
        if (boss.active) {
            if (assets.boss) ctx.drawImage(assets.boss, boss.x, boss.y);
            ctx.fillStyle = 'red';
            ctx.fillRect(boss.x, boss.y - 20, (boss.hp/50)*boss.w, 6);
        }
        
        ctx.fillStyle = '#f0f';
        bossBullets.forEach(bb => { ctx.beginPath(); ctx.arc(bb.x, bb.y, 5, 0, Math.PI*2); ctx.fill(); });
    }

    update();
    requestAnimationFrame(draw);
}