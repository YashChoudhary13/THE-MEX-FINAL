import { useLocation } from "wouter";
import { Facebook, Instagram, Twitter, Mail, Phone, Truck, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  const [, navigate] = useLocation();
  
  return (
    <footer className="bg-card border-t border-border text-foreground py-16">
      <div className="container mx-auto px-4">
        {/* Top Section with Logo and Links */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
          <div className="flex items-center mb-6 md:mb-0">
            <div className="bg-primary/10 p-3 rounded-full mr-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-8 w-8 text-primary"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-heading text-3xl text-primary">BURGER HUB</h3>
          </div>
          
          <div className="flex flex-wrap gap-4">
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary font-menu"
              onClick={() => navigate("/")}
            >
              HOME
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary font-menu"
              onClick={() => navigate("/about")}
            >
              ABOUT
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary font-menu"
              onClick={() => navigate("/contact")}
            >
              CONTACT
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary font-menu"
              onClick={() => navigate("/promotions")}
            >
              PROMOTIONS
            </Button>
          </div>
        </div>
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          <div>
            <h4 className="font-heading text-xl text-primary mb-6">ABOUT US</h4>
            <p className="text-muted-foreground mb-6">
              Serving up the juiciest, flame-grilled burgers since 2015. Our mission is to deliver the ultimate fast food experience with quality ingredients and bold flavors.
            </p>
            <div className="flex space-x-4">
              <Button variant="outline" size="icon" className="rounded-full border-primary/20 text-primary hover:text-primary hover:bg-primary/10 hover:border-primary">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-primary/20 text-primary hover:text-primary hover:bg-primary/10 hover:border-primary">
                <Instagram className="h-5 w-5" />
              </Button>
              <Button variant="outline" size="icon" className="rounded-full border-primary/20 text-primary hover:text-primary hover:bg-primary/10 hover:border-primary">
                <Twitter className="h-5 w-5" />
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="font-heading text-xl text-primary mb-6">OPENING HOURS</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <Clock className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">Weekdays</p>
                  <p>11:00 AM - 11:00 PM</p>
                </div>
              </li>
              <li className="flex items-start">
                <Clock className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">Weekends</p>
                  <p>10:00 AM - 2:00 AM</p>
                </div>
              </li>
              <li className="flex items-start">
                <Truck className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground mb-1">Delivery Hours</p>
                  <p>11:00 AM - 1:00 AM</p>
                </div>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading text-xl text-primary mb-6">CONTACT US</h4>
            <ul className="space-y-4 text-muted-foreground">
              <li className="flex items-start">
                <MapPin className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                <p>123 Burger Street, Fast Food District, FF 12345</p>
              </li>
              <li className="flex items-start">
                <Phone className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                <a href="tel:+15551234567" className="hover:text-primary transition">(555) 123-4567</a>
              </li>
              <li className="flex items-start">
                <Mail className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" />
                <a href="mailto:info@burgerhub.com" className="hover:text-primary transition">info@burgerhub.com</a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading text-xl text-primary mb-6">NEWSLETTER</h4>
            <p className="text-muted-foreground mb-4">Subscribe for exclusive offers, new menu items, and secret menu hacks.</p>
            <div className="flex mb-6">
              <Input
                type="email"
                placeholder="Your email"
                className="bg-transparent border-border rounded-r-none focus-visible:ring-primary"
              />
              <Button className="bg-primary hover:bg-primary/90 rounded-l-none font-menu">
                SEND
              </Button>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                variant="outline" 
                className="border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary text-foreground"
              >
                <div className="flex items-center">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary mr-2" fill="currentColor">
                    <path d="M17.5 12.5c0-1.31-.94-2.5-2.24-2.5s-2.26 1.19-2.26 2.5v1.5h-1v-1.5c0-1.31-.94-2.5-2.24-2.5s-2.26 1.19-2.26 2.5v9h10v-9zm-10-6.5v-2c0-2.21 1.79-4 4-4s4 1.79 4 4v2h2v-2c0-3.31-2.69-6-6-6s-6 2.69-6 6v2h2z"/>
                  </svg>
                  <span className="text-sm font-medium">App Store</span>
                </div>
              </Button>
              <Button 
                variant="outline" 
                className="border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary text-foreground"
              >
                <div className="flex items-center">
                  <svg viewBox="0 0 24 24" className="h-5 w-5 text-primary mr-2" fill="currentColor">
                    <path d="M3 20.5v-17c0-.83.67-1.5 1.5-1.5h11c.83 0 1.5.67 1.5 1.5v17c0 .83-.67 1.5-1.5 1.5h-11c-.83 0-1.5-.67-1.5-1.5zm2.5-15.5h-1v14h1v-14zm14 3h-8v1h8v-1zm0 3h-8v1h8v-1zm0 3h-8v1h8v-1z"/>
                  </svg>
                  <span className="text-sm font-medium">Google Play</span>
                </div>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom Footer */}
        <div className="border-t border-border mt-12 pt-8 text-center">
          <p className="text-muted-foreground text-sm">
            &copy; {new Date().getFullYear()} BURGER HUB. All rights reserved. Made with 🔥 for hungry people.
          </p>
        </div>
      </div>
    </footer>
  );
}
