const gameContainer = document.getElementById("game");
const robin = document.getElementById("robin");
const holesContainer = document.getElementById("holes");
const timerDisplay = document.getElementById("timer");

const holes = [];
const cols = 4;

let score = 0;
let timeLeft = 60;
let gameRunning = false;
let gameStarted = false;

let wormsCaught = 0;

let x = window.innerWidth / 2;
let facing = 1;
let pecking = false;

let combo = 0;
let maxCombo = 0;
let lastHitTime = 0;

const COMBO_WINDOW = 1500;

let highScore = Number(localStorage.getItem("robinWhackHighScore")) || 0;
let difficultyLevel = 1;

let gamePaused = false;
let pausedAt = 0;

let soundEnabled =
    localStorage.getItem("robinSound") !== "false";

let musicEnabled =
    localStorage.getItem("robinMusic") !== "false";

let hapticsEnabled =
    localStorage.getItem("robinHaptics") !== "false";

document.getElementById("highScoreValue").textContent = highScore;

// ============================================================
// SOUND SYSTEM
// ============================================================

const backgroundMusic = new Audio("./assets/sounds/music.mp3");

let musicFadeTimer = null;

backgroundMusic.loop = true;
backgroundMusic.volume = 0;

const sounds = {
    hit: new Audio("./assets/sounds/hit.mp3"),
    fast: new Audio("./assets/sounds/fast.mp3"),
    golden: new Audio("./assets/sounds/golden.mp3"),
    combo: new Audio("./assets/sounds/combo.mp3"),
    start: new Audio("./assets/sounds/start.mp3"),
    gameover: new Audio("./assets/sounds/gameover.mp3"),
    countdown: new Audio("./assets/sounds/countdown.mp3"),
    bonus: new Audio("./assets/sounds/bonus.mp3")
};

Object.values(sounds).forEach(sound => {
    sound.preload = "auto";
});

function playSound(name) {
    const sound = sounds[name];

    if (!sound) return;

    sound.currentTime = 0;

    sound.play().catch(() => {
        // Audio can be blocked until the player interacts.
    });
}

const timerLoop = setInterval(() => {

    if(
        !gameRunning ||
        !gameStarted ||
        gamePaused
    ) {
        return;
    }

    timeLeft--;

    timerDisplay.textContent =
        "⏱ " + timeLeft;

    if(timeLeft <= 0){
        endGame();
    }

}, 1000);

function startGame(){
    gameStarted = true;
    gameRunning = true;

    difficultyLevel = 1;

    startSpawning();

    document.getElementById("startScreen").style.display = "none";

    playSound("start");

    startMusic();

    gamePaused = false;
}

function addScore(points = 1){
    score += points;
    document.getElementById("scoreValue").textContent = score;

    updateDifficulty();
}

function applyPowerUp(type){
    if(type === "golden"){
        timeLeft += 5;

        timerDisplay.textContent = "⏱ " + timeLeft;

        showBonusText("+5s ⏱️", "#72ff72");

        playSound("bonus");
    }
}

function showBonusText(text, color){
    const popup = document.createElement("div");
    popup.textContent = text;
    popup.style.position = "absolute";
    popup.style.left = x + "px";
    popup.style.bottom = "200px";
    popup.style.fontSize = "22px";
    popup.style.fontWeight = "bold";
    popup.style.zIndex = "10";
    popup.style.color = color;
    popup.style.animation = "floatScore 1s forwards";
    document.getElementById("game").appendChild(popup);
    setTimeout(()=> popup.remove(), 1000);
}

