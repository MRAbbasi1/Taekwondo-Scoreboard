import React from "react";
import { useMatch } from "../contexts/MatchContext";
import "../styles/operator.css";

const OperatorPage = () => {
  const {
    matchState,
    addScore,
    addGamJeom,
    toggleTimer,
    endRoundAndAwardWinner,
    resetMatch,
  } = useMatch();

  const openDisplayWindow = () =>
    window.open("/display", "_blank", "noopener,noreferrer");

  const FormattedTimer = ({ seconds }) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="operator-panel">
      <h1>Taekwondo Scoreboard Controls</h1>
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
        <button className="btn-open" onClick={openDisplayWindow}>
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
        {/* Blue Player Controls */}
        <div className="player-controls">
          <h2 style={{ color: "#007bff" }}>BLUE PLAYER</h2>
          {/* ** NEW **: Added 'blue-op' class for styling */}
          <div className="status-display blue-op">
            <h3>Score: {matchState.blue.score}</h3>
            <p>Gam-jeom: {matchState.blue.gamJeom}</p>
          </div>
          <div className="score-buttons">
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                onClick={() => addScore("blue", p)}
                disabled={matchState.status === "FINISHED"}
              >
                {p}
              </button>
            ))}
          </div>
          {/* ** NEW **: Improved button text */}
          <button
            className="gamjeom-button"
            onClick={() => addGamJeom("blue")}
            disabled={matchState.status === "FINISHED"}
          >
            ⚠️ Gam-jeom
          </button>
        </div>

        {/* Center Timer Display */}
        <div className="player-controls">
          <h2>TIMER</h2>
          <div
            style={{ fontSize: "5rem", margin: "20px 0", fontWeight: "bold" }}
          >
            <FormattedTimer seconds={matchState.timer} />
          </div>
        </div>

        {/* Red Player Controls */}
        <div className="player-controls">
          <h2 style={{ color: "#dc3545" }}>RED PLAYER</h2>
          {/* ** NEW **: Added 'red-op' class for styling */}
          <div className="status-display red-op">
            <h3>Score: {matchState.red.score}</h3>
            <p>Gam-jeom: {matchState.red.gamJeom}</p>
          </div>
          <div className="score-buttons">
            {[1, 2, 3, 4, 5].map((p) => (
              <button
                key={p}
                onClick={() => addScore("red", p)}
                disabled={matchState.status === "FINISHED"}
              >
                {p}
              </button>
            ))}
          </div>
          {/* ** NEW **: Improved button text */}
          <button
            className="gamjeom-button"
            onClick={() => addGamJeom("red")}
            disabled={matchState.status === "FINISHED"}
          >
            ⚠️ Gam-jeom
          </button>
        </div>
      </div>
    </div>
  );
};

export default OperatorPage;
