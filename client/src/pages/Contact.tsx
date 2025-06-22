import { motion } from "framer-motion";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin, Phone, Mail, Clock } from "lucide-react";

export default function Contact() {
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header hideSearch />
      
      <main className="flex-grow py-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-secondary/30 to-background py-16 mb-12">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-4xl md:text-6xl font-heading mb-6 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                GET IN TOUCH
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                Have a question, feedback, or want to place a large order? We'd love to hear from you. 
                Our team is ready to assist you with anything you need.
              </p>
            </motion.div>
          </div>
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
        </section>
        
        {/* Contact Information */}
        <section className="container mx-auto px-4 py-16">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="text-center mb-12">
                <h2 className="text-4xl font-heading mb-4 text-primary">CONTACT INFORMATION</h2>
                <p className="text-muted-foreground text-lg max-w-3xl mx-auto leading-relaxed">
                  We're here to help! Reach out to us through any of the channels below, 
                  and we'll get back to you as soon as possible.
                </p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-10 mb-12">
                <div className="flex items-start p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <MapPin className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading mb-2 text-foreground">Our Location</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      14 Pearse Square, Cobh, Co.<br />
                      Cork, P24 TH29
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <Phone className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading mb-2 text-foreground">Phone Number</h3>
                    <p className="text-muted-foreground text-lg font-medium mb-1">+353 21 490 8367</p>
                    <p className="text-sm text-muted-foreground">
                      During Opening Hours
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <Mail className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading mb-2 text-foreground">Email Address</h3>
                    <p className="text-muted-foreground text-lg font-medium mb-1">themexcobh@gmail.com</p>
                    <p className="text-sm text-muted-foreground">
                      We aim to respond within 24 hours
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start p-6 bg-card rounded-xl border border-border hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mr-4 flex-shrink-0">
                    <Clock className="text-primary h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-heading mb-2 text-foreground">Business Hours</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Monday, Wednesday - Thursday:	12:00 - 18:50<br />
                      Friday - Saturday	12:00 - 19:50<br/>
                      Sunday	12:00 - 18:50

                    </p>
                  </div>
                </div>
              </div>
              
              {/* Interactive Map */}
              <div className="rounded-xl overflow-hidden border border-border h-64 relative">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d1232.2849559232814!2d-8.294414!3d51.85055!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x484483419563c96f%3A0x5212f00f5a70feab!2sThe%20Mex!5e0!3m2!1sen!2sus!4v1750591704042!5m2!1sen!2sus"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                ></iframe>
              </div>

            </motion.div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section className="bg-gradient-to-r from-secondary/10 to-background py-16 mt-12">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading mb-4 text-primary">FREQUENTLY ASKED QUESTIONS</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Find answers to our most commonly asked questions. If you can't find what you're looking for, 
                feel free to contact us directly.
              </p>
            </div>
            
            <div className="max-w-3xl mx-auto space-y-6">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3 }}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <h3 className="text-xl font-heading mb-2">Do you offer takeaway or delivery?</h3>
                <p className="text-muted-foreground">
                  We currently offer takeaway only. You can place your order online and pick it up fresh and ready at our restaurant.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <h3 className="text-xl font-heading mb-2">What are your business hours?</h3>
                <p className="text-muted-foreground">
                  We're open:
                  <ul> 
                    <li>Monday, Wednesday & Thursday from 12:00 PM to 6:50 PM</li>
                    <li>Friday & Saturday from 12:00 PM to 7:50 PM</li>
                    <li>Sunday from 12:00 PM to 6:50 PM</li>
                  </ul>

                  We’re closed on Tuesdays — rest day for the crew!
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <h3 className="text-xl font-heading mb-2">Do you have vegetarian options?</h3>
                <p className="text-muted-foreground">
                  Absolutely! We have a variety of vegetarian options on our menu. Just look for items marked with 
                  a (V) or ask our staff for recommendations.
                </p>
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: 0.3 }}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <h3 className="text-xl font-heading mb-2">What payment methods do you accept?</h3>
                <p className="text-muted-foreground">
                  We accept all major credit cards, cash, and most mobile payment methods including Apple Pay and Google Pay.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}