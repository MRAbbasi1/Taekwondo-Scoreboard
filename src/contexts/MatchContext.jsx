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
    blue: { name: "BLUE", score: 0, gamJeom: 0, roundWins: 0 },
    red: { name: "RED", score: 0, gamJeom: 0, roundWins: 0 },
    status: "PRE_MATCH", // PRE_MATCH, RUNNING, PAUSED, FINISHED
    winner: null, // To store the match winner
  };

  const [matchState, setMatchState] = useState(() => {
    const savedState = localStorage.getItem("matchState");
    return savedState ? JSON.parse(savedState) : initialState;
  });

  const timerRef = useRef(null);

  useEffect(() => {
    // ... (Timer and BroadcastChannel effects remain the same)
    if (matchState.isTimerRunning && matchState.timer > 0) {
      timerRef.current = setInterval(() => {
        setMatchState((prev) => ({ ...prev, timer: prev.timer - 1 }));
      }, 1000);
    } else if (matchState.timer <= 0) {
      setMatchState((prev) => ({
        ...prev,
        isTimerRunning: false,
        status: "PAUSED",
      }));
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [matchState.isTimerRunning, matchState.timer]);

  useEffect(() => {
    localStorage.setItem("matchState", JSON.stringify(matchState));
    channel.postMessage(matchState);
  }, [matchState]);

  // --- ACTIONS ---
  // ... (addScore, addGamJeom, toggleTimer remain the same)
  const addScore = (player, points) => {
    if (matchState.status === "FINISHED") return;
    setMatchState((prev) => ({
      ...prev,
      [player]: { ...prev[player], score: prev[player].score + points },
    }));
  };

  const addGamJeom = (player) => {
    if (matchState.status === "FINISHED") return;
    const opponent = player === "blue" ? "red" : "blue";
    setMatchState((prev) => ({
      ...prev,
      [player]: { ...prev[player], gamJeom: prev[player].gamJeom + 1 },
      [opponent]: { ...prev[opponent], score: prev[opponent].score + 1 },
    }));
  };

  const toggleTimer = () => {
    if (matchState.status === "FINISHED") return;
    setMatchState((prev) => ({
      ...prev,
      isTimerRunning: !prev.isTimerRunning,
    }));
  };

  // **THE NEW SMART FUNCTION**
  const endRoundAndAwardWinner = () => {
    clearInterval(timerRef.current);
    let roundWinner = "";
    if (matchState.blue.score > matchState.red.score) {
      roundWinner = "blue";
    } else if (matchState.red.score > matchState.blue.score) {
      roundWinner = "red";
    } else {
      // In a real match, tie-breaker logic would go here.
      // For now, we can alert or do nothing.
      alert("Round is a Tie! No winner awarded.");
      return;
    }

    setMatchState((prev) => {
      const newBlueWins =
        prev.blue.roundWins + (roundWinner === "blue" ? 1 : 0);
      const newRedWins = prev.red.roundWins + (roundWinner === "red" ? 1 : 0);

      // Check for match winner
      if (newBlueWins === 2) {
        return { ...prev, status: "FINISHED", winner: "BLUE" };
      }
      if (newRedWins === 2) {
        return { ...prev, status: "FINISHED", winner: "RED" };
      }

      // If no match winner, prepare for the next round
      return {
        ...prev,
        round: prev.round + 1,
        timer: 120,
        isTimerRunning: false,
        blue: { ...prev.blue, score: 0, gamJeom: 0, roundWins: newBlueWins },
        red: { ...prev.red, score: 0, gamJeom: 0, roundWins: newRedWins },
      };
    });
  };

  const resetMatch = () => {
    clearInterval(timerRef.current);
    setMatchState(initialState);
  };

  const value = {
    matchState,
    addScore,
    addGamJeom,
    toggleTimer,
    endRoundAndAwardWinner,
    resetMatch,
  };

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);
