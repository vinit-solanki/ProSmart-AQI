import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const Products = () => {
  const products = [
    {
      title: "Refresh Bedskin",
      subtitle: "Multi-Layer Hospital Fabric",
      description:
        "The new age multilayer hospital fabric with patent pending technology for enhanced patient comfort and hygiene.",
      badge: "Patent Pending",
    },
    {
      title: "Water Powered LED Emergency Lamp",
      subtitle: "Sustainable Energy Solution",
      description:
        "Revolutionary emergency lighting powered only by water. No batteries, no solar cells required - completely sustainable.",
      badge: "Eco-Friendly",
    },
    {
      title: "Ambient Disinfection Lights",
      subtitle: "APP Controlled UV Sanitization",
      description:
        "Special UV lights that kill viruses and bacteria, completely sanitizing rooms. Fully controllable via mobile app.",
      badge: "App Controlled",
    },
    {
      title: "I.V Alert Alarm",
      subtitle: "Critical Level Monitoring",
      description:
        "Advanced monitoring system that alerts when IV fluid levels drop below critical thresholds, potentially saving lives.",
      badge: "Life Saving",
    },
    {
      title: "Mother Infant Anti Theft Alert",
      subtitle: "Security System",
      description:
        "Comprehensive security solution to prevent infant theft, addressing a critical safety concern in Indian hospitals.",
      badge: "Security",
    },
    {
      title: "Muscle Hand Dynamometer",
      subtitle: "APP Controlled Rehabilitation",
      description:
        "Advanced device for measuring and rehabilitation of muscle strength, fully integrated with mobile app control.",
      badge: "Medical Device",
    },
    {
      title: "Self Heating Food Boxes",
      subtitle: "Hygienic Food Solutions",
      description:
        "Innovative food heating system that keeps food hygienic and at optimal temperature instantly when needed.",
      badge: "Food Safety",
    },
  ];

  return (
    <section id="products" className="py-20 bg-gray-500/20">
      <div className="container mx-auto px-12">
        {/* Section Heading */}
        <div className="text-center mb-16 animate-fade-in">
          <Badge
            variant="outline"
            className="mb-4 text-primary border-primary bg-white"
          >
            Product Portfolio 2024
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Our <span className="text-primary">Smart Solutions</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Discover our comprehensive range of innovative products designed to
            revolutionize healthcare and industrial environments with
            cutting-edge technology.
          </p>
        </div>

        {/* Product Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, index) => (
            <Card
              key={index}
              className="bg-white shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary/30 transform hover:-translate-y-1"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-3 h-3 bg-primary rounded-full"></div>
                  <Badge
                    variant="secondary"
                    className="text-xs bg-gray-100 text-gray-700"
                  >
                    {product.badge}
                  </Badge>
                </div>
                <CardTitle className="text-xl text-gray-900">
                  {product.title}
                </CardTitle>
                <p className="text-sm text-primary font-medium">
                  {product.subtitle}
                </p>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-gray-600 mb-6 leading-relaxed">
                  {product.description}
                </p>
                <Button variant="outline" className="w-full" size="sm">
                  Learn More
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Button size="lg" className="px-8">
            Request Product Catalog
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Products;
