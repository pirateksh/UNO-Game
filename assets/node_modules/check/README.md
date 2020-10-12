node-check
==========

Configuration checker.

[![Build Status](https://secure.travis-ci.org/msiebuhr/node-check.png?branch=master)](http://travis-ci.org/msiebuhr/node-check)

Install
-------

    npm install check

(Or clone the repo.)

Usage
-----

    var check = require('check');

	var config = {
	    database: {hostname: 'example.com', debug: false},
		someOtherSetting: 'bar'
	};

	check(config)
		.has('database.hostname') // Implicitly checks 'database'
		.hasBoolean('database.debug')
		.has('missingSetting')   // Missing key - this will make check fail.
		.assert();               // Assert if anything isn't as required.

Will produce an error not entirely unlike this:

    AssertionError: Incorrect configuration:
	    Missing key 'missingSetting'.
	at functionA (/your/source/code/a.js:line:col)
	at functionB (/your/source/code/b.js:line:col)
	...
	at EventEmitter._tickCallback (node.js:190:38)

API
===

Initialization
--------------

    check(object-literal)

Returns an chainable object whereon the following functions can be used.

.has(key)
---------

Tests if the given key is present. This also works with dot-notation, so
`has('foo.bar')` will check if `foo` exists and then if `foo` has a `bar`-thing
stuck on.

.hasArguments(key)
-----------------
.hasArray(key)
-------------
.hasBoolean(key)
---------------
.hasDate(key)
------------
.hasFunction(key)
----------------
.hasNumber(key)
--------------
.hasObject(key)
--------------
.hasRegExp(key)
--------------
.hasString(key)
--------------

First checks if the key is present (as if running `.has(key)`), and if the
given key is the right type.

.optionalArguments(key)
-----------------
.optionalArray(key)
-------------
.optionalBoolean(key)
---------------
.optionalDate(key)
------------
.optionalFunction(key)
----------------
.optionalNumber(key)
--------------
.optionalObject(key)
--------------
.optionalRegExp(key)
--------------
.optionalString(key)
--------------

If the key is present, it checks if it is of the indicated type.

Finalizers
==========

.assert()
---------

Stops the chaining and `assert()` if any keys were missing.

.ok()
-----

Stops the chaining and returns if any errors were found.

.errors()
---------

Stops the chaining and returns a list of errors (if any).

Bugs
====

Plenty! Report them! And add ideas for great features.

See Also
========

* [node-validator](https://github.com/chriso/node-validator)

License
=======

ISC; see [LICENSE](https://github.com/msiebuhr/node-check/blob/master/LICENSE).
