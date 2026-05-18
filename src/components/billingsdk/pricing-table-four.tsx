"use client";

import { Building2, Check, Crown, Package, X } from "lucide-react";
import { type ReactNode, useId, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { cva, type VariantProps } from "class-variance-authority";

import { type Plan } from "@/src/lib/billingsdk-config";
import { cn } from "@/src/lib/utils";
import { Badge } from "@/src/components/ui/badge";
import { Button } from "@/src/components/ui/button";
import { Label } from "@/src/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";

type BillingCycle = "monthly" | "annual";

const sectionVariants = cva("relative py-32", {
  variants: {
    size: {
      small: "py-12",
      medium: "py-20",
      large: "py-32",
    },
    theme: {
      minimal: "bg-background",
      classic: "bg-background",
    },
  },
  defaultVariants: {
    size: "medium",
    theme: "minimal",
  },
});

const titleVariants = cva("mb-4 font-bold text-foreground", {
  variants: {
    size: {
      small: "text-3xl lg:text-4xl",
      medium: "text-4xl lg:text-5xl",
      large: "text-4xl lg:text-6xl",
    },
    theme: {
      minimal: "",
      classic: "pb-1 text-foreground",
    },
  },
  defaultVariants: {
    size: "medium",
    theme: "minimal",
  },
});

const descriptionVariants = cva("mx-auto mb-2 max-w-3xl text-muted-foreground", {
  variants: {
    size: {
      small: "text-base lg:text-lg",
      medium: "text-lg lg:text-xl",
      large: "lg:text-xl",
    },
    theme: {
      minimal: "",
      classic: "",
    },
  },
  defaultVariants: {
    size: "medium",
    theme: "minimal",
  },
});

const cardVariants = cva(
  "relative h-full rounded-lg border bg-card text-card-foreground transition-all duration-300",
  {
    variants: {
      size: {
        small: "p-4",
        medium: "p-5",
        large: "p-6",
      },
      theme: {
        minimal: "hover:bg-muted/30",
        classic: "border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-xl",
      },
      highlight: {
        true: "",
        false: "",
      },
    },
    compoundVariants: [
      {
        theme: "classic",
        highlight: true,
        className:
          "relative overflow-hidden border-emerald-300/60 bg-gradient-to-b from-emerald-100/55 via-white to-transparent shadow-xl ring-2 ring-emerald-200/70",
      },
      {
        theme: "minimal",
        highlight: true,
        className: "border-primary/20 bg-muted/50",
      },
    ],
    defaultVariants: {
      size: "large",
      theme: "minimal",
      highlight: false,
    },
  },
);

const toggleVariants = cva(
  "flex h-11 w-fit shrink-0 items-center rounded-md p-1 text-lg",
  {
    variants: {
      theme: {
        minimal: "bg-muted",
        classic: "border border-border/50 bg-muted/50 shadow-lg backdrop-blur-sm",
      },
    },
    defaultVariants: {
      theme: "minimal",
    },
  },
);

const priceTextVariants = cva("font-medium", {
  variants: {
    size: {
      small: "text-2xl",
      medium: "text-3xl",
      large: "text-4xl",
    },
    theme: {
      minimal: "",
      classic:
        "bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent font-extrabold",
    },
  },
  defaultVariants: {
    size: "large",
    theme: "minimal",
  },
});

const buttonVariants = cva("w-full transition-all duration-300 hover:cursor-pointer", {
  variants: {
    theme: {
      minimal:
        "ring-primary before:from-primary-foreground/20 after:from-primary-foreground/10 relative isolate inline-flex h-9 w-full items-center justify-center overflow-hidden rounded-md bg-primary px-3 py-2 text-left text-sm font-medium text-primary-foreground shadow ring-1 transition duration-300 ease-[cubic-bezier(0.4,0.36,0,1)] before:pointer-events-none before:absolute before:inset-0 before:-z-10 before:rounded-md before:bg-gradient-to-b before:opacity-80 before:transition-opacity before:duration-300 before:ease-[cubic-bezier(0.4,0.36,0,1)] after:pointer-events-none after:absolute after:inset-0 after:-z-10 after:rounded-md after:bg-gradient-to-b after:to-transparent after:mix-blend-overlay hover:bg-primary/90",
      classic:
        "from-primary to-primary/80 text-primary-foreground relative overflow-hidden rounded-lg border border-primary/20 bg-gradient-to-r px-6 py-3 font-semibold hover:shadow-xl active:scale-95",
    },
  },
  defaultVariants: {
    theme: "minimal",
  },
});

const checkIconVariants = cva("h-[1lh] flex-none", {
  variants: {
    size: {
      small: "size-3",
      medium: "size-4",
      large: "size-4",
    },
    theme: {
      minimal: "text-primary",
      classic: "text-emerald-500",
    },
  },
  defaultVariants: {
    size: "large",
    theme: "minimal",
  },
});

const crossIconVariants = cva("h-[1lh] flex-none text-rose-500", {
  variants: {
    size: {
      small: "size-3",
      medium: "size-4",
      large: "size-4",
    },
  },
  defaultVariants: {
    size: "large",
  },
});

export interface PricingTableFourProps extends VariantProps<typeof sectionVariants> {
  plans: Plan[];
  title?: ReactNode;
  description?: string;
  subtitle?: string;
  onPlanSelect?: (planId: string, cycle: BillingCycle) => void;
  renderPlanTitle?: (plan: Plan) => ReactNode;
  className?: string;
  showBillingToggle?: boolean;
  billingToggleLabels?: {
    monthly: string;
    yearly: string;
  };
}

const defaultIcons = {
  starter: <Package className="h-4 w-4" />,
  pro: <Crown className="h-4 w-4" />,
  enterprise: <Building2 className="h-4 w-4" />,
  free: <Package className="h-4 w-4" />,
  premium_monthly: <Crown className="h-4 w-4" />,
  premium_annual: <Crown className="h-4 w-4" />,
};

export function PricingTableFour({
  plans,
  title = "Choose Your Perfect Plan",
  description = "Transform your project with our comprehensive pricing options designed for every need.",
  subtitle,
  onPlanSelect,
  renderPlanTitle,
  className,
  size = "medium",
  theme = "minimal",
  showBillingToggle = true,
  billingToggleLabels = {
    monthly: "Monthly",
    yearly: "Yearly",
  },
}: PricingTableFourProps) {
  const [isAnnually, setIsAnnually] = useState(false);
  const uniqueId = useId();

  function calculateDiscount(monthlyPrice: string, yearlyPrice: string): number {
    const monthly = parseFloat(monthlyPrice);
    const yearly = parseFloat(yearlyPrice);

    if (
      monthlyPrice.toLowerCase() === "custom" ||
      yearlyPrice.toLowerCase() === "custom" ||
      isNaN(monthly) ||
      isNaN(yearly) ||
      monthly === 0
    ) {
      return 0;
    }

    const discount = ((monthly * 12 - yearly) / (monthly * 12)) * 100;
    return Math.round(discount);
  }

  const yearlyPriceDiscount = plans.length
    ? Math.max(
        ...plans.map((plan) =>
          calculateDiscount(plan.monthlyPrice, plan.yearlyPrice),
        ),
      )
    : 0;

  const handlePlanSelect = (planId: string) => {
    onPlanSelect?.(planId, isAnnually ? "annual" : "monthly");
  };

  const getPlanIcon = (planId: string) => {
    return (
      defaultIcons[planId as keyof typeof defaultIcons] || <Package className="h-5 w-5" />
    );
  };

  return (
    <section className={cn(sectionVariants({ size, theme }), className)}>
      <div className="relative mx-auto w-full max-w-7xl">
        <div className="mb-12 text-center">
          {subtitle && (
            <p className="hero-load-up hero-load-up-title-2 mb-3 text-sm font-medium tracking-wide text-foreground uppercase">
              {subtitle}
            </p>
          )}
          <h2 className={cn("hero-load-up hero-load-up-title-1", titleVariants({ size, theme }))}>
            {title}
          </h2>
          <p
            className={cn(
              "hero-load-up hero-load-up-hero-copy",
              descriptionVariants({ size, theme }),
            )}
          >
            {description}
          </p>

          {showBillingToggle && (
            <div
              className={cn(
                "hero-load-up hero-load-up-hero-cta mx-auto mt-8 flex justify-center",
                toggleVariants({ theme }),
              )}
            >
              <RadioGroup
                defaultValue="monthly"
                className="grid-cols-2"
                onValueChange={(value) => {
                  setIsAnnually(value === "annually");
                }}
              >
                <div className='has-[button[data-state="checked"]]:bg-background rounded-md transition-all'>
                  <RadioGroupItem
                    value="monthly"
                    id={`${uniqueId}-monthly`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`${uniqueId}-monthly`}
                    className="text-muted-foreground peer-data-[state=checked]:text-primary hover:text-foreground flex h-9 cursor-pointer items-center justify-center px-2 font-semibold transition-all md:px-7"
                  >
                    {billingToggleLabels.monthly}
                  </Label>
                </div>
                <div className='has-[button[data-state="checked"]]:bg-background rounded-md transition-all'>
                  <RadioGroupItem
                    value="annually"
                    id={`${uniqueId}-annually`}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={`${uniqueId}-annually`}
                    className="text-muted-foreground peer-data-[state=checked]:text-primary hover:text-foreground flex h-9 cursor-pointer items-center justify-center gap-1 px-2 font-semibold transition-all md:px-7"
                  >
                    {billingToggleLabels.yearly}
                    {yearlyPriceDiscount > 0 && (
                      <span className="ml-1 rounded border border-emerald-200 bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                        Save {yearlyPriceDiscount}%
                      </span>
                    )}
                  </Label>
                </div>
              </RadioGroup>
            </div>
          )}
        </div>

        <div
          className={cn(
            "grid gap-6",
            plans.length === 1 && "mx-auto max-w-md grid-cols-1",
            plans.length === 2 && "mx-auto max-w-4xl grid-cols-1 md:grid-cols-2",
            plans.length === 3 && "grid-cols-1 md:grid-cols-3",
            plans.length >= 4 && "grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4",
          )}
        >
          {plans.map((plan, index) => (
            <motion.div
              key={plan.id}
              className="group relative h-full"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: index * 0.1,
                ease: "easeOut",
              }}
            >
              {plan.badge && (
                <Badge
                  className={cn(
                    "absolute -top-3 left-1/2 z-20 -translate-x-1/2 transform",
                    theme === "classic"
                      ? "border-emerald-700/25 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white shadow-lg"
                      : "bg-primary text-primary-foreground",
                  )}
                >
                  {plan.badge}
                </Badge>
              )}

              {theme === "classic" && plan.highlight && (
                <div className="via-primary absolute -top-px left-1/2 h-px w-32 -translate-x-1/2 bg-gradient-to-r from-transparent to-transparent" />
              )}

              <div className={cn(cardVariants({ size, theme, highlight: plan.highlight }))}>
                <div className="flex h-full flex-col">
                  <div className="mb-4 flex items-start gap-4">
                    <div className="flex-1">
                      <h3
                        className={cn(
                          "mb-1 text-2xl font-bold",
                          theme === "classic" ? "text-2xl" : "",
                        )}
                      >
                        {renderPlanTitle ? renderPlanTitle(plan) : plan.title}
                      </h3>
                      <p
                        className={cn(
                          "text-muted-foreground text-sm",
                          theme === "classic" && "text-foreground/80",
                        )}
                      >
                        {plan.description}
                      </p>
                    </div>
                    <div
                      className={cn(
                        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border",
                        theme === "classic"
                          ? "bg-primary/10 text-primary border-primary/20"
                          : "bg-muted text-foreground border-border",
                      )}
                    >
                      {getPlanIcon(plan.id)}
                    </div>
                  </div>

                  <div className="mb-6">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={isAnnually ? "year" : "month"}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {isAnnually ? (
                          <div className="flex items-baseline gap-1">
                            <span className={cn(priceTextVariants({ size, theme }))}>
                              {plan.highlight && (
                                <span className="sr-only">Premium price </span>
                              )}
                              <span
                                className={cn(
                                  plan.highlight &&
                                    "bg-none bg-clip-border !text-emerald-600",
                                )}
                              >
                              {parseFloat(plan.yearlyPrice) >= 0 &&
                                plan.yearlyPrice.toLowerCase() !== "custom" && (
                                  <>{plan.currency}</>
                                )}
                              {plan.yearlyPrice}
                              </span>
                            </span>
                            <span className="text-muted-foreground text-sm">/year</span>
                            {calculateDiscount(plan.monthlyPrice, plan.yearlyPrice) > 0 && (
                              <span
                                className={cn(
                                  "ml-2 text-xs",
                                  theme === "classic"
                                    ? "font-semibold text-emerald-500"
                                    : "text-primary font-medium",
                                )}
                              >
                                {calculateDiscount(plan.monthlyPrice, plan.yearlyPrice)}% off
                              </span>
                            )}
                          </div>
                        ) : (
                          <div className="flex items-baseline gap-1">
                            <span className={cn(priceTextVariants({ size, theme }))}>
                              {plan.highlight && (
                                <span className="sr-only">Premium price </span>
                              )}
                              <span
                                className={cn(
                                  plan.highlight &&
                                    "bg-none bg-clip-border !text-emerald-600",
                                )}
                              >
                              {parseFloat(plan.monthlyPrice) >= 0 &&
                                plan.monthlyPrice.toLowerCase() !== "custom" && (
                                  <>{plan.currency}</>
                                )}
                              {plan.monthlyPrice}
                              </span>
                            </span>
                            <span className="text-muted-foreground text-sm">/month</span>
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>

                  <div className="mb-6">
                    <Button
                      onClick={() => handlePlanSelect(plan.id)}
                      className={cn(
                        buttonVariants({ theme }),
                        plan.highlight &&
                          theme === "classic" &&
                          "border-emerald-800/40 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white hover:shadow-emerald-200/70",
                        !plan.highlight &&
                          theme === "minimal" &&
                          "bg-secondary hover:bg-secondary/80 text-secondary-foreground",
                      )}
                      variant={plan.highlight ? "default" : "secondary"}
                    >
                      {plan.buttonText}
                      {theme === "classic" && plan.highlight && (
                        <div className="absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-white/0 via-white/10 to-white/0 transition-transform duration-700 hover:translate-x-[100%]" />
                      )}
                    </Button>
                  </div>

                  <div className="flex-1">
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <motion.li
                          key={`${plan.id}-${feature.name}-${featureIndex}`}
                          className="flex items-start gap-3"
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{
                            duration: 0.3,
                            delay: featureIndex * 0.05,
                          }}
                        >
                          {feature.icon === "minus" || feature.icon === "cross" ? (
                            <X className={cn(crossIconVariants({ size }))} />
                          ) : (
                            <Check className={cn(checkIconVariants({ size, theme }))} />
                          )}
                          <span
                            className={cn(
                              "text-sm",
                              theme === "classic"
                                ? "text-foreground/90"
                                : "text-muted-foreground",
                            )}
                          >
                            {feature.name}
                          </span>
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
