import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";

// وارد کردن فایل‌های صوتی جدید
import startSoundSrc from "../assets/audio/B1.wav";
import scoreSoundSrc from "../assets/audio/B2.wav";
import penaltySoundSrc from "../assets/audio/B2.wav";
import endSoundSrc from "../assets/audio/time.wav";
import restCountdownSoundSrc from "../assets/audio/B2.wav";

const channel = new BroadcastChannel("taekwondo_scoreboard");
const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  // ساختن آبجکت‌های Audio
  const startSound = useRef(new Audio(startSoundSrc));
  const scoreSound = useRef(new Audio(scoreSoundSrc));
  const penaltySound = useRef(new Audio(penaltySoundSrc));
  const endSound = useRef(new Audio(endSoundSrc));
  const restCountdownSound = useRef(new Audio(restCountdownSoundSrc));

  const playSound = (audioRef) => {
    audioRef.current.currentTime = 0;
    audioRef.current
      .play()
      .catch((error) => console.error("Audio play failed:", error));
  };

  const initialState = {
    round: 1,
    timer: 120,
    isTimerRunning: false,
    restTimer: 60,
    isRestTimerRunning: false,
    isRestPeriod: false,
    blue: {
      name: "BLUE",
      score: 0,
      gamJeom: 0,
      roundWins: 0,
      pointsBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    },
    red: {
      name: "RED",
      score: 0,
      gamJeom: 0,
      roundWins: 0,
      pointsBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    },
    status: "PRE_MATCH",
    winner: null,
    notification: { message: "", type: "info", visible: false },
  };

  const [matchState, _setMatchState] = useState(() => {
    const savedState = localStorage.getItem("matchState");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.blue && parsed.blue.pointsBreakdown)
        return {
          ...initialState,
          ...parsed,
          isTimerRunning: false,
          isRestTimerRunning: false,
        };
    }
    return initialState;
  });

  const history = useRef([matchState]);
  const notificationTimerRef = useRef(null);
  const timerRef = useRef(null);
  const restTimerRef = useRef(null);

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

  const _handleRoundEnd = useCallback((prevState, roundWinner) => {
    const newBlueWins =
      prevState.blue.roundWins + (roundWinner === "blue" ? 1 : 0);
    const newRedWins =
      prevState.red.roundWins + (roundWinner === "red" ? 1 : 0);
    let newStatus = "PAUSED";
    let finalWinner = null;
    let isNowResting = false;

    if (newBlueWins >= 2) {
      newStatus = "FINISHED";
      finalWinner = "BLUE";
    }
    if (newRedWins >= 2) {
      newStatus = "FINISHED";
      finalWinner = "RED";
    }

    if (newStatus !== "FINISHED") {
      isNowResting = true;
    }

    return {
      ...prevState,
      round: newStatus === "FINISHED" ? prevState.round : prevState.round + 1,
      timer: 120,
      isTimerRunning: false,
      status: newStatus,
      winner: finalWinner,
      isRestPeriod: isNowResting,
      blue: {
        ...prevState.blue,
        roundWins: newBlueWins,
        score: newStatus !== "FINISHED" ? 0 : prevState.blue.score,
        gamJeom: newStatus !== "FINISHED" ? 0 : prevState.blue.gamJeom,
        pointsBreakdown:
          newStatus !== "FINISHED"
            ? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            : prevState.blue.pointsBreakdown,
      },
      red: {
        ...prevState.red,
        roundWins: newRedWins,
        score: newStatus !== "FINISHED" ? 0 : prevState.red.score,
        gamJeom: newStatus !== "FINISHED" ? 0 : prevState.red.gamJeom,
        pointsBreakdown:
          newStatus !== "FINISHED"
            ? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
            : prevState.red.pointsBreakdown,
      },
    };
  }, []);

  const setMatchStateWithHistory = useCallback((updater) => {
    _setMatchState((currentState) => {
      history.current.push(currentState);
      if (history.current.length > 30) history.current.shift();
      return typeof updater === "function" ? updater(currentState) : updater;
    });
  }, []);

  const endRoundAndAwardWinner = useCallback(() => {
    playSound(endSound);
    clearInterval(timerRef.current);
    setMatchStateWithHistory((prev) => {
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
        const pointValues = [5, 4, 3, 2, 1];
        for (const value of pointValues) {
          if (blue.pointsBreakdown[value] > red.pointsBreakdown[value]) {
            roundWinner = "blue";
            winType = `Superiority (SUP)`;
            break;
          }
          if (red.pointsBreakdown[value] > blue.pointsBreakdown[value]) {
            roundWinner = "red";
            winType = `Superiority (SUP)`;
            break;
          }
        }
      }
      if (!roundWinner) {
        setNotification("Round is a Tie! No winner awarded.", "error");
        return { ...prev, isTimerRunning: false, status: "PAUSED" };
      }
      setNotification(
        `${roundWinner.toUpperCase()} wins Round ${prev.round} by ${winType}!`,
        "success"
      );
      return _handleRoundEnd(prev, roundWinner);
    });
  }, [setNotification, setMatchStateWithHistory, _handleRoundEnd]);

  useEffect(() => {
    localStorage.setItem("matchState", JSON.stringify(matchState));
    channel.postMessage(matchState);
  }, [matchState]);

  useEffect(() => {
    clearInterval(timerRef.current);
    if (matchState.isTimerRunning && matchState.timer > 0) {
      timerRef.current = setInterval(() => {
        _setMatchState((prev) => ({ ...prev, timer: prev.timer - 1 }));
      }, 1000);
    } else if (matchState.timer <= 0 && matchState.isTimerRunning) {
      playSound(endSound);
      endRoundAndAwardWinner();
    }
  }, [matchState.isTimerRunning, matchState.timer, endRoundAndAwardWinner]);

  useEffect(() => {
    clearInterval(restTimerRef.current);
    if (matchState.isRestTimerRunning && matchState.restTimer > 0) {
      restTimerRef.current = setInterval(() => {
        _setMatchState((prev) => ({ ...prev, restTimer: prev.restTimer - 1 }));
      }, 1000);
      if (matchState.restTimer <= 5 && matchState.restTimer > 0) {
        playSound(restCountdownSound);
      }
    } else if (matchState.restTimer <= 0 && matchState.isRestTimerRunning) {
      playSound(endSound);
      _setMatchState((prev) => ({
        ...prev,
        isRestTimerRunning: false,
        isRestPeriod: false,
      }));
      setNotification(
        `Rest period over. Round ${matchState.round} is ready.`,
        "info"
      );
    }
  }, [
    matchState.isRestTimerRunning,
    matchState.restTimer,
    setNotification,
    endSound,
  ]);

  const undoLastAction = useCallback(() => {
    if (history.current.length > 1) {
      const prevState = history.current.pop();
      _setMatchState(prevState);
      setNotification("Last action undone.", "info", 2000);
    } else {
      setNotification("No more actions to undo.", "error", 2000);
    }
  }, [setNotification]);

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

  const changeScore = useCallback(
    (player, points) => {
      guardedAction(() => {
        playSound(scoreSound);
        setMatchStateWithHistory((prev) => {
          const newScore = Math.max(0, prev[player].score + points);
          const newBreakdown = { ...prev[player].pointsBreakdown };
          if (points > 0 && newBreakdown[points] !== undefined)
            newBreakdown[points]++;
          const opponent = player === "blue" ? "red" : "blue";
          if (Math.abs(newScore - prev[opponent].score) >= 12) {
            const roundWinner =
              newScore > prev[opponent].score ? player : opponent;
            setNotification(
              `${roundWinner.toUpperCase()} wins Round ${
                prev.round
              } by Point Gap (PTG)!`,
              "success"
            );
            return _handleRoundEnd(
              {
                ...prev,
                [player]: {
                  ...prev[player],
                  score: newScore,
                  pointsBreakdown: newBreakdown,
                },
              },
              roundWinner
            );
          }
          return {
            ...prev,
            [player]: {
              ...prev[player],
              score: newScore,
              pointsBreakdown: newBreakdown,
            },
          };
        });
      });
    },
    [
      matchState.status,
      setMatchStateWithHistory,
      _handleRoundEnd,
      setNotification,
    ]
  );

  const addGamJeom = useCallback(
    (player) => {
      guardedAction(() => {
        playSound(penaltySound);
        setMatchStateWithHistory((prev) => {
          const opponent = player === "blue" ? "red" : "blue";
          return {
            ...prev,
            [player]: { ...prev[player], gamJeom: prev[player].gamJeom + 1 },
            [opponent]: { ...prev[opponent], score: prev[opponent].score + 1 },
          };
        });
      });
    },
    [matchState.status, setMatchStateWithHistory]
  );

  const toggleTimer = useCallback(() => {
    guardedAction(() => {
      if (matchState.isRestPeriod) {
        setNotification("Cannot start match during rest period.", "error");
        return;
      }
      if (!matchState.isTimerRunning && matchState.timer <= 0) {
        setNotification(
          "Timer is at 00:00. Please edit time or reset the match.",
          "error"
        );
        return;
      }
      if (!matchState.isTimerRunning) playSound(startSound);
      setMatchStateWithHistory((prev) => ({
        ...prev,
        isTimerRunning: !prev.isTimerRunning,
      }));
    });
  }, [
    matchState.status,
    matchState.isTimerRunning,
    matchState.timer,
    matchState.isRestPeriod,
    setMatchStateWithHistory,
    setNotification,
  ]);

  const setTimer = useCallback(
    (seconds) => {
      guardedAction(() => {
        if (!isNaN(seconds) && seconds >= 0)
          setMatchStateWithHistory((prev) => ({ ...prev, timer: seconds }));
      });
    },
    [matchState.status, setMatchStateWithHistory]
  );

  const toggleRestTimer = useCallback(() => {
    if (!matchState.isRestTimerRunning && matchState.restTimer <= 0) {
      setNotification(
        "Rest time is over. Please edit time to restart.",
        "error"
      );
      return;
    }
    _setMatchState((prev) => ({
      ...prev,
      isRestTimerRunning: !prev.isRestTimerRunning,
    }));
  }, [matchState.isRestTimerRunning, matchState.restTimer, setNotification]);

  const setRestTimer = useCallback((seconds) => {
    if (!isNaN(seconds) && seconds >= 0) {
      _setMatchState((prev) => ({ ...prev, restTimer: seconds }));
    }
  }, []);

  const changeRoundWins = useCallback(
    (player, amount) => {
      guardedAction(() => {
        setMatchStateWithHistory((prev) => {
          /* ... */
        });
      });
    },
    [matchState.status, setMatchStateWithHistory, setNotification]
  );

  const resetMatch = useCallback(() => {
    setNotification("Match has been reset.", "info");
    localStorage.removeItem("matchState");
    history.current = [initialState];
    _setMatchState(initialState);
  }, [setNotification, initialState]);

  const value = {
    matchState,
    changeScore,
    addGamJeom,
    setTimer,
    toggleTimer,
    endRoundAndAwardWinner,
    resetMatch,
    undoLastAction,
    changeRoundWins,
    toggleRestTimer,
    setRestTimer,
  };

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);
