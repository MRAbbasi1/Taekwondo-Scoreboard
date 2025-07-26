import React, { useState } from "react";
import { useMatch } from "../contexts/MatchContext";
import "../styles/operator.css";
import headIcon from "../assets/picture/head +3.png";
import bodyIcon from "../assets/picture/body +2.png";
import punchIcon from "../assets/picture/punch +1.png";
import techHeadIcon from "../assets/picture/head technical+2.png";
import techBodyIcon from "../assets/picture/body technical +2.png";
import videoCheckIcon from "../assets/picture/video-check.svg";

const pointTypes = {
  head: { value: 3, icon: headIcon },
  body: { value: 2, icon: bodyIcon },
  punch: { value: 1, icon: punchIcon },
  technicalHead: { value: 5, icon: techHeadIcon },
  technicalBody: { value: 4, icon: techBodyIcon },
};

const PointsBreakdownDisplay = ({ breakdown }) => {
  const order = ["technicalHead", "technicalBody", "head", "body", "punch"];
  return (
    <div
      className="points-breakdown"
      style={{
        flexDirection: "row",
        position: "static",
        gap: "10px",
        marginTop: "-20px",
        marginBottom: "20px",
      }}
    >
      {order.map((key) => {
        const count = breakdown[key];
        if (count > 0) {
          return (
            <div
              key={key}
              className="breakdown-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "rgba(0,0,0,0.4)",
                padding: "4px 8px",
                borderRadius: "6px",
              }}
            >
              <img
                src={pointTypes[key].icon}
                alt={key}
                className="breakdown-icon"
                style={{ height: "30px", width: "30px" }}
              />
              <span
                className="breakdown-counter"
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  color: "#fff",
                }}
              >
                x{count}
              </span>
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};

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
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100%",
          color: "white",
        }}
      >
        Waiting for operator signal...
      </div>
    );
  }
  return (
    <div style={{ fontFamily: "Arial, sans-serif", height: "100%" }}>
      <div style={{ display: "flex", width: "100%", height: "100%" }}>
        <div
          style={{
            flex: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px",
            background: "linear-gradient(to bottom, #0000ff, #00003a)",
          }}
        >
          <p
            style={{
              fontSize: "clamp(4rem, 20vw, 12rem)",
              color: "white",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {matchState.blue.score}
          </p>
          <PointsBreakdownDisplay breakdown={matchState.blue.pointsBreakdown} />
          {matchState.videoCheck === "blue" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                marginBottom: "10px",
              }}
            >
              <img
                src={videoCheckIcon}
                alt="Video Check"
                style={{ height: "40px" }}
              />
              <div className="blinking-light"></div>
            </div>
          )}
          <p style={{ fontSize: "1.5rem", color: "white" }}>
            GAM-JEOM: {matchState.blue.gamJeom}
          </p>
        </div>
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-around",
            alignItems: "center",
            background: "#000",
            color: "white",
            textAlign: "center",
          }}
        >
          <div>
            <span style={{ fontSize: "1.2rem" }}>MATCH</span>
            <span style={{ display: "block", fontSize: "3rem" }}>
              {matchState.blue.roundWins} - {matchState.red.roundWins}
            </span>
          </div>
          <div
            style={{
              width: "100%",
              fontSize: "clamp(2rem, 10vw, 4rem)",
              background: "yellow",
              color: "black",
              padding: "10px 0",
            }}
          >
            <FormattedTimer
              milliseconds={matchState.timer}
              isRestPeriod={matchState.isRestPeriod}
            />
          </div>
          <div>
            <span style={{ fontSize: "1.2rem" }}>ROUND</span>
            <span style={{ display: "block", fontSize: "2.5rem" }}>
              {matchState.round}
            </span>
          </div>
        </div>
        <div
          style={{
            flex: 2,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "10px",
            background: "linear-gradient(to bottom, #ff0000, #470000)",
          }}
        >
          <p
            style={{
              fontSize: "clamp(4rem, 20vw, 12rem)",
              color: "white",
              margin: 0,
              lineHeight: 1,
            }}
          >
            {matchState.red.score}
          </p>
          <PointsBreakdownDisplay breakdown={matchState.red.pointsBreakdown} />
          {matchState.videoCheck === "red" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "15px",
                marginBottom: "10px",
              }}
            >
              <img
                src={videoCheckIcon}
                alt="Video Check"
                style={{ height: "40px" }}
              />
              <div className="blinking-light"></div>
            </div>
          )}
          <p style={{ fontSize: "1.5rem", color: "white" }}>
            GAM-JEOM: {matchState.red.gamJeom}
          </p>
        </div>
      </div>
    </div>
  );
};

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
    onSave((parseInt(minutes, 10) || 0) * 60 + (parseInt(seconds, 10) || 0));
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
            style={{ width: "120px", fontSize: "5rem", textAlign: "center" }}
          />
          <span>:</span>
          <input
            type="number"
            value={seconds}
            onChange={(e) => setSeconds(e.target.value)}
            min="0"
            max="59"
            style={{ width: "120px", fontSize: "5rem", textAlign: "center" }}
          />
        </div>
        <div className="timer-editor-buttons">
          <button onClick={handleSave}>Save</button>
          <button onClick={onCancel}>Cancel</button>
        </div>
      </div>
    </div>
  );
};

