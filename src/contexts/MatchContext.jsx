import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";

import startSoundSrc from "../assets/audio/B1.wav";
import scoreSoundSrc from "../assets/audio/B2.wav";
import tenSecondSoundSrc from "../assets/audio/B1.wav";
import endSoundSrc from "../assets/audio/time.wav";
import penaltySoundSrc from "../assets/audio/B1.wav";
import restCountdownSoundSrc from "../assets/audio/B1.wav";

const channel = new BroadcastChannel("taekwondo_scoreboard");
const MatchContext = createContext();

const initialPlayerState = {
  score: 0,
  gamJeom: 0,
  roundWins: 0,
  pointsBreakdown: {
    head: 0,
    body: 0,
    punch: 0,
    technicalHead: 0,
    technicalBody: 0,
    bodyKick: 0,
  },
  lastAction: null,
};

const calculateScore = (playerState) => {
  const { pointsBreakdown } = playerState;
  const breakdownScore =
    pointsBreakdown.head * 3 +
    pointsBreakdown.body * 2 +
    pointsBreakdown.punch * 1 +
    pointsBreakdown.technicalHead * 5 +
    pointsBreakdown.technicalBody * 4 -
    pointsBreakdown.bodyKick * 2;
  return breakdownScore;
};

const calculateOpponentGamJeomScore = (opponentState) => {
  return opponentState.gamJeom;
};

