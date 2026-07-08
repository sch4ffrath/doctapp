/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        emeraldLight: '#6EE7B7',
        medicalGreen: '#10B981',
        doctText: '#374151',
        greenMist: '#ECFDF5',
        ink: '#1F2937'
      },
      boxShadow: {
        soft: '0 18px 45px rgba(16, 185, 129, 0.18)',
        premium: '0 24px 60px rgba(15, 118, 110, 0.16)'
      }
    }
  },
  plugins: []
};
