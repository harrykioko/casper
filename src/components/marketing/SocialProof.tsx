
import { motion } from 'framer-motion';

export default function SocialProof() {
  const testimonials = [
    {
      quote: "Casper transformed how I manage my daily workflow. The command palette is incredibly intuitive.",
      author: "Sarah Chen",
      title: "Product Designer",
    },
    {
      quote: "Finally, a tool that doesn't get in the way. Clean, fast, and exactly what I needed.",
      author: "Marcus Rodriguez",
      title: "Software Engineer",
    },
    {
      quote: "The prompt library alone has saved me hours each week. Game-changer for content creation.",
      author: "Emma Thompson",
      title: "Content Strategist",
    },
  ];

  const integrations = [
    { name: 'Outlook', logo: '📧' },
    { name: 'GitHub', logo: '🐙' },
    { name: 'Supabase', logo: '⚡' },
    { name: 'Microlink', logo: '🔗' },
  ];

  return (
    <section className="py-24 bg-muted/20">
      <div className="container mx-auto px-6">
        {/* Testimonials */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl font-heading mb-12">Loved by early users</h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                viewport={{ once: true }}
                className="glass-card p-6 text-left"
              >
                <p className="mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <div className="font-semibold">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.title}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Integrations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <p className="text-muted-foreground mb-8">Integrates with your favorite tools</p>
          <div className="flex justify-center items-center gap-12 flex-wrap">
            {integrations.map((integration, index) => (
              <motion.div
                key={integration.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.3 }}
                viewport={{ once: true }}
                className="flex flex-col items-center gap-2 text-2xl"
              >
                <span>{integration.logo}</span>
                <span className="text-sm text-muted-foreground">{integration.name}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
