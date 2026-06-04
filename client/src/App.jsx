// ============================================
// App - главный компонент приложения с роутингом
// ============================================

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Pages
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { StartTour } from "./pages/StartTour";
import { Tour } from "./pages/Tour";
import { Game } from "./pages/Game";
import { Complete } from "./pages/Complete";
import { EnterprisePanel } from "./pages/EnterprisePanel";
import { AdminPanel } from "./pages/AdminPanel";

// Components
import { Toast } from "./components/Toast";

// Stores
import { useAuthStore } from "./store/authStore";
import { useSessionStore } from "./store/sessionStore";

function App() {
	const initAuth = useAuthStore((state) => state.initFromStorage);
	const initSession = useSessionStore((state) => state.initFromStorage);

	// Инициализация при загрузке
	useEffect(() => {
		initAuth();
		initSession();
	}, []);

	return (
		<BrowserRouter>
			<Toast />

			<Routes>
				{/* Публичные маршруты */}
				<Route path="/" element={<Landing />} />
				<Route path="/start/:enterpriseId" element={<StartTour />} />
				<Route path="/tour/:sessionId" element={<Tour />} />
				<Route path="/game/:sessionId/:pointId" element={<Game />} />
				<Route path="/complete/:sessionId" element={<Complete />} />

				{/* Страница входа */}
				<Route path="/login" element={<Login />} />

				{/* Защищённые маршруты */}
				<Route path="/enterprise-panel" element={<EnterprisePanel />} />
				<Route path="/admin-panel" element={<AdminPanel />} />

				{/* Fallback */}
				<Route path="*" element={<Navigate to="/" replace />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;
