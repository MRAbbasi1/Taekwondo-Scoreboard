// // src/components/Timer.jsx
// import React from 'react';

// const Timer = ({ seconds }) => {
//   const formatTime = (timeInSeconds) => {
//     const minutes = Math.floor(timeInSeconds / 60);
//     const seconds = timeInSeconds % 60;
//     return `${minutes}:${seconds.toString().padStart(2, '0')}`;
//   };

//   return (
//     <div className="timer-display">
//       {formatTime(seconds)}
//     </div>
//   );
// };

// export default Timer;