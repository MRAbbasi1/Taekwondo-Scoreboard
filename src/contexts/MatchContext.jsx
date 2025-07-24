import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";

// وارد کردن فایل‌های صوتی
import startSoundSrc from "../assets/audio/B1.wav";
import scoreSoundSrc from "../assets/audio/B2.wav";
import tenSecondSoundSrc from "../assets/audio/B1.wav"; // This is the 10-second warning sound
import endSoundSrc from "../assets/audio/time.wav";
import penaltySoundSrc from "../assets/audio/B1.wav";
import restCountdownSoundSrc from "../assets/audio/B1.wav";

const channel = new BroadcastChannel("taekwondo_scoreboard");
const MatchContext = createContext();

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
    timer: 120,
    isTimerRunning: false,
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
        return { ...initialState, ...parsed, isTimerRunning: false };
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
      timer: isNowResting ? 60 : 120,
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

      // Sound for last 5 seconds of REST time
      if (
        matchState.isRestPeriod &&
        matchState.timer <= 5 &&
        matchState.timer > 0
      ) {
        playSound(restCountdownSound);
      }

      // ** THE FIX IS HERE: Sound for last 10 seconds of ROUND time **
      if (!matchState.isRestPeriod && matchState.timer === 10) {
        playSound(tenSecondSound);
      }
    } else if (matchState.timer <= 0 && matchState.isTimerRunning) {
      playSound(endSound);
      if (matchState.isRestPeriod) {
        _setMatchState((prev) => ({
          ...prev,
          isTimerRunning: false,
          isRestPeriod: false,
          timer: 120,
        }));
        setNotification(
          `Rest period over. Round ${matchState.round} is ready.`,
          "info"
        );
      } else {
        endRoundAndAwardWinner();
      }
    }
  }, [
    matchState.isTimerRunning,
    matchState.timer,
    matchState.isRestPeriod,
    endRoundAndAwardWinner,
    setNotification,
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
        if (matchState.isRestPeriod) {
          setNotification("Cannot score during rest period.", "error");
          return;
        }
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
      matchState.isRestPeriod,
      setMatchStateWithHistory,
      _handleRoundEnd,
      setNotification,
    ]
  );

  const addGamJeom = useCallback(
    (player) => {
      guardedAction(() => {
        if (matchState.isRestPeriod) {
          setNotification("Cannot give penalty during rest period.", "error");
          return;
        }
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
    [matchState.status, matchState.isRestPeriod, setMatchStateWithHistory]
  );

  const toggleTimer = useCallback(() => {
    guardedAction(() => {
      if (matchState.isRestPeriod) {
        if (!matchState.isTimerRunning && matchState.timer <= 0) {
          setNotification("Rest time is over. Please edit time.", "error");
          return;
        }
        _setMatchState((prev) => ({
          ...prev,
          isTimerRunning: !prev.isTimerRunning,
        }));
        return;
      }
      if (!matchState.isTimerRunning && matchState.timer <= 0) {
        setNotification(
          "Timer is at 00:00. Please edit time or start rest.",
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

  const startRest = useCallback(() => {
    guardedAction(() => {
      setMatchStateWithHistory((prev) => ({
        ...prev,
        isRestPeriod: true,
        timer: 60,
        isTimerRunning: false,
      }));
    });
  }, [matchState.status, setMatchStateWithHistory]);

  const skipRest = useCallback(() => {
    clearInterval(timerRef.current);
    _setMatchState((prev) => ({
      ...prev,
      isRestPeriod: false,
      timer: 120,
      isTimerRunning: false,
    }));
    setNotification(
      `Rest skipped. Round ${matchState.round} is ready.`,
      "info"
    );
  }, [matchState.round, setNotification]);

  const changeRoundWins = useCallback(
    (player, amount) => {
      guardedAction(() => {
        setMatchStateWithHistory((prev) => {
          const newRoundWins = Math.max(0, prev[player].roundWins + amount);
          const opponent = player === "blue" ? "red" : "blue";
          const blueWins =
            player === "blue" ? newRoundWins : prev[opponent].roundWins;
          const redWins =
            player === "red" ? newRoundWins : prev[opponent].roundWins;
          let newCurrentRound = blueWins + redWins + 1;
          let newStatus = "PAUSED";
          let finalWinner = null;
          if (blueWins >= 2) {
            newStatus = "FINISHED";
            finalWinner = "BLUE";
            newCurrentRound = blueWins + redWins;
          } else if (redWins >= 2) {
            newStatus = "FINISHED";
            finalWinner = "RED";
            newCurrentRound = blueWins + redWins;
          }
          newCurrentRound = Math.min(3, newCurrentRound);
          return {
            ...prev,
            round: newCurrentRound,
            status: newStatus,
            winner: finalWinner,
            [player]: { ...prev[player], roundWins: newRoundWins },
          };
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
    startRest,
    skipRest,
  };

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);
