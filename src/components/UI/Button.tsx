import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";

interface ButtonProps {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger" | "success" | "warning";
  size?: "sm" | "md" | "lg";
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  as?: React.ElementType; // ✅ support custom element like Link
  to?: string; // ✅ needed when using Link
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  icon: Icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  type = "button",
  as: Component = "button", // default is <button>
  to,
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-medium rounded-lg focus-ring smooth-transition shadow-smooth hover:shadow-smooth-lg transform hover:-translate-y-0.5 active:translate-y-0";

  const variantClasses = {
    primary: "gradient-primary text-white hover:from-primary-600 hover:to-primary-700",
    secondary:
      "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white",
    danger: "gradient-danger text-white hover:from-danger-600 hover:to-danger-700",
    success: "gradient-success text-white hover:from-success-600 hover:to-success-700",
    warning: "gradient-warning text-white hover:from-warning-600 hover:to-warning-700",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const isDisabled = disabled || loading;

  const MotionComponent = motion(Component);

  return (
    <MotionComponent
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
      type={Component === "button" ? type : undefined}
      onClick={onClick}
      to={to}
      disabled={isDisabled && Component === "button"}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
        isDisabled ? "opacity-50 cursor-not-allowed" : ""
      } ${className}`}
    >
      {loading ? (
        <LoadingSpinner size="sm" className="mr-2" />
      ) : (
        Icon && iconPosition === "left" && (
          <Icon className={`h-4 w-4 ${children ? "mr-2" : ""}`} />
        )
      )}
      {children}
      {Icon && iconPosition === "right" && !loading && (
        <Icon className={`h-4 w-4 ${children ? "ml-2" : ""}`} />
      )}
    </MotionComponent>
  );
};

export default Button;
