import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import heroImage from "@/assets/factory-colleagues.jpg";

const Hero = () => {
  return (
    <section
      id="home"
      className="relative min-h-screen flex items-center bg-gradient-to-br from-gray-50 to-white overflow-hidden pt-20"
    >
        <div className="absolute inset-0 bg-gradient-to-l from-black via-black/20 to-transparent"></div>
      {/* Subtle primary tint overlay */}
      <div className="absolute inset-0 bg-primary/5"></div>

      {/* Background Image on Right */}
      <div
        className="absolute right-0 top-0 w-1/2 h-full bg-cover bg-center shadow-xl"
        style={{ backgroundImage: `url(${heroImage})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-black via-black/20 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-6 lg:px-12 relative z-10">
        <div className="max-w-3xl">
          <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 mb-6 leading-tight tracking-tight">
            Think Smart.
            <br />
            <span className="text-primary">Innovate Better.</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl leading-relaxed">
            Revolutionary healthcare and industrial solutions powered by
            cutting-edge technology. From water-powered emergency systems to
            AI-controlled disinfection lights.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-14">
            <Button
              size="lg"
              className="text-lg px-8 py-6 shadow-md hover:shadow-lg transition"
            >
              Explore Products
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6 border-2 hover:bg-gray-100 transition"
            >
              Schedule Demo
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl">
            <div className="text-center md:text-left bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="text-4xl font-extrabold text-primary mb-1">7+</div>
              <div className="text-sm text-gray-600">Innovative Products</div>
            </div>
            <div className="text-center md:text-left bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="text-4xl font-extrabold text-primary mb-1">50+</div>
              <div className="text-sm text-gray-600">Installations</div>
            </div>
            <div className="text-center md:text-left bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition">
              <div className="text-4xl font-extrabold text-primary mb-1">100%</div>
              <div className="text-sm text-gray-600">Quality Assured</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
