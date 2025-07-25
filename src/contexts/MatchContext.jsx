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

  const setMatchState = (updater) => {
    history.current.push(matchState);
    if (history.current.length > 30) history.current.shift();
    _setMatchState(updater);
  };

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
      timer: isNowResting ? 60000 : 120000,
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

  const endRoundAndAwardWinner = useCallback(() => {
    playSound(endSound);
    setMatchState((prev) => {
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
  }, [setNotification, _handleRoundEnd]);

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
  }, [matchState.isTimerRunning, matchState.timer <= 10000]);

  useEffect(() => {
    if (matchState.timer <= 0 && matchState.isTimerRunning) {
      _setMatchState((prev) => ({ ...prev, isTimerRunning: false }));

      if (matchState.isRestPeriod) {
        playSound(restCountdownSound);
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
        setMatchState((prev) => {
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
      setNotification,
      _handleRoundEnd,
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
        setMatchState((prev) => {
          const opponent = player === "blue" ? "red" : "blue";
          return {
            ...prev,
            [player]: { ...prev[player], gamJeom: prev[player].gamJeom + 1 },
            [opponent]: { ...prev[opponent], score: prev[opponent].score + 1 },
          };
        });
      });
    },
    [matchState.status, matchState.isRestPeriod, setNotification]
  );

  const toggleTimer = useCallback(() => {
    guardedAction(() => {
      if (!matchState.isTimerRunning && matchState.timer <= 0) {
        setNotification("Timer is at 00:00. Please edit time.", "error");
        return;
      }
      if (!matchState.isTimerRunning) playSound(startSound);
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
      // playSound(restCountdownSound);
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

  const changeRoundWins = useCallback(
    (player, amount) => {
      guardedAction(() => {
        setMatchState((prev) => {
          const newRoundWins = Math.max(0, prev[player].roundWins + amount);
          const opponent = player === "blue" ? "red" : "blue";
          const blueWins =
            player === "blue" ? newRoundWins : prev.blue.roundWins;
          const redWins = player === "red" ? newRoundWins : prev.red.roundWins;

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
    [matchState.status, setNotification]
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
