import React, { useState } from "react";
import { useMatch } from "../contexts/MatchContext";
import "../styles/operator.css";

// کامپوننت ویرایشگر زمان (بدون تغییر)
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

// کامپوننت پیش‌نمایش صفحه دیسپلی
const DisplayPreview = ({ matchState }) => {
  const FormattedTimer = ({ milliseconds, isRestPeriod }) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;

    if (totalSeconds < 10 && !isRestPeriod && milliseconds > 0) {
      const ms = Math.floor((milliseconds % 1000) / 10)
        .toString()
        .padStart(2, "0");
      return `${minutes}:${secs.toString().padStart(2, "0")}:${ms}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (!matchState) {
    return (
      <div className="display-container">Waiting for operator signal...</div>
    );
  }

  return (
    <div className="display-container">
      <div className="score-board">
        {/* Blue Player */}
        <div className="player-section blue">
          <p className="score">{matchState.blue.score}</p>
          <p className="gam-jeom">GAM-JEOM: {matchState.blue.gamJeom}</p>
        </div>

        {/* Center Info */}
        <div className="center-section">
          <div className="match-score">
            <span className="label">MATCH</span>
            <span className="score-text">
              {matchState.blue.roundWins} - {matchState.red.roundWins}
            </span>
          </div>
          <div className="timer">
            <FormattedTimer
              milliseconds={matchState.timer}
              isRestPeriod={matchState.isRestPeriod}
            />
          </div>
          <div className="round-info">
            <span className="label">ROUND</span>
            <span className="round-number">{matchState.round}</span>
          </div>
        </div>

        {/* Red Player */}
        <div className="player-section red">
          <p className="score">{matchState.red.score}</p>
          <p className="gam-jeom">GAM-JEOM: {matchState.red.gamJeom}</p>
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

  const handleEditTimeClick = () => {
    if (matchState.isTimerRunning) toggleTimer();
    setIsEditingTime(true);
  };

  const OperatorFormattedTimer = ({ milliseconds }) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <>
      <div className="operator-layout-container">
        <main className="preview-panel">
          <DisplayPreview matchState={matchState} />
        </main>

        <aside className={`sidebar-panel ${isResting ? "resting" : ""}`}>
          <div className="round-display">ROUND: {matchState.round}</div>
          <div className="timer-display">
            <OperatorFormattedTimer milliseconds={matchState.timer} />
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
              disabled={isFinished || isResting || matchState.isTimerRunning}
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
        </aside>

        <footer className="controls-panel">
          <div className="player-controls-group blue">
            <h3>BLUE</h3>
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

          <div className="match-meta-controls">
            <div className="round-win-editors-container">
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
            </div>
            <div className="general-buttons-container">
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
                Undo
              </button>
              <button className="btn-reset-match" onClick={resetMatch}>
                Reset Match
              </button>
            </div>
          </div>

          <div className="player-controls-group red">
            <h3>RED</h3>
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
        </footer>
      </div>

      {/* Overlays */}
      {isEditingTime && (
        <TimerEditor
          currentSeconds={Math.round(matchState.timer / 1000)}
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
