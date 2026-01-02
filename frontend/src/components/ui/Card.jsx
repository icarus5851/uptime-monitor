export function Card({ children, className = "", ...props }) {
  return (
    <div 
      className={`
        bg-card text-card-foreground 
        border border-border rounded-xl 
        shadow-sm hover:shadow-md transition-shadow duration-200
        ${className}
      `}
      {...props} 
    >
      {children}
    </div>
  );
}

export function Badge({ children, variant = "default" }) {
  const variants = {
    default: "bg-secondary text-secondary-foreground",
    success: "bg-green-500/15 text-green-600 dark:text-green-400 border border-green-500/20",
    error: "bg-destructive/15 text-destructive border border-destructive/20",
    warning: "bg-primary/15 text-primary border border-primary/20",
  };

  return (
    <span className={`
      px-2.5 py-0.5 rounded-md text-xs font-medium 
      ${variants[variant] || variants.default}
    `}>
      {children}
    </span>
  );
}