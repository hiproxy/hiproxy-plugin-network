/**
 * @file network
 * @author huazihear
 */

'use strict';

var commands = require('./plugin/commands');
var directives = require('./plugin/directives');
var routes = require('./plugin/routes');

module.exports = {
  // CLI commands
  commands: commands,

  // Rewrite config redirectives
  directives: directives,

  // HTTP server routes
  routes: routes
};
