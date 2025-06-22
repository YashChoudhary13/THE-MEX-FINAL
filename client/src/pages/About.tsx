import { motion } from "framer-motion";
import { Clock, MapPin, Award, Users, UtensilsCrossed } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function About() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header hideSearch />
      
      <main className="flex-grow py-12">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-secondary/30 to-background py-20 mb-12">
          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-4xl md:text-6xl font-heading mb-6 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">
                OUR STORY
              </h1>
              <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
                At The Mex, we're passionate about bringing you the most authentic and flavorful Mexican-inspired fast food experience. Our journey began with a simple idea: create delicious, high-quality food that brings people together.
              </p>
            </motion.div>
          </div>
          <div className="absolute inset-0 bg-pattern opacity-10"></div>
        </section>
        
        {/* Our History */}
        <section className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <h2 className="text-3xl font-heading mb-4 text-primary">OUR HUMBLE BEGINNINGS</h2>
                <p className="text-muted-foreground mb-4">
                  The MEX began as a cozy food spot with a big mission — to bring bold, handcrafted Mexican flavors to every plate. Over the years, The MEX has grown into a vibrant destination for those who crave something real — food that’s comforting, crave-worthy, and packed with personality. Whether it’s cheesy quesadillas, spicy birria tacos, or refreshing house drinks, the goal has always been the same: serve up unforgettable flavor in every bite.
                </p>
                <div className="flex items-center gap-2 text-primary mt-6">
                  <Clock className="h-5 w-5" />
                  <span className="text-sm font-medium">Established in 2022</span>
                </div>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="rounded-xl overflow-hidden border border-border"
              >
                <img 
                  src="https://res.cloudinary.com/dva2pren5/image/upload/v1750590923/473923969_921955426731378_1623534966545710942_n.jpg_vv3rdl.jpg?auto=format&fit=crop&w=800&h=600" 
                  alt="Restaurant interior" 
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>
          </div>
        </section>
        
        {/* Our Values */}
        <section className="bg-gradient-to-r from-secondary/10 to-background py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-heading mb-4 bg-gradient-to-r from-primary to-primary-foreground bg-clip-text text-transparent">OUR VALUES</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                The principles that guide every dish we serve and every customer interaction we have.
              </p>
            </div>
            
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UtensilsCrossed className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-heading mb-2">Quality Ingredients</h3>
                <p className="text-muted-foreground text-sm">We source only the freshest, highest-quality ingredients for our dishes.</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-heading mb-2">Community Focus</h3>
                <p className="text-muted-foreground text-sm">We're committed to giving back to the community that has supported us.</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-heading mb-2">Culinary Excellence</h3>
                <p className="text-muted-foreground text-sm">We strive for perfection in every dish we create, combining tradition with innovation.</p>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-card p-6 rounded-xl border border-border"
              >
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <MapPin className="text-primary h-6 w-6" />
                </div>
                <h3 className="text-xl font-heading mb-2">Local Impact</h3>
                <p className="text-muted-foreground text-sm">We partner with local suppliers and work to minimize our environmental footprint.</p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}