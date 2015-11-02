# implementation

Here at **newscorpau** we use a simple approach to dependency injection when writing modules for our node.js based applications.

Internally it has become known as the `_implementation` approach and was first introduced by **[@drew-walker](https://github.com/drew-walker)** at a time when mocking required dependencies became convoluted.

The intent with this module is to formalise the approach and provide an easy way of writing tests for modules which follow this pattern.

## dependency injection

There has been numerous attempts to solve this. However these often involve manipulating the require.cache and adding un-necessary complexity.

With the `_implementation` approach dependency injection becomes far simpler. That's if you don't mind splitting a modules dependencies and it's actual implementation between two files.

I know what your thinking, ***"But hey that adds an extra file I shouldn't really need"*** and you would be right and I thought the same initially however the benefits far outway the need for that extra file.

> It would be awesome if node itself had a supported DI approach baked in however as with most wishes these can often be solved by userland and this is just another of those userland attempts :-)

So what does this mean for your code? Not much changes really.

### before

```JavaScript
var path       = require('path'),
    currentEnv = process.env.NODE_ENV;

module.exports = function (env) {
    env = env || currentEnv;
    var config = path.join(__dirname, env);
    return require(env);
};
```
> ./lib/config.js

### after

```JavaScript
var path       = require('path'),
    currentEnv = process.env.NODE_ENV;

module.exports = require('./module_implementation')
                    (require, __dirname, path, currentEnv);
```
> lib/config.js

```JavaScript
module.exports = function (require, path, dirname, currentEnv) {

    var self = function (env)
            env = env || currentEnv;
            var config = path.join(dirname, env);
            return require(env);
        };

    return self;

};
```
> lib/config_implementation.js

## tests

It now becomes fairly straightforward to require a modules implementation and begin to mock it's dependencies.

```JavaScript
var test           = require('tape'),
    implementation = require('implementation')('lib/config');

test('path.join called correctly when no environment specified', function (assert) {

    implementation(function () {
        test.end();
    }, {
        join : function(dirname, env) {
            assert(dirname, 'should match __dirname').toEqual('some/dir');
            assert(env, 'should match default environment').toEqual('development');
        }
    }, 'some/dir', 'development');

});
```

For a real example checkout how this module was written. It follows the `_implementation` approach.

# Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using ***`npm test`***

# Release History

- **0.1.0** Initial release

# License
Copyright (c) 2015 News Corp Australia. Licensed under the MIT license.
