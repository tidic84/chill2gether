// src/App.jsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomPage from "./pages/RoomPage";

function App() {
  return (
    <Router>
      <Routes>
        {/* Page d’un salon dynamique */}
        <Route path="/room/:roomId" element={<RoomPage />} />

        {/* Page d’accueil ou redirect vers un salon test */}
        <Route
          path="/"
          element={
            <div className="flex items-center justify-center h-screen">
              <h1 className="text-3xl text-red-500 font-bold">
                CHILL 2GETHER - Accueil
              </h1>
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
