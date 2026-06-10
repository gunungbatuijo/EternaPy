import { Layout } from "@/components/Layout";
import { useListSubscriptionPlans } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function PricingPage() {
  const { data: plans, isLoading } = useListSubscriptionPlans();

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-16 pb-20 pt-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Invest in your developer career</h1>
          <p className="text-xl text-muted-foreground">Simple, transparent pricing. No surprise fees. Upgrade to unlock everything.</p>
        </div>

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-[500px] rounded-2xl" />)}
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto items-start">
            {plans.map(plan => (
              <Card 
                key={plan.id} 
                className={`relative flex flex-col h-full ${plan.isPopular ? 'border-primary shadow-lg scale-105 z-10' : 'border-border shadow-sm mt-4'}`}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider py-1 px-4 rounded-full">
                    Most Popular
                  </div>
                )}
                <CardHeader className="text-center pb-8 pt-8">
                  <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                  <div className="mt-4 flex items-end justify-center gap-1">
                    <span className="text-5xl font-extrabold">${plan.price}</span>
                    <span className="text-muted-foreground mb-2">/{plan.billingPeriod}</span>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-4">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter className="pt-8 pb-8">
                  <Button 
                    className="w-full h-12 text-base font-semibold" 
                    variant={plan.isPopular ? "default" : "outline"}
                  >
                    {plan.price === 0 ? "Start for Free" : "Upgrade to " + plan.name}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-20">Pricing plans not available right now.</div>
        )}
      </div>
    </Layout>
  );
}
