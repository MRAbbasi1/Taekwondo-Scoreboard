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

  const [matchState, setMatchState] = useState(() => {
    const savedState = localStorage.getItem("matchState");
    if (savedState) {
      const parsed = JSON.parse(savedState);
      if (parsed.blue && parsed.blue.pointsBreakdown) return parsed;
    }
    return initialState;
  });

  const timerRef = useRef(null);
  const notificationTimerRef = useRef(null);

  // All useEffect hooks remain the same
  useEffect(() => {
    if (matchState.isTimerRunning && matchState.timer > 0) {
      timerRef.current = setInterval(
        () => setMatchState((prev) => ({ ...prev, timer: prev.timer - 1 })),
        1000
      );
    } else if (matchState.timer <= 0 && matchState.isTimerRunning) {
      setMatchState((prev) => ({
        ...prev,
        isTimerRunning: false,
        status: "PAUSED",
      }));
    }
    return () => clearInterval(timerRef.current);
  }, [matchState.isTimerRunning, matchState.timer]);

  useEffect(() => {
    localStorage.setItem("matchState", JSON.stringify(matchState));
    channel.postMessage(matchState);
  }, [matchState]);

  // All action functions up to endRoundAndAwardWinner remain the same
  const setNotification = (message, type = "info", duration = 4000) => {
    clearTimeout(notificationTimerRef.current);
    setMatchState((prev) => ({
      ...prev,
      notification: { message, type, visible: true },
    }));
    notificationTimerRef.current = setTimeout(() => {
      setMatchState((prev) => ({
        ...prev,
        notification: { ...prev.notification, visible: false },
      }));
    }, duration);
  };
  const changeScore = (player, points) => {
    if (matchState.status === "FINISHED" || points === 0) return;
    setMatchState((prev) => {
      const newScore = Math.max(0, prev[player].score + points);
      const newBreakdown = { ...prev[player].pointsBreakdown };
      if (points > 0 && newBreakdown[points] !== undefined) {
        newBreakdown[points]++;
      }
      // This part handles correction for score removal, though it's an approximation
      if (points < 0 && newBreakdown[-points] !== undefined) {
        newBreakdown[-points] = Math.max(0, newBreakdown[-points] - 1);
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
  const changeGamJeom = (player, amount) => {
    if (matchState.status === "FINISHED") return;
    const opponent = player === "blue" ? "red" : "blue";
    const currentGamJeom = matchState[player].gamJeom;
    if (amount < 0 && currentGamJeom === 0) return;
    setMatchState((prev) => ({
      ...prev,
      [player]: {
        ...prev[player],
        gamJeom: Math.max(0, prev[player].gamJeom + amount),
      },
      [opponent]: {
        ...prev[opponent],
        score: Math.max(0, prev[opponent].score + amount),
      },
    }));
  };
  const toggleTimer = () => {
    if (matchState.status === "FINISHED") return;
    setMatchState((prev) => ({
      ...prev,
      isTimerRunning: !prev.isTimerRunning,
    }));
  };
  const setTimer = (seconds) => {
    if (!isNaN(seconds) && seconds >= 0) {
      setMatchState((prev) => ({ ...prev, timer: seconds }));
    }
  };

  const endRoundAndAwardWinner = () => {
    clearInterval(timerRef.current);
    let roundWinner = "";
    const { blue, red } = matchState;

    if (blue.score > red.score) {
      roundWinner = "blue";
    } else if (red.score > blue.score) {
      roundWinner = "red";
    } else {
      // Tie-breaker logic
      const pointValues = [5, 4, 3, 2, 1];
      for (const value of pointValues) {
        if (blue.pointsBreakdown[value] > red.pointsBreakdown[value]) {
          roundWinner = "blue";
          setNotification(
            `BLUE wins by Superiority (${value}-point hits)!`,
            "success"
          );
          break;
        }
        // ** THE BUG FIX IS HERE: Comparing red to blue, not red to red **
        if (red.pointsBreakdown[value] > blue.pointsBreakdown[value]) {
          roundWinner = "red";
          setNotification(
            `RED wins by Superiority (${value}-point hits)!`,
            "success"
          );
          break;
        }
      }
    }

    if (!roundWinner) {
      setNotification("Round is a Tie! No winner awarded.", "error");
      setMatchState((prev) => ({ ...prev, isTimerRunning: false }));
      return;
    }

    if (blue.score !== red.score) {
      setNotification(
        `${roundWinner.toUpperCase()} wins Round ${matchState.round}!`,
        "success"
      );
    }

    setMatchState((prev) => {
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
          name: "BLUE",
          roundWins: newBlueWins,
          score: 0,
          gamJeom: 0,
          pointsBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
        red: {
          name: "RED",
          roundWins: newRedWins,
          score: 0,
          gamJeom: 0,
          pointsBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        },
      };
    });
  };

  const resetMatch = () => {
    setNotification("Match has been reset.", "info");
    localStorage.removeItem("matchState");
    setMatchState(initialState);
  };

  const value = {
    matchState,
    changeScore,
    changeGamJeom,
    setTimer,
    toggleTimer,
    endRoundAndAwardWinner,
    resetMatch,
  };

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);
