import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ChamberPage from "./pages/ChamberPage";
import CreateChamberPage from "./pages/CreateChamberPage";
import { EthereumProvider } from "./ethereum/EthereumContext";
import { nanoid } from "nanoid";
import { ReplicacheProvider } from "./replicache/ReplicacheContext";

const USER_ID_KEY = "replicache-user-id";
const THEME_KEY = "site-theme";

function getLocalUserId(): string {
	let userId = localStorage.getItem(USER_ID_KEY);
	if (!userId) {
		userId = nanoid();
		localStorage.setItem(USER_ID_KEY, userId);
	}
	return userId;
}

function getInitialTheme(): "light" | "dark" {
	const savedTheme = localStorage.getItem(THEME_KEY) as "light" | "dark";
	return savedTheme || "light"; // Default to light theme
}

function App() {
	const [userId, setUserId] = useState<string | null>(null);
	const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme());

	useEffect(() => {
		setUserId(getLocalUserId());
	}, []);

	useEffect(() => {
		localStorage.setItem(THEME_KEY, theme);
		if (theme === "dark") {
			document.body.classList.add("dark-mode");
			document.body.classList.remove("light-mode");
		} else {
			document.body.classList.add("light-mode");
			document.body.classList.remove("dark-mode");
		}
	}, [theme]);

	const toggleTheme = () => {
		setTheme((prevTheme) => (prevTheme === "light" ? "dark" : "light"));
	};

	if (!userId) {
		return <div>Loading user identity...</div>;
	}

	return (
		<EthereumProvider>
			<ReplicacheProvider userId={userId}>
				<Router>
					<Navbar theme={theme} toggleTheme={toggleTheme} />
					<main style={{ padding: "0 20px" }} className={theme}>
						<Routes>
							<Route path="/" element={<HomePage />} />
							<Route path="/chamber/new" element={<CreateChamberPage />} />
							<Route path="/chamber/:chamberId" element={<ChamberPage />} />
						</Routes>
					</main>
				</Router>
			</ReplicacheProvider>
		</EthereumProvider>
	);
}

export default App;
