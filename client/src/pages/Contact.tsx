import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, { message: "Name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  subject: z.string().min(2, { message: "Subject is required" }),
  message: z.string().min(10, { message: "Message must be at least 10 characters" }),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

export default function Contact() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Initialize form
  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });
  
  // Form submission handler
  const onSubmit = async (data: ContactFormValues) => {
    setIsSubmitting(true);
    
    try {
      // In a real application, you would send this data to your backend
      console.log("Form data submitted:", data);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Reset form
      form.reset();
      
      // Show success message
      toast({
        title: "Message Sent Successfully",
        description: "We've received your message and will get back to you soon.",
      });
    } catch (error) {
      console.error("Failed to send message:", error);
      toast({
        title: "Failed to Send Message",
        description: "There was an issue sending your message. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
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
        
        {/* Contact Info & Form */}
        <section className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Contact Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h2 className="text-3xl font-heading mb-6 text-primary">CONTACT INFORMATION</h2>
              <p className="text-muted-foreground mb-8">
                We're here to help! Reach out to us through any of the channels below, 
                and we'll get back to you as soon as possible.
              </p>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 mt-1">
                    <MapPin className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading mb-1">Our Location</h3>
                    <p className="text-muted-foreground">
                      123 Taco Street<br />
                      Burrito Hills, CA 90210
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 mt-1">
                    <Phone className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading mb-1">Phone Number</h3>
                    <p className="text-muted-foreground">(555) 123-4567</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Mon-Fri 9am-10pm, Sat-Sun 10am-11pm
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 mt-1">
                    <Mail className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading mb-1">Email Address</h3>
                    <p className="text-muted-foreground">info@themex.com</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      We aim to respond within 24 hours
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-4 mt-1">
                    <Clock className="text-primary h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-heading mb-1">Business Hours</h3>
                    <p className="text-muted-foreground">
                      Monday-Friday: 9am-10pm<br />
                      Saturday-Sunday: 10am-11pm
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Map or Image */}
              <div className="mt-10 rounded-xl overflow-hidden border border-border h-64 relative">
                <img 
                  src="https://images.unsplash.com/photo-1577058005446-f10ecfabf245?auto=format&fit=crop&w=800&h=400" 
                  alt="Restaurant location" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-background/50">
                  <p className="text-foreground px-4 py-2 bg-card rounded-lg border border-border text-sm">
                    Interactive map will be displayed here
                  </p>
                </div>
              </div>
            </motion.div>
            
            {/* Contact Form */}
            <div className="bg-card p-8 rounded-xl border border-border"></div>
              <h2 className="text-3xl font-heading mb-6 text-primary">SEND US A MESSAGE</h2>
              <p className="text-muted-foreground mb-6">
                Fill out the form below with your inquiry and we'll get back to you as soon as possible.
              </p>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="Your email address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="subject"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <FormControl>
                          <Input placeholder="What is your message about?" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="message"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Message</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Your message here..."
                            className="resize-none min-h-[120px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <Button 
                    type="submit" 
                    className="w-full bg-primary hover:bg-primary/90"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center">
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center">
                        Send Message <Send className="ml-2 h-4 w-4" />
                      </span>
                    )}
                  </Button>
                </form>
              </Form>
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
                <h3 className="text-xl font-heading mb-2">Do you offer catering services?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer catering for events of all sizes. Please contact us at least 48 hours in advance 
                  to discuss your needs and arrange for catering.
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
                  We're open Monday through Friday from 9am to 10pm, and Saturday to Sunday from 10am to 11pm.
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