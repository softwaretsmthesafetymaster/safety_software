import { Link } from "react-router-dom";
import { Shield, Home, Info, Phone, Menu, X } from "lucide-react";
import Button from "./UI/Button";
import { useState } from "react";

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const navItems = [
    { label: "Home", href: "/", icon: Home },
    { label: "About", href: "/about", icon: Info },
    { label: "Contact", href: "#contact", icon: Phone },
  ];

  return (
    <div className="w-full">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div>
              <Link to="/" className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  TSM Digitech
                </span>
              </Link>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600"
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            {/* Auth buttons (desktop) */}
            <div className="hidden md:flex items-center space-x-4">
              <Link
                to="/login"
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                Sign In
              </Link>
              <Link to="/register">
                <Button variant="primary">Get Started</Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
              >
                {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {menuOpen && (
          <div className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <div className="px-4 py-3 space-y-3">
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="flex items-center space-x-2 text-gray-600 dark:text-gray-300 hover:text-blue-600"
                  onClick={() => setMenuOpen(false)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
              <div className="flex flex-col space-y-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Link
                  to="/login"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-600"
                  onClick={() => setMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMenuOpen(false)}>
                  <Button variant="primary" className="w-full">
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </header>
    </div>
  );
};

export default Navbar;
