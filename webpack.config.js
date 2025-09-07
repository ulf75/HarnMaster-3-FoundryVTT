const path = require('path');

module.exports = {
    module: {
        rules: [
            {
                test: /\.s[ac]ss$/i,
                use: [
                    // Creates `style` nodes from JS strings
                    'style-loader',
                    // Translates CSS into CommonJS
                    'css-loader',
                    // Compiles Sass to CSS
                    'sass-loader'
                ]
            }
        ]
    },
    entry: './module/hm3',
    mode: 'development',
    output: {
        filename: 'hm3.js',
        // Setting webpack to generate the library with a global variable as
        // the spec of the test is suggesting
        library: 'HM',
        libraryTarget: 'var',
        libraryExport: 'default',
        globalObject: 'this',
        path: path.resolve(__dirname, 'dist')
    },
    devtool: 'inline-source-map',
    devServer: {
        contentBase: path.resolve(__dirname, 'dist')
    }
};
