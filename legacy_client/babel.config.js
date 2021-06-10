module.exports = {
    env: {
        test: {
            presets: [
                '@babel/preset-env',
                '@babel/react',
                'next/babel',
                '@babel/preset-typescript',
            ],
        },
        development: {
            presets: ['next/babel'],
        },
    },

    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    esmodules: true,
                },
            },
        ],
        [
            '@babel/preset-react',
            {
                targets: {
                    esmodules: true,
                },
            },
        ],
        '@babel/preset-typescript',
    ],
    plugins: ['@babel/plugin-proposal-class-properties'],
}
