import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MatchProvider } from "./contexts/MatchContext";
import OperatorPage from "./pages/OperatorPage";
import DisplayPage from "./pages/DisplayPage";
// import "./app.css";

function App() {
  return (
    <MatchProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OperatorPage />} />
          <Route path="/display" element={<DisplayPage />} />
        </Routes>
      </BrowserRouter>
    </MatchProvider>
  );
}

export default App;
