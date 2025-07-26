import React, { useState, useEffect } from "react";
import "../styles/display.css";

import headIcon from "../assets/picture/head +3.png";
import bodyIcon from "../assets/picture/body +2.png";
import punchIcon from "../assets/picture/punch +1.png";
import techHeadIcon from "../assets/picture/head technical+2.png";
import techBodyIcon from "../assets/picture/body technical +2.png";

const pointTypes = {
  head: { icon: headIcon },
  body: { icon: bodyIcon },
  punch: { icon: punchIcon },
  technicalHead: { icon: techHeadIcon },
  technicalBody: { icon: techBodyIcon },
};

const PointsBreakdownDisplay = ({ breakdown }) => {
  const order = ["technicalHead", "technicalBody", "head", "body", "punch"];
  return (
    <div className="points-breakdown">
      {order.map((key) => {
        const count = breakdown[key];
        if (count > 0) {
          return (
            <div key={key} className="breakdown-item">
              <img
                src={pointTypes[key].icon}
                alt={key}
                className="breakdown-icon"
              />
              <span className="breakdown-counter">x{count}</span>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

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
        <div className="player-section blue">
          <div className="score-and-breakdown">
            <p className="score">{matchState.blue.score}</p>
            <PointsBreakdownDisplay
              breakdown={matchState.blue.pointsBreakdown}
            />
          </div>
          <p className="gam-jeom">GAM-JEOM: {matchState.blue.gamJeom}</p>
        </div>

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

        <div className="player-section red">
          <div className="score-and-breakdown">
            <p className="score">{matchState.red.score}</p>
            <PointsBreakdownDisplay
              breakdown={matchState.red.pointsBreakdown}
            />
          </div>
          <p className="gam-jeom">GAM-JEOM: {matchState.red.gamJeom}</p>
        </div>
      </div>
    </div>
  );
};

export default DisplayPage;
