import babel from 'rollup-plugin-babel'
import commonjs from 'rollup-plugin-commonjs'
import resolve from 'rollup-plugin-node-resolve'

export default {
  entry: 'src/index.js',
  targets: [
    { dest: 'dist/svc-web.js', format: 'umd', sourceMap: true },
    { dest: 'dist/svc-web.cjs.js', format: 'cjs', sourceMap: true },
    { dest: 'dist/svc-web.es.js', format: 'es', sourceMap: true }
  ],
  moduleName: 'svcWeb',
  plugins: [
    babel({
      babelrc: false,
      exclude: 'node_modules/**',
      presets: [
        [
          'es2015',
          {
            'modules': false
          }
        ]
      ],
      plugins: [
        'external-helpers'
      ]
    }),
    resolve({
      jsnext: true,
      main: true
    }),
    commonjs()
  ]

}
