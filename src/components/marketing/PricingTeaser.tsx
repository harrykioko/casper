
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';

export default function PricingTeaser() {
  const plans = [
    {
      name: 'Free Beta',
      price: 'Free',
      description: 'Perfect for getting started',
      features: [
        'Unlimited tasks',
        'Basic prompt library',
        'Reading list',
        'Community support',
      ],
      cta: 'Start Free',
      popular: false,
    },
    {
      name: 'Pro',
      price: '$10/mo',
      description: 'For power users and teams',
      features: [
        'Everything in Free',
        'Advanced automation',
        'Calendar integrations',
        'Priority support',
        'Custom themes',
      ],
      cta: 'Get Pro Access',
      popular: true,
    },
  ];

  return (
    <section id="pricing" className="py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-heading mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-lg text-muted-foreground">
            Start free, upgrade when you're ready
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              viewport={{ once: true }}
              className={`glass-card p-8 relative shadow-md hover:shadow-lg transition ${
                plan.popular ? 'ring-2 ring-accent-blue' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className="bg-accent-blue text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-heading mb-2">{plan.name}</h3>
                <div className="text-3xl font-heading text-accent-blue mb-2">
                  {plan.price}
                </div>
                <p className="text-muted-foreground">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-accent-blue flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {plan.popular ? (
                <Button variant="default" size="lg" className="w-full">
                  {plan.cta}
                </Button>
              ) : (
                <Button variant="outline" size="lg" className="w-full">
                  {plan.cta}
                </Button>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
