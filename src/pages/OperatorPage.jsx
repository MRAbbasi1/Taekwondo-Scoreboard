import React, { useState, useEffect } from "react";
import { useMatch } from "../contexts/MatchContext";
import "../styles/operator.css";

// Timer Edit Component
const TimerEditor = ({ currentSeconds, onSave, onCancel }) => {
  const [minutes, setMinutes] = useState(Math.floor(currentSeconds / 60));
  const [seconds, setSeconds] = useState(currentSeconds % 60);

  const handleSave = () => {
    const totalSeconds = parseInt(minutes, 10) * 60 + parseInt(seconds, 10);
    onSave(totalSeconds);
  };

  return (
    <div className="timer-editor">
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
      <button onClick={handleSave} className="btn-save-time">
        Save
      </button>
      <button onClick={onCancel} className="btn-cancel-time">
        Cancel
      </button>
    </div>
  );
};

const OperatorPage = () => {
  const {
    matchState,
    changeScore,
    changeGamJeom,
    setTimer,
    toggleTimer,
    endRoundAndAwardWinner,
    resetMatch,
  } = useMatch();
  const [isEditingTime, setIsEditingTime] = useState(false);

  const FormattedTimer = ({ seconds }) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className="operator-panel">
        <h1>Taekwondo Scoreboard Controls</h1>
        {/* ... (Header and Main Controls remain the same) ... */}
        <h2 className="match-score-header">
          <span style={{ color: "#007bff" }}>BLUE</span>{" "}
          <span style={{ color: "#007bff", fontSize: "2.5rem" }}>
            {matchState.blue.roundWins}
          </span>
          {" - "}
          <span style={{ color: "#dc3545", fontSize: "2.5rem" }}>
            {matchState.red.roundWins}
          </span>{" "}
          <span style={{ color: "#dc3545" }}>RED</span>
        </h2>
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
            className={`btn-timer ${
              matchState.isTimerRunning ? "running" : "stopped"
            }`}
            onClick={toggleTimer}
            disabled={matchState.status === "FINISHED"}
          >
            {matchState.isTimerRunning ? "Stop Timer" : "Start Timer"}
          </button>
          <button
            className="btn-end-round"
            onClick={endRoundAndAwardWinner}
            disabled={matchState.status === "FINISHED"}
          >
            End Round & Award Winner
          </button>
          <button className="btn-reset-match" onClick={resetMatch}>
            Reset Full Match
          </button>
        </div>

        {matchState.winner && (
          <h1 className="final-winner-text">WINNER: {matchState.winner}</h1>
        )}
        <div className="control-section">
          {/* ... (Blue Player Controls remain the same, but use 'changeScore' and 'changeGamJeom') ... */}
          <div className="player-controls">
            <h2 style={{ color: "#007bff" }}>BLUE PLAYER</h2>
            <div className="status-display blue-op">
              <h3>Score: {matchState.blue.score}</h3>
              <div className="manual-edit">
                <button
                  onClick={() => changeScore("blue", -1)}
                  disabled={matchState.status === "FINISHED"}
                >
                  -
                </button>
                <span>Score</span>
                <button
                  onClick={() => changeScore("blue", 1)}
                  disabled={matchState.status === "FINISHED"}
                >
                  +
                </button>
              </div>
              <p>Gam-jeom: {matchState.blue.gamJeom}</p>
              <div className="manual-edit">
                <button
                  onClick={() => changeGamJeom("blue", -1)}
                  disabled={matchState.status === "FINISHED"}
                >
                  -
                </button>
                <span>Gam-jeom</span>
                <button
                  onClick={() => changeGamJeom("blue", 1)}
                  disabled={matchState.status === "FINISHED"}
                >
                  +
                </button>
              </div>
            </div>
            <div className="score-buttons">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={`blue-${p}`}
                  onClick={() => changeScore("blue", p)}
                  disabled={matchState.status === "FINISHED"}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Center Timer Display with Edit functionality */}
          <div className="player-controls">
            <h2>TIMER</h2>
            {isEditingTime ? (
              <TimerEditor
                currentSeconds={matchState.timer}
                onSave={(newTotalSeconds) => {
                  setTimer(newTotalSeconds);
                  setIsEditingTime(false);
                }}
                onCancel={() => setIsEditingTime(false)}
              />
            ) : (
              <>
                <div className="timer-display-op">
                  <FormattedTimer seconds={matchState.timer} />
                </div>
                <button
                  className="btn-edit-time"
                  onClick={() => setIsEditingTime(true)}
                  disabled={matchState.status === "FINISHED"}
                >
                  Edit Time
                </button>
              </>
            )}
          </div>

          {/* ... (Red Player Controls remain the same, but use 'changeScore' and 'changeGamJeom') ... */}
          <div className="player-controls">
            <h2 style={{ color: "#dc3545" }}>RED PLAYER</h2>
            <div className="status-display red-op">
              <h3>Score: {matchState.red.score}</h3>
              <div className="manual-edit">
                <button
                  onClick={() => changeScore("red", -1)}
                  disabled={matchState.status === "FINISHED"}
                >
                  -
                </button>
                <span>Score</span>
                <button
                  onClick={() => changeScore("red", 1)}
                  disabled={matchState.status === "FINISHED"}
                >
                  +
                </button>
              </div>
              <p>Gam-jeom: {matchState.red.gamJeom}</p>
              <div className="manual-edit">
                <button
                  onClick={() => changeGamJeom("red", -1)}
                  disabled={matchState.status === "FINISHED"}
                >
                  -
                </button>
                <span>Gam-jeom</span>
                <button
                  onClick={() => changeGamJeom("red", 1)}
                  disabled={matchState.status === "FINISHED"}
                >
                  +
                </button>
              </div>
            </div>
            <div className="score-buttons">
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={`red-${p}`}
                  onClick={() => changeScore("red", p)}
                  disabled={matchState.status === "FINISHED"}
                >
                  {p}
                </button>
              ))}
            </div>
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
