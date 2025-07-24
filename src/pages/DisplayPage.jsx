import React, { useState, useEffect } from "react";
import "../styles/display.css";

// یک کامپوننت ساده و کاربردی برای فرمت کردن زمان
const FormattedTimer = ({ seconds }) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes}:${secs.toString().padStart(2, "0")}`;
};

const DisplayPage = () => {
  // ۱. استفاده از یک وضعیت محلی به جای context
  // مقدار اولیه از localStorage خوانده می‌شود تا اگر وسط بازی پنجره باز شد، اطلاعات درست باشد
  const [matchState, setMatchState] = useState(() => {
    const savedState = localStorage.getItem("matchState");
    return savedState ? JSON.parse(savedState) : null;
  });

  // ۲. این افکت فقط یک بار در زمان ساخته شدن کامپوننت اجرا می‌شود
  // و شنونده‌ها را برای دریافت آپدیت‌ها فعال می‌کند
  useEffect(() => {
    const channel = new BroadcastChannel("taekwondo_scoreboard");

    // هرگاه پیامی از اپراتور رسید، وضعیت را آپدیت کن
    channel.onmessage = (event) => {
      setMatchState(event.data);
    };

    // این هم به عنوان پشتیبان برای اطمینان بیشتر عمل می‌کند
    const handleStorageChange = (e) => {
      if (e.key === "matchState") {
        setMatchState(JSON.parse(e.newValue));
      }
    };
    window.addEventListener("storage", handleStorageChange);

    // در زمان بسته شدن کامپوننت، شنونده‌ها را پاک می‌کنیم
    return () => {
      channel.close();
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []); // ۳. آرایه وابستگی خالی است تا این افکت فقط یک بار اجرا شود

  // اگر هنوز اطلاعاتی دریافت نشده، یک پیام لودینگ نشان بده
  if (!matchState) {
    return (
      <div className="display-container">Waiting for operator signal...</div>
    );
  }

  // رندر کردن اسکوربورد با اطلاعات آپدیت شده
  return (
    <div className="display-container">
      <div className="score-board">
        {/* Blue Player */}
        <div className="player-section blue">
          <p className="score">{matchState.blue.score}</p>
          <p className="gam-jeom">GAM-JEOM: {matchState.blue.gamJeom}</p>
        </div>

        {/* Center Info */}
        <div className="center-section">
          <div className="match-score">
            <span className="label">MATCH</span>
            <span className="score-text">
              {matchState.blue.roundWins} - {matchState.red.roundWins}
            </span>
          </div>
          <div className="timer">
            <FormattedTimer seconds={matchState.timer} />
          </div>
          <div className="round-info">
            <span className="label">ROUND</span>
            <span className="round-number">{matchState.round}</span>
          </div>
        </div>

        {/* Red Player */}
        <div className="player-section red">
          <p className="score">{matchState.red.score}</p>
          <p className="gam-jeom">GAM-JEOM: {matchState.red.gamJeom}</p>
        </div>
      </div>
    </div>
  );
};

export default DisplayPage;
