import ContactForm from "@components/contact-form";
import { MessageCircle, Phone, Mail, MapPin, Clock, Users, Sparkles } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us - Get in Touch | GoodHive",
  description:
    "Contact the GoodHive team for support, partnerships, or questions about our Web3 recruitment platform. We're here to help you succeed in the decentralized economy.",
  keywords:
    "contact GoodHive, Web3 platform support, blockchain recruitment contact, crypto job platform help, decentralized hiring support",
};

export default function ContactFormPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute inset-0">
        {/* Honeycomb Pattern */}
        <div className="absolute top-0 left-0 w-full h-full opacity-5">
          <div className="grid grid-cols-12 gap-4 transform rotate-12 scale-150 -translate-x-8 -translate-y-8">
            {Array.from({ length: 144 }, (_, i) => (
              <div
                key={i}
                className="w-8 h-8 border-2 border-amber-300 transform rotate-45"
              ></div>
            ))}
          </div>
        </div>

        {/* Animated Flying Bees */}
        <div className="absolute top-1/4 left-1/4 w-12 h-12 opacity-80">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "0s", animationDuration: "3s" }}
          >
            <span className="text-4xl">🐝</span>
          </div>
          <div className="absolute top-0 left-0 w-full h-full animate-ping opacity-20">
            <div className="w-full h-full bg-amber-400 rounded-full"></div>
          </div>
        </div>

        <div className="absolute top-1/3 right-1/4 w-10 h-10 opacity-70">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "1.5s", animationDuration: "4s" }}
          >
            <span className="text-3xl">🐝</span>
          </div>
        </div>

        <div className="absolute bottom-1/4 left-1/3 w-8 h-8 opacity-60">
          <div
            className="relative animate-bounce"
            style={{ animationDelay: "3s", animationDuration: "5s" }}
          >
            <span className="text-2xl">🐝</span>
          </div>
        </div>

        {/* Floating Pollen Particles */}
        <div className="absolute top-20 left-20 w-2 h-2 bg-yellow-300 rounded-full animate-ping opacity-40"></div>
        <div
          className="absolute top-32 right-32 w-1 h-1 bg-amber-400 rounded-full animate-ping opacity-30"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute bottom-32 left-32 w-1.5 h-1.5 bg-orange-300 rounded-full animate-ping opacity-25"
          style={{ animationDelay: "2.5s" }}
        ></div>
      </div>

      <div className="relative container mx-auto px-6 py-20">
        <div className="max-w-7xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-16">
            {/* Badge */}
            <div className="inline-flex items-center bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4 mr-2" />
              Let's Connect
            </div>

            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
              Get in Touch with Our
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-600">
                Hive Community
              </span>
            </h1>

            {/* Description */}
            <p className="text-xl text-gray-700 mb-8 leading-relaxed max-w-3xl mx-auto">
              Ready to join the future of Web3 recruitment? We'd love to hear from you. 
              Whether you're a talented developer or a company looking for top-tier talent, 
              our team is here to help you succeed.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Information */}
            <div className="space-y-8">
              {/* Contact Methods */}
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-amber-200 p-8 relative overflow-hidden">
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-400 bg-opacity-20 rounded-full"></div>
                
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <MessageCircle className="w-6 h-6 mr-3 text-amber-500" />
                  Ways to Reach Us
                </h2>
                
                <div className="space-y-6">
                  <div className="flex items-center space-x-4 p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 transition-colors duration-300">
                    <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                      <Mail className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Email Us</h3>
                      <p className="text-gray-600">contact@goodhive.io</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 transition-colors duration-300">
                    <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                      <Phone className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Schedule a Call</h3>
                      <p className="text-gray-600">Book a 15-minute consultation</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4 p-4 rounded-2xl bg-amber-50 hover:bg-amber-100 transition-colors duration-300">
                    <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Join Our Community</h3>
                      <p className="text-gray-600">Connect on social media</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Business Hours */}
              <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-amber-200 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-amber-500" />
                  Response Time
                </h2>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100">
                    <div className="text-2xl font-bold text-amber-600 mb-1">24h</div>
                    <div className="text-sm text-gray-600">Email Response</div>
                  </div>
                  <div className="text-center p-4 rounded-2xl bg-gradient-to-br from-amber-100 to-yellow-100">
                    <div className="text-2xl font-bold text-amber-600 mb-1">Same Day</div>
                    <div className="text-sm text-gray-600">Call Scheduling</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white bg-opacity-60 backdrop-blur-sm rounded-3xl shadow-xl border-2 border-amber-200 p-8 lg:p-12 relative overflow-hidden">
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-yellow-400 bg-opacity-15 rounded-full"></div>
              
              <div className="relative">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                  <span className="text-2xl mr-3">🍯</span>
                  Send Us a Message
                </h2>
                
                <p className="text-gray-600 mb-8">
                  Fill out the form below and we'll get back to you as soon as possible. 
                  We're excited to learn more about your needs!
                </p>
                
                <ContactForm />
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="mt-16 text-center">
            <div className="bg-gradient-to-r from-amber-500 to-yellow-500 rounded-3xl p-8 shadow-xl">
              <h3 className="text-2xl font-bold text-white mb-4">
                Ready to Transform Your Career or Team?
              </h3>
              <p className="text-amber-100 mb-6 max-w-2xl mx-auto">
                Join thousands of Web3 professionals and companies who trust GoodHive 
                to make the perfect match in the decentralized economy.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a
                  href="/talents/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-white text-amber-600 font-semibold rounded-2xl hover:bg-amber-50 transform hover:-translate-y-1 transition-all duration-300 shadow-lg"
                >
                  <Users className="w-5 h-5 mr-2" />
                  Find Talent
                </a>
                <a
                  href="/companies/register"
                  className="inline-flex items-center justify-center px-8 py-4 bg-amber-600 text-white font-semibold rounded-2xl hover:bg-amber-700 transform hover:-translate-y-1 transition-all duration-300 shadow-lg"
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Join as Company
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
