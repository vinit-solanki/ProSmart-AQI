import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import logoImage from "@/assets/prosmart-logo.jpg";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-200 shadow-sm font-sans">
      <div className="container mx-auto px-6 py-4 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-3">
          <img
            src={logoImage}
            alt="ProSmart Logo - Think Smart"
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">
              ProSmart
            </h1>
            <p className="text-xs md:text-sm text-gray-600 tracking-wide">
              Think Smart Solutions
            </p>
          </div>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8">
          {["Home", "About", "Products", "Contact"].map((item, i) => (
            <a
              key={i}
              href={`#${item.toLowerCase()}`}
              className="relative text-gray-700 font-medium tracking-wide transition-colors hover:text-primary after:content-[''] after:block after:w-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Button
            size="sm"
            className="font-semibold tracking-wide shadow-sm hover:shadow-md transition-all"
          >
            Get Quote
          </Button>
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-lg animate-fade-in-down">
          <nav className="flex flex-col space-y-4 px-6 py-4 text-center">
            {["Home", "About", "Products", "Contact"].map((item, i) => (
              <a
                key={i}
                href={`#${item.toLowerCase()}`}
                className="text-gray-700 font-medium tracking-wide hover:text-primary transition-colors"
              >
                {item}
              </a>
            ))}
            <Button className="w-full font-semibold tracking-wide">
              Get Quote
            </Button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
