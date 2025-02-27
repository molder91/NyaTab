module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#FF9EB6', // Light pink
          DEFAULT: '#FF6B95', // Medium pink
          dark: '#CC5476'    // Dark pink
        },
        secondary: {
          light: '#BCDEFF',
          DEFAULT: '#90C7FC',
          dark: '#75A9E0'
        },
        background: {
          light: '#FFFCFD',
          DEFAULT: '#FFF5F9',
          dark: '#382F35'
        },
        accent: {
          purple: '#AD8CE8',
          teal: '#76E4D4',
          yellow: '#FFDE89'
        }
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem'
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.05)',
        'medium': '0 6px 16px rgba(0, 0, 0, 0.1)',
        'inner-soft': 'inset 0 2px 6px rgba(0, 0, 0, 0.05)'
      },
      fontFamily: {
        'sans': ['Nunito', 'sans-serif'],
        'display': ['M PLUS Rounded 1c', 'Nunito', 'sans-serif']
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'bounce-soft': 'bounceSoft 2s infinite'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 }
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 }
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' }
        }
      }
    }
  },
  plugins: []
}; 