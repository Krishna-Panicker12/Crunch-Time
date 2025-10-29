import { useState } from "react";
import { Link } from "react-router-dom";

function NavBar() {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <>
            <nav className="w-full h-20 bg-gray-950 text-white font-bold flex items-center justify-between px-4">
                {/* Brand Name */}
                <Link to ="/" className="text-2xl font-bold text-red-200 hover:text-purple-400 transition">CRUNCH TIME</Link>

                {/* Desktop Menu */}
                <ul className="hidden md:flex space-x-8 text-lg">
                    <li>
                        <Link to="/compare" className="hover:text-blue-400 transition">Compare</Link>
                    </li>
                    <li>
                        <Link to="/pickem" className="hover:text-blue-400 transition">Pick'em</Link>
                    </li>
                    <li>
                        <Link to="/profile" className="hover:text-blue-400 transition">Profile</Link>
                    </li>
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                </button>
            </nav>

            {/* Mobile Menu */}
            {menuOpen && (
                <div className="md:hidden bg-gray-950 text-white px-4 py-2 absolute w-full z-10 shadow-lg">
                    <ul className="flex flex-col space-y-4 text-lg">
                        <li>
                            <Link to="/teams" className="hover:text-blue-400 transition" onClick={() => setMenuOpen(false)}>Teams</Link>
                        </li>
                        <li>
                            <Link to="/compare" className="hover:text-blue-400 transition" onClick={() => setMenuOpen(false)}>Compare</Link>
                        </li>
                        <li>
                            <Link to="/top10" className="hover:text-blue-400 transition" onClick={() => setMenuOpen(false)}>Top 10</Link>
                        </li>
                    </ul>
                </div>
            )}
        </>
    )
}


export default NavBar