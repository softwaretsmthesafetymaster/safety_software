import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Shield, CreditCard, Lock, Check, AlertCircle } from 'lucide-react';
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
  const [totalAmount, setTotalAmount] = useState(0);

  const modules = [
    { id: 'ptw', name: 'Permit to Work', price: 99 },
    { id: 'ims', name: 'Incident Management', price: 129 },
    { id: 'hazop', name: 'HAZOP Studies', price: 149 },
    { id: 'hira', name: 'HIRA Assessment', price: 119 },
    { id: 'bbs', name: 'Behavior Based Safety', price: 89 },
    { id: 'audit', name: 'Safety Audits', price: 109 }
  ];

  useEffect(() => {
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    // Get selected modules from localStorage
    const modules = localStorage.getItem('selectedModules');
    const amount = localStorage.getItem('totalAmount');
    
    if (modules) {
      setSelectedModules(JSON.parse(modules));
    }
    if (amount) {
      setTotalAmount(parseInt(amount));
    }

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!user) {
      navigate('/login');
      return;
    }


    try {
      // Create order using Redux
      const order = await dispatch(createPaymentOrder({
        amount: totalAmount,
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

  const getSelectedModuleDetails = () => {
    return selectedModules.map(moduleId => 
      modules.find(m => m.id === moduleId)
    ).filter(Boolean);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-2xl w-full space-y-8"
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
            Complete Your Purchase
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Secure payment powered by Razorpay
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Summary */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Order Summary
            </h3>
            
            <div className="space-y-4">
              {getSelectedModuleDetails().map((module) => (
                <div key={module?.id} className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {module?.name}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Monthly subscription
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900 dark:text-white">
                    ₹{module?.price}
                  </p>
                </div>
              ))}
              
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    Total (Monthly)
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    ₹{totalAmount}
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800 dark:text-blue-200">
                  <p className="font-medium">30-Day Free Trial</p>
                  <p>You won't be charged for the first 30 days. Cancel anytime during the trial period.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Details */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Payment Details
            </h3>

            <div className="space-y-4">
              <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-green-500" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      Secure Payment
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Your payment is secured by Razorpay
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    256-bit SSL encryption
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    PCI DSS compliant
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Check className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    30-day money-back guarantee
                  </span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                loading={isLoading}
                disabled={isLoading || selectedModules.length === 0}
                className="w-full"
                size="lg"
                icon={Lock}
              >
                {isLoading ? 'Processing...' : `Pay ₹${totalAmount} - Start Free Trial`}
              </Button>

              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                By clicking "Pay", you agree to our Terms of Service and Privacy Policy.
                You can cancel your subscription at any time.
              </p>
            </div>
          </Card>
        </div>

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