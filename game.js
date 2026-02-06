const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. CONFIGURATION ---
let score = 0;
let gameOver = false;
let gameStarted = false;
let isVictory = false;
const ASSETS_PATH = './'; 

let assets = { player: null, enemy1: null, enemy2: null, boss: null, pwrFire: null, pwrLife: null };
let stars = [], starsBack = [];
let player = { x: 0, y: 0, w: 60, h: 60, hp: 3, fireRate: 250, isInvincible: false };
let bullets = [], enemies = [], bossBullets = [], enemyBullets = [], powerups = [];
let boss = { x: 0, y: -200, w: 180, h: 120, hp: 100, active: false };

// --- 2. CHARGEMENT ASSETS ---
function createResizedAsset(img, targetW, targetH) {
    const off = document.createElement('canvas');
    off.width = targetW; off.height = targetH;
    off.getContext('2d').drawImage(img, 0, 0, targetW, targetH);
    return off;
}

const imgSources = {
    player: { src: 'vaisseau.png', w: 60, h: 60 },
    enemy1: { src: 'ennemi.png', w: 45, h: 45 },
    enemy2: { src: 'ennemi2.png', w: 45, h: 45 },
    boss: { src: 'boss.png', w: 180, h: 120 },
    pwrFire: { src: 'powerup_fire.png', w: 30, h: 30 },
    pwrLife: { src: 'powerup_life.png', w: 30, h: 30 }
};

const sndLaser = new Audio(ASSETS_PATH + 'laser.mp3');
const sndExplosion = new Audio(ASSETS_PATH + 'explosion.mp3');
const bgMusic = new Audio(ASSETS_PATH + 'boss-music.mp3');
bgMusic.loop = true;

let loadedCount = 0;
for (let key in imgSources) {
    const img = new Image();
    img.src = ASSETS_PATH + imgSources[key].src;
    img.onload = () => {
        assets[key] = createResizedAsset(img, imgSources[key].w, imgSources[key].h);
        if (++loadedCount === Object.keys(imgSources).length) init();
    };
    img.onerror = () => { if (++loadedCount === Object.keys(imgSources).length) init(); };
}

// --- 3. SYSTÈME DE JEU ---
function init() {
    window.addEventListener('resize', resize);
    resize();
    requestAnimationFrame(draw);
}

function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.w / 2;
    player.y = canvas.height - 100;
    stars = []; starsBack = [];
    for (let i = 0; i < 40; i++) {
        stars.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: 2, speed: 3 });
        starsBack.push({ x: Math.random()*canvas.width, y: Math.random()*canvas.height, size: 1, speed: 1.2 });
    }
}

function startGame() {
    document.getElementById('startScreen').style.display = 'none';
    gameStarted = true;
    bgMusic.play().catch(() => {});
    startShooting();
}

let fireInterval;
function startShooting() {
    if (fireInterval) clearInterval(fireInterval);
    fireInterval = setInterval(() => {
        if (gameStarted && !gameOver) {
            bullets.push({ x: player.x + player.w/2 - 2, y: player.y, w: 4, h: 12 });
            const s = sndLaser.cloneNode(); s.volume = 0.1; s.play();
        }
    }, player.fireRate);
}

function takeDamage() {
    if (player.isInvincible || gameOver) return;
    player.hp--;
    player.isInvincible = true;
    const s = sndExplosion.cloneNode(); s.volume = 0.3; s.play();
    if (player.hp <= 0) endGame();
    else setTimeout(() => player.isInvincible = false, 2000);
}

