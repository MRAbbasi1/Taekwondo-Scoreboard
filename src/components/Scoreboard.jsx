// // src/components/Scoreboard.jsx
// import React from 'react';
// import Timer from './Timer';
// import '../styles/display.css';

// const Scoreboard = ({ state }) => {
//   return (
//     <div className="scoreboard-container">
//       {/* Blue Player Side */}
//       <div className="player-section blue-bg">
//         <div className="score-box">
//           <span className="score-text blue-glow">{state.blue.score}</span>
//         </div>
//         <div className="gam-jeom-section">
//           <span className="gam-jeom-label">GAM-JEOM</span>
//           <span className="gam-jeom-score">{state.blue.gamJeom}</span>
//         </div>
//       </div>

//       {/* Center Column */}
//       <div className="center-section">
//         <div className="match-info">
//           <span className="match-label">MATCH</span>
//           <span className="match-score">{state.blue.roundWins}</span>
//         </div>
//         <Timer seconds={state.timer} />
//         <div className="round-info">
//           <span className="round-label">ROUND</span>
//           <span className="round-number">{state.round}</span>
//         </div>
//       </div>
      
//       {/* Red Player Side */}
//       <div className="player-section red-bg">
//          <div className="score-box">
//           <span className="score-text red-glow">{state.red.score}</span>
//         </div>
//         <div className="gam-jeom-section">
//           <span className="gam-jeom-label">GAM-JEOM</span>
//           <span className="gam-jeom-score">{state.red.gamJeom}</span>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Scoreboard;