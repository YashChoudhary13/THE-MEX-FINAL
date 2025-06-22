import { useLocation } from "wouter";
import { Facebook, Instagram, Twitter, Mail, Phone, Truck, Clock, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function Footer() {
  const [, navigate] = useLocation();
  
  return (
    <footer className="bg-card border-t border-border text-foreground py-8 sm:py-12 lg:py-16">
      <div className="container mx-auto px-4 sm:px-6">
        {/* Top Section with Logo and Links */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 sm:mb-12">
          <div className="flex items-center mb-6 md:mb-0">
            <div className="bg-primary/10 p-2 sm:p-3 rounded-full mr-3 sm:mr-4">
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="h-6 w-6 sm:h-8 sm:w-8 text-primary"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl text-primary">THE MEX</h3>
          </div>
          
          <div className="flex flex-wrap gap-2 sm:gap-4">
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary font-menu text-sm sm:text-base h-9 px-2 sm:px-4"
              onClick={() => navigate("/")}
            >
              HOME
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary font-menu text-sm sm:text-base h-9 px-2 sm:px-4"
              onClick={() => navigate("/about")}
            >
              ABOUT
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary font-menu text-sm sm:text-base h-9 px-2 sm:px-4"
              onClick={() => navigate("/contact")}
            >
              CONTACT
            </Button>
            <Button 
              variant="ghost" 
              className="text-foreground hover:text-primary font-menu text-sm sm:text-base h-9 px-2 sm:px-4"
              onClick={() => navigate("/track-order")}
            >
              TRACK ORDER
            </Button>
          </div>
        </div>
        
        {/* Main Footer Content */}
        <div className="w-full max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 sm:gap-10">

          {/* About Us Section */}
          <div className="space-y-4">
            <h4 className="font-heading text-lg sm:text-xl text-primary">ABOUT US</h4>
            <p className="text-muted-foreground text-sm sm:text-base">
              A new bistro in Cobh, serving Mexican style food and drinks. All of our food is made from scratch with fresh ingredients. Our meat is slow cooked and we make all of our sauces in-house. We also serve coffee and tea!
            </p>
            <div className="flex space-x-3">
              <a href="https://www.facebook.com/themexcobh" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-primary/20 text-primary hover:text-primary hover:bg-primary/10 hover:border-primary">
                  <Facebook className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </a>

              <a href="https://www.instagram.com/themexcobh/" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-primary/20 text-primary hover:text-primary hover:bg-primary/10 hover:border-primary">
                  <Instagram className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </a>

              <a href="https://twitter.com/yourhandle" target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full border-primary/20 text-primary hover:text-primary hover:bg-primary/10 hover:border-primary">
                  <Twitter className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              </a>

            </div>
          </div>
          
          {/* Opening Hours Section */}
          <div className="space-y-4">
            <h4 className="font-heading text-lg sm:text-xl text-primary">OPENING HOURS</h4>
            <ul className="space-y-3 text-muted-foreground text-sm sm:text-base">
              <li className="flex items-start">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Monday, Wednesday - Thursday</p>
                  <p className="text-sm">12:00 - 18:50</p>
                </div>
              </li>
              <li className="flex items-start">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Friday - Saturday</p>
                  <p className="text-sm">12:00 - 19:50</p>
                </div>
              </li>
              <li className="flex items-start">
                <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Sunday</p>
                  <p className="text-sm">12:00 - 18:50</p>
                </div>
              </li>
              <li className="flex items-start">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <div>
                  <p className="font-medium text-foreground">Pickup Hours</p>
                  <p className="text-sm">Same as Opening Hours</p>
                </div>
              </li>
            </ul>
          </div>
          
          {/* Contact Us Section */}
          <div className="space-y-4">
            <h4 className="font-heading text-lg sm:text-xl text-primary">CONTACT US</h4>
            <ul className="space-y-3 text-muted-foreground text-sm sm:text-base">
              <li className="flex items-start">
                <MapPin className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <p>14 Pearse Square, Cobh, Co. Cork, P24 TH29</p>
              </li>
              <li className="flex items-start">
                <Phone className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <a href="tel:+353214908367" className="hover:text-primary transition">+353 21 490 8367</a>
              </li>
              <li className="flex items-start">
                <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-primary mt-0.5 mr-2 sm:mr-3 flex-shrink-0" />
                <a href="mailto:themexcobh@gmail.com" className="hover:text-primary transition">themexcobh@gmail.com</a>
              </li>
            </ul>
          </div>
      </div>
        
        {/* Bottom Footer */}
        <div className="border-t border-border mt-8 sm:mt-12 pt-6 sm:pt-8 text-center">
          <p className="text-muted-foreground text-xs sm:text-sm">
            &copy; {new Date().getFullYear()} THE MEX. All rights reserved. Made with 🔥 for food lovers.
          </p>
        </div>
      </div>
    </footer>
  );
}