function update() {
    if (!gameStarted || gameOver) return;

    [stars, starsBack].forEach(g => g.forEach(s => { s.y += s.speed; if(s.y > canvas.height) s.y = -10; }));
    bullets.forEach((b, i) => { b.y -= 10; if(b.y < -20) bullets.splice(i, 1); });

    // Boss à 1500 points
    if (score >= 1500 && !boss.active) {
        boss.active = true;
        boss.x = canvas.width/2 - 90;
    }

    if (Math.random() < 0.03 && !boss.active) {
        enemies.push({ x: Math.random()*(canvas.width-40), y:-50, w:45, h:45, type: Math.random()>0.7?2:1, lastShot: Date.now() });
    }

    enemies.forEach((en, i) => {
        en.y += 3;
        if (en.type === 2 && Date.now() - en.lastShot > 2000) {
            enemyBullets.push({ x: en.x + 20, y: en.y + 40, w: 6, h: 12 });
            en.lastShot = Date.now();
        }
        if (rectIntersect(player, en)) takeDamage();
        if (en.y > canvas.height) enemies.splice(i, 1);
    });

    enemyBullets.forEach((eb, i) => {
        eb.y += 6;
        if (rectIntersect(player, eb)) { enemyBullets.splice(i, 1); takeDamage(); }
        if (eb.y > canvas.height) enemyBullets.splice(i, 1);
    });

    powerups.forEach((p, i) => {
        p.y += 2;
        if (rectIntersect(player, p)) {
            if (p.type === 'fire') { player.fireRate = Math.max(100, player.fireRate-30); startShooting(); }
            else { player.hp = Math.min(5, player.hp+1); }
            powerups.splice(i, 1);
        }
    });

    if (boss.active) {
        if (boss.y < 80) boss.y += 1;
        boss.x += Math.sin(Date.now()/600) * 5;
        if (Date.now() % 1200 < 25) {
            for(let i=0; i<12; i++) {
                let a = (Math.PI*2/12)*i;
                bossBullets.push({ x: boss.x+90, y: boss.y+60, vx: Math.cos(a)*5, vy: Math.sin(a)*5 });
            }
        }
    }

    bossBullets.forEach((bb, i) => {
        bb.x += bb.vx; bb.y += bb.vy;
        if (rectIntersect(player, {x: bb.x-5, y: bb.y-5, w: 10, h: 10})) takeDamage();
        if (bb.y > canvas.height || bb.y < 0 || bb.x < 0 || bb.x > canvas.width) bossBullets.splice(i, 1);
    });

    bullets.forEach((b, bi) => {
        enemies.forEach((en, ei) => {
            if (rectIntersect(b, en)) {
                if(Math.random()<0.15) powerups.push({ x: en.x, y: en.y, w: 30, h: 30, type: Math.random()>0.5?'fire':'life' });
                enemies.splice(ei, 1); bullets.splice(bi, 1);
                score += 15; document.getElementById('scoreVal').innerText = score;
                const s = sndExplosion.cloneNode(); s.volume = 0.1; s.play();
            }
        });
        if (boss.active && rectIntersect(b, boss)) {
            bullets.splice(bi, 1); boss.hp--;
            if (boss.hp <= 0) showVictory();
        }
    });
}

function showVictory() {
    gameOver = true;
    isVictory = true;
    document.getElementById('victoryScreen').style.display = 'block';
    document.getElementById('scrollingText').classList.add('animate-scroll');
    saveScore(score);
}

function endGame() {
    if (isVictory) return;
    gameOver = true;
    bgMusic.pause();
    document.getElementById('endScreen').style.display = 'block';
    document.getElementById('finalScore').innerText = score;
    saveScore(score);
}

function saveScore(s) {
    let sc = JSON.parse(localStorage.getItem('morlockScores') || '[]');
    sc.push(s); sc.sort((a,b) => b-a); sc = sc.slice(0, 5);
    localStorage.setItem('morlockScores', JSON.stringify(sc));
    document.querySelectorAll('#list').forEach(l => {
        l.innerHTML = sc.map((v,i) => `<p>${i+1}. ${v} PTS</p>`).join('');
    });
}

function rectIntersect(r1, r2) {
    return !(r2.x > r1.x + r1.w || r2.x + r2.w < r1.x || r2.y > r1.y + r1.h || r2.y + r2.h < r1.y);
}

function handleMove(e) {
    if (!gameStarted || gameOver) return;
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    player.x = cx - player.w/2; player.y = cy - player.h/2;
}
window.addEventListener('touchmove', e => { e.preventDefault(); handleMove(e); }, {passive:false});
window.addEventListener('mousemove', handleMove);

function draw() {
    ctx.fillStyle = '#050505'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#444'; starsBack.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));
    ctx.fillStyle = '#fff'; stars.forEach(s => ctx.fillRect(s.x, s.y, s.size, s.size));

    if (gameStarted && !gameOver) {
        ctx.fillStyle = "#fff"; ctx.font = "bold 18px sans-serif";
        ctx.fillText("VIE: " + "❤️".repeat(player.hp), 20, 70);
        if (assets.player && (!player.isInvincible || Math.floor(Date.now()/100)%2===0)) 
            ctx.drawImage(assets.player, player.x, player.y);
        ctx.fillStyle = '#0ff'; bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
        ctx.fillStyle = '#f44'; enemyBullets.forEach(eb => ctx.fillRect(eb.x, eb.y, eb.w, eb.h));
        enemies.forEach(en => {
            let img = en.type === 2 ? assets.enemy2 : assets.enemy1;
            if (img) ctx.drawImage(img, en.x, en.y);
        });
        powerups.forEach(p => {
            let img = p.type === 'fire' ? assets.pwrFire : assets.pwrLife;
            if (img) ctx.drawImage(img, p.x, p.y);
        });
        if (boss.active && assets.boss) {
            ctx.drawImage(assets.boss, boss.x, boss.y);
            ctx.fillStyle = 'red'; ctx.fillRect(boss.x, boss.y-20, (boss.hp/100)*boss.w, 6);
        }
        ctx.fillStyle = '#f0f'; bossBullets.forEach(bb => { ctx.beginPath(); ctx.arc(bb.x, bb.y, 5, 0, Math.PI*2); ctx.fill(); });
    }
    update();
    requestAnimationFrame(draw);
}
