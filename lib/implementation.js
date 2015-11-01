'use strict';

var path     = require('path'),
    callsite = require('callsite');

module.exports =
    require('./implementation_implementation')(require, path, callsite);
