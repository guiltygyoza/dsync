import { useEffect, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import HomePage from "./pages/HomePage";
import ChamberPage from "./pages/ChamberPage";
import CreateChamberPage from "./pages/CreateChamberPage";
import { ReplicacheProvider } from "./replicache/ReplicacheContext";
import { EthereumProvider } from "./ethereum/EthereumContext";
import { Identities } from "@orbitdb/core";
import { nanoid } from "nanoid";
import { useHelia } from "./hooks/useHelia";

const USER_ID_KEY = "replicache-user-id";

function getLocalUserId(): string {
  let userId = localStorage.getItem(USER_ID_KEY);
  if (!userId) {
    userId = nanoid();
    localStorage.setItem(USER_ID_KEY, userId);
  }
  return userId;
}

function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const { error, starting } = useHelia();

  useEffect(() => {
    setUserId(getLocalUserId());
  }, []);

  if (!userId) {
    return <div>Loading user identity...</div>;
  }

  return (
    <EthereumProvider>
      <ReplicacheProvider userId={userId}>
        <Router>
          <Navbar />
          <main style={{ padding: "0 20px" }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chamber/new" element={<CreateChamberPage />} />
              <Route path="/chamber/:chamberId" element={<ChamberPage />} />
            </Routes>
            <div
              id="heliaStatus"
              style={{
                border: `4px solid ${
                  error ? "red" : starting ? "yellow" : "green"
                }`,
                paddingBottom: "4px",
              }}
            >
              Helia Status
            </div>
          </main>
        </Router>
      </ReplicacheProvider>
    </EthereumProvider>
  );
}

export default App;
