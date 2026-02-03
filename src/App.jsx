import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import NavBar from "./components/NavBar"
import Compare from "./pages/Compare.jsx"
import ArchetypeDefinitions from "./pages/ArchetypeDefinitions.jsx"
import { useEffect } from "react"
// import { loadAllData } from "./api/loadCSV.js"






function App() {
  return (
    <>
      <NavBar/>
      <main className="bg-gradient-to-b from-gray-950 via-blue-950 to-gray-950">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/archetype" element={<ArchetypeDefinitions />} />
        </Routes>
      </main>
    </>
  )
}

export default App