function endGame(){

    gameRunning = false;

    fadeMusicOut();

    clearInterval(spawnTimer);

    playSound("gameover");

    const isNewHighScore = score > highScore;

    if(isNewHighScore){

        highScore = score;

        localStorage.setItem(
            "robinWhackHighScore",
            highScore
        );

        document.getElementById(
            "highScoreValue"
        ).textContent = highScore;

    }

    document.getElementById("finalScore").textContent = score;

    document.getElementById(
        "finalHighScore"
    ).textContent = highScore;

    document.getElementById(
        "finalCombo"
    ).textContent = maxCombo;

    document.getElementById(
        "finalWorms"
    ).textContent = wormsCaught;

    document.getElementById(
        "finalLevel"
    ).textContent = difficultyLevel;

    const highScoreBanner =
        document.getElementById("newHighScore");

    if(isNewHighScore){

        highScoreBanner.style.display = "block";

        playSound("golden");

        createHitParticles(
            window.innerWidth / 2,
            window.innerHeight / 2,
            "golden"
        );

    } else {

        highScoreBanner.style.display = "none";

    }

    document.getElementById(
        "gameOver"
    ).style.display = "block";
}

function targetHole(hole) {
    if(!gameRunning || pecking) return;

    facing = hole.x > x ? 1 : -1;
    x = hole.x;
    
    robin.style.setProperty("--dir", facing);
    robin.style.left = x + "px";

    pecking = true;
    robin.classList.add("peck");

    setTimeout(() => {
        if(hole.occupied) {
            hole.worm.classList.remove("up");
            hole.worm.classList.add("caught");
            hole.occupied = false;

            addScore(hole.points);
            wormsCaught++;

            if(hapticsEnabled && navigator.vibrate){

                if(hole.type === "golden"){
                    navigator.vibrate([30, 40, 60]);
                } else if(hole.type === "fast"){
                    navigator.vibrate(25);
                } else {
                    navigator.vibrate(15);
                }

            }

            registerCombo();

            applyPowerUp(hole.type);

            createHitParticles(
                hole.x,
                window.innerHeight - hole.bottom - 20,
                hole.type
            );

            screenShake();

            if (hole.type === "golden") {
                playSound("golden");
            } else if (hole.type === "fast") {
                playSound("fast");
            } else {
                playSound("hit");
            }

            setTimeout(() => { hole.worm.classList.remove("caught"); }, 400);
            showPoints(hole.x, hole.bottom, hole.points);
        }
    }, 90);

    setTimeout(() => {
        robin.classList.remove("peck");
        pecking = false;
    }, 180);
}

function showPoints(x, y, points = 1){
    const popup = document.createElement("div");
    popup.textContent = `+${points} ⭐`;
    popup.style.position = "absolute";
    popup.style.left = x + "px";
    popup.style.bottom = (y + 40) + "px";
    popup.style.fontSize = "22px";
    popup.style.fontWeight = "bold";
    popup.style.zIndex = "10";
    popup.style.color = points > 1 ? "gold" : "#fff";
    popup.style.animation = "floatScore .8s forwards";

    document.getElementById("game").appendChild(popup);
    setTimeout(() => { popup.remove(); }, 800);
}

// SNOW GENERATOR
for(let i = 0; i < 70; i++){
    const snow = document.createElement("div");
    snow.className = "flake";
    snow.style.left = Math.random() * 100 + "vw";
    const size = 2 + Math.random() * 5;
    snow.style.width = size + "px";
    snow.style.height = size + "px";
    snow.style.animationDuration = 6 + Math.random() * 10 + "s";
    snow.style.animationDelay = -Math.random() * 15 + "s";
    document.getElementById("snow").appendChild(snow);
}

// PURE CSS WORM HTML GENERATOR
function createWormHTML() {
    return `
    <div class="worm-container-inner">
        <div class="head-band"></div>
        <div class="head"></div>
        <div class="eye eye1"></div>
        <div class="eye eye2"></div>
        <div class="mouth"></div>
        <div class="worm-body">
            <div class="segment s1"></div>
            <div class="segment s2"></div>
            <div class="segment s3"></div>
            <div class="segment s4"></div>
            <div class="segment s5"></div>
            <div class="segment s6"></div>
        </div>
    </div>`;
}

