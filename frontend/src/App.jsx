import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomPage from "./pages/RoomPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import { SocketProvider } from './contexts/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          {/* Page d'un salon dynamique */}
          <Route path="/room/:roomId" element={<RoomPage />} />

          {/* Page d'accueil */}
          <Route path="/" element={<HomePage />} />

          {/* Page de création de room */}
          <Route path="/create-room" element={<CreateRoomPage />} />

          {/* Pages d'authentification */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;
