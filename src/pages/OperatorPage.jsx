import React, { useState } from "react";
import { useMatch } from "../contexts/MatchContext";
import "../styles/operator.css";

const TimerEditor = ({
  currentSeconds,
  onSave,
  onCancel,
  title = "Edit Time",
}) => {
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
    if (isFinished) {
      setTimer(0);
      return;
    }
    if (matchState.isTimerRunning) {
      toggleTimer();
    }
    setIsEditingTime(true);
  };

  const handleStartRest = () => {
    startRest();
    setIsEditingTime(true);
  };

  const handleSkipRest = () => {
    setIsEditingTime(false); // Close editor if it's open
    skipRest();
  };

  return (
    <>
      <div className="operator-panel">
        <h1>Taekwondo Scoreboard Controls</h1>
        <div className="match-score-header">
          <div className="round-win-editor">
            <button
              onClick={() => changeRoundWins("blue", -1)}
              disabled={isFinished || isResting}
            >
              -
            </button>
            <span style={{ color: "#007bff" }}>BLUE</span>
            <span
              style={{ color: "#007bff", fontSize: "2.5rem", width: "40px" }}
            >
              {matchState.blue.roundWins}
            </span>
            <button
              onClick={() => changeRoundWins("blue", 1)}
              disabled={isFinished || isResting}
            >
              +
            </button>
          </div>
          <span style={{ fontSize: "2.5rem" }}>-</span>
          <div className="round-win-editor">
            <button
              onClick={() => changeRoundWins("red", -1)}
              disabled={isFinished || isResting}
            >
              -
            </button>
            <span style={{ color: "#dc3545" }}>RED</span>
            <span
              style={{ color: "#dc3545", fontSize: "2.5rem", width: "40px" }}
            >
              {matchState.red.roundWins}
            </span>
            <button
              onClick={() => changeRoundWins("red", 1)}
              disabled={isFinished || isResting}
            >
              +
            </button>
          </div>
        </div>

        <div className="main-controls">
          <button
            className="btn-open"
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
            Undo
          </button>
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
            onClick={handleStartRest}
            disabled={isFinished || matchState.isTimerRunning}
          >
            Manual Rest
          </button>
          {isResting && (
            <button className="btn-skip-rest" onClick={handleSkipRest}>
              Skip Rest
            </button>
          )}
          <button className="btn-reset-match" onClick={resetMatch}>
            Reset Match
          </button>
        </div>

        {matchState.winner && (
          <h1 className="final-winner-text">WINNER: {matchState.winner}</h1>
        )}

        <div
          className={`control-section ${isResting ? "disabled-section" : ""}`}
        >
          <div className="player-controls">
            <h2 style={{ color: "#007bff" }}>BLUE PLAYER</h2>
            <div className="status-display blue-op">
              <h3>Score: {matchState.blue.score}</h3>
              <p>Gam-jeom: {matchState.blue.gamJeom}</p>
            </div>
            <div className="score-buttons">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={`blue-${p}`}
                  onClick={() => changeScore("blue", p)}
                  disabled={isFinished}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              className="gamjeom-button"
              onClick={() => addGamJeom("blue")}
              disabled={isFinished}
            >
              ⚠️ Gam-jeom
            </button>
          </div>

          <div className="player-controls">
            <h2>{isResting ? "REST TIME" : "TIMER & ROUND"}</h2>
            {isEditingTime ? (
              <TimerEditor
                currentSeconds={matchState.timer}
                onSave={(newTotalSeconds) => {
                  setTimer(newTotalSeconds);
                  setIsEditingTime(false);
                }}
                onCancel={() => setIsEditingTime(false)}
                title={isResting ? "Edit Rest Time" : "Edit Match Time"}
              />
            ) : (
              <>
                <div
                  className={`timer-display-op ${
                    isResting ? "rest-timer-display" : ""
                  }`}
                >
                  <FormattedTimer seconds={matchState.timer} />
                </div>
                <button
                  className="btn-edit-time"
                  onClick={handleEditTimeClick}
                  disabled={isFinished}
                >
                  Edit Time
                </button>
              </>
            )}
            <div className="round-display">ROUND: {matchState.round}</div>
          </div>

          <div className="player-controls">
            <h2 style={{ color: "#dc3545" }}>RED PLAYER</h2>
            <div className="status-display red-op">
              <h3>Score: {matchState.red.score}</h3>
              <p>Gam-jeom: {matchState.red.gamJeom}</p>
            </div>
            <div className="score-buttons">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={`red-${p}`}
                  onClick={() => changeScore("red", p)}
                  disabled={isFinished}
                >
                  {p}
                </button>
              ))}
            </div>
            <button
              className="gamjeom-button"
              onClick={() => addGamJeom("red")}
              disabled={isFinished}
            >
              ⚠️ Gam-jeom
            </button>
          </div>
        </div>
      </div>

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
