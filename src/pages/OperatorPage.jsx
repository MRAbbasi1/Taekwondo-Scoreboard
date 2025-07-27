import React, { useState, useEffect, useMemo } from "react";
import { useMatch } from "../contexts/MatchContext";
import "../styles/operator.css";
import DisplayPage from "./DisplayPage"; // Import the new DisplayPage for preview

// NEW: Import libraries for country selection
import Select from "react-select";
import countryList from "react-select-country-list";

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
        <div className="modal-buttons">
          <button onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-save">
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const MatchInfoModal = ({ onSave, onCancel, currentInfo }) => {
  const [matchData, setMatchData] = useState({
    matchName: currentInfo.matchName,
    bluePlayerName: currentInfo.bluePlayerName,
    redPlayerName: currentInfo.redPlayerName,
    blueCountry: currentInfo.blueCountry,
    redCountry: currentInfo.redCountry,
  });

  // NEW: Get country options for the select dropdown
  const countryOptions = useMemo(() => countryList().getData(), []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setMatchData((prev) => ({ ...prev, [name]: value }));
  };

  // NEW: Handle country change from react-select
  const handleCountryChange = (player, selectedOption) => {
    setMatchData((prev) => ({ ...prev, [`${player}Country`]: selectedOption }));
  };

  const handleSave = () => {
    onSave(matchData);
  };

  // NEW: Custom styles for react-select to match the dark theme
  const customSelectStyles = {
    control: (provided) => ({
      ...provided,
      backgroundColor: "#1a1f25",
      borderColor: "#5a646c",
      color: "#e1e1e1",
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: "#2c343a",
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#0088ff"
        : state.isFocused
        ? "#4a545c"
        : "#2c343a",
      color: "#e1e1e1",
    }),
    singleValue: (provided) => ({
      ...provided,
      color: "#e1e1e1",
    }),
    input: (provided) => ({
      ...provided,
      color: "#e1e1e1",
    }),
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h4>Match Information</h4>
        <div className="modal-form">
          <div className="form-group">
            <label>Match Name</label>
            <input
              type="text"
              name="matchName"
              value={matchData.matchName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Blue Player Name</label>
            <input
              type="text"
              name="bluePlayerName"
              value={matchData.bluePlayerName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Blue Player Country</label>
            {/* UPDATED: Replaced <select> with <Select> from react-select */}
            <Select
              options={countryOptions}
              value={matchData.blueCountry}
              onChange={(option) => handleCountryChange("blue", option)}
              styles={customSelectStyles}
            />
          </div>
          <div className="form-group">
            <label>Red Player Name</label>
            <input
              type="text"
              name="redPlayerName"
              value={matchData.redPlayerName}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-group">
            <label>Red Player Country</label>
            {/* UPDATED: Replaced <select> with <Select> from react-select */}
            <Select
              options={countryOptions}
              value={matchData.redCountry}
              onChange={(option) => handleCountryChange("red", option)}
              styles={customSelectStyles}
            />
          </div>
        </div>
        <div className="modal-buttons">
          <button onClick={onCancel} className="btn-cancel">
            Cancel
          </button>
          <button onClick={handleSave} className="btn-save">
            Save
          </button>
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
        {(selectedBase === "body" || selectedBase === "head") && (
          <>
            <button
              className={selectedSub === "bodyTechnical" ? "selected" : ""}
              onClick={() => handleSubSelect("bodyTechnical")}
              disabled={disabled}
            >
              Body Technical
            </button>
            <button
              className={selectedSub === "headTechnical" ? "selected" : ""}
              onClick={() => handleSubSelect("headTechnical")}
              disabled={disabled}
            >
              Head Technical
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
    updateMatchInfo,
  } = useMatch();

  const [isEditingTime, setIsEditingTime] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
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
          <DisplayPage externalMatchState={matchState} />
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
                disabled={isFinished || !matchState.isMatchInfoSet}
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
                className="btn-match-info"
                onClick={() => setIsInfoModalOpen(true)}
              >
                Match Info
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
            <div className="video-check-controls">
              <button
                className={`video-check-btn blue ${
                  matchState.videoCheck === "blue" ? "active" : ""
                }`}
                onClick={() => handleVideoCheck("blue")}
                disabled={isControlDisabled}
              >
                Video Check BLUE
              </button>
              <button
                className={`video-check-btn red ${
                  matchState.videoCheck === "red" ? "active" : ""
                }`}
                onClick={() => handleVideoCheck("red")}
                disabled={isControlDisabled}
              >
                Video Check RED
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

      {isInfoModalOpen && (
        <MatchInfoModal
          currentInfo={matchState}
          onSave={(data) => {
            updateMatchInfo(data);
            setIsInfoModalOpen(false);
          }}
          onCancel={() => setIsInfoModalOpen(false)}
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