// CREATE 4 HOLES & HITAREAS
for(let col = 0; col < cols; col++){
    const hitArea = document.createElement("div");
    hitArea.className = "hole-hitarea";

    const hole = document.createElement("div");
    hole.className = "hole";
    hitArea.appendChild(hole);

    const wormWrapper = document.createElement("div");
    wormWrapper.className = "worm-wrapper normal";
    wormWrapper.innerHTML = createWormHTML();
    hole.appendChild(wormWrapper);

    holesContainer.appendChild(hitArea);

    const holeData = {
        hitArea: hitArea,
        worm: wormWrapper,
        x: 0,
        bottom: 0,
        occupied: false,
        type: "normal",
        points: 1,
        spawnId: 0
    };

    hitArea.addEventListener("pointerdown", (e) => {
        e.preventDefault();
        targetHole(holeData);
    });

    holes.push(holeData);
}

function resizeGame(){
    const isLandscape = window.innerWidth > window.innerHeight;
    
    let scale = Math.min(window.innerWidth / (isLandscape ? 900 : 650), 1);
    if (isLandscape && window.innerHeight < 450) {
        scale *= 0.75;
    }
    document.documentElement.style.setProperty("--scale", scale);

    const margin = window.innerWidth * 0.16;
    const spacingX = (window.innerWidth - margin * 2) / (cols - 1);
    
    const groundBottom = isLandscape ? 5 : 10;
    const groundHeight = isLandscape ? 150 : 240;
    const totalGroundOffset = (groundBottom + groundHeight) * scale;

    // Matched precisely to the deeper wavy snow layer peaks
    const hillOffsets = [32, 22, 28, 20];
    const holeDrop = isLandscape ? 45 : 85;
    const robinDrop = isLandscape ? 75 : 115;

    holes.forEach((hole, i) => {
        hole.x = margin + i * spacingX;
        hole.hitArea.style.left = hole.x + "px";
        
        const hillOffset = (hillOffsets[i] || 25) * scale;
        
        hole.bottom = totalGroundOffset - hillOffset - (holeDrop * scale);
        hole.hitArea.style.bottom = hole.bottom + "px";
    });

    robin.style.left = x + "px";
    robin.style.bottom = (totalGroundOffset - (robinDrop * scale)) + "px";
}

resizeGame();
window.addEventListener("resize", resizeGame);

function getCurrentUpTime(){
    const clampedTime = Math.max(0, Math.min(60, timeLeft));
    const progress = clampedTime / 60;
    return 550 + (950 * progress);
}

function spawnWorm(){

    if(
        !gameRunning ||
        !gameStarted ||
        gamePaused
    ) {
        return;
    }

    // Find available holes
    const availableHoles = holes.filter(hole => !hole.occupied);

    if(availableHoles.length === 0) {
        return;
    }

    // Pick a random available hole
    const hole =
        availableHoles[
            Math.floor(Math.random() * availableHoles.length)
        ];

    // --------------------------------------------------------
    // CHOOSE WORM TYPE
    // --------------------------------------------------------

    const random = Math.random();

    let type = "normal";

    if(random < 0.10){
        type = "golden";
    } else if(random < 0.30){
        type = "fast";
    }

    // --------------------------------------------------------
    // SET WORM TYPE
    // --------------------------------------------------------

    hole.type = type;

    if(type === "golden"){
        hole.points = 5;
    } else if(type === "fast"){
        hole.points = 2;
    } else {
        hole.points = 1;
    }

    // IMPORTANT:
    // Set the class BEFORE adding "up".
    // This stops a worm changing colour while it is appearing.
    hole.worm.className =
        "worm-wrapper " + type;

    // New spawn ID prevents an old timeout from affecting
    // a newer worm occupying the same hole.
    hole.spawnId++;

    const thisSpawnId = hole.spawnId;

    hole.occupied = true;

    // --------------------------------------------------------
    // ANIMATION
    // --------------------------------------------------------

    hole.worm.classList.remove("up", "caught");

    // Force the browser to recognise the reset
    void hole.worm.offsetWidth;

    hole.worm.classList.add("up");

    // --------------------------------------------------------
    // HOW LONG THE WORM STAYS UP
    // --------------------------------------------------------

    let upTime = getCurrentUpTime();

    if(type === "fast"){
        upTime *= 0.65;
    }

    if(type === "golden"){
        upTime *= 1.15;
    }

    // Make sure they don't disappear ridiculously quickly
    upTime = Math.max(650, upTime);

    setTimeout(() => {

        // Only remove the worm if this is still
        // the same spawn.
        if(
            hole.spawnId !== thisSpawnId ||
            !hole.occupied
        ){
            return;
        }

        hole.worm.classList.remove("up");

        hole.occupied = false;

    }, upTime);
}

