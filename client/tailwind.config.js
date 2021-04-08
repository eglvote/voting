const colors = require('tailwindcss/colors')

module.exports = {
    purge: [
        './pages/**/*.js',
        './components/**/*.js',
        './pages/**/*.tsx',
        './components/**/*.tsx',
    ],
    darkMode: false, // or 'media' or 'class'
    theme: {
        fontFamily: {
            sans: ['sans-serif'],
        },
        colors: {
            salmon: {
                DEFAULT: '#f57073',
                dark: '#f24043',
            },
            dark: '#171717',
            babyBlue: {
                DEFAULT: '#6775F5',
                dark: '#343b7b',
                light: '#959ef8',
            },
            hailStorm: {
                DEFAULT: '#F1F1F1',
                dark: '#D9D9D9',
            },
            plum: {
                DEFAULT: '#323343',
                dark: '#1E2031',
            },
            twitterBlue: '#1DA1F2',
            github: '#F24043',
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
        minWidth: {
            '0': '0',
            '1/4': '25%',
            '1/2': '50%',
            '3/4': '75%',
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
    variants: {
        extend: {},
    },
    plugins: [],
}
