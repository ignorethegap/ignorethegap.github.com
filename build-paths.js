var appRoot = 'site/src/';
var outputRoot = 'dist/';
var exportSrvRoot = 'export/';

module.exports = {
  root: appRoot,
  source: appRoot + '**/*.js',
  html: appRoot + '**/*.html',
  css: appRoot + '**/*.css',
  style: 'styles/**/*.css',
  output: outputRoot,
  exportSrv: exportSrvRoot,
  doc: './doc',
  e2eSpecsSrc: 'site/test/e2e/src/*.js',
  e2eSpecsDist: 'site/test/e2e/dist/'
};
