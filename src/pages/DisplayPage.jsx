import React, { useState, useEffect } from "react";
import "../styles/display.css";

// NEW: Import the flag component
import ReactCountryFlag from "react-country-flag";

// Import images from the specified asset path
import worldTaekwondoLogo from "../assets/picture/world-taekwondo-federation.png";
import daedoLogo from "../assets/picture/DAEDO_logo.png";
import headPointsBg from "../assets/picture/head-points.png";
import bodyPointsBg from "../assets/picture/body-points.png";
import videoCheckIcon from "../assets/picture/video-check.svg";

// Point icons
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
    <div className="points-icons-container">
      {order.map((key) => (
        <div key={key} className="points-icon-item">
          <span className="points-icon-counter">x{breakdown[key] || 0}</span>
          <img
            src={pointTypes[key].icon}
            alt={key}
            className="points-icon-img"
          />
        </div>
      ))}
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
    return `${minutes.toString().padStart(2, "0")} : ${secs
      .toString()
      .padStart(2, "0")} : ${ms}`;
  }

  return `${minutes.toString().padStart(2, "0")} : ${secs
    .toString()
    .padStart(2, "0")}`;
};

const DisplayPage = ({ externalMatchState }) => {
  const [matchState, setMatchState] = useState(externalMatchState || null);

  useEffect(() => {
    // If used as a standalone page, listen for broadcast updates
    if (!externalMatchState) {
      const channel = new BroadcastChannel("taekwondo_scoreboard");
      channel.onmessage = (event) => {
        setMatchState(event.data);
      };

      // Initial load from localStorage
      try {
        const savedState = localStorage.getItem("matchState");
        if (savedState) setMatchState(JSON.parse(savedState));
      } catch (e) {
        console.error("Could not parse matchState from localStorage", e);
      }

      return () => channel.close();
    } else {
      // If used as a component (preview), update with props
      setMatchState(externalMatchState);
    }
  }, [externalMatchState]);

  if (!matchState) {
    return <div className="display-page">Waiting for operator signal...</div>;
  }

  const { blue, red } = matchState;

  return (
    <div className="display-page">
      <header className="header">
        <div className="header-logos">
          <img src={worldTaekwondoLogo} alt="World Taekwondo Federation" />
          <img src={daedoLogo} alt="Daedo International" />
        </div>
        <div className="match-name">{matchState.matchName}</div>
        <div className="hit-counters">
          <div className="hit-counter">
            <img src={headPointsBg} alt="Head Hits" />
            <div className="hit-counter-number">{matchState.totalHeadHits}</div>
          </div>
          <div className="hit-counter">
            <img src={bodyPointsBg} alt="Body Hits" />
            <div className="hit-counter-number">{matchState.totalBodyHits}</div>
          </div>
        </div>
      </header>

      <main className="body-container">
        {/* Blue Player Section */}
        <div className="player-body-background blue-body-background">
          <div className="flags-and-names">
            {/* UPDATED: Restructured for correct layout */}
            <div className="player-identity">
              {matchState.blueCountry.value && (
                <ReactCountryFlag
                  countryCode={matchState.blueCountry.value}
                  svg
                  className="player-flag"
                  alt={matchState.blueCountry.label}
                />
              )}
              <span className="player-country-code">
                {matchState.blueCountry.value}
              </span>
            </div>
            <span className="player-name">{matchState.bluePlayerName}</span>
          </div>
          <div className="main-content">
            <PointsBreakdownDisplay breakdown={blue.pointsBreakdown} />
            <div className="player-match-points">
              <div className="player-point-background blue-point-background"></div>
              <div className="player-game-point">{blue.score}</div>
              <div className="player-video-check">
                {matchState.videoCheck === "blue" && (
                  <img src={videoCheckIcon} alt="Video Check Blue" />
                )}
              </div>
            </div>
          </div>
          <div className="gam-jeom-container">
            <div className="gam-jeom-number">
              GAM-JEOM
              <br />
              {blue.gamJeom}
            </div>
          </div>
        </div>

        {/* Center Column */}
        <div className="center-column-display">
          <div className="match-round-points">
            MATCH
            <br />
            {blue.roundWins} - {red.roundWins}
          </div>
          <div className="timer-background">
            <FormattedTimer
              milliseconds={matchState.timer}
              isRestPeriod={matchState.isRestPeriod}
            />
          </div>
          <div className="round-number-display">
            ROUND
            <br />
            {matchState.round}
          </div>
        </div>

        {/* Red Player Section */}
        <div className="player-body-background red-body-background">
          <div className="flags-and-names">
            {/* UPDATED: Restructured for correct layout (order swapped) */}
            <span className="player-name">{matchState.redPlayerName}</span>
            <div className="player-identity">
              {matchState.redCountry.value && (
                <ReactCountryFlag
                  countryCode={matchState.redCountry.value}
                  svg
                  className="player-flag"
                  alt={matchState.redCountry.label}
                />
              )}
              <span className="player-country-code">
                {matchState.redCountry.value}
              </span>
            </div>
          </div>
          <div className="main-content">
            <div className="player-match-points">
              <div className="player-point-background red-point-background"></div>
              <div className="player-game-point">{red.score}</div>
              <div className="player-video-check">
                {matchState.videoCheck === "red" && (
                  <img src={videoCheckIcon} alt="Video Check Red" />
                )}
              </div>
            </div>
            <PointsBreakdownDisplay breakdown={red.pointsBreakdown} />
          </div>
          <div className="gam-jeom-container">
            <div className="gam-jeom-number">
              GAM-JEOM
              <br />
              {red.gamJeom}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default DisplayPage;
