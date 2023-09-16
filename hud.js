
const ctx = document.getElementById('hud').getContext('2d')

const crosshair = new Image();
const winImg = new Image();
const loseImg = new Image();

winImg.src = './assets/win.png';
loseImg.src = './assets/lose.png';

ctx.font = "50px Arial";
ctx.fillStyle = "white";

let startTime = null;
let secondsElapsed = 0;
let showLoseMessage = false;
let loseTimerStart = null;
let end = false;

const winSound = new Audio('./sounds/win.wav');
winSound.volume = 0.5;
winSound.loop = false;

const loseSound = new Audio('./sounds/lose.wav');
loseSound.volume = 0.5;
loseSound.loop = false;

function playSound(){
    if (end == false && !showLoseMessage){
        winSound.play();
        end = true;
    } else if (end == false && showLoseMessage){
        loseSound.play();
        end = true;
    }
}
function updateHUD() {
    crosshair.src = './assets/crosshair.png';
    var shotsCounter = `${shots}`
    var points = `${totalPoints}`
    
    ctx.fillText("Shots: ", 1150, 670);
    ctx.fillText("Points: ", 50, 50);
    crosshair.onload = () => {
        ctx.clearRect(0, 0, 1920, 1080);
        ctx.drawImage(crosshair, 660, 320, 100, 100);
        if(shots == 0 && totalPoints == 5){
            ctx.drawImage(winImg, 600, 200, 300, 300);
            ctx.fillText("You won!", 650, 500);
            playSound();
        }
        if(shots == 0 && showLoseMessage){
            ctx.drawImage(loseImg, 600, 200, 300, 300);
            ctx.fillText("You lost", 660, 500);
            playSound();
        }
    };
    ctx.fillText(shotsCounter, 1300, 672)
    ctx.fillText(points, 210, 53)
}

function run(time) {
    if (!startTime) {
        startTime = time;
    }

    if (totalPoints >= 5 && shots == 0) {
        secondsElapsed += 0;
        ctx.fillText(`${secondsElapsed} seconds!`, 630, 550);
    } else {
        const elapsedTime = (time - startTime) * 0.001;
        secondsElapsed = Math.floor(elapsedTime);
    }

    if (shots >= 0) {
        updateHUD();
        requestAnimationFrame(run);
    }

    if (shots == 0 && totalPoints <= 3) {
        showLoseMessage = true;
    }

    if (shots == 0 && totalPoints < 5 && !showLoseMessage) {
        if (loseTimerStart === null) {
            loseTimerStart = time;
        }
        const loseElapsedTime = (time - loseTimerStart) * 0.001;
        if (loseElapsedTime >= 2) {
            showLoseMessage = true;
        }
    }
}

run();