import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext"; // 👈 make sure path is correct

function NavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth(); // 👈 access Firebase auth context
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
      setMenuOpen(false); // close mobile menu
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <>
      <nav className="w-full h-20 bg-gray-950 text-white font-bold flex items-center justify-between px-4">
        {/* Brand Name */}
        <Link
          to="/"
          className="text-2xl font-bold text-cyan-400 hover:text-purple-400 transition"
        >
          CRUNCH TIME
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex space-x-8 text-lg items-center">
          <li>
            <Link to="/compare" className="hover:text-blue-400 transition">
              Compare
            </Link>
          </li>
          <li>
            <Link to="/pickem" className="hover:text-blue-400 transition">
              Pick'em
            </Link>
          </li>
          <li>
            <Link to="/profile" className="hover:text-blue-400 transition">
              Profile
            </Link>
          </li>

          {/* 👇 Auth Section */}
          {user ? (
            <button
              onClick={handleLogout}
              className="bg-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-700 transition"
            >
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-500 transition"
            >
              Login
            </Link>
          )}
        </ul>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden flex items-center"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
        </button>
      </nav>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-950 text-white px-4 py-2 absolute w-full z-10 shadow-lg">
          <ul className="flex flex-col space-y-4 text-lg">
            <li>
              <Link
                to="/compare"
                className="hover:text-blue-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                Compare
              </Link>
            </li>
            <li>
              <Link
                to="/pickem"
                className="hover:text-blue-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                Pick'em
              </Link>
            </li>
            <li>
              <Link
                to="/profile"
                className="hover:text-blue-400 transition"
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </Link>
            </li>

            {/* 👇 Auth Section for mobile */}
            {user ? (
              <button
                onClick={handleLogout}
                className="bg-gray-800 px-3 py-1 rounded text-sm hover:bg-gray-700 transition"
              >
                Logout
              </button>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-500 transition"
                onClick={() => setMenuOpen(false)}
              >
                Login
              </Link>
            )}
          </ul>
        </div>
      )}
    </>
  );
}

export default NavBar;
