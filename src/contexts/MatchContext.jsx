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

  const changeScore = (player, points) => {
    if (matchState.status === "FINISHED") return;
    setMatchStateWithHistory((prev) => {
      const newScore = Math.max(0, prev[player].score + points);
      const newBreakdown = { ...prev[player].pointsBreakdown };
      if (points > 0 && newBreakdown[points] !== undefined) {
        newBreakdown[points]++;
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

  // ** NEW SMART LOGIC **
  const changeRoundWins = (player, amount) => {
    setMatchStateWithHistory((prev) => {
      const newRoundWins = Math.max(0, prev[player].roundWins + amount);
      const updatedPlayerState = { ...prev[player], roundWins: newRoundWins };

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
        [player]: updatedPlayerState,
      };
    });
  };

  const endRoundAndAwardWinner = () => {
    clearInterval(timerRef.current);
    setMatchStateWithHistory((prev) => {
      let roundWinner = "";
      const { blue, red } = prev;
      if (blue.score > red.score) {
        roundWinner = "blue";
      } else if (red.score > blue.score) {
        roundWinner = "red";
      } else {
        const pointValues = [5, 4, 3, 2, 1];
        for (const value of pointValues) {
          if (blue.pointsBreakdown[value] > red.pointsBreakdown[value]) {
            roundWinner = "blue";
            break;
          }
          if (red.pointsBreakdown[value] > blue.pointsBreakdown[value]) {
            roundWinner = "red";
            break;
          }
        }
      }
      if (!roundWinner) {
        setNotification("Round is a Tie! No winner awarded.", "error");
        return { ...prev, isTimerRunning: false };
      }
      const newBlueWins =
        prev.blue.roundWins + (roundWinner === "blue" ? 1 : 0);
      const newRedWins = prev.red.roundWins + (roundWinner === "red" ? 1 : 0);
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
        ...prev,
        round: newStatus === "FINISHED" ? prev.round : prev.round + 1,
        timer: 120,
        isTimerRunning: false,
        status: newStatus,
        winner: finalWinner,
        blue: {
          ...prev.blue,
          roundWins: newBlueWins,
          score: newStatus !== "FINISHED" ? 0 : prev.blue.score,
          gamJeom: newStatus !== "FINISHED" ? 0 : prev.blue.gamJeom,
          pointsBreakdown:
            newStatus !== "FINISHED"
              ? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
              : prev.blue.pointsBreakdown,
        },
        red: {
          ...prev.red,
          roundWins: newRedWins,
          score: newStatus !== "FINISHED" ? 0 : prev.red.score,
          gamJeom: newStatus !== "FINISHED" ? 0 : prev.red.gamJeom,
          pointsBreakdown:
            newStatus !== "FINISHED"
              ? { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
              : prev.red.pointsBreakdown,
        },
      };
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
    // changeRoundNumber is removed
  };

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);
