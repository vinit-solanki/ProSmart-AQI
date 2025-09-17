import professionalImage from "@/assets/professional-worker.jpg";
import industrialImage from "@/assets/industrial-welding.jpg";

const About = () => {
  return (
    <section id="about" className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight">
            About <span className="text-primary">ProSmart</span>
          </h2>
          <p className="mt-6 text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Leading the future of smart technology solutions with innovative products 
            that make a real difference in healthcare and industrial environments.
          </p>
        </div>

        {/* Content Grid */}
        <div className="grid md:grid-cols-2 gap-16 items-center">
          {/* Left Content */}
          <div>
            <h3 className="text-3xl font-bold text-gray-900 mb-6">
              Transforming Industries Through Smart Innovation
            </h3>
            <p className="text-gray-600 mb-4 leading-relaxed">
              ProSmart specializes in developing cutting-edge technology solutions that address 
              critical challenges in healthcare and industrial sectors. Our products are designed 
              with one goal in mind: to save lives and improve operational efficiency.
            </p>
            <p className="text-gray-600 mb-8 leading-relaxed">
              From water-powered LED emergency systems to AI-controlled disinfection lights, 
              our innovative approach combines sustainability with advanced technology to 
              create solutions that are both effective and environmentally responsible.
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                <div className="text-3xl font-extrabold text-primary mb-1">7+</div>
                <div className="text-sm text-gray-500">Products</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                <div className="text-3xl font-extrabold text-primary mb-1">50+</div>
                <div className="text-sm text-gray-500">Installations</div>
              </div>
              <div className="text-center p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition">
                <div className="text-3xl font-extrabold text-primary mb-1">100%</div>
                <div className="text-sm text-gray-500">Quality</div>
              </div>
            </div>
          </div>

          {/* Right Images */}
          <div className="grid grid-cols-2 gap-4">
            <img
              src={professionalImage}
              alt="Professional worker in industrial setting"
              className="rounded-2xl object-cover h-72 w-full shadow-md hover:scale-105 transition-transform"
            />
            <img
              src={industrialImage}
              alt="Industrial welding and manufacturing"
              className="rounded-2xl object-cover h-72 w-full shadow-md hover:scale-105 transition-transform mt-8"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
