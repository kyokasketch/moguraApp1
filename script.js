const holes = document.querySelectorAll(".hole");
const scoreText = document.getElementById("score");
const timeText = document.getElementById("time");
const bestScoreText = document.getElementById("bestScore");
const message = document.getElementById("message");
const hitMessage = document.getElementById("hitMessage");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const scoreCompare = document.getElementById("scoreCompare");
const scoreHistoryList = document.getElementById("scoreHistory");
const moleTypes = [
  {
    id: "strong",
    name: "ワルモグラ",
    image: "assets/mole-strong.png",
    hp: 3,
    points: 20,
    rate: 0.2
  },
  {
    id: "sprout",
    name: "埋もれモグラ",
    image: "assets/mole-sprout.png",
    hp: 1,
    points: 5,
    rate: 0.2
  },
  {
    id: "happy",
    name: "ノーマルモグラ",
    image: "assets/mole-happy.png",
    hp: 1,
    points: 10,
    rate: 0.6
  }
];

let score = 0;
let timeLeft = 30;
let currentMole = -1;
let currentMoleType = null;
let currentMoleHp = 0;
let gameRunning = false;
let moleTimer = null;
let countdownTimer = null;
const moleShowTime = 1200;
let hammerSwingTimer = null;

function showDesktopHammerSwing(event) {
  if (event.pointerType !== "mouse") {
    return;
  }

  document.body.classList.add("hammer-swing");
  clearTimeout(hammerSwingTimer);
  hammerSwingTimer = setTimeout(() => {
    document.body.classList.remove("hammer-swing");
  }, 250);
}

function showTapHammer(event) {
  const isTouchLike = event.pointerType !== "mouse" || window.matchMedia("(pointer: coarse)").matches;

  if (!isTouchLike) {
    return;
  }

  const hammer = document.createElement("img");
  hammer.className = "tap-hammer";
  hammer.src = "assets/hammer-cursor.svg";
  hammer.alt = "";
  hammer.setAttribute("aria-hidden", "true");
  hammer.style.left = `${event.clientX}px`;
  hammer.style.top = `${event.clientY}px`;

  document.body.appendChild(hammer);
  setTimeout(() => hammer.remove(), 300);
}

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

function getScoreHistory() {
  try {
    return JSON.parse(localStorage.getItem("moguraScoreHistory")) || [];
  } catch (error) {
    return [];
  }
}

function saveScoreHistory() {
  try {
    localStorage.setItem("moguraScoreHistory", JSON.stringify(scoreHistory));
  } catch (error) {
    console.log("スコア履歴を保存できませんでした。");
  }
}

function formatScoreTime(dateText) {
  const date = new Date(dateText);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function renderScoreHistory() {
  scoreHistoryList.innerHTML = "";

  if (scoreHistory.length === 0) {
    scoreCompare.textContent = "まだ記録がありません";
    return;
  }

  const latestScore = scoreHistory[0].score;
  const previousScore = scoreHistory[1]?.score;

  if (previousScore === undefined) {
    scoreCompare.textContent = `前回スコア: ${latestScore}点`;
  } else {
    const diff = latestScore - previousScore;
    const sign = diff > 0 ? "+" : "";
    scoreCompare.textContent = `前回: ${previousScore}点 / 今回: ${latestScore}点 (${sign}${diff}点)`;
  }

  scoreHistory.slice(0, 5).forEach((record) => {
    const item = document.createElement("li");
    const date = document.createElement("span");
    const scoreValue = document.createElement("strong");

    date.textContent = formatScoreTime(record.date);
    scoreValue.textContent = `${record.score}点`;
    item.append(date, scoreValue);
    scoreHistoryList.appendChild(item);
  });
}

// 最高スコアは、使えるブラウザでは自動で保存します。
let bestScore = getSavedBestScore();
let scoreHistory = getScoreHistory();
bestScoreText.textContent = bestScore;
restartButton.disabled = true;
renderScoreHistory();

function clearMoles() {
  holes.forEach((hole, index) => {
    const health = hole.querySelector(".boss-health");

    hole.classList.remove("mole", "strong", "sprout", "happy", "hit", "damaged");
    hole.setAttribute("aria-label", `穴 ${index + 1}`);
    health.textContent = "";
  });
}

function chooseMoleType() {
  const roll = Math.random();
  let border = 0;

  for (const moleType of moleTypes) {
    border += moleType.rate;
    if (roll < border) {
      return moleType;
    }
  }

  return moleTypes[moleTypes.length - 1];
}

function showMole() {
  if (currentMoleType && currentMoleHp > 0) {
    return;
  }

  // 前のモグラを消します。
  clearMoles();

  // 0から8までのランダムな数字を作ります。
  currentMole = Math.floor(Math.random() * holes.length);
  currentMoleType = chooseMoleType();
  currentMoleHp = currentMoleType.hp;

  const hole = holes[currentMole];
  const image = hole.querySelector(".mole-image");
  const health = hole.querySelector(".boss-health");

  hole.classList.add("mole", currentMoleType.id);
  hole.setAttribute("aria-label", `${currentMoleType.name}がいる穴 ${currentMole + 1}`);
  image.src = currentMoleType.image;

  if (currentMoleType.hp > 1) {
    health.textContent = `HP ${currentMoleHp}`;
    message.textContent = `${currentMoleType.name}出現！3回叩こう！`;
  } else {
    message.textContent = "モグラをタップ！";
  }
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
  currentMoleType = null;
  currentMoleHp = 0;

  updateScore();
  updateTime();
  hitMessage.textContent = "叩いたモグラと点数がここに出ます";
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

  clearMoles();
  currentMole = -1;
  currentMoleType = null;
  currentMoleHp = 0;
  startButton.disabled = false;

  scoreHistory.unshift({
    score,
    date: new Date().toISOString()
  });
  scoreHistory = scoreHistory.slice(0, 10);
  saveScoreHistory();
  renderScoreHistory();

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
  clearMoles();
  startGame();
}

holes.forEach((hole, index) => {
  hole.addEventListener("click", () => {
    // ゲーム中で、モグラがいるマスだけ得点できます。
    if (!gameRunning || index !== currentMole) {
      return;
    }

    hole.classList.add("hit");
    setTimeout(() => hole.classList.remove("hit"), 200);

    currentMoleHp -= 1;

    if (currentMoleHp > 0) {
      hole.querySelector(".boss-health").textContent = `HP ${currentMoleHp}`;
      message.textContent = `${currentMoleType.name}はあと${currentMoleHp}回！`;
      hole.classList.add("damaged");
      setTimeout(() => hole.classList.remove("damaged"), 200);
      return;
    }

    score += currentMoleType.points;
    updateScore();
    hitMessage.textContent = `${currentMoleType.name}＋${currentMoleType.points}点！！`;
    message.textContent = `${currentMoleType.name}を倒した！`;
    currentMoleType = null;
    currentMoleHp = 0;
    showMole();
  });
});

startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", restartGame);
document.addEventListener("pointerdown", showDesktopHammerSwing, { passive: true });
document.addEventListener("pointerdown", showTapHammer, { passive: true });
