const holes = document.querySelectorAll(".hole");
const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const bestScoreText = document.getElementById("bestScore");
const message = document.getElementById("message");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

let score = 0;
let timeLeft = 30;
let currentMole = -1;
let gameRunning = false;
let moleTimer = null;
let countdownTimer = null;
const moleShowTime = 1200;

function getSavedBestScore() {
  // ブラウザによっては保存機能が使えないので、安全に読み込みます。
  try {
    return Number(localStorage.getItem("moguraBestScore")) || 0;
  } catch (error) {
    return 0;
  }
}

function saveBestScore() {
  // 保存に失敗しても、ゲームは止まらないようにします。
  try {
    localStorage.setItem("moguraBestScore", bestScore);
  } catch (error) {
    console.log("最高スコアを保存できませんでした。");
  }
}

// 最高スコアは、使えるブラウザでは自動で保存します。
let bestScore = getSavedBestScore();
bestScoreText.textContent = bestScore;
restartButton.disabled = true;

function showMole() {
  // 前のモグラを消します。
  holes.forEach((hole) => hole.classList.remove("mole"));

  // 0から8までのランダムな数字を作ります。
  currentMole = Math.floor(Math.random() * holes.length);
  holes[currentMole].classList.add("mole");
}

function updateScore() {
  scoreText.textContent = score;
}

function updateTime() {
  timeText.textContent = timeLeft;
}

function startGame() {
  score = 0;
  timeLeft = 30;
  gameRunning = true;
  currentMole = -1;

  updateScore();
  updateTime();
  message.textContent = "モグラをタップ！";
  startButton.disabled = true;
  restartButton.disabled = false;

  showMole();

  // モグラの場所を何度も変えます。数字を大きくすると、ゆっくりになります。
  moleTimer = setInterval(showMole, moleShowTime);

  // 1秒ごとに残り時間を減らします。
  countdownTimer = setInterval(() => {
    timeLeft -= 1;
    updateTime();

    if (timeLeft <= 0) {
      endGame();
    }
  }, 1000);
}

function endGame() {
  gameRunning = false;
  clearInterval(moleTimer);
  clearInterval(countdownTimer);

  holes.forEach((hole) => hole.classList.remove("mole"));
  startButton.disabled = false;

  if (score > bestScore) {
    bestScore = score;
    saveBestScore();
    bestScoreText.textContent = bestScore;
    message.textContent = `終了！最終スコアは${score}点。最高記録です！`;
  } else {
    message.textContent = `終了！最終スコアは${score}点です。`;
  }
}

function restartGame() {
  clearInterval(moleTimer);
  clearInterval(countdownTimer);
  holes.forEach((hole) => hole.classList.remove("mole", "hit"));
  startGame();
}

holes.forEach((hole, index) => {
  hole.addEventListener("click", () => {
    // ゲーム中で、モグラがいるマスだけ得点できます。
    if (!gameRunning || index !== currentMole) {
      return;
    }

    score += 1;
    updateScore();

    hole.classList.add("hit");
    setTimeout(() => hole.classList.remove("hit"), 200);

    showMole();
  });
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
