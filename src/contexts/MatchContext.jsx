import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useRef,
} from "react";

const channel = new BroadcastChannel("taekwondo_scoreboard");
const MatchContext = createContext();

export const MatchProvider = ({ children }) => {
  const initialState = {
    round: 1,
    timer: 120,
    isTimerRunning: false,
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
      if (parsed.blue && parsed.blue.pointsBreakdown) return parsed;
    }
    return initialState;
  });

  const history = useRef([matchState]);
  const notificationTimerRef = useRef(null);
  const timerRef = useRef(null);

  // Helper function to handle all end-of-round logic
  const _handleRoundEnd = (prevState, roundWinner) => {
    const newBlueWins =
      prevState.blue.roundWins + (roundWinner === "blue" ? 1 : 0);
    const newRedWins =
      prevState.red.roundWins + (roundWinner === "red" ? 1 : 0);
    let newStatus = "PAUSED";
    let finalWinner = null;

    if (newBlueWins >= 2) {
      newStatus = "FINISHED";
      finalWinner = "BLUE";
    }
    if (newRedWins >= 2) {
      newStatus = "FINISHED";
      finalWinner = "RED";
    }

    return {
      ...prevState,
      round: newStatus === "FINISHED" ? prevState.round : prevState.round + 1,
      timer: 120,
      isTimerRunning: false,
      status: newStatus,
      winner: finalWinner,
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
  };

  const setMatchStateWithHistory = (updater) => {
    _setMatchState((currentState) => {
      history.current.push(currentState);
      if (history.current.length > 30) history.current.shift();
      return typeof updater === "function" ? updater(currentState) : updater;
    });
  };

  const undoLastAction = () => {
    if (history.current.length > 1) {
      const prevState = history.current.pop();
      _setMatchState(prevState);
      setNotification("Last action undone.", "info", 2000);
    } else {
      setNotification("No more actions to undo.", "error", 2000);
    }
  };

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
      _setMatchState((prev) => ({
        ...prev,
        isTimerRunning: false,
        status: "PAUSED",
      }));
    }
  }, [matchState.isTimerRunning, matchState.timer]);

  const setNotification = (message, type = "info", duration = 4000) => {
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
  };

  // ** UPDATED with PTG LOGIC **
  const changeScore = (player, points) => {
    if (matchState.status === "FINISHED") return;
    setMatchStateWithHistory((prev) => {
      const newScore = Math.max(0, prev[player].score + points);
      const newBreakdown = { ...prev[player].pointsBreakdown };
      if (points > 0 && newBreakdown[points] !== undefined) {
        newBreakdown[points]++;
      }

      const opponent = player === "blue" ? "red" : "blue";
      const opponentScore = prev[opponent].score;

      // PTG Check (Win by 12 Point Gap)
      if (Math.abs(newScore - opponentScore) >= 12) {
        const roundWinner = newScore > opponentScore ? player : opponent;
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
  };

  const addGamJeom = (player) => {
    // We can also add PTG check for GamJeom if needed, but for now we keep it simple
    if (matchState.status === "FINISHED") return;
    setMatchStateWithHistory((prev) => {
      const opponent = player === "blue" ? "red" : "blue";
      return {
        ...prev,
        [player]: { ...prev[player], gamJeom: prev[player].gamJeom + 1 },
        [opponent]: { ...prev[opponent], score: prev[opponent].score + 1 },
      };
    });
  };

  const toggleTimer = () => {
    if (matchState.status === "FINISHED") return;
    setMatchStateWithHistory((prev) => ({
      ...prev,
      isTimerRunning: !prev.isTimerRunning,
    }));
  };

  const setTimer = (seconds) => {
    if (!isNaN(seconds) && seconds >= 0) {
      setMatchStateWithHistory((prev) => ({ ...prev, timer: seconds }));
    }
  };

  const changeRoundWins = (player, amount) => {
    setMatchStateWithHistory((prev) => {
      // ... (logic remains the same)
    });
  };

  // ** UPDATED with PTF and SUP NOTIFICATIONS **
  const endRoundAndAwardWinner = () => {
    clearInterval(timerRef.current);
    setMatchStateWithHistory((prev) => {
      let roundWinner = "";
      let winType = "";
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
        return { ...prev, isTimerRunning: false };
      }

      setNotification(
        `${roundWinner.toUpperCase()} wins Round ${prev.round} by ${winType}!`,
        "success"
      );
      return _handleRoundEnd(prev, roundWinner);
    });
  };

  const resetMatch = () => {
    setNotification("Match has been reset.", "info");
    localStorage.removeItem("matchState");
    history.current = [initialState];
    _setMatchState(initialState);
  };

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
  };

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);