function togglePause(){

    if(!gameRunning) return;

    gamePaused = !gamePaused;

    const pauseScreen =
        document.getElementById("pauseScreen");


    if(gamePaused){

        pauseScreen.style.display = "block";

        document.getElementById(
            "pauseBtn"
        ).textContent = "▶";

        fadeMusicOut();

    } else {

        pauseScreen.style.display = "none";

        document.getElementById(
            "pauseBtn"
        ).textContent = "⏸";

        updateMusicState();

    }

}

function restartFromPause(){

    document.getElementById(
        "pauseScreen"
    ).style.display = "none";

    gamePaused = false;

    restartGame();
}

function restartGame(){
    score = 0;
    timeLeft = 60;
    combo = 0;
    maxCombo = 0;
    lastHitTime = 0;
    wormsCaught = 0;
    gameRunning = true;
    gameStarted = true;

    difficultyLevel = 1;
    startSpawning();

    gamePaused = false;

    document.getElementById("scoreValue").textContent = score;
    timerDisplay.textContent = "⏱ " + timeLeft;
    document.getElementById("gameOver").style.display = "none";
    document.getElementById("newHighScore").style.display = "none";

    holes.forEach(hole => {
        hole.occupied = false;
        hole.worm.classList.remove("up", "caught");
    });

    if (musicEnabled) {
        startMusic();
    }
}

function registerCombo() {
    const now = Date.now();

    if (now - lastHitTime <= COMBO_WINDOW) {
        combo++;
    } else {
        combo = 1;
    }

    lastHitTime = now;

    if (combo > maxCombo) {
        maxCombo = combo;
    }

    const comboElement = document.getElementById("combo");

    if (combo >= 2) {
        comboElement.textContent = "🔥 " + combo + " COMBO!";

        comboElement.classList.remove("pop");

        // Force animation restart
        void comboElement.offsetWidth;

        comboElement.classList.add("show", "pop");

        if (combo === 3 || combo === 5 || combo % 5 === 0) {
            playSound("combo");
        }
    }
}

setInterval(() => {
    if (!gameRunning) return;

    if (combo > 0 && Date.now() - lastHitTime > COMBO_WINDOW) {
        combo = 0;

        const comboElement = document.getElementById("combo");

        comboElement.classList.remove("show");
    }
}, 250);

function createHitParticles(x, y, type) {
    const container = document.getElementById("particles");

    let count = 10;

    if (type === "fast") {
        count = 14;
    }

    if (type === "golden") {
        count = 22;
    }

    for (let i = 0; i < count; i++) {
        const particle = document.createElement("div");

        particle.className = "particle";

        const angle = Math.random() * Math.PI * 2;
        const distance = 30 + Math.random() * 45;

        const dx = Math.cos(angle) * distance;
        const dy = Math.sin(angle) * distance;

        particle.style.left = x + "px";
        particle.style.top = y + "px";

        particle.style.setProperty("--dx", dx);
        particle.style.setProperty("--dy", dy);

        const size = 4 + Math.random() * 6;

        particle.style.width = size + "px";
        particle.style.height = size + "px";

        if (type === "golden") {
            particle.textContent = "⭐";
            particle.style.width = "auto";
            particle.style.height = "auto";
            particle.style.fontSize = (12 + Math.random() * 8) + "px";
            particle.style.background = "transparent";
        } else {
            particle.style.background =
                type === "fast"
                    ? "#38bdf8"
                    : "#ffffff";
        }

        container.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 600);
    }
}

function screenShake() {
    gameContainer.classList.remove("shake");

    void gameContainer.offsetWidth;

    gameContainer.classList.add("shake");
}

let spawnTimer;

