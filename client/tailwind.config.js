const colors = require('tailwindcss/colors')

module.exports = {
    // purge: ['./pages/**/*.js', './components/**/*.js'],
    darkMode: false, // or 'media' or 'class'
    theme: {
        fontFamily: {
            sans: [
                'sans-serif',
                // 'Inter var',
                // 'Menlo',
                // 'sans',
                // 'Haas Grot Disp R',
                // 'Consolas',
                // 'Monaco',
                // 'Andale Mono',
                // 'Ubuntu Mono',
                // 'monospace',
            ],
            // font-family: Consolas, Monaco, 'Andale Mono', 'Ubuntu Mono', monospace;
        },
        colors: {
            salmon: {
                DEFAULT: '#f57073',
                dark: '#f24043',
            },
            dark: '#171717',
            babyBlue: '#6775F5',
            hailStorm: {
                DEFAULT: '#F1F1F1',
                dark: '#D9D9D9',
            },
            transparent: 'transparent',
            current: 'currentColor',
            black: colors.black,
            white: colors.white,
            gray: colors.trueGray,
            indigo: colors.indigo,
            red: colors.rose,
            yellow: colors.amber,
        },
        extend: {
            spacing: {
                '108': '27rem',
                '120': '30rem',
                '126': '31.5rem',
                '132': '33rem',
                '144': '36rem',
                '156': '39rem',
                '168': '42rem',
                '170': '45rem',
                '182': '48rem',
                '194': '51rem',
                '200': '53rem',
                '206': '54rem',
            },
        },
    },
    variants: {
        extend: {},
    },
    plugins: [],
}
