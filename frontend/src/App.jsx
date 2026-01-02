import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomPage from "./pages/RoomPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import NotFoundPage from "./pages/NotFoundPage";
import { SocketProvider } from './contexts/SocketContext';
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
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

            {/* Page 404 - Doit être la dernière route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
      </SocketProvider>
    </ThemeProvider>
  );
}

export default App;
