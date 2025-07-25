import React, { useState } from "react";
import { useMatch } from "../contexts/MatchContext";
import "../styles/operator.css";

const TimerEditor = ({ currentSeconds, onSave, onCancel, title }) => {
  const [minutes, setMinutes] = useState(
    Math.floor(currentSeconds / 60)
      .toString()
      .padStart(2, "0")
  );
  const [seconds, setSeconds] = useState(
    (currentSeconds % 60).toString().padStart(2, "0")
  );

  const handleSave = () => {
    const totalSeconds =
      (parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0);
    onSave(totalSeconds);
  };

  return (
    <div className="timer-editor-overlay">
      <div className="timer-editor">
        <h4>{title}</h4>
        <div className="timer-inputs">
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            min="0"
            max="59"
          />
          <span>:</span>
          <input
            type="number"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            min="0"
            max="59"
          />
        </div>
        <div className="timer-editor-buttons">
          <button onClick={handleSave} className="btn-save-time">
            Save
          </button>
          <button onClick={onCancel} className="btn-cancel-time">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const OperatorPage = () => {
  const {
    matchState,
    changeScore,
    addGamJeom,
    setTimer,
    toggleTimer,
    endRoundAndAwardWinner,
    resetMatch,
    undoLastAction,
    changeRoundWins,
    startRest,
    skipRest,
  } = useMatch();

  const [isEditingTime, setIsEditingTime] = useState(false);
  const isFinished = matchState.status === "FINISHED";
  const isResting = matchState.isRestPeriod;

  const FormattedTimer = ({ seconds }) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleEditTimeClick = () => {
    if (matchState.isTimerRunning) toggleTimer();
    setIsEditingTime(true);
  };

  return (
    <>
      <div className="operator-grid-container">
        {/* Header Panel */}
        <header className="panel header-panel">
          <div className="round-win-editor">
            <button
              onClick={() => changeRoundWins("blue", -1)}
              disabled={isFinished}
            >
              -
            </button>
            <div className="round-wins blue">
              <span>BLUE</span>
              <span>{matchState.blue.roundWins}</span>
            </div>
            <button
              onClick={() => changeRoundWins("blue", 1)}
              disabled={isFinished}
            >
              +
            </button>
          </div>

          <h1>MATCH CONTROL</h1>

          <div className="round-win-editor">
            <button
              onClick={() => changeRoundWins("red", -1)}
              disabled={isFinished}
            >
              -
            </button>
            <div className="round-wins red">
              <span>RED</span>
              <span>{matchState.red.roundWins}</span>
            </div>
            <button
              onClick={() => changeRoundWins("red", 1)}
              disabled={isFinished}
            >
              +
            </button>
          </div>
        </header>

        {/* Blue Player Panel */}
        <div
          className={`panel player-panel blue ${
            isResting || isFinished ? "disabled-section" : ""
          }`}
        >
          <h2 style={{ color: "var(--primary-blue)" }}>BLUE</h2>
          <div className="score-display">{matchState.blue.score}</div>
          <div className="gamjeom-display">
            Gam-jeom: {matchState.blue.gamJeom}
          </div>
          <div className="score-buttons">
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={`blue-p-${p}`}
                onClick={() => changeScore("blue", p)}
                disabled={isFinished || isResting}
              >
                +{p}
              </button>
            ))}
          </div>
          <button
            className="gamjeom-button"
            onClick={() => addGamJeom("blue")}
            disabled={isFinished || isResting}
          >
            Gam-jeom
          </button>
        </div>

        {/* Center Console */}
        <div className={`panel center-console ${isResting ? "resting" : ""}`}>
          <div className="round-display">ROUND: {matchState.round}</div>
          <div className="timer-display">
            <FormattedTimer seconds={matchState.timer} />
          </div>
          <button
            className="btn-edit-time"
            onClick={handleEditTimeClick}
            disabled={isFinished}
          >
            Edit Time
          </button>
          <div className="main-controls">
            <button
              className={`btn-timer ${
                matchState.isTimerRunning ? "running" : "stopped"
              }`}
              onClick={toggleTimer}
              disabled={isFinished}
            >
              {isResting
                ? matchState.isTimerRunning
                  ? "Pause Rest"
                  : "Start Rest"
                : matchState.isTimerRunning
                ? "Stop Timer"
                : "Start Timer"}
            </button>
            <button
              className="btn-end-round"
              onClick={endRoundAndAwardWinner}
              disabled={isFinished || isResting}
            >
              End Round
            </button>
            <button
              className="btn-rest"
              onClick={startRest}
              disabled={isFinished || matchState.isTimerRunning}
            >
              Manual Rest
            </button>
            {isResting && (
              <button className="btn-skip-rest" onClick={skipRest}>
                Skip Rest
              </button>
            )}
          </div>
        </div>

        {/* Red Player Panel */}
        <div
          className={`panel player-panel red ${
            isResting || isFinished ? "disabled-section" : ""
          }`}
        >
          <h2 style={{ color: "var(--primary-red)" }}>RED</h2>
          <div className="score-display">{matchState.red.score}</div>
          <div className="gamjeom-display">
            Gam-jeom: {matchState.red.gamJeom}
          </div>
          <div className="score-buttons">
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={`red-p-${p}`}
                onClick={() => changeScore("red", p)}
                disabled={isFinished || isResting}
              >
                +{p}
              </button>
            ))}
          </div>
          <button
            className="gamjeom-button"
            onClick={() => addGamJeom("red")}
            disabled={isFinished || isResting}
          >
            Gam-jeom
          </button>
        </div>

        {/* Footer Panel */}
        <footer className="panel footer-panel">
          <button
            className="btn-open-display"
            onClick={() =>
              window.open("/display", "_blank", "noopener,noreferrer")
            }
          >
            Open Display
          </button>
          <button
            className="btn-undo"
            onClick={undoLastAction}
            disabled={isResting}
          >
            Undo Action
          </button>
          <button className="btn-reset-match" onClick={resetMatch}>
            Reset Match
          </button>
        </footer>
      </div>

      {/* Overlays */}
      {isEditingTime && (
        <TimerEditor
          currentSeconds={matchState.timer}
          onSave={(newTime) => {
            setTimer(newTime);
            setIsEditingTime(false);
          }}
          onCancel={() => setIsEditingTime(false)}
          title={isResting ? "Edit Rest Time" : "Edit Match Time"}
        />
      )}
      {matchState.winner && (
        <h1 className="final-winner-text">WINNER: {matchState.winner}</h1>
      )}
      <div
        className={`notification ${matchState.notification.type} ${
          matchState.notification.visible ? "show" : ""
        }`}
      >
        {matchState.notification.message}
      </div>
    </>
  );
};

export default OperatorPage;
