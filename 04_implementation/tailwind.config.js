/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // FF14風のカラーパレット
        tank: '#3B82F6',      // 青
        healer: '#22C55E',    // 緑
        dps: '#EF4444',       // 赤
        burst: '#FEF08A',     // 薄黄色（バーストハイライト）
        phase: {
          1: '#60A5FA',
          2: '#34D399',
          3: '#FBBF24',
          4: '#F87171',
        },
      },
    },
  },
  plugins: [],
}
