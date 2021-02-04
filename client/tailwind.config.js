const colors = require('tailwindcss/colors')

module.exports = {
    // purge: ['./pages/**/*.js', './components/**/*.js'],
    darkMode: false, // or 'media' or 'class'
    theme: {
        colors: {
            salmon: {
                DEFAULT: '#f57073',
                dark: '#f24043',
            },
            dark: '#171717',
            babyBlue: '#6775F5',
            hailStorm: '#F1F1F1',
            transparent: 'transparent',
            current: 'currentColor',
            black: colors.black,
            white: colors.white,
            gray: colors.trueGray,
            indigo: colors.indigo,
            red: colors.rose,
            yellow: colors.amber,
        },
        extend: {},
    },
    variants: {
        extend: {},
    },
    plugins: [],
}
