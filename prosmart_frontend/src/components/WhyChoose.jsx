import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const WhyChoose = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        {/* Section Heading */}
        <div className="text-center mb-16 animate-fade-in">
          <Badge
            variant="outline"
            className="mb-4 text-primary border-primary bg-gray-50"
          >
            Why Choose ProSmart
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Experience the <span className="text-primary">ProSmart Advantage</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            When you choose ProSmart, you're partnering with industry leaders
            committed to delivering exceptional value and innovative solutions.
          </p>
        </div>

        {/* Stats Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {[
            { value: "99.9%", label: "System Uptime", note: "Guaranteed reliability" },
            { value: "24/7", label: "Support Available", note: "Round-the-clock assistance" },
            { value: "50+", label: "Installations", note: "Across healthcare facilities" },
            { value: "100%", label: "Quality Assured", note: "Hospital grade standards" },
          ].map((stat, i) => (
            <div
              key={i}
              className={`text-center p-6 bg-gray-50 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up`}
              style={{ animationDelay: `${i * 0.2}s` }}
            >
              <div className="text-4xl font-bold text-primary mb-2">
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 font-medium">{stat.label}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.note}</div>
            </div>
          ))}
        </div>

        {/* Cards Section */}
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              title: "Proven Track Record",
              desc: "Successfully deployed solutions across multiple healthcare and industrial facilities with measurable results.",
            },
            {
              title: "Cutting-Edge Technology",
              desc: "Latest IoT, AI, and sustainable technology integrated into every product we develop and deploy.",
            },
            {
              title: "Comprehensive Support",
              desc: "End-to-end service from consultation and installation to ongoing maintenance and technical support.",
            },
          ].map((item, i) => (
            <Card
              key={i}
              className="bg-white shadow-lg border-0 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${0.2 * (i + 1)}s` }}
            >
              <CardContent className="p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-3">
                  {item.title}
                </h4>
                <p className="text-gray-600">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChoose;
