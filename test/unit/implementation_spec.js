var expect          = require('chai').expect,
    _implementation = require('../../lib/implementation')('../../lib/implementation'),
    noop            = function () {};

describe('implementation', function () {

    it('is a function', function () {
        var implementation = _implementation();
        expect(implementation, 'is a valid function').to.be.a('function');
        expect(implementation.length, 'has an call arity of 2').to.equal(2);
    });

    it('normalizes caller path', function () {

        var calledCount = 0,
            _require    = function () {},
            implementation;

        _require.resolve = function (path) {
            calledCount++;
            expect(
                path,
                'path has been correctly resolved'
            ).to.equal('/user/path/config');
            return '';
        };

        implementation = _implementation(_require, {
            dirname: function (path) {
                calledCount++;
                expect(path).to.equal('/user/path/to/caller/index.js');
                return '/user/path/to/caller/';
            },
            resolve: function (from, to) {
                calledCount++;
                expect(from).to.equal('/user/path/to/caller/');
                expect(to).to.equal('../../config');
                return '/user/path/config';
            }
        });

        implementation.getCaller = function () {
            calledCount++;
            return '/user/path/to/caller/index.js';
        };

        implementation('../../config');
        expect(calledCount, 'correctly called methods').to.equal(4);

    });

    it('requires implementation correctly ( suffix: _implementation )', function () {

        var calledCount = 0,
            _require    = function (path) {
                calledCount++;
                expect(
                    path,
                    'correctly formatted implementation path'
                ).to.equal('/user/path/config/index_implementation');
            },
            implementation;

        _require.resolve = function () {
            calledCount++;
            return '/user/path/config/index.js';
        };

        implementation = _implementation(_require, {
            dirname: function () {
                calledCount++;
                return '/user/path/to/caller/';
            },
            resolve: function () {
                calledCount++;
                return '/user/path/config';
            }
        });

        implementation.getCaller = function () {
            calledCount++;
            return '/user/path/to/caller/index.js';
        };

        implementation('../../config');
        expect(calledCount, 'correctly called methods').to.equal(5);

    });

    it('requires implementation correctly ( custom suffix: _foo )', function () {

        var calledCount = 0,
            _require    = function (path) {
                calledCount++;
                expect(
                    path,
                    'correctly formatted implementation path'
                ).to.equal('/user/path/config/index_foo');
            },
            implementation;

        _require.resolve = function () {
            calledCount++;
            return '/user/path/config/index.js';
        };

        implementation = _implementation(_require, {
            dirname: function () {
                calledCount++;
                return '/user/path/to/caller/';
            },
            resolve: function () {
                calledCount++;
                return '/user/path/config';
            }
        });

        implementation.getCaller = function () {
            calledCount++;
            return '/user/path/to/caller/index.js';
        };

        implementation('../../config', '_foo');
        expect(calledCount, 'correctly called methods').to.equal(5);

    });

    describe('self.getCaller', function () {

        it('is a function', function () {
            var getCaller = _implementation().getCaller;
            expect(getCaller, 'is a valid function').to.be.a('function');
            expect(getCaller.length, 'has an call arity of 0').to.equal(0);
        });

        it('called with the correct arguments', function () {

            var _require = function () {},
                implementation;

            _require.resolve = function () { return ''; };

            implementation = _implementation(_require, {
                dirname: noop,
                resolve: noop
            });

            implementation.getCaller = function (path) {
                expect(path, 'correctly passed to getCaller').to.equal('../foo/bar');
                return 'foo';
            };

            implementation('../foo/bar');

        });

        // self.getCaller = function (path) {
        //
        //     var stack   = callsite(path),
        //         current = stack.shift().getFileName(),
        //         caller;
        //
        //     while (stack.length) {
        //         caller = stack.shift().getFileName();
        //         if (current !== caller) break;
        //     }
        //
        //     return caller;
        //
        // };

        it('calls callsite', function () {

            var calledCount = 0,
                callsite = function () {
                    calledCount++;
                    return [{ getFileName: noop }];
                },
                getCaller = _implementation(null, null, callsite).getCaller;

            getCaller();
            expect(calledCount, 'callsite is called once').to.equal(1);

        });

        it('returns current caller', function () {

            var calledCount = 0,
                callsite = function () {
                    calledCount++;
                    return [
                        {
                            getFileName: function () {
                                return 'foo';
                            }
                        }, {
                            getFileName: function () {
                                return 'bar';
                            }
                        }
                    ];
                },
                getCaller = _implementation(null, null, callsite).getCaller,
                result    = getCaller();

            expect(result).to.equal('bar');
            expect(calledCount, 'callsite is called once').to.equal(1);

        });

        it('returns undefined if cannot obtain current caller', function () {

            var calledCount = 0,
                callsite = function () {
                    calledCount++;
                    return [
                        {
                            getFileName: function () {
                                return 'foo';
                            }
                        }
                    ];
                },
                getCaller = _implementation(null, null, callsite).getCaller,
                result    = getCaller();

            expect(result).to.be.an('undefined');
            expect(calledCount, 'callsite is called once').to.equal(1);

        });

    });

    describe('exceptions', function () {

        it('thrown for invalid input', function () {
            var implementation = _implementation();
            expect(
                implementation,
                'throws an exception for non-string input'
            ).to.throw('Module path must be a string');
        });

        it('thrown when cannot determine caller', function () {
            var implementation = _implementation();

            implementation.getCaller = function () {
                return undefined;
            };

            expect(
                implementation.bind(null, 'foo'),
                'throws an exception when cannot obtain caller'
            ).to.throw('Unable to require implementation');

        });

        it('thrown when cannot resolve module', function () {

            var _require    = function () {
                    throw new Error('I should not be called');
                },
                implementation;

            _require.resolve = function () {
                var err = new Error('');
                err.code = 'MODULE_NOT_FOUND';
                throw err;
            };

            implementation = _implementation(_require, {
                dirname: function () {
                    return '/user/path/to/caller/';
                },
                resolve: function () {
                    return '/user/path/config';
                }
            });

            implementation.getCaller = function () {
                return '/user/path/to/caller/index.js';
            };

            expect(
                implementation.bind(null, '../../config', '_foo')
            ).to.throw('No implementation file found for module: "../../config"');

        });

        it('thrown when cannot require implementation', function () {

            var _require    = function () {
                    var err = new Error('');
                    err.code = 'MODULE_NOT_FOUND';
                    throw err;
                },
                implementation;

            _require.resolve = function () {
                return '';
            };

            implementation = _implementation(_require, {
                dirname: function () {
                    return '/user/path/to/caller/';
                },
                resolve: function () {
                    return '/user/path/config';
                }
            });

            implementation.getCaller = function () {
                return '/user/path/to/caller/index.js';
            };

            expect(
                implementation.bind(null, '../../config', '_foo')
            ).to.throw('No implementation file found for module: "../../config"');

        });

        it('throws unknown errors', function () {

            var _require = function () {
                    throw new Error('I should not be called');
                },
                implementation;

            _require.resolve = function () {
                throw new Error('I am an unknown error');
            };

            implementation = _implementation(_require, {
                dirname: function () {
                    return '/user/path/to/caller/';
                },
                resolve: function () {
                    return '/user/path/config';
                }
            });

            implementation.getCaller = function () {
                return '/user/path/to/caller/index.js';
            };

            expect(
                implementation.bind(null, '../../config', '_foo')
            ).to.throw('I am an unknown error');

        });

    });

});
