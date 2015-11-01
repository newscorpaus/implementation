'use strict';

/**
 * @function implementation
 * Factory for creating a implementation resolver
 *
 * @param   {Function}  require     default node.js require
 * @param   {Object}    npath       native path module
 * @param   {Function}  callsite    get calling modules path
 *
 * @returns {Function}
 */

module.exports = function implementation(require, npath, callsite) {

    /**
     * @function resolve
     * Resolve a module implementation path
     *
     * @param   {String}    path        module path
     * @param   {String}    suffix      module path suffix
     *
     * @returns {Module}
     */

    var self = function resolve(path, suffix) {

        suffix = suffix || '_implementation';

        if (typeof path !== 'string') {
            throw new Error('Module path must be a string');
        }

        var caller = self.getCaller(path),
            implementationModule, modPath;

        if (!caller) {
            throw new Error('Unable to require implementation');
        }

        // normalize the caller path and resolve the requested
        // path from the caller

        caller  = npath.dirname(caller);
        modPath = npath.resolve(caller, path);

        try {
            modPath = require.resolve(modPath);
            modPath = modPath.replace('.js', suffix);
            implementationModule = require(modPath);
        } catch (err) {
            if (err.code === 'MODULE_NOT_FOUND') {
                err.code    = 'IMPLEMENTATION_NOT_FOUND';
                err.message = 'No implementation file found for module: "' + path + '"';
            }
            throw err;
        }

        return implementationModule;

    };

    /**
     * @function getCaller
     * Returns the current caller path
     * @returns {String}
     */

    self.getCaller = function () {

        var stack   = callsite(),
            current = stack.shift().getFileName(),
            caller;

        while (stack.length) {
            caller = stack.shift().getFileName();
            if (current !== caller) break;
        }

        return caller;

    };

    return self;

};
