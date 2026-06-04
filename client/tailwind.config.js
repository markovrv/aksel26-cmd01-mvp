/** @type {import('tailwindcss').Config} */
export default {
	content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
	theme: {
		extend: {
			colors: {
				primary: "#00C2D4",
				"primary-hover": "#00A3B8",
				"primary-light": "#D0F5F8",
				"ar-bg": "#0D1B2A",
				surface: "#FFFFFF",
				"surface-2": "#EEF2F7",
				"text-main": "#1A2332",
				"text-muted": "#94A3B8",
				"text-muted-light": "#CBD5E1",
				success: "#2ECC71",
				error: "#E74C3C",
				warning: "#F39C12",
			},
			fontFamily: {
				montserrat: ["Montserrat", "sans-serif"],
				inter: ["Inter", "sans-serif"],
			},
			borderRadius: {
				xl: "12px",
				"2xl": "16px",
				"3xl": "20px",
			},
			boxShadow: {
				ar: "0 -4px 24px rgba(0,0,0,0.15)",
			},
		},
	},
	plugins: [],
};
