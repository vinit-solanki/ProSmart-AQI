import { Separator } from "@/components/ui/separator";
import logoImage from "@/assets/prosmart-logo.jpg";

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="md:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <img
                src={logoImage}
                alt="ProSmart Logo"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <h3 className="text-xl font-bold text-primary">ProSmart</h3>
                <p className="text-sm text-gray-400">Think Smart Solutions</p>
              </div>
            </div>
            <p className="text-gray-300 max-w-md mb-6 leading-relaxed">
              Leading the future of smart technology solutions with innovative products 
              that make a real difference in healthcare and industrial environments.
            </p>
            <div className="text-sm text-gray-300 space-y-1">
              <p>📍 Govandi East, Mumbai, Maharashtra, India</p>
              <p>📞 +91 98765 43210</p>
              <p>✉️ info@prosmart.com</p>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#home" className="text-gray-400 hover:text-primary transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#about" className="text-gray-400 hover:text-primary transition-colors">
                  About Us
                </a>
              </li>
              <li>
                <a href="#products" className="text-gray-400 hover:text-primary transition-colors">
                  Products
                </a>
              </li>
              <li>
                <a href="#contact" className="text-gray-400 hover:text-primary transition-colors">
                  Contact
                </a>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h4 className="font-semibold text-white mb-4">Our Products</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">Water Powered LED Lamps</li>
              <li className="text-gray-400">UV Disinfection Lights</li>
              <li className="text-gray-400">I.V Alert Systems</li>
              <li className="text-gray-400">Anti-Theft Alerts</li>
              <li className="text-gray-400">Muscle Dynamometers</li>
              <li className="text-gray-400">Self Healing Food Boxes</li>
            </ul>
          </div>
        </div>

        <Separator className="my-8 bg-gray-700" />

        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400">
          <p>© 2024 ProSmart. All rights reserved.</p>
          <div className="flex space-x-4 mt-4 md:mt-0">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">Support</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;