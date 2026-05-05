thrashing
that occurs when threads are repeatedly terminated and recreated.

Strategy 3: Increase the `minThreads` configuration option. This has
the same basic effect as increasing the `idleTimeout`. If the queue
pressure is not high enough, workers may sit idle indefinitely but
there will be less of a performance hit.

In applications using Piscina, it will be most effective to use a
combination of these three approaches and tune the various configuration
parameters to find the optimum combination both for the application
workload and the capabilities of the deployment environment. There
are no one set of options that are going to work best.

### Thread priority on Linux systems

On Linux systems that support [`nice(2)`][], Piscina is capable of setting
the priority of every worker in the pool. To use this mechanism, an additional
optional native addon dependency (`@napi-rs/nice`, `npm i @napi-rs/nice`) is required.
Once [`@napi-rs/nice`][] is installed, creating a `Piscina` instance with the
`niceIncrement` configuration option will set the priority for the pool:

```js
const Piscina = require('piscina');
const pool = new Piscina({
  worker: '/absolute/path/to/worker.js',
  niceIncrement: 20
});
```

The higher the `niceIncrement`, the lower the CPU scheduling priority will be
for the pooled workers which will generally extend the execution time of
CPU-bound tasks but will help prevent those threads from stealing CPU time from
the main Node.js event loop thread. Whether this is a good thing or not depends
entirely on your application and will require careful profiling to get correct.

The key metrics to pay attention to when tuning the `niceIncrement` are the
sampled run times of the tasks in the worker pool (using the [`runTime`][]
property) and the [delay of the Node.js main thread event loop][].

### Multiple Thread Pools and Embedding Piscina as a Dependency

Every `Piscina` instance creates a separate pool of threads and operates
without any awareness of the other. When multiple pools are created in a
single application the various threads may contend with one another, and
with the Node.js main event loop thread, and may cause an overall reduction
in system performance.

Modules that embed Piscina as a dependency *should* make it clear via
documentation that threads are being used. It would be ideal if those
would make it possible for users to provide an existing `Piscina` instance
as a configuration option in lieu of always creating their own.


## Release Notes

### 4.1.0

#### Features

* add `needsDrain` property ([#368](https://github.com/piscinajs/piscina/issues/368)) ([2d49b63](https://github.com/piscinajs/piscina/commit/2d49b63368116c172a52e2019648049b4d280162))
* correctly handle process.exit calls outside of a task ([#361](https://github.com/piscinajs/piscina/issues/361)) ([8e6d16e](https://github.com/piscinajs/piscina/commit/8e6d16e1dc23f8bb39772ed954f6689852ad435f))


#### Bug Fixes

* Fix types for TypeScript 4.7 ([#239](https://github.com/piscinajs/piscina/issues/239)) ([a38fb29](https://github.com/piscinajs/piscina/commit/a38fb292e8fcc45cc20abab8668f82d908a24dc0))
* use CJS imports ([#374](https://github.com/piscinajs/piscina/issues/374)) ([edf8dc4](https://github.com/piscinajs/piscina/commit/edf8dc4f1a19e9b49e266109cdb70d9acc86f3ca))

### 4.0.0

* Drop Node.js 14.x support
* Add Node.js 20.x to CI

### 3.2.0

* Adds a new `PISCINA_DISABLE_ATOMICS` environment variable as an alternative way of
  disabling Piscina's internal use of the `Atomics` API. (https://github.com/piscinajs/pisc