const PlayerActionControls = ({
  player,
  onScoreAction,
  onGamJeomAction,
  disabled,
}) => {
  const colorClass = player === "blue" ? "blue-text" : "red-text";

  return (
    <div className="player-action-controls">
      <h3 className={colorClass}>{player.toUpperCase()}</h3>
      <div className="action-group">
        <button
          className="action-button"
          onClick={() => onScoreAction(player, "remove")}
          disabled={disabled}
        >
          -
        </button>
        <span className={`action-label ${colorClass}`}>SCORE</span>
        <button
          className="action-button"
          onClick={() => onScoreAction(player, "add")}
          disabled={disabled}
        >
          +
        </button>
      </div>
      <div className="action-group">
        <button
          className="action-button"
          onClick={() => onGamJeomAction(player, "remove")}
          disabled={disabled}
        >
          -
        </button>
        <span className={`action-label ${colorClass}`}>GAM JUM</span>
        <button
          className="action-button"
          onClick={() => onGamJeomAction(player, "add")}
          disabled={disabled}
        >
          +
        </button>
      </div>
    </div>
  );
};

const CentralPointSelection = ({
  selectedBase,
  setSelectedBase,
  selectedSub,
  setSelectedSub,
  disabled,
  onVideoCheck,
  videoCheckPlayer,
}) => {
  const handleBaseSelect = (base) => {
    if (selectedBase === base) {
      setSelectedBase(null);
      setSelectedSub(null);
    } else {
      setSelectedBase(base);
      setSelectedSub(null);
    }
  };

  const handleSubSelect = (sub) => {
    if (selectedSub === sub) {
      setSelectedSub(null);
    } else {
      setSelectedSub(sub);
    }
  };

  return (
    <div className="central-point-selection">
      <div className="base-point-selectors">
        <button
          className={selectedBase === "punch" ? "selected" : ""}
          onClick={() => handleBaseSelect("punch")}
          disabled={disabled}
        >
          1
        </button>
        <button
          className={selectedBase === "body" ? "selected" : ""}
          onClick={() => handleBaseSelect("body")}
          disabled={disabled}
        >
          2
        </button>
        <button
          className={selectedBase === "head" ? "selected" : ""}
          onClick={() => handleBaseSelect("head")}
          disabled={disabled}
        >
          3
        </button>
      </div>
      <div className="sub-point-selectors">
        {selectedBase === "body" && (
          <>
            <button
              className={selectedSub === "headTechnical" ? "selected" : ""}
              onClick={() => handleSubSelect("headTechnical")}
              disabled={disabled}
            >
              Head Technical
            </button>
            <button
              className={selectedSub === "bodyTechnical" ? "selected" : ""}
              onClick={() => handleSubSelect("bodyTechnical")}
              disabled={disabled}
            >
              Body Technical
            </button>
            <button
              className={selectedSub === "bodyKick" ? "selected" : ""}
              onClick={() => handleSubSelect("bodyKick")}
              disabled={disabled}
            >
              Body Kick
            </button>
          </>
        )}
      </div>
      <div className="video-check-controls">
        <button
          className={`video-check-btn blue ${
            videoCheckPlayer === "blue" ? "active" : ""
          }`}
          onClick={() => onVideoCheck("blue")}
          disabled={disabled}
        >
          Video Check BLUE
        </button>
        <button
          className={`video-check-btn red ${
            videoCheckPlayer === "red" ? "active" : ""
          }`}
          onClick={() => onVideoCheck("red")}
          disabled={disabled}
        >
          Video Check RED
        </button>
      </div>
    </div>
  );
};

