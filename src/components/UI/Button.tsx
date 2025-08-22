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
    "inline-flex items-center justify-center font-medium rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary:
      "bg-gray-200 hover:bg-gray-300 text-gray-900 dark:bg-gray-600 dark:hover:bg-gray-700 dark:text-white focus:ring-gray-500",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
    success: "bg-green-600 hover:bg-green-700 text-white focus:ring-green-500",
    warning: "bg-yellow-600 hover:bg-yellow-700 text-white focus:ring-yellow-500",
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const isDisabled = disabled || loading;

  const MotionComponent = motion(Component);

  return (
    <MotionComponent
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      type={Component === "button" ? type : undefined}
      onClick={onClick}
      to={to} // ✅ will be applied only if Link
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