export const MatchProvider = ({ children }) => {
  const startSound = useRef(new Audio(startSoundSrc));
  const scoreSound = useRef(new Audio(scoreSoundSrc));
  const tenSecondSound = useRef(new Audio(tenSecondSoundSrc));
  const endSound = useRef(new Audio(endSoundSrc));
  const penaltySound = useRef(new Audio(penaltySoundSrc));
  const restCountdownSound = useRef(new Audio(restCountdownSoundSrc));

  const playSound = (audioRef) => {
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .catch((error) => console.error("Audio play failed:", error));
  };

  const initialState = {
    round: 1,
    timer: 120000,
    isTimerRunning: false,
    isRestPeriod: false,
    blue: { ...initialPlayerState, name: "BLUE" },
    red: { ...initialPlayerState, name: "RED" },
    status: "PRE_MATCH",
    winner: null,
    notification: { message: "", type: "info", visible: false },
  };

  const [matchState, _setMatchState] = useState(() => {
    const savedState = localStorage.getItem("matchState");
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        if (parsed.status && parsed.status !== "FINISHED") {
          return { ...initialState, ...parsed, isTimerRunning: false };
        }
      } catch (error) {
        console.error("Failed to parse state from localStorage", error);
      }
    }
    return initialState;
  });

  const history = useRef([matchState]);
  const notificationTimerRef = useRef(null);
  const timerRef = useRef(null);

  const setNotification = useCallback(
    (message, type = "info", duration = 4000) => {
      clearTimeout(notificationTimerRef.current);
      _setMatchState((prev) => ({
        ...prev,
        notification: { message, type, visible: true },
      }));
      notificationTimerRef.current = setTimeout(() => {
        _setMatchState((prev) => ({
          ...prev,
          notification: { ...prev.notification, visible: false },
        }));
      }, duration);
    },
    []
  );

  const _handleRoundEnd = useCallback(
    (prevState, roundWinner, winType) => {
      playSound(endSound);
      const newBlueWins =
        prevState.blue.roundWins + (roundWinner === "blue" ? 1 : 0);
      const newRedWins =
        prevState.red.roundWins + (roundWinner === "red" ? 1 : 0);
      let newStatus = "PAUSED";
      let finalWinner = null;
      let isNowResting = false;

      setNotification(
        `${roundWinner.toUpperCase()} wins Round ${
          prevState.round
        } by ${winType}!`,
        "success"
      );

      if (newBlueWins >= 2) {
        newStatus = "FINISHED";
        finalWinner = "BLUE";
      } else if (newRedWins >= 2) {
        newStatus = "FINISHED";
        finalWinner = "RED";
      }

      if (newStatus !== "FINISHED") {
        isNowResting = true;
      }

      return {
        ...prevState,
        round: newStatus === "FINISHED" ? prevState.round : prevState.round + 1,
        timer: isNowResting ? 60000 : 120000,
        isTimerRunning: false,
        status: newStatus,
        winner: finalWinner,
        isRestPeriod: isNowResting,
        blue: { ...initialPlayerState, name: "BLUE", roundWins: newBlueWins },
        red: { ...initialPlayerState, name: "RED", roundWins: newRedWins },
      };
    },
    [setNotification, endSound]
  );

  const setMatchState = (updater) => {
    _setMatchState((prev) => {
      if (prev.status === "FINISHED") return prev;

      const newState = typeof updater === "function" ? updater(prev) : updater;

      const blueScore =
        calculateScore(newState.blue) +
        calculateOpponentGamJeomScore(newState.red);
      const redScore =
        calculateScore(newState.red) +
        calculateOpponentGamJeomScore(newState.blue);

      let finalState = {
        ...newState,
        blue: { ...newState.blue, score: blueScore },
        red: { ...newState.red, score: redScore },
      };

      const canCheckPTG = finalState.isTimerRunning && !finalState.isRestPeriod;
      if (canCheckPTG && Math.abs(blueScore - redScore) >= 12) {
        const roundWinner = blueScore > redScore ? "blue" : "red";
        finalState = _handleRoundEnd(
          finalState,
          roundWinner,
          "Point Gap (PTG)"
        );
      }

      history.current.push(prev);
      if (history.current.length > 30) history.current.shift();

      return finalState;
    });
  };

  const endRoundAndAwardWinner = useCallback(() => {
    setMatchState((prev) => {
      if (prev.isTimerRunning) return prev;
      let roundWinner = "",
        winType = "";
      const { blue, red } = prev;

      if (blue.score > red.score) {
        roundWinner = "blue";
        winType = "Points (PTF)";
      } else if (red.score > blue.score) {
        roundWinner = "red";
        winType = "Points (PTF)";
      } else {
        const superiorityOrder = [
          "technicalHead",
          "technicalBody",
          "head",
          "body",
          "punch",
        ];
        for (const type of superiorityOrder) {
          if (blue.pointsBreakdown[type] > red.pointsBreakdown[type]) {
            roundWinner = "blue";
            winType = `Superiority (SUP)`;
            break;
          }
          if (red.pointsBreakdown[type] > blue.pointsBreakdown[type]) {
            roundWinner = "red";
            winType = `Superiority (SUP)`;
            break;
          }
        }
        if (!roundWinner && red.gamJeom > blue.gamJeom) {
          roundWinner = "blue";
          winType = "Fewer Gam-jeom (GAM)";
        } else if (!roundWinner && blue.gamJeom > red.gamJeom) {
          roundWinner = "red";
          winType = "Fewer Gam-jeom (GAM)";
        }
      }

      if (!roundWinner) {
        setNotification("Round is a Tie! No winner awarded.", "error");
        return { ...prev, isTimerRunning: false, status: "PAUSED" };
      }

      return _handleRoundEnd(prev, roundWinner, winType);
    });
  }, [_handleRoundEnd, setNotification]);

  const guardedAction = (action) => {
    if (matchState.status === "FINISHED") {
      setNotification(
        "Match is over. Please reset to start a new match.",
        "error"
      );
      return;
    }
    action();
  };

  const changeRoundWins = useCallback((player, amount) => {
    setMatchState((prev) => {
      const newRoundWins = Math.max(0, prev[player].roundWins + amount);
      return {
        ...prev,
        [player]: { ...prev[player], roundWins: newRoundWins },
      };
    });
  }, []);

  const handlePointAction = useCallback(
    (player, pointType, operation) => {
      guardedAction(() => {
        if (matchState.isRestPeriod) {
          setNotification("Cannot score during rest period.", "error");
          return;
        }
        playSound(scoreSound);
        setMatchState((prev) => {
          const currentBreakdown = { ...prev[player].pointsBreakdown };
          if (operation === "add") {
            currentBreakdown[pointType]++;
          } else if (
            operation === "remove" &&
            currentBreakdown[pointType] > 0
          ) {
            currentBreakdown[pointType]--;
          } else {
            setNotification(`No ${pointType} points to remove.`, "error");
            return prev;
          }
          return {
            ...prev,
            [player]: {
              ...prev[player],
              pointsBreakdown: currentBreakdown,
              lastAction: pointType,
            },
          };
        });
      });
    },
    [matchState.isRestPeriod, matchState.status, setNotification]
  );

  const handleBodyKick = useCallback(
    (player, operation) => {
      guardedAction(() => {
        if (matchState.isRestPeriod) {
          setNotification("Cannot score during rest period.", "error");
          return;
        }
        playSound(penaltySound);
        setMatchState((prev) => {
          const currentBreakdown = { ...prev[player].pointsBreakdown };
          if (operation === "add") {
            currentBreakdown.bodyKick++;
            setNotification("-2 points for body kick.", "error");
          } else if (operation === "remove" && currentBreakdown.bodyKick > 0) {
            currentBreakdown.bodyKick--;
            setNotification("Body kick deduction removed.", "info");
          } else {
            setNotification(`No body kick to remove.`, "error");
            return prev;
          }
          return {
            ...prev,
            [player]: {
              ...prev[player],
              pointsBreakdown: currentBreakdown,
              lastAction: "bodyKick",
            },
          };
        });
      });
    },
    [matchState.isRestPeriod, matchState.status, setNotification]
  );

  const applyTechnicalBonus = useCallback(
    (player, bonusType) => {
      guardedAction(() => {
        if (matchState.isRestPeriod) {
          setNotification("Cannot apply bonus during rest period.", "error");
          return;
        }
        setMatchState((prev) => {
          const basePointType = bonusType === "head" ? "head" : "body";
          const technicalPointType =
            bonusType === "head" ? "technicalHead" : "technicalBody";
          const currentBreakdown = { ...prev[player].pointsBreakdown };
          if (currentBreakdown[basePointType] > 0) {
            playSound(scoreSound);
            currentBreakdown[basePointType]--;
            currentBreakdown[technicalPointType]++;
            setNotification(`Technical ${bonusType} bonus applied!`, "success");
            return {
              ...prev,
              [player]: {
                ...prev[player],
                pointsBreakdown: currentBreakdown,
                lastAction: technicalPointType,
              },
            };
          } else {
            setNotification(
              `A regular +${
                basePointType === "head" ? 3 : 2
              } point must be registered first to apply this bonus.`,
              "error"
            );
            return prev;
          }
        });
      });
    },
    [matchState.isRestPeriod, matchState.status, setNotification]
  );

  const handleGamJeom = useCallback(
    (player, operation) => {
      guardedAction(() => {
        if (matchState.isRestPeriod) {
          setNotification("Cannot give penalty during rest period.", "error");
          return;
        }
        playSound(penaltySound);
        setMatchState((prev) => {
          const currentGamJeom = prev[player].gamJeom;
          let newPlayerGamJeom;
          if (operation === "add") {
            newPlayerGamJeom = currentGamJeom + 1;
            setNotification("+1 point to the opponent for Gam-jeom.", "info");
          } else if (operation === "remove") {
            if (currentGamJeom <= 0) {
              setNotification("No Gam-jeom to remove.", "error");
              return prev;
            }
            newPlayerGamJeom = currentGamJeom - 1;
            setNotification("Gam-jeom removed.", "info");
          } else {
            return prev;
          }
          return {
            ...prev,
            [player]: { ...prev[player], gamJeom: newPlayerGamJeom },
          };
        });
      });
    },
    [matchState.isRestPeriod, matchState.status, setNotification]
  );

  const undoLastAction = useCallback(() => {
    if (history.current.length > 1) {
      const prevState = history.current.pop();
      _setMatchState(prevState);
      setNotification("Last action undone.", "info", 2000);
    } else {
      setNotification("No more actions to undo.", "error", 2000);
    }
  }, [setNotification]);

  const toggleTimer = useCallback(() => {
    guardedAction(() => {
      if (!matchState.isTimerRunning && matchState.timer <= 0) {
        setNotification("Timer is at 00:00. Please edit time.", "error");
        return;
      }
      _setMatchState((prev) => ({
        ...prev,
        isTimerRunning: !prev.isTimerRunning,
      }));
    });
  }, [matchState.status, matchState.timer, setNotification]);

  const setTimer = useCallback(
    (seconds) => {
      guardedAction(() => {
        if (!isNaN(seconds) && seconds >= 0)
          setMatchState((prev) => ({ ...prev, timer: seconds * 1000 }));
      });
    },
    [matchState.status]
  );

  const startRest = useCallback(() => {
    guardedAction(() => {
      setMatchState((prev) => ({
        ...prev,
        isRestPeriod: true,
        timer: 60000,
        isTimerRunning: false,
      }));
    });
  }, [matchState.status]);

  const skipRest = useCallback(() => {
    _setMatchState((prev) => ({
      ...prev,
      isRestPeriod: false,
      timer: 120000,
      isTimerRunning: false,
    }));
    setNotification(
      `Rest skipped. Round ${matchState.round} is ready.`,
      "info"
    );
  }, [matchState.round, setNotification]);

  const resetMatch = useCallback(() => {
    setNotification("Match has been reset.", "info");
    localStorage.removeItem("matchState");
    _setMatchState(initialState);
    history.current = [initialState];
  }, [setNotification, initialState]);

  useEffect(() => {
    localStorage.setItem("matchState", JSON.stringify(matchState));
    channel.postMessage(matchState);
  }, [matchState]);

  useEffect(() => {
    if (matchState.isTimerRunning) {
      const isFastMode = matchState.timer <= 10000 && !matchState.isRestPeriod;
      const intervalRate = isFastMode ? 47 : 250;
      timerRef.current = setInterval(() => {
        _setMatchState((prev) => {
          if (!prev.isTimerRunning || prev.timer <= 0) return prev;
          const newTimer = Math.max(0, prev.timer - intervalRate);
          if (!prev.isRestPeriod && prev.timer > 10000 && newTimer <= 10000) {
            playSound(tenSecondSound);
          }
          if (prev.isRestPeriod && prev.timer > 0) {
            const previousSecond = Math.ceil(prev.timer / 1000);
            const currentSecond = Math.ceil(newTimer / 1000);
            if (currentSecond < previousSecond && currentSecond <= 5) {
              playSound(restCountdownSound);
            }
          }
          return { ...prev, timer: newTimer };
        });
      }, intervalRate);
    }
    return () => clearInterval(timerRef.current);
  }, [matchState.isTimerRunning, matchState.timer, matchState.isRestPeriod]);

  useEffect(() => {
    if (matchState.timer <= 0 && matchState.isTimerRunning) {
      _setMatchState((prev) => ({ ...prev, isTimerRunning: false }));
      if (matchState.isRestPeriod) {
        setNotification(
          `Rest period over. Round ${matchState.round} is ready.`,
          "info"
        );
        _setMatchState((prev) => ({
          ...prev,
          isRestPeriod: false,
          timer: 120000,
        }));
      } else {
        endRoundAndAwardWinner();
      }
    }
  }, [
    matchState.timer,
    matchState.isTimerRunning,
    matchState.isRestPeriod,
    matchState.round,
    endRoundAndAwardWinner,
    setNotification,
  ]);

  const value = {
    matchState,
    setNotification,
    handlePointAction,
    applyTechnicalBonus,
    handleGamJeom,
    handleBodyKick,
    setTimer,
    toggleTimer,
    endRoundAndAwardWinner,
    resetMatch,
    undoLastAction,
    changeRoundWins,
    startRest,
    skipRest,
  };

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);
