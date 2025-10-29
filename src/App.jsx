import { Route, Routes } from "react-router-dom"
import Home from "./pages/Home"
import NavBar from "./components/NavBar"
import Compare from "./pages/Compare.jsx"
import PickEm from "./pages/PickEm"
import Profile from "./pages/Profile"






function App() {
  return (
    <>
      <NavBar/>
      <main className="bg-purple-fade bg-cover bg-center ">
        <Routes>
          <Route path="/" element = {<Home />} />
          <Route path="/compare" element = {<Compare />}></Route>
          <Route path="/pickem" element = {<PickEm />}></Route>
          <Route path="/profile" element = {<Profile />}></Route>
        </Routes>
      </main>
    </>
  )
}

export default App
