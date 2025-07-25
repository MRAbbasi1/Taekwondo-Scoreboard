import React, { useState, useEffect } from "react";
import "../styles/display.css";

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

const DisplayPage = () => {
  const [matchState, setMatchState] = useState(() => {
    const savedState = localStorage.getItem("matchState");
    return savedState ? JSON.parse(savedState) : null;
  });

  useEffect(() => {
    const channel = new BroadcastChannel("taekwondo_scoreboard");

    channel.onmessage = (event) => {
      setMatchState(event.data);
    };

    const handleStorageChange = (e) => {
      if (e.key === "matchState") {
        setMatchState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      channel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

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

export default DisplayPage;
