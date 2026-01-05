import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import RoomPage from "./pages/RoomPage";
import HomePage from "./pages/HomePage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CreateRoomPage from "./pages/CreateRoomPage";
import ProfilePage from "./pages/ProfilePage";
import NotFoundPage from "./pages/NotFoundPage";
import { SocketProvider } from './contexts/SocketContext';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { TutorialProvider } from './contexts/TutorialContext';
import TutorialOverlay from './components/Tutorial/TutorialOverlay';

function App() {
  return (
    <ThemeProvider>
      <TutorialProvider>
        <AuthProvider>
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

                {/* Page de profil */}
                <Route path="/profile" element={<ProfilePage />} />

                {/* Page 404 - Doit être la dernière route */}
                <Route path="*" element={<NotFoundPage />} />
              </Routes>
              <TutorialOverlay />
            </Router>
          </SocketProvider>
        </AuthProvider>
      </TutorialProvider>
    </ThemeProvider>
  );
}

export default App;
