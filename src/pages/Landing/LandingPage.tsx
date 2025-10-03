import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  FileText,
  AlertTriangle,
  Search,
  Target,
  Eye,
  CheckSquare,
  ArrowRight,
  Check,
  Star,
  Users,
  Building,
  Globe,
  Zap,
  BarChart3,
  Lock,
  Play,
  MapPin,
  Phone,
  Mail,
  Instagram,
  Youtube,
  Twitter,
  Facebook,
  Linkedin
} from 'lucide-react';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import Navbar from '../../components/Navbar';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const modules = [
    {
      id: 'ptw',
      name: 'Permit to Work',
      icon: FileText,
      description: 'Comprehensive work permit management with digital approvals and safety checklists',
      features: ['Digital Permits', 'Multi-step Approvals', 'Safety Checklists', 'Auto Reminders'],
      price: 99,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'ims',
      name: 'Incident Management',
      icon: AlertTriangle,
      description: 'Complete incident reporting, investigation, and corrective action tracking',
      features: ['Incident Reporting', 'Investigation Tools', 'Root Cause Analysis', 'Action Tracking'],
      price: 129,
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'hazop',
      name: 'HAZOP Studies',
      icon: Search,
      description: 'Hazard and Operability studies with AI-powered risk identification',
      features: ['Study Management', 'Node Analysis', 'AI Suggestions', 'Risk Assessment'],
      price: 149,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'hira',
      name: 'HIRA Assessment',
      icon: Target,
      description: 'Hazard Identification and Risk Assessment with automated scoring',
      features: ['Risk Scoring', 'Hazard Database', 'Control Measures', 'Risk Matrix'],
      price: 119,
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'bbs',
      name: 'Behavior Based Safety',
      icon: Eye,
      description: 'Behavioral observation and safety culture improvement tracking',
      features: ['Observation Forms', 'Behavior Tracking', 'Safety Culture', 'Trend Analysis'],
      price: 89,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'audit',
      name: 'Safety Audits',
      icon: CheckSquare,
      description: 'Comprehensive safety auditing with compliance tracking and reporting',
      features: ['Audit Checklists', 'Compliance Tracking', 'Finding Management', 'Reports'],
      price: 109,
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  const handleModuleSelect = (moduleId: string) => {
    setSelectedModules(prev => 
      prev.includes(moduleId) 
        ? prev.filter(id => id !== moduleId)
        : [...prev, moduleId]
    );
  };

  const getTotalPrice = () => {
    return selectedModules.reduce((total, moduleId) => {
      const module = modules.find(m => m.id === moduleId);
      return total + (module?.price || 0);
    }, 0);
  };

  const handleProceedToPayment = () => {
    if (selectedModules.length === 0) {
      alert('Please select at least one module');
      return;
    }
    
    // Store selected modules in localStorage for payment process
    localStorage.setItem('selectedModules', JSON.stringify(selectedModules));
    localStorage.setItem('totalAmount', getTotalPrice().toString());
    
    navigate('/register');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <Navbar />

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6"
            >
              Complete Safety Management
              <span className="text-blue-600"> Platform</span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto"
            >
              Streamline your safety operations with our comprehensive SaaS platform. 
              Manage permits, incidents, audits, and more with AI-powered insights.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Button size="lg" icon={Play} onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}>
                Explore Modules
              </Button>
              <Button size="lg" variant="secondary" as={Link} to="/demo">
                Watch Demo
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-500/10 rounded-full animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-500/10 rounded-full animate-bounce"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-green-500/10 rounded-full animate-ping"></div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: 'Companies Trust Us', value: '500+', icon: Building },
              { label: 'Safety Incidents Prevented', value: '10K+', icon: Shield },
              { label: 'Active Users', value: '25K+', icon: Users },
              { label: 'Countries', value: '15+', icon: Globe }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="text-center"
              >
                <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
                <div className="text-gray-600 dark:text-gray-300">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules Section */}
      <section id="modules" className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Safety Modules
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Select the modules that fit your organization's needs. Mix and match to create your perfect safety solution.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {modules.map((module, index) => (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card 
                  className={`p-6 cursor-pointer transition-all duration-300 ${
                    selectedModules.includes(module.id) 
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                      : 'hover:shadow-lg'
                  }`}
                  onClick={() => handleModuleSelect(module.id)}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-lg bg-gradient-to-r ${module.color}`}>
                      <module.icon className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-2xl font-bold text-gray-900 dark:text-white">
                        ${module.price}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">/month</span>
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                    {module.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    {module.description}
                  </p>
                  
                  <ul className="space-y-2 mb-6">
                    {module.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center space-x-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="flex items-center justify-center">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      selectedModules.includes(module.id)
                        ? 'bg-blue-500 border-blue-500'
                        : 'border-gray-300 dark:border-gray-600'
                    }`}>
                      {selectedModules.includes(module.id) && (
                        <Check className="h-4 w-4 text-white" />
                      )}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Pricing Summary */}
          {selectedModules.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-lg max-w-md mx-auto"
            >
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selected Modules ({selectedModules.length})
              </h3>
              <div className="space-y-2 mb-4">
                {selectedModules.map(moduleId => {
                  const module = modules.find(m => m.id === moduleId);
                  return (
                    <div key={moduleId} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{module?.name}</span>
                      <span className="font-medium">${module?.price}/month</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-blue-600">${getTotalPrice()}/month</span>
                </div>
                <Button 
                  className="w-full" 
                  size="lg" 
                  icon={ArrowRight}
                  onClick={handleProceedToPayment}
                >
                  Proceed to Payment
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose TSM Digitech?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: 'AI-Powered Insights',
                description: 'Get intelligent recommendations and automated risk assessments powered by advanced AI.'
              },
              {
                icon: BarChart3,
                title: 'Real-time Analytics',
                description: 'Monitor safety KPIs and trends with comprehensive dashboards and reporting.'
              },
              {
                icon: Lock,
                title: 'Enterprise Security',
                description: 'Bank-grade security with role-based access control and data encryption.'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="text-center"
              >
                <div className="bg-blue-100 dark:bg-blue-900/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Trusted by Industry Leaders
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: 'Sarah Johnson',
                role: 'Safety Manager, TechCorp',
                content: 'TSM Digitech has transformed our safety operations. The incident management module alone has reduced our response time by 60%.',
                rating: 5
              },
              {
                name: 'Michael Chen',
                role: 'Plant Head, Manufacturing Inc',
                content: 'The permit to work system is incredibly intuitive. Our workers love the digital interface and automated reminders.',
                rating: 5
              },
              {
                name: 'Emily Rodriguez',
                role: 'HSE Director, Energy Solutions',
                content: 'The AI-powered risk assessments have helped us identify potential hazards we might have missed. Excellent platform!',
                rating: 5
              }
            ].map((testimonial, index) => (
              <motion.div
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
              >
                <Card className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {testimonial.role}
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Transform Your Safety Operations?
            </h2>
            <p className="text-xl text-blue-100 mb-8">
              Join thousands of companies already using TSM Digitech to create safer workplaces.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                variant="secondary"
                onClick={() => document.getElementById('modules')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Select Modules
              </Button>
            <Link to="/register">
            <Button
                size="lg"
                className="bg-gray-400 text-blue-600 hover:bg-gray-300"
            >
                Start Free Trial
            </Button>
            </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">TSM Digitech</h3>
              <p className="text-gray-400">Where Cutting-Edge Technology Meets Uncompromising Safety</p>
              <div className="flex space-x-4 mt-4 ">
              <a
                href="https://in.linkedin.com/company/thesafetymaster"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 hover:text-blue-800 transition-colors"
              >
                <Linkedin className="w-6 h-6" />
              </a>

              <a
                href="https://www.facebook.com/thesafetymaster"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Facebook className="w-6 h-6" />
              </a>

              <a
                href="https://twitter.com/thsafetymaster"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ffffff] hover:text-[#daf1ff] transition-colors"
              >
                <Twitter className="w-6 h-6" />
              </a>  

              <a
                href="https://www.youtube.com/channel/UCfBqBnuUfcMlORvhBaft7yA"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#f14d4d] hover:text-red-800 transition-colors"
              >
                <Youtube className="w-6 h-6" />
              </a>  

              <a
                href="https://api.whatsapp.com/send/?phone=917665231743&text&type=phone_number&app_absent=0"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#40db62] hover:text-green-800 transition-colors"
              >
                <Phone className="w-6 h-6" />
              </a>  
              <a
                href="https://www.instagram.com/thesafetymaster_tsm/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-pink-700 hover:text-pink-800 transition-colors"
              >
                <Instagram className="w-6 h-6" />
              </a>  



              <a
                href="info@thesafetymaster.com"
                className="text-[#D44638] hover:text-red-600 transition-colors"
              >
                {/* <Mail className="w-6 h-6" /> */}
              </a>
            </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><a href="#about" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#modules" className="text-gray-400 hover:text-white transition-colors">Solutions</a></li>
                <li><a href="#industries" className="text-gray-400 hover:text-white transition-colors">Industries</a></li>
                <li><a href="#contact" className="text-gray-400 hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Contact</h4>
              <a href="mailto:info@thesafetymaster.com" className="flex items-center text-gray-400 cursor-pointer hover:text-blue-500">
            <Mail className="w-4 h-5 mr-2 text-white" />
            <p>info@thesafetymaster.com</p>
          </a>
              <a href="tel:+917665231743" className="flex items-center text-gray-400 cursor-pointer hover:text-blue-500">
            <Phone className="w-3 h-4 mr-2 text-white" />
            <p>+91 7665231743</p>
          </a>
           {/* Phone Number 2 */}
           <a href="tel:+919413882016" className="flex items-center text-gray-400 cursor-pointer hover:text-blue-500">
            <Phone className="w-3 h-4 mr-2 text-white" />
            <p>+91 9413882016</p>
          </a>
           {/* Address */}
         <a
          href="https://www.google.com/maps/search/?q=Unit+No+221,+Sunsquare+Plaza+Complex,+2nd+%26+4th+Floor,+450-451-452,+SPL1%2FJ,+RIICO+Chowk,+Bhiwadi,+Rajasthan+301019"
        target="_blank"
        rel="noopener noreferrer"
         className="flex items-center text-gray-400 cursor-pointer hover:text-blue-500 mt-4"
       >
    <MapPin className="w-8 h-10 mr-2 text-white" />
    <p>Unit No 221-445-450-451-452-453, 2nd & 4th Floor, Sunsquare Plaza Complex, RIICO Chowk, Bhiwadi, Rajasthan 301019</p>
  </a>
            </div>
            <div>
              <h4 className="text-lg font-semibold mb-4">Legal</h4>
              <ul className="space-y-2">
                <li><a href="https://www.thesafetymaster.com/privacy-policy/" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
                
              </ul>
              <p className="text-gray-400 mt-4">&copy; {new Date().getFullYear()} TSM Digitech. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;