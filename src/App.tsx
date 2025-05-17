import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import CreateEIPPage from "./pages/CreateEIPPage";
import EIPPage from "./pages/EIPPage";
import { EthereumProvider } from "./ethereum/EthereumContext";
import EIPListPage from "./pages/EIPListPage";

const THEME_KEY = "site-theme";

function getInitialTheme(): "light" | "dark" {
	const savedTheme = localStorage.getItem(THEME_KEY) as "light" | "dark";
	return savedTheme || "light"; // Default to light theme
}

function App() {
	const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme());

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

	return (
		<EthereumProvider>
			<Router>
				<Navbar theme={theme} toggleTheme={toggleTheme} />
				<main style={{ padding: "0 20px" }} className={theme}>
					<Routes>
						<Route path="/" element={<HomePage />} />
						<Route path="/eips/:eipId" element={<EIPPage />} />
						<Route path="/eips" element={<EIPListPage />} />
						<Route path="/eips/new" element={<CreateEIPPage />} />
					</Routes>
				</main>
			</Router>
		</EthereumProvider>
	);
}

export default App;
