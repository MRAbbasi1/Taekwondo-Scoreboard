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
    status: "PRE_MATCH",
    winner: null,
    // این خط مهم‌ترین بخش برای رفع خطای شماست
    notification: { message: "", type: "info", visible: false },
  };

  const [matchState, setMatchState] = useState(() => {
    const savedState = localStorage.getItem("matchState");
    // یک بررسی اضافه شده تا اگر ساختار state قدیمی بود، از نو ساخته شود
    if (savedState) {
      const parsedState = JSON.parse(savedState);
      if (parsedState.notification) {
        // Check if the notification object exists
        return parsedState;
      }
    }
    return initialState;
  });

  const timerRef = useRef(null);
  const notificationTimerRef = useRef(null);

  useEffect(() => {
    if (matchState.isTimerRunning && matchState.timer > 0) {
      timerRef.current = setInterval(() => {
        setMatchState((prev) => ({ ...prev, timer: prev.timer - 1 }));
      }, 1000);
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

  const changeScore = (player, amount) => {
    if (matchState.status === "FINISHED") return;
    setMatchState((prev) => ({
      ...prev,
      [player]: {
        ...prev[player],
        score: Math.max(0, prev[player].score + amount),
      },
    }));
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
      status: "RUNNING",
    }));
  };

  const setTimerManually = () => {
    const newTime = prompt("Enter new time in seconds:", matchState.timer);
    const newTimeInSeconds = parseInt(newTime, 10);
    if (!isNaN(newTimeInSeconds) && newTimeInSeconds >= 0) {
      setMatchState((prev) => ({ ...prev, timer: newTimeInSeconds }));
      setNotification(`Timer set to ${newTimeInSeconds} seconds.`, "info");
    } else {
      setNotification("Invalid time. Please enter numbers only.", "error");
    }
  };

  const endRoundAndAwardWinner = () => {
    clearInterval(timerRef.current);
    let roundWinner = "";
    if (matchState.blue.score > matchState.red.score) roundWinner = "blue";
    else if (matchState.red.score > matchState.blue.score) roundWinner = "red";

    if (!roundWinner) {
      setNotification("Round is a Tie! No winner awarded.", "error");
      setMatchState((prev) => ({ ...prev, isTimerRunning: false }));
      return;
    }

    setNotification(
      `${roundWinner.toUpperCase()} wins Round ${matchState.round}!`,
      "success"
    );

    setMatchState((prev) => {
      const newBlueWins =
        prev.blue.roundWins + (roundWinner === "blue" ? 1 : 0);
      const newRedWins = prev.red.roundWins + (roundWinner === "red" ? 1 : 0);
      let newStatus = "PAUSED";
      let finalWinner = null;

      if (newBlueWins === 2) {
        newStatus = "FINISHED";
        finalWinner = "BLUE";
      } else if (newRedWins === 2) {
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
        blue: { ...prev.blue, score: 0, gamJeom: 0, roundWins: newBlueWins },
        red: { ...prev.red, score: 0, gamJeom: 0, roundWins: newRedWins },
      };
    });
  };

  const resetMatch = () => {
    setNotification("Match has been reset.", "info");
    // قبل از ریست کردن، اطلاعات قدیمی localStorage را پاک می‌کنیم
    localStorage.removeItem("matchState");
    setMatchState(initialState);
  };

  const value = {
    matchState,
    changeScore,
    changeGamJeom,
    toggleTimer,
    endRoundAndAwardWinner,
    resetMatch,
    setTimerManually,
  };

  return (
    <MatchContext.Provider value={value}>{children}</MatchContext.Provider>
  );
};

export const useMatch = () => useContext(MatchContext);
