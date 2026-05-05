# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [20.2.9](https://www.github.com/yargs/yargs-parser/compare/yargs-parser-v20.2.8...yargs-parser-v20.2.9) (2021-06-20)


### Bug Fixes

* **build:** fixed automated release pipeline ([1fe9135](https://www.github.com/yargs/yargs-parser/commit/1fe9135884790a083615419b2861683e2597dac3))

### [20.2.8](https://www.github.com/yargs/yargs-parser/compare/yargs-parser-v20.2.7...yargs-parser-v20.2.8) (2021-06-20)


### Bug Fixes

* **locale:** Turkish camelize and decamelize issues with toLocaleLowerCase/toLocaleUpperCase ([2617303](https://www.github.com/yargs/yargs-parser/commit/261730383e02448562f737b94bbd1f164aed5143))
* **perf:** address slow parse when using unknown-options-as-args ([#394](https://www.github.com/yargs/yargs-parser/issues/394)) ([441f059](https://www.github.com/yargs/yargs-parser/commit/441f059d585d446551068ad213db79ac91daf83a))
* **string-utils:** detect [0,1] ranged values as numbers ([#388](https://www.github.com/yargs/yargs-parser/issues/388)) ([efcc32c](https://www.github.com/yargs/yargs-parser/commit/efcc32c2d6b09aba31abfa2db9bd947befe5586b))

### [20.2.7](https://www.github.com/yargs/yargs-parser/compare/v20.2.6...v20.2.7) (2021-03-10)


### Bug Fixes

* **deno:** force release for Deno ([6687c97](https://www.github.com/yargs/yargs-parser/commit/6687c972d0f3ca7865a97908dde3080b05f8b026))

### [20.2.6](https://www.github.com/yargs/yargs-parser/compare/v20.2.5...v20.2.6) (2021-02-22)


### Bug Fixes

* **populate--:** -- should always be array ([#354](https://www.github.com/yargs/yargs-parser/issues/354)) ([585ae8f](https://www.github.com/yargs/yargs-parser/commit/585ae8ffad74cc02974f92d788e750137fd65146))

### [20.2.5](https://www.github.com/yargs/yargs-parser/compare/v20.2.4...v20.2.5) (2021-02-13)


### Bug Fixes

* do not lowercase camel cased string ([#348](https://www.github.com/yargs/yargs-parser/issues/348)) ([5f4da1f](https://www.github.com/yargs/yargs-parser/commit/5f4da1f17d9d50542d2aaa206c9806ce3e320335))

### [20.2.4](https://www.github.com/yargs/yargs-parser/compare/v20.2.3...v20.2.4) (2020-11-09)


### Bug Fixes

* **deno:** address import issues in Deno ([#339](https://www.github.com/yargs/yargs-parser/issues/339)) ([3b54e5e](https://www.github.com/yargs/yargs-parser/commit/3b54e5eef6e9a7b7c6eec7c12bab3ba3b8ba8306))

### [20.2.3](https://www.github.com/yargs/yargs-parser/compare/v20.2.2...v20.2.3) (2020-10-16)


### Bug Fixes

* **exports:** node 13.0 and 13.1 require the dotted object form _with_ a string fallback ([#336](https://www.github.com/yargs/yargs-parser/issues/336)) ([3ae7242](https://www.github.com/yargs/yargs-parser/commit/3ae7242040ff876d28dabded60ac226e00150c88))

### [20.2.2](https://www.github.com/yargs/yargs-parser/compare/v20.2.1...v20.2.2) (2020-10-14)


### Bug Fixes

* **exports:** node 13.0-13.6 require a string fallback ([#333](https://www.github.com/yargs/yargs-parser/issues/333)) ([291aeda](https://www.github.com/yargs/yargs-parser/commit/291aeda06b685b7a015d83bdf2558e180b37388d))

### [20.2.1](https://www.github.com/yargs/yargs-parser/compare/v20.2.0...v20.2.1) (2020-10-01)


### Bug Fixes

* **deno:** update types for deno ^1.4.0 ([#330](https://www.github.com/yargs/yargs-parser/issues/330)) ([0ab92e5](https://www.github.com/yargs/yargs-parser/commit/0ab92e50b090f11196334c048c9c92cecaddaf56))

## [20.2.0](https://www.github.com/yargs/yargs-parser/compare/v20.1.0...v20.2.0) (2020-09-21)


### Features

* **string-utils:** export looksLikeNumber helper ([#324](https://www.github.com/yargs/yargs-parser/issues/324)) ([c8580a2](https://www.github.com/yargs/yargs-parser/commit/c8580a2327b55f6342acecb6e72b62963d506750))


### Bug Fixes

* **unknown-options-as-args:** convert positionals that look like numbers ([#326](https://www.github.com/yargs/yargs-parser/issues/326)) ([f85ebb4](https://www.github.com/yargs/yargs-parser/commit/f85ebb4face9d4b0f56147659404cbe0002f3dad))

## [20.1.0](https://www.github.com/yargs/yargs-parser/compare/v20.0.0...v20.1.0) (2020-09-20)


### Features

* adds parse-positional-numbers configuration ([#321](https://www.github.com/yargs/yargs-parser/issues/321)) ([9cec00a](https://www.github.com/yargs/yargs-parser/commit/9cec00a622251292ffb7dce6f78f5353afaa0d4c))


### Bug Fixes

* **build:** update release-please; make labels kick off builds ([#323](https://www.github.com/yargs/yargs-parser/issues/323)) ([09f448b](https://www.github.com/yargs/yargs-parser/commit/09f448b4cd66e25d2872544718df46dab8af062a))

## [20.0.0](https://www.github.com/yargs/yargs-parser/compare/v19.0.4...v20.0.0) (2020-09-09)


### ‚ö† BREAKING CHANGES

* do not ship type definitions (#318)

### Bug Fixes

* only strip camel case if hyphenated ([#316](https://www.github.com/yargs/yargs-parser/issues/316)) ([95a9e78](https://www.github.com/yargs/yargs-parser/commit/95a9e785127b9bbf2d1db1f1f808ca1fb100e82a)), closes [#315](https://www.github.com/yargs/yargs-parser/issues/315)


### Code Refactoring

* do not ship type definitions ([#318](https://www.github.com/yargs/yargs-parser/issues/318)) ([8fbd56f](https://www.github.com/yargs/yargs-parser/commit/8fbd56f1d0b6c44c30fca62708812151ca0ce330))

### [19.0.4](https://www.github.com/yargs/yargs-parser/compare/v19.0.3...v19.0.4) (2020-08-27)


### Bug Fixes

* **build:** fixing publication ([#310](https://www.github.com/yargs/yargs-parser/issues/310)) ([5d3c6c2](https://www.github.com/yargs/yargs-parser/commit/5d3c6c29a9126248ba601920d9cf87c78e161ff5))

### [19.0.3](https://www.github.com/yargs/yargs-parser/compare/v19.0.2...v19.0.3) (2020-08-27)


### Bug Fixes

* **build:** switch to action for publish ([#308](https://www.github.com/yargs/yargs-parser/issues/308)) ([5c2f305](https://www.github.com/yargs/yargs-parser/commit/5c2f30585342bcd8aaf926407c863099d256d174))

### [19.0.2](https://www.github.com/yargs/yargs-parser/compare/v19.0.1...v19.0.2) (2020-08-27)


### Bug Fixes

* **types:** envPrefix should be optional ([#305](https://www.github.com/yargs/yargs-parser/issues/305)) ([ae3f180](https://www.github.com/yargs/yargs-parser/commit/ae3f180e14df2de2fd962145f4518f9aa0e76523))

### [19.0.1](https://www.github.com/yargs/yargs-parser/compare/v19.0.0...v19.0.1) (2020-08-09)


### Bug Fixes

* **build:** push tag created for deno ([2186a14](https://www.github.com/yargs/yargs-parser/commit/2186a14989749887d56189867602e39e6679f8b0))

## [19.0.0](https://www.github.com/yargs/yargs-parser/compare/v18.1.3...v19.0.0) (2020-08-09)


### ‚ö† BREAKING CHANGES

* adds support for ESM and Deno (#295)
* **ts:** projects using `@types/yargs-parser` may see variations in type definitions.
* drops Node 6. begin following Node.js LTS schedule (#278)

### Features

* adds support for ESM and Deno ([#295](https://www.github.com/yargs/yargs-parser/issues/295)) ([195bc4a](https://www.github.com/yargs/yargs-parser/commit/195bc4a7f20c2a8f8e33fbb6ba96ef6e9a0120a1))
* expose camelCase and decamelize helpers ([#296](https://www.github.com/yargs/yargs-parser/issues/296)) ([39154ce](https://www.github.com/yargs/yargs-parser/commit/39154ceb5bdcf76b5f59a9219b34cedb79b67f26))
* **deps:** update to latest camelcase/decamelize ([#281](https://www.github.com/yargs/yargs-parser/issues/281)) ([8931ab0](https://www.github.com/yargs/yargs-parser/commit/8931ab08f686cc55286f33a95a83537da2be5516))


### Bug Fixes

* boolean numeric short option ([#294](https://www.github.com/yargs/yargs-parser/issues/294)) ([f600082](https://www.github.com/yargs/yargs-parser/commit/f600082c959e092076caf420bbbc9d7a231e2418))
* raise permission error for Deno if config load fails ([#298](https://www.github.com/yargs/yargs-parser/issues/298)) ([1174e2b](https://www.github.com/yargs/yargs-parser/commit/1174e2b3f0c845a1cd64e14ffc3703e730567a84))
* **deps:** update dependency decamelize to v3 ([#274](https://www.github.com/yargs/yargs-parser/issues/274)) ([4d98698](https://www.github.com/yargs/yargs-parser/commit/4d98698bc6767e84ec54a0842908191739be73b7))
* **types:** switch back to using Partial types ([#293](https://www.github.com/yargs/yargs-parser/issues/293)) ([bdc80ba](https://www.github.com/yargs/yargs-parser/commit/bdc80ba59fa13bc3025ce0a85e8bad9f9da24ea7))


### Build System

* drops Node 6. begin following Node.js LTS schedule ([#278](https://www.github.com/yargs/yargs-parser/issues/278)) ([9014ed7](https://www.github.com/yargs/yargs-parser/commit/9014ed722a32768b96b829e65a31705db5c1458a))


### Code Refactoring

* **ts:** move index.js to TypeScript ([#292](https://www.github.com/yargs/yargs-parser/issues/292)) ([f78d2b9](https://www.github.com/yargs/yargs-parser/commit/f78d2b97567ac4828624406e420b4047c710b789))

### [18.1.3](https://www.github.com/yargs/yargs-parser/compare/v18.1.2...v18.1.3) (2020-04-16)


### Bug Fixes

* **setArg:** options using camel-case and dot-notation populated twice ([#268](https://www.github.com/yargs/yargs-parser/issues/268)) ([f7e15b9](https://www.github.com/yargs/yargs-parser/commit/f7e15b9800900b9856acac1a830a5f35847be73e))

### [18.1.2](https://www.github.com/yargs/yargs-parser/compare/v18.1.1...v18.1.2) (2020-03-26)


### Bug Fixes

* **array, nargs:** support -o=--value and --option=--value format ([#262](https://www.github.com/yargs/yargs-parser/issues/262)) ([41d3f81](https://www.github.com/yargs/yargs-parser/commit/41d3f8139e116706b28de9b0de3433feb08d2f13))

### [18.1.1](https://www.github.com/yargs/yargs-parser/compare/v18.1.0...v18.1.1) (2020-03-16)


### Bug Fixes

* \_\_proto\_\_ will now be replaced with \_\_\_proto\_\_\_ in parse ([#258](https://www.github.com/yargs/yargs-parser/issues/258)), patching a potential 
prototype pollution vulnerability. This was reported by the Snyk Security Research Team.([63810ca](https://www.github.com/yargs/yargs-parser/commit/63810ca1ae1a24b08293a4d971e70e058c7a41e2))

## [18.1.0](https://www.github.com/yargs/yargs-parser/compare/v18.0.0...v18.1.0) (2020-03-07)


### Features

* introduce single-digit boolean aliases ([#255](https://www.github.com/yargs/yargs-parser/issues/255)) ([9c60265](https://www.github.com/yargs/yargs-parser/commit/9c60265fd7a03cb98e6df3e32c8c5e7508d9f56f))

## [18.0.0](https://www.github.com/yargs/yargs-parser/compare/v17.1.0...v18.0.0) (2020-03-02)


### ‚ö† BREAKING CHANGES

* the narg count is now enforced when parsing arrays.

### Features

* NaN can now be provided as a value for nargs, indicating "at least" one value is expected for array ([#251](https://www.github.com/yargs/yargs-parser/issues/251)) ([9db4be8](https://www.github.com/yargs/yargs-parser/commit/9db4be81417a2c7097128db34d86fe70ef4af70c))

## [17.1.0](https://www.github.com/yargs/yargs-parser/compare/v17.0.1...v17.1.0) (2020-03-01)


### Features

* introduce greedy-arrays config, for specifying whether arrays consume multiple positionals ([#249](https://www.github.com/yargs/yargs-parser/issues/249)) ([60e880a](https://www.github.com/yargs/yargs-parser/commit/60e880a837046314d89fa4725f923837fd33a9eb))

### [17.0.1](https://www.github.com/yargs/yargs-parser/compare/v17.0.0...v17.0.1) (2020-02-29)


### Bug Fixes

* normalized keys were not enumerable ([#247](https://www.github.com/yargs/yargs-parser/issues/247)) ([57119f9](https://www.github.com/yargs/yargs-parser/commit/57119f9f17cf27499bd95e61c2f72d18314f11ba))

## [17.0.0](https://www.github.com/yargs/yargs-parser/compare/v16.1.0...v17.0.0) (2020-02-10)


### ‚ö† BREAKING CHANGES

* this reverts parsing behavior of booleans to that of yargs@14
* objects used during parsing are now created with a null
prototype. There may be some scenarios where this change in behavior
leaks externally.

### Features

* boolean arguments will not be collected into an implicit array ([#236](https://www.github.com/yargs/yargs-parser/issues/236)) ([34c4e19](https://www.github.com/yargs/yargs-parser/commit/34c4e19bae4e7af63e3cb6fa654a97ed476e5eb5))
* introduce nargs-eats-options config option ([#246](https://www.github.com/yargs/yargs-parser/issues/246)) ([d50822a](https://www.github.com/yargs/yargs-parser/commit/d50822ac10e1b05f2e9643671ca131ac251b6732))


### Bug Fixes

* address bugs with "uknown-options-as-args" ([bc023e3](https://www.github.com/yargs/yargs-parser/commit/bc023e3b13e20a118353f9507d1c999bf388a346))
* array should take precedence over nargs, but enforce nargs ([#243](https://www.github.com/yargs/yargs-parser/issues/243)) ([4cbc188](https://www.github.com/yargs/yargs-parser/commit/4cbc188b7abb2249529a19c090338debdad2fe6c))
* support keys that collide with object prototypes ([#234](https://www.github.com/yargs/yargs-parser/issues/234)) ([1587b6d](https://www.github.com/yargs/yargs-parser/commit/1587b6d91db853a9109f1be6b209077993fee4de))
* unknown options terminated with digits now handled by unknown-options-as-args ([#238](https://www.github.com/yargs/yargs-parser/issues/238)) ([d36cdfa](https://www.github.com/yargs/yargs-parser/commit/d36cdfa854254d7c7e0fe1d583818332ac46c2a5))

## [16.1.0](https://www.github.com/yargs/yargs-parser/compare/v16.0.0...v16.1.0) (2019-11-01)


### ‚ö† BREAKING CHANGES

* populate error if incompatible narg/count or array/count options are used (#191)

### Features

* options that have had their default value used are now tracked ([#211](https://www.github.com/yargs/yargs-parser/issues/211)) ([a525234](https://www.github.com/yargs/yargs-parser/commit/a525234558c847deedd73f8792e0a3b77b26e2c0))
* populate error if incompatible narg/count or array/count options are used ([#191](https://www.github.com/yargs/yargs-parser/issues/191)) ([84a401f](https://www.github.com/yargs/yargs-parser/commit/84a401f0fa3095e0a19661670d1570d0c3b9d3c9))


### Reverts

* revert 16.0.0 CHANGELOG entry ([920320a](https://www.github.com/yargs/yargs-parser/commit/920320ad9861bbfd58eda39221ae211540fc1daf))
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               /**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import ts from 'typescript';
export declare function tsCastToAny(expr: ts.Expression): ts.Expression;
/**
 * Create an expression which instantiates an element by its HTML tagName.
 *
 * Thanks to narrowing of `document.createElement()`, this expression will have its type inferred
 * based on the tag name, including for custom elements that have appropriate .d.ts definitions.
 */
export declare function tsCreateElement(tagName: string): ts.Expression;
/**
 * Create a `ts.VariableStatement` which declares a variable without explicit initialization.
 *
 * The initializer `null!` is used to bypass strict variable initialization checks.
 *
 * Unlike with `tsCreateVariable`, the type of the variable is explicitly specified.
 */
export declare function tsDeclareVariable(id: ts.Identifier, type: ts.TypeNode): ts.VariableStatement;
/**
 * Creates a `ts.TypeQueryNode` for a coerced input.
 *
 * For example: `typeof MatInput.ngAcceptInputType_value`, where MatInput is `typeName` and `value`
 * is the `coercedInputName`.
 *
 * @param typeName The `EntityName` of the Directive where the static coerced input is defined.
 * @param coercedInputName The field name of the coerced input.
 */
export declare function tsCreateTypeQueryForCoercedInput(typeName: ts.EntityName, coercedInputName: string): ts.TypeQueryNode;
/**
 * Create a `ts.VariableStatement` that initializes a variable with a given expression.
 *
 * Unlike with `tsDeclareVariable`, the type of the variable is inferred from the initializer
 * expression.
 */
export declare function tsCreateVariable(id: ts.Identifier, initializer: ts.Expression, flags?: ts.NodeFlags | null): ts.VariableStatement;
/**
 * Construct a `ts.CallExpression` that calls a method on a receiver.
 */
export declare function tsCallMethod(receiver: ts.Expression, methodName: string, args?: ts.Expression[]): ts.CallExpression;
export declare function isAccessExpression(node: ts.Node): node is ts.ElementAccessExpression | ts.PropertyAccessExpression;
/**
 * Creates a TypeScript node representing a numeric value.
 */
export declare function tsNumericExpression(value: number): ts.NumericLiteral | ts.PrefixUnaryExpression;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           # yargs-parser

![ci](https://github.com/yargs/yargs-parser/workflows/ci/badge.svg)
[![NPM version](https://img.shields.io/npm/v/yargs-parser.svg)](https://www.npmjs.com/package/yargs-parser)
[![Conventional Commits](https://img.shields.io/badge/Conventional%20Commits-1.0.0-yellow.svg)](https://conventionalcommits.org)
![nycrc config on GitHub](https://img.shields.io/nycrc/yargs/yargs-parser)

The mighty option parser used by [yargs](https://github.com/yargs/yargs).

visit the [yargs website](http://yargs.js.org/) for more examples, and thorough usage instructions.

<img width="250" src="https://raw.githubusercontent.com/yargs/yargs-parser/main/yargs-logo.png">

## Example

```sh
npm i yargs-parser --save
```

```js
const argv = require('yargs-parser')(process.argv.slice(2))
console.log(argv)
```

```console
$ node example.js --foo=33 --bar hello
{ _: [], foo: 33, bar: 'hello' }
```

_or parse a string!_

```js
const argv = require('yargs-parser')('--foo=99 --bar=33')
console.log(argv)
```

```console
{ _: [], foo: 99, bar: 33 }
```

Convert an array of mixed types before passing to `yargs-parser`:

```js
const parse = require('yargs-parser')
parse(['-f', 11, '--zoom', 55].join(' '))   // <-- array to string
parse(['-f', 11, '--zoom', 55].map(String)) // <-- array of strings
```

## Deno Example

As of `v19` `yargs-parser` supports [Deno](https://github.com/denoland/deno):

```typescript
import parser from "https://deno.land/x/yargs_parser/deno.ts";

const argv = parser('--foo=99 --bar=9987930', {
  string: ['bar']
})
console.log(argv)
```

## ESM Example

As of `v19` `yargs-parser` supports ESM (_both in Node.js and in the browser_):

**Node.js:**

```js
import parser from 'yargs-parser'

const argv = parser('--foo=99 --bar=9987930', {
  string: ['bar']
})
console.log(argv)
```

**Browsers:**

```html
<!doctype html>
<body>
  <script type="module">
    import parser from "https://unpkg.com/yargs-parser@19.0.0/browser.js";

    const argv = parser('--foo=99 --bar=9987930', {
      string: ['bar']
    })
    console.log(argv)
  </script>
</body>
```

## API

### parser(args, opts={})

Parses command line arguments returning a simple mapping of keys and values.

**expects:**

* `args`: a string or array of strings representing the options to parse.
* `opts`: provide a set of hints indicating how `args` should be parsed:
  * `opts.alias`: an object representing the set of aliases for a key: `{alias: {foo: ['f']}}`.
  * `opts.array`: indicate that keys should be parsed as an array: `{array: ['foo', 'bar']}`.<br>
    Indicate that keys should be parsed as an array and coerced to booleans / numbers:<br>
    `{array: [{ key: 'foo', boolean: true }, {key: 'bar', number: true}]}`.
  * `opts.boolean`: arguments should be parsed as booleans: `{boolean: ['x', 'y']}`.
  * `opts.coerce`: provide a custom synchronous function that returns a coerced value from the argument provided
    (or throws an error). For arrays the function is called only once for the entire array:<br>
    `{coerce: {foo: function (arg) {return modifiedArg}}}`.
  * `opts.config`: indicate a key that represents a path to a configuration file (this file will be loaded and parsed).
  * `opts.configObjects`: configuration objects to parse, their properties will be set as arguments:<br>
    `{configObjects: [{'x': 5, 'y': 33}, {'z': 44}]}`.
  * `opts.configuration`: provide configuration options to the yargs-parser (see: [configuration](#configuration)).
  * `opts.count`: indicate a key that should be used as a counter, e.g., `-vvv` = `{v: 3}`.
  * `opts.default`: provide default values for keys: `{default: {x: 33, y: 'hello world!'}}`.
  * `opts.envPrefix`: environment variables (`process.env`) with the prefix provided should be parsed.
  * `opts.narg`: specify that a key requires `n` arguments: `{narg: {x: 2}}`.
  * `opts.normalize`: `path.normalize()` will be applied to values set to this key.
  * `opts.number`: keys should be treated as numbers.
  * `opts.string`: keys should be treated as strings (even if they resemble a number `-x 33`).

**returns:**

* `obj`: an object representing the parsed value of `args`
  * `key/value`: key value pairs for each argument and their aliases.
  * `_`: an array representing the positional arguments.
  * [optional] `--`:  an array with arguments after the end-of-options flag `--`.

### require('yargs-parser').detailed(args, opts={})

Parses a command line string, returning detailed information required by the
yargs engine.

**expects:**

* `args`: a string or array of strings representing options to parse.
* `opts`: provide a set of hints indicating how `args`, inputs are identical to `require('yargs-parser')(args, opts={})`.

**returns:**

* `argv`: an object representing the parsed value of `args`
  * `key/value`: key value pairs for each argument and their aliases.
  * `_`: an array representing the positional arguments.
  * [optional] `--`:  an array with arguments after the end-of-options flag `--`.
* `error`: populated with an error object if an exception occurred during parsing.
* `aliases`: the inferred list of aliases built by combining lists in `opts.alias`.
* `newAliases`: any new aliases added via camel-case expansion:
  * `boolean`: `{ fooBar: true }`
* `defaulted`: any new argument created by `opts.default`, no aliases included.
  * `boolean`: `{ foo: true }`
* `configuration`: given by default settings and `opts.configuration`.

<a name="configuration"></a>

### Configuration

The yargs-parser applies several automated transformations on the keys provided
in `args`. These features can be turned on and off using the `configuration` field
of `opts`.

```js
var parsed = parser(['--no-dice'], {
  configuration: {
    'boolean-negation': false
  }
})
```

### short option groups

* default: `true`.
* key: `short-option-groups`.

Should a group of short-options be treated as boolean flags?

```console
$ node example.js -abc
{ _: [], a: true, b: true, c: true }
```

_if disabled:_

```console
$ node example.js -abc
{ _: [], abc: true }
```

### camel-case expansion

* default: `true`.
* key: `camel-case-expansion`.

Should hyphenated arguments be expanded into camel-case aliases?

```console
$ node example.js --foo-bar
{ _: [], 'foo-bar': true, fooBar: true }
```

_if disabled:_

```console
$ node example.js --foo-bar
{ _: [], 'foo-bar': true }
```

### dot-notation

* default: `true`
* key: `dot-notation`

Should keys that contain `.` be treated as objects?

```console
$ node example.js --foo.bar
{ _: [], foo: { bar: true } }
```

_if disabled:_

```console
$ node example.js --foo.bar
{ _: [], "foo.bar": true }
```

### parse numbers

* default: `true`
* key: `parse-numbers`

Should keys that look like numbers be treated as such?

```console
$ node example.js --foo=99.3
{ _: [], foo: 99.3 }
```

_if disabled:_

```console
$ node example.js --foo=99.3
{ _: [], foo: "99.3" }
```

### parse positional numbers

* default: `true`
* key: `parse-positional-numbers`

Should positional keys that look like numbers be treated as such.

```console
$ node example.js 99.3
{ _: [99.3] }
```

_if disabled:_

```console
$ node example.js 99.3
{ _: ['99.3'] }
```

### boolean negation

* default: `true`
* key: `boolean-negation`

Should variables prefixed with `--no` be treated as negations?

```console
$ node example.js --no-foo
{ _: [], foo: false }
```

_if disabled:_

```console
$ node example.js --no-foo
{ _: [], "no-foo": true }
```

### combine arrays

* default: `false`
* key: `combine-arrays`

Should arrays be combined when provided by both command line arguments and
a configuration file.

### duplicate arguments array

* default: `true`
* key: `duplicate-arguments-array`

Should arguments be coerced into an array when duplicated:

```console
$ node example.js -x 1 -x 2
{ _: [], x: [1, 2] }
```

_if disabled:_

```console
$ node example.js -x 1 -x 2
{ _: [], x: 2 }
```

### flatten duplicate arrays

* default: `true`
* key: `flatten-duplicate-arrays`

Should array arguments be coerced into a single array when duplicated:

```console
$ node example.js -x 1 2 -x 3 4
{ _: [], x: [1, 2, 3, 4] }
```

_if disabled:_

```console
$ node example.js -x 1 2 -x 3 4
{ _: [], x: [[1, 2], [3, 4]] }
```

### greedy arrays

* default: `true`
* key: `greedy-arrays`

Should arrays consume more than one positional argument following their flag.

```console
$ node example --arr 1 2
{ _: [], arr: [1, 2] }
```

_if disabled:_

```console
$ node example --arr 1 2
{ _: [2], arr: [1] }
```

**Note: in `v18.0.0` we are considering defaulting greedy arrays to `false`.**

### nargs eats options

* default: `false`
* key: `nargs-eats-options`

Should nargs consume dash options as well as positional arguments.

### negation prefix

* default: `no-`
* key: `negation-prefix`

The prefix to use for negated boolean variables.

```console
$ node example.js --no-foo
{ _: [], foo: false }
```

_if set to `quux`:_

```console
$ node example.js --quuxfoo
{ _: [], foo: false }
```

### populate --

* default: `false`.
* key: `populate--`

Should unparsed flags be stored in `--` or `_`.

_If disabled:_

```console
$ node example.js a -b -- x y
{ _: [ 'a', 'x', 'y' ], b: true }
```

_If enabled:_

```console
$ node example.js a -b -- x y
{ _: [ 'a' ], '--': [ 'x', 'y' ], b: true }
```

### set placeholder key

* default: `false`.
* key: `set-placeholder-key`.

Should a placeholder be added for keys not set via the corresponding CLI argument?

_If disabled:_

```console
$ node example.js -a 1 -c 2
{ _: [], a: 1, c: 2 }
```

_If enabled:_

```console
$ node example.js -a 1 -c 2
{ _: [], a: 1, b: undefined, c: 2 }
```

### halt at non-option

* default: `false`.
* key: `halt-at-non-option`.

Should parsing stop at the first positional argument? This is similar to how e.g. `ssh` parses its command line.

_If disabled:_

```console
$ node example.js -a run b -x y
{ _: [ 'b' ], a: 'run', x: 'y' }
```

_If enabled:_

```console
$ node example.js -a run b -x y
{ _: [ 'b', '-x', 'y' ], a: 'run' }
```

### strip aliased

* default: `false`
* key: `strip-aliased`

Should aliases be removed before returning results?

_If disabled:_

```console
$ node example.js --test-field 1
{ _: [], 'test-field': 1, testField: 1, 'test-alias': 1, testAlias: 1 }
```

_If enabled:_

```console
$ node example.js --test-field 1
{ _: [], 'test-field': 1, testField: 1 }
```

### strip dashed

* default: `false`
* key: `strip-dashed`

Should dashed keys be removed before returning results?  This option has no effect if
`camel-case-expansion` is disabled.

_If disabled:_

```console
$ node example.js --test-field 1
{ _: [], 'test-field': 1, testField: 1 }
```

_If enabled:_

```console
$ node example.js --test-field 1
{ _: [], testField: 1 }
```

### unknown options as args

* default: `false`
* key: `unknown-options-as-args`

Should unknown options be treated like regular arguments?  An unknown option is one that is not
configured in `opts`.

_If disabled_

```console
$ node example.js --unknown-option --known-option 2 --string-option --unknown-option2
{ _: [], unknownOption: true, knownOption: 2, stringOption: '', unknownOption2: true }
```

_If enabled_

```console
$ node example.js --unknown-option --known-option 2 --string-option --unknown-option2
{ _: ['--unknown-option'], knownOption: 2, stringOption: '--unknown-option2' }
```

## Supported Node.js Versions

Libraries in this ecosystem make a best effort to track
[Node.js' release schedule](https://nodejs.org/en/about/releases/). Here's [a
post on why we think this is important](https://medium.com/the-node-js-collection/maintainers-should-consider-following-node-js-release-schedule-ab08ed4de71a).

## Special Thanks

The yargs project evolves from optimist and minimist. It owes its
existence to a lot of James Halliday's hard work. Thanks [substack](https://github.com/substack) **beep** **boop** \o/

## License

ISC
                                                                                                                                                                                                                                                                                                                                                                                    var path = require('path');
var fs = require('fs');

function Mime() {
  // Map of extension -> mime type
  this.types = Object.create(null);

  // Map of mime type -> extension
  this.extensions = Object.create(null);
}

/**
 * Define mimetype -> extension mappings.  Each key is a mime-type that maps
 * to an array of extensions associated with the type.  The first extension is
 * used as the default extension for the type.
 *
 * e.g. mime.define({'audio/ogg', ['oga', 'ogg', 'spx']});
 *
 * @param map (Object) type definitions
 */
Mime.prototype.define = function (map) {
  for (var type in map) {
    var exts = map[type];
    for (var i = 0; i < exts.length; i++) {
      if (process.env.DEBUG_MIME && this.types[exts[i]]) {
        console.warn((this._loading || "define()").replace(/.*\//, ''), 'changes "' + exts[i] + '" extension type from ' +
          this.types[exts[i]] + ' to ' + type);
      }

      this.types[exts[i]] = type;
    }

    // Default extension is the first one we encounter
    if (!this.extensions[type]) {
      this.extensions[type] = exts[0];
    }
  }
};

/**
 * Load an Apache2-style ".types" file
 *
 * This may be called multiple times (it's expected).  Where files declare
 * overlapping types/extensions, the last file wins.
 *
 * @param file (String) path of file to load.
 */
Mime.prototype.load = function(file) {
  this._loading = file;
  // Read file and split into lines
  var map = {},
      content = fs.readFileSync(file, 'ascii'),
      lines = content.split(/[\r\n]+/);

  lines.forEach(function(line) {
    // Clean up whitespace/comments, and split into fields
    var fields = line.replace(/\s*#.*|^\s*|\s*$/g, '').split(/\s+/);
    map[fields.shift()] = fields;
  });

  this.define(map);

  this._loading = null;
};

/**
 * Lookup a mime type based on extension
 */
Mime.prototype.lookup = function(path, fallback) {
  var ext = path.replace(/^.*[\.\/\\]/, '').toLowerCase();

  return this.types[ext] || fallback || this.default_type;
};

/**
 * Return file extension associated with a mime type
 */
Mime.prototype.extension = function(mimeType) {
  var type = mimeType.match(/^\s*([^;\s]*)(?:;|\s|$)/)[1].toLowerCase();
  return this.extensions[type];
};

// Default instance
var mime = new Mime();

// Define built-in types
mime.define(require('./types.json'));

// Default type
mime.default_type = mime.lookup('bin');

//
// Additional API specific to the default instance
//

mime.Mime = Mime;

/**
 * Lookup a charset based on mime type.
 */
mime.charsets = {
  lookup: function(mimeType, fallback) {
    // Assume text types are utf8
    return (/^text\/|^application\/(javascript|json)/).test(mimeType) ? 'UTF-8' : fallback;
  }
};

module.exports = mime;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          cÜTªEÚm·√∞œîÆÍﬁèNÏ…&ÇÏ04.M•l°"}<s
üZR∞ö∂§©*<ã3baCä·õa"[Ö:4dP%êÿÿï–€5\OK”ZÏô&®òVÿÁÈî'3/“^∞ÅûØ^9~Ñ\œÕ3≤À8wÓ˜¯‘S‚ {3è≤í»{±∫&K’À&í€‰«JìÕgÅŒÆgÈ!ºbæ[G´#	∫{ Ô‘Ãfj¶r	œ≠ËgO›√cyyRÆúøOië Öí∏Ö™‚¢ØáîÑô8„dÉ1Kk≥˝µ˘	)m¥‹ÚGèkﬂO’’FU6
UñsÃJoÒΩ«≥*VØØ…øÔ’”ë≈„)˙ap¶ñq¿õæâòà|˙¿ü|∆;Ì´∑Â'>˚ç°Z)xI%ËÏÌc]Dr∫xÅÛz4ªEÀÎfÚ?·—ãŒ xn ◊ÅZbu» ◊æDî#ü‰gL}â +£«uFi}¿≤ˆAŒo˜¨v="+.¬í_¿$q=Ø«ÅyMößè©AÄ‡¸¶,›ÅE$Ã∏‘F≤ÏGNﬁ¸~∞^}ƒ˛KüÇüå=≈?£¨©I÷Ω¿W ìµL¿ÿLP°Y"@ˆ˘á]†Ó7‰v‡£_ƒÚP—Í‚ª¡*51FÎqéµ1Èƒ!aÅ=‹pN»”kÿ1ıÚE&.√µS¨ÆfY)zÑÙ"Wñ‡uaOé#ÃœNù,≈å_ Y¥>D·Ñ¥ﬂ‘Ê–›p‰”ó‚˚L∏a=u∑˙ù“LÌ[Ç$ÒZWå¢KtÄÎZ∆πy∑G–<OÙ£Ù+*ê”)@¢&æ:yhÆ_|N#ı¿Å@€5≤Òpû⁄ı¢Î,⁄XÔ’ãŸ\˝1ÖBNq-8√àÊ‹1—ó$8)ù',Tj	ø‡Wó}0¥Eè*êk®pHuD.¬õ¢ŒTÆ≥™éFÌÓÎ8N?É¿‹tÁΩztÍZ|2KıNòŸ"ÿãÂi¢^ê\cˇQoﬂ˚ßß1¡ƒÏt\xZ 1¥Û¿˝Ë
©≈A•ê¡Bq4áÀûÀô[≤CwÃaz†@¯˛ˆ¨¥£&ÎAçƒä`ú…’ˇî§Ÿ≈ˇï∏Ω»∞Ï∞< +Wn"ú¡=∂‹ÖSKY‹YSZwKˇ05,ı(+˜=ái¡zrú◊"ˆqÛæ{é~Læ”f*øqÆyÈSd˛ã†Ù&îb¨ °˚i»¨>$j∂Øic≥›a≥)CN{r∂2H"Óèk«3µèB?ˆ(Ô2î–∑†ﬂ)2c—¥”ç~Í˛q2ƒéEèEB‰˙˙Nü0Ï¶JœÿìËc«[˝÷í’y7Ùí≠Û˜È>Ω§é6±Ê6ÂràoΩCóRŸâc¡>‘|JÁhÒ ◊ì≤ûA( À'PP πbèˇÖd’fwÔÁæ≈2«v•˜%ÓıJ:C◊">A6U1åÒüK˘ˆéä°aü/yõ]]w&-mOºIB=üÛy∏AÃ˘S1üH“ª…PÙØ¥ªk-ôÛèñÖJG8ÇvO@± íÏ_ûÆßi^öíkˇQøÍ¡1g∏#,1nÙÇÒØÇÂS\πæÈÂÛ≥ äHÍëD¯›@,Ê{Å—/u	p]@x¸N5ã”áxøê°±Ò©ãeÂ“§S
,∆&!q•ÜóÌ«€ËÓı!≤D	˘*upFˇå&¸˝tZb¨ñ0¢®éìô¯®}âÙı¢}W{•qüÓ}WéU±ßØ	åﬁi◊vî≤øo“9Aê√®‡ô≤b4◊ÈëÚÜvÙõOπﬂçMw˘T‚œê`y™cã.ñ≤ú÷ˆDLÃ#¶£-àöÿ˙}t~jÍPÚk-¯˜œfIÓ!Ωˆw∏Îö)	M¨ÆÁTô¢ÇÆ€10¶∏Sœ…Z§UÀ°f-ª«É>⁄GÌqò¶ï“Ê@=|)v—Ó¬G)?Á∫ÙÄÿêEJØ«ﬁÎ1hÀùˆ)ñ˘á≠Ú¿∑6<Y≈Íg·e´….ŒCæì€+ $“‹"é«zï<ÕX«O…’TæïŒ`ü~IæQl]oGÆÓVzÏÓ∂ÃﬂˆIÄ<[Øò;åÌÈ†®˜ù2#;<q4]÷  …≠¥€˜C…òµ7™"ë∞ôCπÕÂD¬êck®˜„∆õNwo˘5v≠≤L˘`h\J˙lÛö{@É¡f™9ˇÏ\MˇL>ï4"}•;$k√¸OÖñÆ]%ÆjN{}'ŸŒÄjSe∆Ä˚                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              import { argsert } from './argsert.js';
import { isPromise } from './utils/is-promise.js';
export function globalMiddlewareFactory(globalMiddleware, context) {
    return function (callback, applyBeforeValidation = false) {
        argsert('<array|function> [boolean]', [callback, applyBeforeValidation], arguments.length);
        if (Array.isArray(callback)) {
            for (let i = 0; i < callback.length; i++) {
                if (typeof callback[i] !== 'function') {
                    throw Error('middleware must be a function');
                }
                callback[i].applyBeforeValidation = applyBeforeValidation;
            }
            Array.prototype.push.apply(globalMiddleware, callback);
        }
        else if (typeof callback === 'function') {
            callback.applyBeforeValidation = applyBeforeValidation;
            globalMiddleware.push(callback);
        }
        return context;
    };
}
export function commandMiddlewareFactory(commandMiddleware) {
    if (!commandMiddleware)
        return [];
    return commandMiddleware.map(middleware => {
        middleware.applyBeforeValidation = false;
        return middleware;
    });
}
export function applyMiddleware(argv, yargs, middlewares, beforeValidation) {
    const beforeValidationError = new Error('middleware cannot return a promise when applyBeforeValidation is true');
    return middlewares.reduce((acc, middleware) => {
        if (middleware.applyBeforeValidation !== beforeValidation) {
            return acc;
        }
        if (isPromise(acc)) {
            return acc
                .then(initialObj => Promise.all([
                initialObj,
                middleware(initialObj, yargs),
            ]))
                .then(([initialObj, middlewareObj]) => Object.assign(initialObj, middlewareObj));
        }
        else {
            const result = middleware(acc, yargs);
            if (beforeValidation && isPromise(result))
                throw beforeValidationError;
            return isPromise(result)
                ? result.then(middlewareObj => Object.assign(acc, middlewareObj))
                : Object.assign(acc, result);
        }
    }, argv);
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  /// <reference types="node" />
/// <reference types="node" />
import { EventEmitter as EE } from 'events';
import { BrotliDecompress, Unzip } from 'minizlib';
import { Yallist } from 'yallist';
import { TarOptions } from './options.js';
import { Pax } from './pax.js';
import { ReadEntry } from './read-entry.js';
import { type WarnData, type Warner } from './warn-method.js';
declare const STATE: unique symbol;
declare const WRITEENTRY: unique symbol;
declare const READENTRY: unique symbol;
declare const NEXTENTRY: unique symbol;
declare const PROCESSENTRY: unique symbol;
declare const EX: unique symbol;
declare const GEX: unique symbol;
declare const META: unique symbol;
declare const EMITMETA: unique symbol;
declare const BUFFER: unique symbol;
declare const QUEUE: unique symbol;
declare const ENDED: unique symbol;
declare const EMITTEDEND: unique symbol;
declare const EMIT: unique symbol;
declare const UNZIP: unique symbol;
declare const CONSUMECHUNK: unique symbol;
declare const CONSUMECHUNKSUB: unique symbol;
declare const CONSUMEBODY: unique symbol;
declare const CONSUMEMETA: unique symbol;
declare const CONSUMEHEADER: unique symbol;
declare const CONSUMING: unique symbol;
declare const BUFFERCONCAT: unique symbol;
declare const MAYBEEND: unique symbol;
declare const WRITING: unique symbol;
declare const ABORTED: unique symbol;
declare const SAW_VALID_ENTRY: unique symbol;
declare const SAW_NULL_BLOCK: unique symbol;
declare const SAW_EOF: unique symbol;
declare const CLOSESTREAM: unique symbol;
export type State = 'begin' | 'header' | 'ignore' | 'meta' | 'body';
export declare class Parser extends EE implements Warner {
    file: string;
    strict: boolean;
    maxMetaEntrySize: number;
    filter: Exclude<TarOptions['filter'], undefined>;
    brotli?: TarOptions['brotli'];
    writable: true;
    readable: false;
    [QUEUE]: Yallist<ReadEntry | [string | symbol, any, any]>;
    [BUFFER]?: Buffer;
    [READENTRY]?: ReadEntry;
    [WRITEENTRY]?: ReadEntry;
    [STATE]: State;
    [META]: string;
    [EX]?: Pax;
    [GEX]?: Pax;
    [ENDED]: boolean;
    [UNZIP]?: false | Unzip | BrotliDecompress;
    [ABORTED]: boolean;
    [SAW_VALID_ENTRY]?: boolean;
    [SAW_NULL_BLOCK]: boolean;
    [SAW_EOF]: boolean;
    [WRITING]: boolean;
    [CONSUMING]: boolean;
    [EMITTEDEND]: boolean;
    constructor(opt?: TarOptions);
    warn(code: string, message: string | Error, data?: WarnData): void;
    [CONSUMEHEADER](chunk: Buffer, position: number): void;
    [CLOSESTREAM](): void;
    [PROCESSENTRY](entry?: ReadEntry | [string | symbol, any, any]): boolean;
    [NEXTENTRY](): void;
    [CONSUMEBODY](chunk: Buffer, position: number): number;
    [CONSUMEMETA](chunk: Buffer, position: number): number;
    [EMIT](ev: string | symbol, data?: any, extra?: any): void;
    [EMITMETA](entry: ReadEntry): void;
    abort(error: Error): void;
    write(buffer: Uint8Array | string, cb?: (err?: Error | null) => void): boolean;
    write(str: string, encoding?: BufferEncoding, cb?: (err?: Error | null) => void): boolean;
    [BUFFERCONCAT](c: Buffer): void;
    [MAYBEEND](): void;
    [CONSUMECHUNK](chunk?: Buffer): void;
    [CONSUMECHUNKSUB](chunk: Buffer): void;
    end(cb?: () => void): this;
    end(data: string | Buffer, cb?: () => void): this;
    end(str: string, encoding?: BufferEncoding, cb?: () => void): this;
}
export {};
//# sourceMappingURL=parse.d.ts.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          O	˚EJGÓKß8•æ3µAÖ¥–§Ñæøø»íÖÖ5(_Ä„6∆¡Á9óëÛA†˙∫BØÂø§áhü4å¨Y4À•¿ôâ9£_¯_ùË°Éa/jŸ	‚9®ŸkÙ<s`ùÖ´]øûØC•·ú(©.á.Î·¬b˛ÿGRÊˆ|ÙfΩmÖ…ârÙœø‘•ÀB~∆<B….Zú†!•˚8Ü∆…= ”˛˚›ã¸oˆ<Ç"¿°»ôïöV±æmx∫s)IZl@õ‚cÌá2A+ùœ Y≥ÂG$@∫™û√3»N√Q‰Çˇvˆ¶Uo†úñùJ∆”8*«2∏çòâÛﬂnRà£Õáq–ˆœ c‘Q÷˚"NŸ£F%êYdy ‡§M√<!ƒ‘c%d¶i©xáå-|`±åªX é¶ü<8ÁCSŒÊ™‘  ≥À˚`â8+sñ™„©≥÷™‰R6ÎÌÚä$¯ØüFx°¡“6„€dñK¢Z!n˛ˇ◊á#bj)4«ŸD~m
ººÚtr¡ΩJT™µ$qÎEﬁ¨A_⁄Ê:$ÎÜÆÊb‰zd¯∏ÚëœaK§Uö	Ás”â√3Á€∑Sﬁ]t¬˜ü\˚™_.v}-∏&Z-ò|â4„Í°çw≤É◊‘°Ûêõ'l∏xmè ØÜãH„bÖIæÅ"P!åI(”¿0>ÿ©{ŸN8>âƒ.„8ˇ≥s3GJrEÖ≠mÆdUÏ∞Zﬁ€∑Zz‹f/ZÂ 2GPéß/oß_®¿û◊«∏º‚ÍSÜ!ÇÒ Í£
Ù£p4åO›ÊﬂËè¬H‡∏±~ãÚÂK⁄†G~`¯≤∫ıı”ô∂>◊⁄äÌ’´|\MpfjDCåƒ	7üÚXzƒπ¥•f,T\a®&jPy‹Œô≠®£g$ﬂ}™=CwÚ‘≠‚é
l,œ⁄:/çµKTÏà[ÿπPWóê†ü,Jc]ÄÛ∆yâÖçL0øh¡îZf˙Aˆöªí/´Û*aE™er<€d£wyùafBÖ®[ˇ≠Ã–]/1¸[:wu°'Áèá”’Ü		”(q«F"=ﬂ´ÍΩΩ≠sgüvY|≥Á,‹ƒCßFúÂT;VË©t©õ5\[¸¯ΩÑ`?æ^µT	˘˜ÚHø∂Ù¥‰‰Ω“KÖ‹◊√ˆ9ÕË?Ω¨‹ﬂîŒ˚Ç?X√klä´Xê¡oÿZ†œö¥rçòlO™≤ÇÖ¿¢Q¿Ibf4"ë£≤ãπO)⁄Ã¶0≠jﬁu_Z8π¶çZ q˘ ô.SöüÍ	◊;nèî'∞ß‘NÌN¸£¯œê?å-fı˜íu™/Ø∆€E‰‰Ë*⁄ts˛+ΩY
ëf4í©y,R‘s+ZWy‘ÔDYÖ›XŒÆª~ª-âI<êÑ|7qâûßd
á}U †/§~wn⁄áÁæ˝S±?ì\dÙÖ¨[Ú\8ç*=ˇ¨ç≥¬‰ôh∞‰Ây—0tQËkgµ˚tÇ¬œˆÖ!m2ª9me$FËC¢è>Ò—[Ù˛CW{Èôgrï◊%ÈŸû«» |+-Z[≠Úx!
MÓΩ¨ Ô:‡iΩb>ªbΩÿ†<≠~G’BôŒÅ˚‘úTàg§DÚçGù€ßã
¯‚úÆÏ™}2l“KÂ]„ÌÅ)ÔßBÇ∞–l3‡ç`Ïd‘:faòÕ˝–ôúØ=;e¢F‘'£
˜∆˙ª]X˛d.Ö`K{“¡áiºùbfÔetHíq†!‚ﬁ^Læ z5i∆‡—!m ˜y¬ó
ŸÇïYvlÚY∆Œ9≠Ôª,t5CÊ#0€hã∑ˇàπVªêœœUl%{M±Û¸Ä•ÛıùWöw÷KSE˚¥ìe›°¸%>
†ŸAºTßío∑ﬁÕF3-¸ÿçmzµ÷8f‹,A-~∞¿»Õ›ŒJ Ùë†|; É$8w°Œﬁ¶¶Î(`MqHÊM wrÓ ‚Ü ˇ:ô˘uç˚e›[.‰SN5ÈBZ~í¢¯Ú‚.U§ëLˇ,îJ≤‚f¥
◊$i|ÁQ“π:®ã7J4ÑÂsÁmsÁ≥˝¡ÆVíTdΩBJb‘FªJF¿£ÿãØWœ´√ùö.ÿe˛gê˙9wÜáRgh€ø?ûHd"©x”¸aï‡√K»/Ê8öﬁ»Cm4øWVH>û^Q^†a(µ<Ë¥MÖ9ÿ)é3≈e#YÍ’6I5;?                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              /* -*- Mode: js; js-indent-level: 2; -*- */
/*
 * Copyright 2011 Mozilla Foundation and contributors
 * Licensed under the New BSD license. See LICENSE or:
 * http://opensource.org/licenses/BSD-3-Clause
 */

// It turns out that some (most?) JavaScript engines don't self-host
// `Array.prototype.sort`. This makes sense because C++ will likely remain
// faster than JS when doing raw CPU-intensive sorting. However, when using a
// custom comparator function, calling back and forth between the VM's C++ and
// JIT'd JS is rather slow *and* loses JIT type information, resulting in
// worse generated code for the comparator function than would be optimal. In
// fact, when sorting with a comparator, these costs outweigh the benefits of
// sorting in C++. By using our own JS-implemented Quick Sort (below), we get
// a ~3500ms mean speed-up in `bench/bench.html`.

/**
 * Swap the elements indexed by `x` and `y` in the array `ary`.
 *
 * @param {Array} ary
 *        The array.
 * @param {Number} x
 *        The index of the first item.
 * @param {Number} y
 *        The index of the second item.
 */
function swap(ary, x, y) {
  var temp = ary[x];
  ary[x] = ary[y];
  ary[y] = temp;
}

/**
 * Returns a random integer within the range `low .. high` inclusive.
 *
 * @param {Number} low
 *        The lower bound on the range.
 * @param {Number} high
 *        The upper bound on the range.
 */
function randomIntInRange(low, high) {
  return Math.round(low + (Math.random() * (high - low)));
}

/**
 * The Quick Sort algorithm.
 *