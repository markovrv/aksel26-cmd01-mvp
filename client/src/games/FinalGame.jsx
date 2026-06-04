// ============================================
// FinalGame (пример-заглушка) — игра для Финального стенда
// Викторина на скорость: выбери правильный ответ
// ============================================

import { useState } from "react";
import { useGameState, GAME_STATES } from "./useGameState";
import { gamesApi } from "../api/client";

/**
 * КАК ПОДКЛЮЧИТЬ:
 *
 * 1. В БД (server/src/db/seed.js) для точки "Финальный стенд" установить:
 *    game_type: "final",
 *    game_data: JSON.stringify({
 *      timeLimit: 30,
 *      questions: [
 *        { text: "Какой металл производит МеталлПром?", answer: "Сталь" },
 *        { text: "Какая температура в доменной печи?", answer: "1500°C" },
 *        { text: "Что производят на прокатном стане?", answer: "Металлопрокат" },
 *      ],
 *    }),
 *
 * 2. В client/src/pages/Game.jsx добавить:
 *    import { FinalGame } from "../games/FinalGame";
 *    // в render:
 *    {gameData.gameType === "final" && (
 *      <FinalGame ... />
 *    )}
 *
 * 3. Перезапустить сервер с пересозданием БД (удалить data/ar-guide.db).
 */

export function FinalGame({ pointId, sessionId, gameData, onComplete, onBack }) {
  const { gameState, score, timeLeft, startGame, addScore, completeGame, formatTime } =
    useGameState({ timeLimit: gameData?.timeLimit || 30 });

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [feedback, setFeedback] = useState(null);

  const questions = gameData?.questions || [
    { text: "Из какого материала изготавливают прокатные валки?", answer: "Сталь" },
    { text: "Как называется процесс соединения металлов сваркой?", answer: "Сварка" },
    { text: "Что такое шлак в металлургии?", answer: "Отход" },
  ];

  const handleStart = () => {
    setCurrentQuestion(0);
    setInputValue("");
    setFeedback(null);
    startGame();
  };

  const handleSubmitAnswer = () => {
    const userAnswer = inputValue.trim().toLowerCase();
    const correctAnswer = questions[currentQuestion].answer.toLowerCase();
    const isCorrect = userAnswer === correctAnswer;

    if (isCorrect) addScore(33);
    setFeedback(isCorrect ? "✅ Верно!" : `❌ Неверно. Ответ: ${questions[currentQuestion].answer}`);

    setTimeout(() => {
      setFeedback(null);
      setInputValue("");
      if (currentQuestion + 1 >= questions.length) {
        completeGame();
      } else {
        setCurrentQuestion((q) => q + 1);
      }
    }, 1500);
  };

  const handleFinish = async () => {
    try {
      await gamesApi.saveResult(pointId, { sessionId, score, maxScore: 100, timeSec: 30 });
    } catch (e) { /* ignore */ }
    onComplete(score, 100);
  };

  // IDLE
  if (gameState === GAME_STATES.IDLE) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: "#0D1B2A" }}>
        <div className="text-center p-6 max-w-md">
          <h2 className="font-montserrat text-2xl font-bold text-white mb-4">🏁 Финальное задание</h2>
          <p className="font-inter text-white/80 mb-6">Ответьте на вопросы по пройденной экскурсии</p>
          <p className="font-inter text-sm text-white/70 mb-8">Вопросов: {questions.length} | Время: {formatTime(timeLeft)}</p>
          <button onClick={handleStart} className="btn-primary">Начать</button>
          <button onClick={onBack} className="block w-full mt-4 text-white/70 hover:text-primary">Вернуться</button>
        </div>
      </div>
    );
  }

  // RESULT
  if (gameState === GAME_STATES.SUCCESS || gameState === GAME_STATES.TIMEOUT) {
    return (
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: "#0D1B2A" }}>
        <div className="text-center p-6">
          <h2 className="font-montserrat text-2xl font-bold mb-4" style={{ color: gameState === GAME_STATES.SUCCESS ? "#2ECC71" : "#E74C3C" }}>
            {gameState === GAME_STATES.SUCCESS ? "🏆 Экскурсия завершена!" : "⏰ Время вышло"}
          </h2>
          <div className="font-montserrat text-5xl font-bold mb-8" style={{ color: "#00C2D4" }}>+{score}<span className="text-lg text-white/70"> очков</span></div>
          <button onClick={handleFinish} className="btn-primary">Продолжить</button>
        </div>
      </div>
    );
  }

  // PLAYING
  return (
    <div className="flex flex-col h-full relative" style={{ backgroundColor: "#0D1B2A" }}>
      <div className="absolute top-4 right-4 bg-black/70 text-white px-4 py-2 rounded-xl z-10">
        <span className="font-mono text-2xl">{formatTime(timeLeft)}</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <p className="font-inter text-white/60 text-sm mb-2">Вопрос {currentQuestion + 1} из {questions.length}</p>
          <h3 className="font-montserrat text-xl font-semibold text-white mb-6">{questions[currentQuestion].text}</h3>
          {feedback ? (
            <p className="font-inter text-lg text-center mb-4" style={{ color: feedback.includes("✅") ? "#2ECC71" : "#E74C3C" }}>
              {feedback}
            </p>
          ) : (
            <>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmitAnswer()}
                placeholder="Введите ответ..."
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-inter placeholder:text-white/40 focus:outline-none focus:border-primary mb-4"
                autoFocus
              />
              <button onClick={handleSubmitAnswer} className="w-full bg-primary text-white py-3 rounded-xl font-semibold hover:bg-primary-hover">
                Ответить
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinalGame;