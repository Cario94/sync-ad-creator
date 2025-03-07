
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowRight, CheckCircle2, Layout, Zap, Users, Shield, Upload } from 'lucide-react';
import AnimatedGradient from '@/components/ui/AnimatedGradient';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';

// Testimonial type
type Testimonial = {
  name: string;
  role: string;
  company: string;
  content: string;
};

// Pricing plan type
type PricingPlan = {
  name: string;
  price: string;
  description: string;
  features: string[];
  popular?: boolean;
};

// Feature type
type Feature = {
  icon: React.ElementType;
  title: string;
  description: string;
};

const Index = () => {
  // Features data
  const features: Feature[] = [
    {
      icon: Layout,
      title: "Visual Workspace",
      description: "Build ad campaigns visually with our intuitive drag & drop interface, making complex campaign structures simple."
    },
    {
      icon: Zap,
      title: "AI-Powered Generation",
      description: "Generate effective ad copy and creative suggestions with our integrated AI assistant based on your brand and goals."
    },
    {
      icon: Upload,
      title: "Seamless Meta Upload",
      description: "Push campaigns directly to Meta Ads Manager with one click, eliminating manual transfers and reducing errors."
    },
    {
      icon: Users,
      title: "Real-Time Collaboration",
      description: "Work simultaneously with team members using live cursors and real-time updates for efficient teamwork."
    },
    {
      icon: Shield,
      title: "Compliance Validation",
      description: "Automatically check ads against Meta's policies before submission to minimize rejections and delays."
    }
  ];

  // Testimonials data
  const testimonials: Testimonial[] = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechGrowth Inc.",
      content: "CampaignSync has transformed how our team builds Facebook campaigns. What used to take days now takes hours, and our approval rates have increased by 40%."
    },
    {
      name: "Michael Chen",
      role: "Agency Owner",
      company: "Digital Spark Agency",
      content: "As an agency managing dozens of client accounts, CampaignSync has become our secret weapon. The visual builder and collaboration features are game-changers."
    },
    {
      name: "Emma Rodriguez",
      role: "E-commerce Manager",
      company: "StyleHouse",
      content: "The AI copy suggestions alone are worth the subscription. We've seen a 25% improvement in our ad performance since switching to CampaignSync."
    }
  ];

  // Pricing plans data
  const pricingPlans: PricingPlan[] = [
    {
      name: "Starter",
      price: "$49",
      description: "Perfect for individuals and small teams getting started with Meta ads.",
      features: [
        "1 Meta Ad Account",
        "5 Campaigns per month",
        "Basic AI copy suggestions",
        "Standard support"
      ]
    },
    {
      name: "Professional",
      price: "$99",
      description: "Ideal for growing businesses with regular ad campaigns.",
      features: [
        "3 Meta Ad Accounts",
        "Unlimited Campaigns",
        "Advanced AI generation",
        "Compliance validation",
        "Real-time collaboration",
        "Priority support"
      ],
      popular: true
    },
    {
      name: "Agency",
      price: "$249",
      description: "For agencies and large teams managing multiple clients.",
      features: [
        "10 Meta Ad Accounts",
        "Unlimited Campaigns",
        "Premium AI features",
        "Advanced analytics",
        "White-labeling",
        "Dedicated success manager"
      ]
    }
  ];

  // Scroll reveal animation
  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '0px',
      threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-up');
          entry.target.classList.remove('opacity-0');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    const animatedElements = document.querySelectorAll('.reveal-animation');
    animatedElements.forEach(el => {
      el.classList.add('opacity-0');
      observer.observe(el);
    });

    return () => {
      animatedElements.forEach(el => {
        observer.unobserve(el);
      });
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <AnimatedGradient />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            <span className="text-gradient">Visualize</span> and <span className="text-gradient">Streamline</span> Your Meta Ad Campaigns
          </h1>
          <p className="text-xl md:text-2xl max-w-3xl mx-auto text-muted-foreground mb-10">
            The all-in-one platform that helps marketers build, optimize, and launch Meta ad campaigns visually, with AI-powered assistance.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
            <Link to="/register">
              <Button size="lg" className="text-base h-12 px-8">
                Get Started Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="outline" className="text-base h-12 px-8">
                Log In
              </Button>
            </Link>
          </div>
          
          <div className="relative mx-auto max-w-5xl bg-card rounded-xl overflow-hidden shadow-lg border border-border/30">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent"></div>
            <img 
              src="https://placehold.co/1200x675/f5f8fc/e2e8f0?text=Campaign+Workspace+Preview" 
              alt="CampaignSync workspace preview" 
              className="w-full h-auto"
            />
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section className="py-20 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal-animation">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Powerful Features for Modern Marketers
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Everything you need to create, optimize, and scale your Meta ad campaigns efficiently.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index} 
                className="glass-morphism p-8 rounded-xl hover:shadow-md reveal-animation"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg mb-6">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal-animation">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by Marketing Teams
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              See what our users are saying about CampaignSync.
            </p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div 
                key={index} 
                className="glass-dark p-8 rounded-xl reveal-animation"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="mb-6">
                  {Array(5).fill(0).map((_, i) => (
                    <span key={i} className="text-primary">★</span>
                  ))}
                </div>
                <p className="mb-6 text-foreground">"{testimonial.content}"</p>
                <div>
                  <p className="font-medium">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {testimonial.role}, {testimonial.company}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Pricing Section */}
      <section className="py-20 px-6 md:px-12 bg-secondary/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 reveal-animation">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Choose the plan that works best for your business needs.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <div 
                key={index} 
                className={`glass-morphism p-8 rounded-xl reveal-animation relative ${
                  plan.popular ? 'ring-2 ring-primary' : ''
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-primary text-primary-foreground px-4 py-1 text-sm font-medium rounded-bl-lg rounded-tr-xl">
                    Most Popular
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-bold">{plan.price}</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <p className="text-muted-foreground mb-6">{plan.description}</p>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mr-3 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/register" className="block w-full">
                  <Button 
                    className="w-full" 
                    variant={plan.popular ? "default" : "outline"}
                  >
                    Get Started
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-5xl mx-auto text-center reveal-animation">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Transform Your Meta Ad Campaigns?
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-10">
            Join thousands of marketers who are saving time and improving results with CampaignSync.
          </p>
          <Link to="/register">
            <Button size="lg" className="text-base h-12 px-10">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Index;
