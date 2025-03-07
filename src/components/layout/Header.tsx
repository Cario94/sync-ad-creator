
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Check if we're on the workspace page
  const isWorkspace = location.pathname === '/workspace';

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when changing routes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Don't show header on workspace page
  if (isWorkspace) return null;

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 py-4 px-6 md:px-12 transition-all duration-300 ${
        isScrolled ? 'glass-morphism' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link 
          to="/" 
          className="text-2xl font-bold text-gradient"
          aria-label="CampaignSync Home"
        >
          CampaignSync
        </Link>
        
        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link 
            to="/" 
            className="font-medium hover:text-primary transition-colors"
          >
            Home
          </Link>
          <Link 
            to="/features" 
            className="font-medium hover:text-primary transition-colors"
          >
            Features
          </Link>
          <Link 
            to="/pricing" 
            className="font-medium hover:text-primary transition-colors"
          >
            Pricing
          </Link>
          <div className="flex items-center space-x-4">
            <Link to="/login">
              <Button variant="outline" className="font-medium px-6">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="font-medium px-6">Get Started</Button>
            </Link>
          </div>
        </nav>
        
        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-foreground"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle mobile menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>
      
      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 glass-morphism animate-fade-down py-6 px-6">
          <nav className="flex flex-col space-y-4">
            <Link 
              to="/" 
              className="font-medium hover:text-primary transition-colors py-2"
            >
              Home
            </Link>
            <Link 
              to="/features" 
              className="font-medium hover:text-primary transition-colors py-2"
            >
              Features
            </Link>
            <Link 
              to="/pricing" 
              className="font-medium hover:text-primary transition-colors py-2"
            >
              Pricing
            </Link>
            <div className="flex flex-col space-y-3 pt-2">
              <Link to="/login" className="w-full">
                <Button variant="outline" className="font-medium w-full">
                  Login
                </Button>
              </Link>
              <Link to="/register" className="w-full">
                <Button className="font-medium w-full">
                  Get Started
                </Button>
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
