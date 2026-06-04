// ============================================
// CatcherGame — игра для стенда "Производство"
// Рабочий ловит детали в ящик, двигаясь мышью
// Поле растягивается по ширине и высоте экрана
// ============================================

import { useState, useEffect, useRef, useCallback } from "react";
import { gamesApi } from "../api/client";

const CATCHER_W    = 80;
const CATCHER_H    = 30;
const PART_SIZE    = 36;

const DEFAULT_CONFIG = {
  timeLimit:     45,
  goodParts:     ["⚙️", "🔩", "🔧", "🏗️"],
  badParts:      ["💣", "🗑️", "❌"],
  goodScore:     10,
  badPenalty:    15,
  spawnInterval: 1200,
  fallSpeed:     2,
};

function formatTime(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function CatcherGame({ pointId, sessionId, gameData, onComplete, onBack }) {
  const cfg = { ...DEFAULT_CONFIG, ...(gameData || {}) };

  const [gameState, setGameState] = useState("idle");
  const [timeLeft,   setTimeLeft]   = useState(cfg.timeLimit);
  const [score,      setScore]      = useState(0);
  const [parts,      setParts]      = useState([]);
  const [catcherX,   setCatcherX]   = useState(0);
  const [feedback,   setFeedback]   = useState(null);
  const [combo,      setCombo]      = useState(0);
  const [particles,  setParticles]  = useState([]);
  const [fieldSize,  setFieldSize]  = useState({ w: 600, h: 600 });

  const fieldRef      = useRef(null);
  const animRef       = useRef(null);
  const spawnRef      = useRef(null);
  const timerRef      = useRef(null);
  const partsRef      = useRef(parts);
  const catcherXRef   = useRef(catcherX);
  const scoreRef      = useRef(score);
  const comboRef      = useRef(combo);
  const nextIdRef     = useRef(0);
  const fieldSizeRef  = useRef({ w: 600, h: 600 });

  partsRef.current  = parts;
  catcherXRef.current = catcherX;
  scoreRef.current  = score;
  comboRef.current  = combo;

  // Вычисляем размеры поля по контейнеру и сразу пишем в ref
  const updateFieldSize = useCallback(() => {
    if (!fieldRef.current?.parentElement) return;
    const parent = fieldRef.current.parentElement;
    const w = Math.max(300, parent.clientWidth - 32);
    const h = Math.max(300, parent.clientHeight - 80);
    fieldSizeRef.current = { w, h };
    setFieldSize({ w, h });
  }, []);

  useEffect(() => {
    updateFieldSize();
    window.addEventListener("resize", updateFieldSize);
    return () => window.removeEventListener("resize", updateFieldSize);
  }, [updateFieldSize]);

  const startGame = useCallback(() => {
    updateFieldSize();
    setParts([]);
    setScore(0);
    setTimeLeft(cfg.timeLimit);
    setCombo(0);
    setFeedback(null);
    setParticles([]);
    nextIdRef.current = 0;
    setGameState("playing");
  }, [cfg.timeLimit, updateFieldSize]);

  const getCatcherXFromClient = useCallback((clientX) => {
    if (!fieldRef.current) return catcherXRef.current;
    const rect = fieldRef.current.getBoundingClientRect();
    const fw = rect.width; // используем актуальную ширину из DOM, а не ref
    const x = clientX - rect.left - CATCHER_W / 2;
    if (clientX < rect.left) return 0;
    if (clientX > rect.right) return fw - CATCHER_W;
    return Math.max(0, Math.min(fw - CATCHER_W, x));
  }, []);

  // Глобальный mousemove — работает даже при выходе мыши за пределы контейнера
  useEffect(() => {
    if (gameState !== "playing") return;
    const handleMove = (e) => {
      setCatcherX(getCatcherXFromClient(e.clientX));
    };
    window.addEventListener("mousemove", handleMove);
    return () => window.removeEventListener("mousemove", handleMove);
  }, [gameState, getCatcherXFromClient]);

  // Глобальный touchmove
  useEffect(() => {
    if (gameState !== "playing") return;
    const handleTouch = (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      setCatcherX(getCatcherXFromClient(touch.clientX));
    };
    window.addEventListener("touchmove", handleTouch, { passive: true });
    return () => window.removeEventListener("touchmove", handleTouch);
  }, [gameState, getCatcherXFromClient]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const loop = () => {
      const fw = fieldSizeRef.current.w;
      const fh = fieldSizeRef.current.h;

      setParts((prev) => {
        const cX = catcherXRef.current;
        const catcherTop = fh - CATCHER_H - 8;

        const updated = [];
        prev.forEach((p) => {
          const newY = p.y + cfg.fallSpeed;

          if (
            newY + PART_SIZE >= catcherTop &&
            newY <= catcherTop + CATCHER_H &&
            p.x + PART_SIZE / 2 >= cX &&
            p.x + PART_SIZE / 2 <= cX + CATCHER_W
          ) {
            if (p.isGood) {
              const bonus = 1 + Math.floor(comboRef.current / 3) * 0.5;
              const pts = Math.round(cfg.goodScore * bonus);
              setScore((s) => s + pts);
              setCombo((c) => c + 1);
              setFeedback({ text: `+${pts} 🎯`, good: true });
            } else {
              setScore((s) => Math.max(0, s - cfg.badPenalty));
              setCombo(0);
              setFeedback({ text: `-${cfg.badPenalty} ⚠️`, good: false });
            }
            setParticles((pp) => [
              ...pp,
              { id: Date.now() + Math.random(), x: p.x, y: catcherTop, good: p.isGood },
            ]);
            return;
          }

          if (newY > fh) {
            if (p.isGood) setCombo(0);
            return;
          }

          updated.push({ ...p, y: newY });
        });
        return updated;
      });

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [gameState, cfg.fallSpeed, cfg.goodScore, cfg.badPenalty]);

  useEffect(() => {
    if (gameState !== "playing") return;

    const allParts = [...cfg.goodParts, ...cfg.badParts];
    spawnRef.current = setInterval(() => {
      const emoji  = allParts[Math.floor(Math.random() * allParts.length)];
      const isGood = cfg.goodParts.includes(emoji);
      const fw = fieldSizeRef.current.w;
      const x = Math.random() * (fw - PART_SIZE);
      setParts((prev) => [
        ...prev,
        { id: nextIdRef.current++, x, y: -PART_SIZE, emoji, isGood },
      ]);
    }, cfg.spawnInterval);

    return () => clearInterval(spawnRef.current);
  }, [gameState, cfg.goodParts, cfg.badParts, cfg.spawnInterval]);

  useEffect(() => {
    if (gameState !== "playing") return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setGameState("finished");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [gameState]);

  useEffect(() => {
    if (gameState !== "finished") return;
    const finalScore = scoreRef.current;
    gamesApi.saveResult(pointId, {
      sessionId,
      score: finalScore,
      maxScore: 200,
      timeSec: cfg.timeLimit - timeLeft,
    }).catch(console.error);
    onComplete?.(finalScore, 200);
  }, [gameState]);

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 800);
    return () => clearTimeout(t);
  }, [feedback]);

  useEffect(() => {
    if (particles.length === 0) return;
    const t = setTimeout(
      () => setParticles((pp) => pp.slice(Math.max(0, pp.length - 5))),
      600
    );
    return () => clearTimeout(t);
  }, [particles]);

  if (gameState === "idle") {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-6 p-6" style={{ backgroundColor: "#0D1B2A" }}>
        <div className="text-center max-w-md">
          <h2 className="font-montserrat text-2xl font-bold text-white mb-4">
            ⚙️ Поймай детали!
          </h2>
          <p className="font-inter text-white/80 mb-2">Двигай мышью — лови нужные детали в ящик.</p>
          <p className="font-inter text-sm mb-1" style={{ color: "#2ECC71" }}>
            Хорошие: {cfg.goodParts.join(" ")} → +{cfg.goodScore} очков
          </p>
          <p className="font-inter text-sm mb-1" style={{ color: "#E74C3C" }}>
            Брак: {cfg.badParts.join(" ")} → -{cfg.badPenalty} очков
          </p>
          <p className="font-inter text-sm text-yellow-400 mb-8">Комбо × увеличивает награду!</p>
          <p className="font-inter text-sm text-white/50 mb-4">Время: {cfg.timeLimit} сек</p>
          <button onClick={startGame} className="btn-primary w-full">
            Начать
          </button>
          <button onClick={onBack} className="block w-full mt-4 text-white/70 hover:text-primary">
            Вернуться
          </button>
        </div>
      </div>
    );
  }

  if (gameState === "finished") {
    const medal = score >= 200 ? "🥇" : score >= 100 ? "🥈" : "🥉";
    return (
      <div className="flex flex-col items-center justify-center h-full gap-5 p-6" style={{ backgroundColor: "#0D1B2A" }}>
        <div className="text-5xl">{medal}</div>
        <h2 className="font-montserrat text-2xl font-bold text-white">Время вышло!</h2>
        <p className="font-inter text-white/70 text-lg">
          Итоговый счёт:{" "}
          <span className="text-primary font-bold text-2xl">{score}</span>
        </p>
        <p className="font-inter text-sm text-white/50 text-center">
          {score >= 200
            ? "Отличный результат! Настоящий профессионал 🏆"
            : score >= 100
            ? "Хорошая работа! Есть куда расти 💪"
            : "Продолжай тренироваться! 🔧"}
        </p>
        <button onClick={startGame} className="bg-white/10 border border-white/20 text-white px-6 py-2 rounded-xl hover:bg-white/20 transition-all">
          Сыграть ещё раз
        </button>
        <button onClick={onBack} className="text-white/50 hover:text-primary text-sm">
          Вернуться к экскурсии
        </button>
      </div>
    );
  }

  // Игровой экран — full height/width
  return (
    <div className="relative h-full flex flex-col" style={{ backgroundColor: "#0D1B2A" }}>
      {/* HUD */}
      <div className="flex justify-between items-center px-4 py-2 text-white font-inter text-sm flex-shrink-0">
        <span>⏱ {formatTime(timeLeft)}</span>
        <span>
          {combo >= 3 && (
            <span className="text-yellow-300 mr-2">
              🔥 Комбо ×{(1 + Math.floor(combo / 3) * 0.5).toFixed(1)}
            </span>
          )}
          Счёт: <span className="font-bold text-primary">{score}</span>
        </span>
      </div>

      {/* Игровое поле */}
      <div ref={fieldRef} className="flex-1 mx-4 mb-4 relative rounded-2xl overflow-hidden"
        style={{ backgroundColor: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="absolute inset-0 opacity-10 flex items-center justify-center text-[120px] pointer-events-none select-none text-white">
          🏭
        </div>

        {parts.map((p) => (
          <div
            key={p.id}
            className="absolute text-2xl leading-none select-none pointer-events-none"
            style={{ left: p.x, top: p.y, width: PART_SIZE, height: PART_SIZE }}
          >
            {p.emoji}
          </div>
        ))}

        {particles.map((p) => (
          <div
            key={p.id}
            className="absolute text-xl pointer-events-none animate-ping"
            style={{ left: p.x, top: p.y, color: p.good ? "#2ECC71" : "#E74C3C" }}
          >
            {p.good ? "✨" : "💥"}
          </div>
        ))}

        <div
          className="absolute"
          style={{ bottom: 8, left: catcherX, width: CATCHER_W, height: CATCHER_H }}
        >
          <div className="w-full h-full rounded-md flex items-center justify-center text-lg"
            style={{ backgroundColor: "#b45309", border: "2px solid #f59e0b" }}>
            📦
          </div>
        </div>

        {feedback && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 text-xl font-bold font-inter animate-bounce"
            style={{ color: feedback.good ? "#2ECC71" : "#E74C3C" }}
          >
            {feedback.text}
          </div>
        )}
      </div>
    </div>
  );
}

export default CatcherGame;