function startSpawning() {
    clearInterval(spawnTimer);

    spawnTimer = setInterval(() => {
        spawnWorm();
    }, getSpawnInterval());
}

function getSpawnInterval() {
    return Math.max(
        450,
        750 - ((difficultyLevel - 1) * 35)
    );
}

function updateDifficulty() {
    const newLevel =
        Math.floor(score / 15) + 1;

    if (newLevel !== difficultyLevel) {
        difficultyLevel = newLevel;

        startSpawning();

        showBonusText(
            "LEVEL " + difficultyLevel + "!",
            "#ffffff"
        );
    }
}

function toggleSettings(){

    const panel =
        document.getElementById("settingsPanel");

    if(panel.style.display === "block"){
        panel.style.display = "none";
    } else {
        panel.style.display = "block";
    }

}

function toggleSound(){

    soundEnabled = !soundEnabled;

    localStorage.setItem(
        "robinSound",
        soundEnabled
    );

    updateSettingsUI();

    if(soundEnabled){
        playSound("hit");
    }

}

function toggleMusic(){

    musicEnabled = !musicEnabled;

    localStorage.setItem(
        "robinMusic",
        musicEnabled
    );

    updateSettingsUI();

    updateMusicState();

}

function toggleHaptics(){

    hapticsEnabled = !hapticsEnabled;

    localStorage.setItem(
        "robinHaptics",
        hapticsEnabled
    );

    updateSettingsUI();

    if(hapticsEnabled && navigator.vibrate){
        navigator.vibrate(30);
    }

}

function updateSettingsUI(){

    const soundButton =
        document.getElementById("soundToggle");

    const musicButton =
        document.getElementById("musicToggle");

    const hapticsButton =
        document.getElementById("hapticsToggle");


    soundButton.textContent =
        soundEnabled ? "ON" : "OFF";

    soundButton.classList.toggle(
        "active",
        soundEnabled
    );


    musicButton.textContent =
        musicEnabled ? "ON" : "OFF";

    musicButton.classList.toggle(
        "active",
        musicEnabled
    );


    hapticsButton.textContent =
        hapticsEnabled ? "ON" : "OFF";

    hapticsButton.classList.toggle(
        "active",
        hapticsEnabled
    );

}

updateSettingsUI();

function fadeMusicIn(){

    if(musicFadeTimer){
        clearInterval(musicFadeTimer);
    }

    backgroundMusic.volume = 0;

    musicFadeTimer = setInterval(() => {

        if(
            backgroundMusic.paused ||
            !musicEnabled ||
            gamePaused
        ){

            clearInterval(musicFadeTimer);

            musicFadeTimer = null;

            return;
        }

        if(backgroundMusic.volume >= 0.35){

            backgroundMusic.volume = 0.35;

            clearInterval(musicFadeTimer);

            musicFadeTimer = null;

            return;
        }

        backgroundMusic.volume += 0.03;

    }, 80);
}

function fadeMusicOut(){

    if(musicFadeTimer){

        clearInterval(musicFadeTimer);

        musicFadeTimer = null;
    }

    musicFadeTimer = setInterval(() => {

        if(backgroundMusic.volume <= 0.03){

            backgroundMusic.volume = 0;

            backgroundMusic.pause();

            clearInterval(musicFadeTimer);

            musicFadeTimer = null;

            return;
        }

        backgroundMusic.volume -= 0.03;

    }, 50);
}

function updateMusicState(){

    if(!musicEnabled){

        fadeMusicOut();

        return;
    }

    if(
        gameRunning &&
        gameStarted &&
        !gamePaused
    ){

        if(backgroundMusic.paused){

            backgroundMusic
                .play()
                .then(() => {
                    fadeMusicIn();
                })
                .catch(() => {});

        }

    }

}

function startMusic(){

    if(!musicEnabled) return;

    backgroundMusic.currentTime = 0;

    backgroundMusic
        .play()
        .then(() => {

            fadeMusicIn();

        })
        .catch(error => {

            console.log(
                "Music could not start:",
                error
            );

        });
}

