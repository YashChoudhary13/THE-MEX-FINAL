import { useLocation } from "wouter";
import { Facebook, Instagram, Twitter, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  const [, navigate] = useLocation();
  
  return (
    <footer className="bg-secondary text-white py-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Flavor Haven</h3>
            <p className="text-gray-300 text-sm">Experience culinary excellence delivered to your doorstep. Our mission is to bring restaurant-quality meals to your home.</p>
            <div className="flex mt-4 space-x-4">
              <Button variant="ghost" size="icon" className="text-white hover:text-primary transition p-0 h-auto">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:text-primary transition p-0 h-auto">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-white hover:text-primary transition p-0 h-auto">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Opening Hours</h3>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex justify-between">
                <span>Monday - Friday</span>
                <span>11:00 AM - 10:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Saturday</span>
                <span>10:00 AM - 11:00 PM</span>
              </li>
              <li className="flex justify-between">
                <span>Sunday</span>
                <span>10:00 AM - 9:00 PM</span>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-2">Contact</h4>
              <div className="text-gray-300 text-sm">
                <div className="flex items-center mb-1">
                  <Phone className="h-4 w-4 mr-2" />
                  <a href="tel:+15551234567" className="hover:text-primary">(555) 123-4567</a>
                </div>
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <a href="mailto:info@flavorhaven.com" className="hover:text-primary">info@flavorhaven.com</a>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-heading font-bold text-lg mb-4">Newsletter</h3>
            <p className="text-gray-300 text-sm mb-3">Subscribe to get special offers and news about upcoming events.</p>
            <form className="flex">
              <Input
                type="email"
                placeholder="Your email"
                className="flex-1 p-2 rounded-l focus:outline-none focus:ring-primary text-dark"
              />
              <Button className="bg-primary hover:bg-primary/90 text-white rounded-l-none">
                Subscribe
              </Button>
            </form>
            <div className="mt-4">
              <h4 className="font-medium text-sm mb-2">Download Our App</h4>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  className="text-white border-gray-600 hover:border-white hover:bg-transparent"
                >
                  <div className="flex items-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white mr-2" fill="currentColor">
                      <path d="M17.5 12.5c0-1.31-.94-2.5-2.24-2.5s-2.26 1.19-2.26 2.5v1.5h-1v-1.5c0-1.31-.94-2.5-2.24-2.5s-2.26 1.19-2.26 2.5v9h10v-9zm-10-6.5v-2c0-2.21 1.79-4 4-4s4 1.79 4 4v2h2v-2c0-3.31-2.69-6-6-6s-6 2.69-6 6v2h2z"/>
                    </svg>
                    <div className="text-left">
                      <span className="text-gray-400 text-xs block leading-tight">Download on the</span>
                      <span className="text-white text-sm font-medium">App Store</span>
                    </div>
                  </div>
                </Button>
                <Button 
                  variant="outline" 
                  className="text-white border-gray-600 hover:border-white hover:bg-transparent"
                >
                  <div className="flex items-center">
                    <svg viewBox="0 0 24 24" className="h-5 w-5 text-white mr-2" fill="currentColor">
                      <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5h11c.83 0 1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5h-11c-.83 0-1.5-.67-1.5-1.5zm2.5-15.5h-1v14h1v-14zm14 3h-8v1h8v-1zm0 3h-8v1h8v-1zm0 3h-8v1h8v-1z"/>
                    </svg>
                    <div className="text-left">
                      <span className="text-gray-400 text-xs block leading-tight">GET IT ON</span>
                      <span className="text-white text-sm font-medium">Google Play</span>
                    </div>
                  </div>
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-6 text-center text-gray-400 text-xs">
          <p>&copy; {new Date().getFullYear()} Flavor Haven. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
