/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
    // Fix for undici syntax error in @vercel/blob 2.0.1
    // We also force alias undici to the browser shim to avoid bundling the Node.js version
    // which causes parsing errors with private fields (#target) in some environments.
    transpilePackages: ['@vercel/blob', 'undici'],

    webpack: (config, { isServer }) => {
        // Alias undici to the browser shim provided by @vercel/blob
        // This shim uses globalThis.fetch, which works in both Browser and Node 18+
        config.resolve.alias['undici'] = path.join(__dirname, 'node_modules/@vercel/blob/dist/undici-browser.js');

        return config;
    },

    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    }
};

module.exports = nextConfig;
