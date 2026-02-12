import type { Config } from "tailwindcss";

export default {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./app/**/*.{ts,tsx}",
		"./src/**/*.{ts,tsx}",
	],
	prefix: "",
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px'
			}
		},
		extend: {
			fontFamily: {
				sans: ['Inter', 'sans-serif'],
				heading: ['Space Grotesk', 'sans-serif'],
			},
			colors: {
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				},
				// Status colors
				status: {
					active: 'hsl(var(--status-active))',
					warning: 'hsl(var(--status-warning))',
					danger: 'hsl(var(--status-danger))',
					info: 'hsl(var(--status-info))',
				},
				// Accent colors
				'accent-blue': 'hsl(var(--accent-blue))',
				'accent-coral': 'hsl(var(--accent-coral))',
				'accent-purple': 'hsl(var(--accent-purple))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
				'2xl': '1rem',
				'3xl': '1.75rem',
				'4xl': '2rem',
			},
			boxShadow: {
				'glass-light': '0px 6px 24px rgba(0, 0, 0, 0.08)',
				'glass-dark': '0px 6px 28px rgba(0, 0, 0, 0.25)',
				'glass-hover': '0px 8px 32px rgba(0, 0, 0, 0.12)',
				'glass-dark-hover': '0px 10px 40px rgba(0, 0, 0, 0.35)',
				'glass-glow': '0px 0px 20px rgba(113, 167, 255, 0.15)',
				'glass-pane': '-8px 0 32px rgba(0, 0, 0, 0.15)',
			},
			backdropBlur: {
				'xl': '20px',
				'2xl': '24px',
				'3xl': '30px',
			},
			keyframes: {
				'accordion-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-accordion-content-height)' }
				},
				'accordion-up': {
					from: { height: 'var(--radix-accordion-content-height)' },
					to: { height: '0' }
				},
				'fade-in': {
					'0%': { opacity: '0', transform: 'translateY(10px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'fade-in-up': {
					'0%': { opacity: '0', transform: 'translateY(20px)' },
					'100%': { opacity: '1', transform: 'translateY(0)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.95)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'slide-in-right': {
					'0%': { transform: 'translateX(100%)', opacity: '0' },
					'100%': { transform: 'translateX(0)', opacity: '1' }
				},
				'confetti': {
					'0%': { transform: 'translateY(0) rotate(0)', opacity: '1' },
					'100%': { transform: 'translateY(-100px) rotate(360deg)', opacity: '0' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-200% 0' },
					'100%': { backgroundPosition: '200% 0' }
				},
				'pulse-soft': {
					'0%, 100%': { opacity: '1' },
					'50%': { opacity: '0.7' }
				},
				'collapsible-down': {
					from: { height: '0' },
					to: { height: 'var(--radix-collapsible-content-height)' }
				},
				'collapsible-up': {
					from: { height: 'var(--radix-collapsible-content-height)' },
					to: { height: '0' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'fade-in': 'fade-in 0.3s ease-out',
				'fade-in-up': 'fade-in-up 0.4s ease-out',
				'scale-in': 'scale-in 0.2s ease-out',
				'slide-in-right': 'slide-in-right 0.3s ease-out',
				'confetti': 'confetti 1s ease-out forwards',
				'shimmer': 'shimmer 2s infinite linear',
				'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
				'collapsible-down': 'collapsible-down 0.2s ease-out',
				'collapsible-up': 'collapsible-up 0.2s ease-out'
			},
			backgroundImage: {
				'gradient-primary': 'linear-gradient(to right, #FF1464, #2B2DFF)',
				'gradient-glass': 'linear-gradient(180deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
				'gradient-hero-light': 'linear-gradient(135deg, hsl(220 25% 96%) 0%, hsl(225 30% 94%) 50%, hsl(260 30% 96%) 100%)',
				'gradient-hero-dark': 'linear-gradient(135deg, hsl(220 15% 8%) 0%, hsl(225 20% 10%) 50%, hsl(260 25% 12%) 100%)',
			},
			spacing: {
				'18': '4.5rem',
				'88': '22rem',
				'128': '32rem',
			}
		}
	},
	plugins: [
		require("tailwindcss-animate"),
		function({ addUtilities }: { addUtilities: Function }) {
			addUtilities({
				'.scrollbar-none': {
					'-ms-overflow-style': 'none',
					'scrollbar-width': 'none',
					'&::-webkit-scrollbar': {
						display: 'none'
					}
				},
				'.glass-blur': {
					'backdrop-filter': 'blur(24px)',
					'-webkit-backdrop-filter': 'blur(24px)'
				}
			})
		}
	],
} satisfies Config;
