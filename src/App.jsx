import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import NavBar from "./components/NavBar"
import Compare from "./pages/Compare.jsx"
import PickEm from "./pages/PickEm"
import Profile from "./pages/Profile"
import { useEffect } from "react"
import { loadAllData } from "./api/loadCSV.js"
import LoginPage from "./pages/Login.jsx"
import ProtectedRoute from "./components/ProtectedRoute.jsx"






function App() {
  useEffect(() => {
    loadAllData(2025)
  }, []);
  return (
    <>
      <NavBar/>
      <main className="bg-gradient-to-b from-gray-950 via-blue-950 to-gray-950">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/pickem" element={<PickEm />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
        </Routes>
      </main>
    </>
  )
}

export default App