const OperatorPage = () => {
  const {
    matchState,
    setNotification,
    handlePointAction,
    applyTechnicalBonus,
    handleBodyKick,
    handleGamJeom,
    setTimer,
    toggleTimer,
    endRoundAndAwardWinner,
    resetMatch,
    undoLastAction,
    changeRoundWins,
    startRest,
    skipRest,
    handleVideoCheck,
  } = useMatch();

  const [isEditingTime, setIsEditingTime] = useState(false);
  const [selectedBase, setSelectedBase] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);

  const isFinished = matchState.status === "FINISHED";
  const isResting = matchState.isRestPeriod;
  const isControlDisabled = isFinished || isResting;

  const handleScoreAction = (player, operation) => {
    if (!selectedBase) {
      setNotification(
        "Please select a base point type (1, 2, 3) first.",
        "error"
      );
      return;
    }

    let actionTaken = false;

    if (selectedSub) {
      switch (selectedSub) {
        case "headTechnical":
          if (operation === "add") {
            applyTechnicalBonus(player, "head");
            actionTaken = true;
          } else {
            setNotification(
              "This action is not valid for subtraction.",
              "error"
            );
          }
          break;
        case "bodyTechnical":
          if (operation === "add") {
            applyTechnicalBonus(player, "body");
            actionTaken = true;
          } else {
            setNotification(
              "This action is not valid for subtraction.",
              "error"
            );
          }
          break;
        case "bodyKick":
          handleBodyKick(player, operation);
          actionTaken = true;
          break;
        default:
          break;
      }
    } else {
      handlePointAction(player, selectedBase, operation);
      actionTaken = true;
    }

    if (actionTaken) {
      setSelectedBase(null);
      setSelectedSub(null);
    }
  };

  const handleEditTimeClick = () => {
    if (matchState.isTimerRunning) toggleTimer();
    setIsEditingTime(true);
  };
  const OperatorFormattedTimer = ({ milliseconds }) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    return `${Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0")}:${(totalSeconds % 60).toString().padStart(2, "0")}`;
  };

  return (
    <>
      <div className="operator-layout-container">
        <main className="preview-panel">
          <DisplayPreview matchState={matchState} />
        </main>

        <aside className={`sidebar-panel ${isResting ? "resting" : ""}`}>
          <div className="top-sidebar">
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
          </div>
          <div className="bottom-sidebar">
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
            </div>
          </div>
        </aside>

        <footer className="controls-panel">
          <PlayerActionControls
            player="blue"
            onScoreAction={handleScoreAction}
            onGamJeomAction={handleGamJeom}
            disabled={isControlDisabled && !matchState.videoCheck}
          />
          <CentralPointSelection
            selectedBase={selectedBase}
            setSelectedBase={setSelectedBase}
            selectedSub={selectedSub}
            setSelectedSub={setSelectedSub}
            disabled={isControlDisabled && !matchState.videoCheck}
            onVideoCheck={handleVideoCheck}
            videoCheckPlayer={matchState.videoCheck}
          />
          <PlayerActionControls
            player="red"
            onScoreAction={handleScoreAction}
            onGamJeomAction={handleGamJeom}
            disabled={isControlDisabled && !matchState.videoCheck}
          />
        </footer>
      </div>

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
        <h1
          className={`final-winner-text winner-${matchState.winner.toLowerCase()}`}
        >
          WINNER: {matchState.winner}
        </h1>
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
