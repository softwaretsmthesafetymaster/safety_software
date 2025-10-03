import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, CreditCard, Lock, Check, AlertCircle, FileText, AlertTriangle, Search, Target, Eye, CheckSquare } from 'lucide-react';
import { useAppSelector, useAppDispatch } from '../../hooks/redux';
import { createPaymentOrder, verifyPayment } from '../../store/slices/paymentSlice';
import Button from '../../components/UI/Button';
import Card from '../../components/UI/Card';
import { addNotification } from '../../store/slices/uiSlice';

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentPage: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { isLoading } = useAppSelector((state) => state.payment);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);

  const modules = [
    {
      id: 'ptw',
      name: 'Permit to Work',
      icon: FileText,
      description: 'Comprehensive work permit management with digital approvals and safety checklists',
      features: ['Digital Permits', 'Multi-step Approvals', 'Safety Checklists', 'Auto Reminders', 'Digital Signatures'],
      price: 99,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'ims',
      name: 'Incident Management',
      icon: AlertTriangle,
      description: 'Complete incident reporting, investigation, and corrective action tracking',
      features: ['Incident Reporting', 'Investigation Tools', 'Root Cause Analysis', 'Action Tracking', 'Body Map'],
      price: 129,
      color: 'from-red-500 to-red-600'
    },
    {
      id: 'hazop',
      name: 'HAZOP Studies',
      icon: Search,
      description: 'Hazard and Operability studies with AI-powered risk identification',
      features: ['Study Management', 'Node Analysis', 'AI Suggestions', 'Risk Assessment', 'Drawing Upload'],
      price: 149,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'hira',
      name: 'HIRA Assessment',
      icon: Target,
      description: 'Hazard Identification and Risk Assessment with automated scoring',
      features: ['Risk Scoring', 'Hazard Database', 'Control Measures', 'Risk Matrix', 'Team Collaboration'],
      price: 119,
      color: 'from-orange-500 to-orange-600'
    },
    {
      id: 'bbs',
      name: 'Behavior Based Safety',
      icon: Eye,
      description: 'Behavioral observation and safety culture improvement tracking',
      features: ['Observation Forms', 'Behavior Tracking', 'Safety Culture', 'Trend Analysis', 'Photo Evidence'],
      price: 89,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'audit',
      name: 'Safety Audits',
      icon: CheckSquare,
      description: 'Comprehensive safety auditing with compliance tracking and reporting',
      features: ['Audit Checklists', 'Compliance Tracking', 'Finding Management', 'Reports', 'AI Recommendations'],
      price: 109,
      color: 'from-indigo-500 to-indigo-600'
    }
  ];

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Get selected modules from localStorage if coming from registration
    const storedModules = localStorage.getItem('selectedModules');
    if (storedModules) {
      setSelectedModules(JSON.parse(storedModules));
    }

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

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

  const handlePayment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (selectedModules.length === 0) {
      dispatch(addNotification({
        type: 'error',
        message: 'Please select at least one module'
      }));
      return;
    }

    try {
      // Create order using Redux
      const order = await dispatch(createPaymentOrder({
        amount: getTotalPrice(),
        currency: 'INR',
        modules: selectedModules
      })).unwrap();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'SafetyPro',
        description: 'Safety Management Modules',
        order_id: order.id,
        handler: async function (response: any) {
          try {
            // Verify payment using Redux
            await dispatch(verifyPayment({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              modules: selectedModules
            })).unwrap();

            dispatch(addNotification({
              type: 'success',
              message: 'Payment successful! Welcome to SafetyPro.'
            }));

            // Clear localStorage
            localStorage.removeItem('selectedModules');
            localStorage.removeItem('totalAmount');
            
            // Redirect to dashboard
            navigate('/dashboard');
          } catch (error) {
            console.error('Payment verification error:', error);
            dispatch(addNotification({
              type: 'error',
              message: 'Payment verification failed. Please contact support.'
            }));
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
          contact: user.phone || ''
        },
        notes: {
          modules: selectedModules.join(',')
        },
        theme: {
          color: '#3B82F6'
        },
        modal: {
          ondismiss: function() {
            // Payment dismissed
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Payment error:', error);
      dispatch(addNotification({
        type: 'error',
        message: 'Payment failed. Please try again.'
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-6xl w-full space-y-8"
      >
        <div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center"
          >
            <CreditCard className="h-8 w-8 text-white" />
          </motion.div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Choose Your Safety Modules
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Select the modules that fit your organization's needs
          </p>
        </div>

        {/* Module Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module, index) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
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
                      ₹{module.price}
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
            className="max-w-md mx-auto"
          >
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Selected Modules ({selectedModules.length})
              </h3>
              <div className="space-y-2 mb-4">
                {selectedModules.map(moduleId => {
                  const module = modules.find(m => m.id === moduleId);
                  return (
                    <div key={moduleId} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-300">{module?.name}</span>
                      <span className="font-medium">₹{module?.price}/month</span>
                    </div>
                  );
                })}
              </div>
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">Total</span>
                  <span className="text-2xl font-bold text-blue-600">₹{getTotalPrice()}/month</span>
                </div>
                
                <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium">30-Day Free Trial</p>
                      <p>You won't be charged for the first 30 days. Cancel anytime during the trial period.</p>
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg" 
                  icon={Lock}
                  onClick={handlePayment}
                  loading={isLoading}
                  disabled={selectedModules.length === 0}
                >
                  {isLoading ? 'Processing...' : `Pay ₹${getTotalPrice()} - Start Free Trial`}
                </Button>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                  By clicking "Pay", you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </Card>
          </motion.div>
        )}

        {selectedModules.length === 0 && (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please select at least one module to continue
            </p>
            <Button
              variant="secondary"
              onClick={() => navigate('/dashboard')}
            >
              Skip for Now
            </Button>
          </div>
        )}

        {/* Security Badges */}
        <div className="flex justify-center items-center space-x-8 opacity-60">
          <div className="flex items-center space-x-2">
            <Lock className="h-4 w-4" />
            <span className="text-sm">SSL Secured</span>
          </div>
          <div className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span className="text-sm">PCI Compliant</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default PaymentPage;