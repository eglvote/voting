module.exports = {
    env: {
        test: {
            presets: ['@babel/preset-env', '@babel/react', 'next/babel'],
        },
        development: {
            presets: ['next/babel'],
        },
    },
    presets: ['@babel/preset-env', '@babel/preset-react'],
}
