
                        }
                        if (this.#hasDisposeAfter) {
                            this.#disposed?.push([s, k, 'set']);
                        }
                    }
                }
                else if (!noDisposeOnSet) {
                    if (this.#hasDispose) {
                        this.#dispose?.(oldVal, k, 'set');
                    }
                    if (this.#hasDisposeAfter) {
                        this.#disposed?.push([oldVal, k, 'set']);
                    }
                }
                this.#removeItemSize(index);
                this.#addItemSize(index, size, status);
                this.#valList[index] = v;
                if (status) {
                    status.set = 'replace';
                    const oldValue = oldVal && this.#isBackgroundFetch(oldVal)
                        ? oldVal.__staleWhileFetching
                        : oldVal;
                    if (oldValue !== undefined)
                        status.oldValue = oldValue;
                }
            }
            else if (status) {
                status.set = 'update';
            }
        }
        if (ttl !== 0 && !this.#ttls) {
            this.#initializeTTLTracking();
        }
        if (this.#ttls) {
            if (!noUpdateTTL) {
                this.#setItemTTL(index, ttl, start);
            }
            if (status)
                this.#statusTTL(status, index);
        }
        if (!noDisposeOnSet && this.#hasDisposeAfter && this.#disposed) {
            const dt = this.#disposed;
            let task;
            while ((task = dt?.shift())) {
                this.#disposeAfter?.(...task);
            }
        }
        return this;
    }
    /**
     * Evict the least recently used item, returning its value or
     * `undefined` if cache is empty.
     */
    pop() {
        try {
            while (this.#size) {
                const val = this.#valList[this.#head];
                this.#evict(true);
                if (this.#isBackgroundFetch(val)) {
                    if (val.__staleWhileFetching) {
                        return val.__staleWhileFetching;
                    }
                }
                else if (val !== undefined) {
                    return val;
                }
            }
        }
        finally {
            if (this.#hasDisposeAfter && this.#disposed) {
                const dt = this.#disposed;
                let task;
                while ((task = dt?.shift())) {
                    this.#disposeAfter?.(...task);
                }
            }
        }
    }
    #evict(free) {
        const head = this.#head;
        const k = this.#keyList[head];
        const v = this.#valList[head];
        if (this.#hasFetchMethod && this.#isBackgroundFetch(v)) {
            v.__abortController.abort(new Error('evicted'));
        }
        else if (this.#hasDispose || this.#hasDisposeAfter) {
            if (this.#hasDispose) {
                this.#dispose?.(v, k, 'evict');
            }
            if (this.#hasDisposeAfter) {
                this.#disposed?.push([v, k, 'evict']);
            }
        }
        this.#removeItemSize(head);
        // if we aren't about to use the index, then null these out
        if (free) {
            this.#keyList[head] = undefined;
            this.#valList[head] = undefined;
            this.#free.push(head);
        }
        if (this.#size === 1) {
            this.#head = this.#tail = 0;
            this.#free.length = 0;
        }
        else {
            this.#head = this.#next[head];
        }
        this.#keyMap.delete(k);
        this.#size--;
        return head;
    }
    /**
     * Check if a key is in the cache, without updating the recency of use.
     * Will return false if the item is stale, even though it is technically
     * in the cache.
     *
     * Check if a key is in the cache, without updating the recency of
     * use. Age is updated if {@link LRUCache.OptionsBase.updateAgeOnHas} is set
     * to `true` in either the options or the constructor.
     *
     * Will return `false` if the item is stale, even though it is technically in
     * the cache. The difference can be determined (if it matters) by using a
     * `status` argument, and inspecting the `has` field.
     *
     * Will not update item age unless
     * {@link LRUCache.OptionsBase.updateAgeOnHas} is set.
     */
    has(k, hasOptions = {}) {
        const { updateAgeOnHas = this.updateAgeOnHas, status } = hasOptions;
        const index = this.#keyMap.get(k);
        if (index !== undefined) {
            const v = this.#valList[index];
            if (this.#isBackgroundFetch(v) &&
                v.__staleWhileFetching === undefined) {
                return false;
            }
            if (!this.#isStale(index)) {
                if (updateAgeOnHas) {
                    this.#updateItemAge(index);
                }
                if (status) {
                    status.has = 'hit';
                    this.#statusTTL(status, index);
                }
                return true;
            }
            else if (status) {
                status.has = 'stale';
                this.#statusTTL(status, index);
            }
        }
        else if (status) {
            status.has = 'miss';
        }
        return false;
    }
    /**
     * Like {@link LRUCache#get} but doesn't update recency or delete stale
     * items.
     *
     * Returns `undefined` if the item is stale, unless
     * {@link LRUCache.OptionsBase.allowStale} is set.
     */
    peek(k, peekOptions = {}) {
        const { allowStale = this.allowStale } = peekOptions;
        const index = this.#keyMap.get(k);
        if (index === undefined ||
            (!allowStale && this.#isStale(index))) {
            return;
        }
        const v = this.#valList[index];
        // either stale and allowed, or forcing a refresh of non-stale value
        return this.#isBackgroundFetch(v) ? v.__staleWhileFetching : v;
    }
    #backgroundFetch(k, index, options, context) {
        const v = index === undefined ? undefined : this.#valList[index];
        if (this.#isBackgroundFetch(v)) {
            return v;
        }
        const ac = new AC();
        const { signal } = options;
        // when/if our AC signals, then stop listening to theirs.
        signal?.addEventListener('abort', () => ac.abort(signal.reason), {
            signal: ac.signal,
        });
        const fetchOpts = {
            signal: ac.signal,
            options,
            context,
        };
        const cb = (v, updateCache = false) => {
            const { aborted } = ac.signal;
            const ignoreAbort = options.ignoreFetchAbort && v !== undefined;
            if (options.status) {
                if (aborted && !updateCache) {
                    options.status.fetchAborted = true;
                    options.status.fetchError = ac.signal.reason;
                    if (ignoreAbort)
                        options.status.fetchAbortIgnored = true;
                }
                else {
                    options.status.fetchResolved = true;
                }
            }
            if (aborted && !ignoreAbort && !updateCache) {
                return fetchFail(ac.signal.reason);
            }
            // either we didn't abort, and are still here, or we did, and ignored
            const bf = p;
            if (this.#valList[index] === p) {
                if (v === undefined) {
                    if (bf.__staleWhileFetching) {
                        this.#valList[index] = bf.__staleWhileFetching;
                    }
                    else {
                        this.#delete(k, 'fetch');
                    }
                }
                else {
                    if (options.status)
                        options.status.fetchUpdated = true;
                    this.set(k, v, fetchOpts.options);
                }
            }
            return v;
        };
        const eb = (er) => {
            if (options.status) {
                options.status.fetchRejected = true;
                options.status.fetchError = er;
            }
            return fetchFail(er);
        };
        const fetchFail = (er) => {
            const { aborted } = ac.signal;
            const allowStaleAborted = aborted && options.allowStaleOnFetchAbort;
            const allowStale = allowStaleAborted || options.allowStaleOnFetchRejection;
            const noDelete = allowStale || options.noDeleteOnFetchRejection;
            const bf = p;
            if (this.#valList[index] === p) {
                // if we allow stale on fetch rejections, then we need to ensure that
                // the stale value is not removed from the cache when the fetch fails.
                const del = !noDelete || bf.__staleWhileFetching === undefined;
                if (del) {
                    this.#delete(k, 'fetch');
                }
                else if (!allowStaleAborted) {
                    // still replace the *promise* with the stale value,
                    // since we are done with the promise at this point.
                    // leave it untouched if we're still waiting for an
                    // aborted background fetch that hasn't yet returned.
                    this.#valList[index] = bf.__staleWhileFetching;
                }
            }
            if (allowStale) {
                if (options.status && bf.__staleWhileFetching !== undefined) {
                    options.status.returnedStale = true;
                }
                return bf.__staleWhileFetching;
            }
            else if (bf.__returned === bf) {
                throw er;
            }
        };
        const pcall = (res, rej) => {
            const fmp = this.#fetchMethod?.(k, v, fetchOpts);
            if (fmp && fmp instanceof Promise) {
                fmp.then(v => res(v === undefined ? undefined : v), rej);
            }
            // ignored, we go until we finish, regardless.
            // defer check until we are actually aborting,
            // so fetchMethod can override.
            ac.signal.addEventListener('abort', () => {
                if (!options.ignoreFetchAbort ||
                    options.allowStaleOnFetchAbort) {
                    res(undefined);
                    // when it eventually resolves, update the cache.
                    if (options.allowStaleOnFetchAbort) {
                        res = v => cb(v, true);
                    }
                }
            });
        };
        if (options.status)
            options.status.fetchDispatched = true;
        const p = new Promise(pcall).then(cb, eb);
        const bf = Object.assign(p, {
            __abortController: ac,
            __staleWhileFetching: v,
            __returned: undefined,
        });
        if (index === undefined) {
            // internal, don't expose status.
            this.set(k, bf, { ...fetchOpts.options, status: undefined });
            index = this.#keyMap.get(k);
        }
        else {
            this.#valList[index] = bf;
        }
        return bf;
    }
    #isBackgroundFetch(p) {
        if (!this.#hasFetchMethod)
            return false;
        const b = p;
        return (!!b &&
            b instanceof Promise &&
            b.hasOwnProperty('__staleWhileFetching') &&
            b.__abortController instanceof AC);
    }
    async fetch(k, fetchOptions = {}) {
        const { 
        // get options
        allowStale = this.allowStale, updateAgeOnGet = this.updateAgeOnGet, noDeleteOnStaleGet = this.noDeleteOnStaleGet, 
        // set options
        ttl = this.ttl, noDisposeOnSet = this.noDisposeOnSet, size = 0, sizeCalculation = this.sizeCalculation, noUpdateTTL = this.noUpdateTTL, 
        // fetch exclusive options
        noDeleteOnFetchRejection = this.noDeleteOnFetchRejection, allowStaleOnFetchRejection = this.allowStaleOnFetchRejection, ignoreFetchAbort = this.ignoreFetchAbort, allowStaleOnFetchAbort = this.allowStaleOnFetchAbort, context, forceRefresh = false, status, signal, } = fetchOptions;
        if (!this.#hasFetchMethod) {
            if (status)
                status.fetch = 'get';
            return this.get(k, {
                allowStale,
                updateAgeOnGet,
                noDeleteOnStaleGet,
                status,
            });
        }
        const options = {
            allowStale,
            updateAgeOnGet,
            noDeleteOnStaleGet,
            ttl,
            noDisposeOnSet,
            size,
            sizeCalculation,
            noUpdateTTL,
            noDeleteOnFetchRejection,
            allowStaleOnFetchRejection,
            allowStaleOnFetchAbort,
            ignoreFetchAbort,
            status,
            signal,
        };
        let index = this.#keyMap.get(k);
        if (index === undefined) {
            if (status)
                status.fetch = 'miss';
            const p = this.#backgroundFetch(k, index, options, context);
            return (p.__returned = p);
        }
        else {
            // in cache, maybe already fetching
            const v = this.#valList[index];
            if (this.#isBackgroundFetch(v)) {
                const stale = allowStale && v.__staleWhileFetching !== undefined;
                if (status) {
                    status.fetch = 'inflight';
                    if (stale)
                        status.returnedStale = true;
                }
                return stale ? v.__staleWhileFetching : (v.__returned = v);
            }
            // if we force a refresh, that means do NOT serve the cached value,
            // unless we are already in the process of refreshing the cache.
            const isStale = this.#isStale(index);
            if (!forceRefresh && !isStale) {
                if (status)
                    status.fetch = 'hit';
                this.#moveToTail(index);
                if (updateAgeOnGet) {
                    this.#updateItemAge(index);
                }
                if (status)
                    this.#statusTTL(status, index);
                return v;
            }
            // ok, it is stale or a forced refresh, and not already fetching.
            // refresh the cache.
            const p = this.#backgroundFetch(k, index, options, context);
            const hasStale = p.__staleWhileFetching !== undefined;
            const staleVal = hasStale && allowStale;
            if (status) {
                status.fetch = isStale ? 'stale' : 'refresh';
                if (staleVal && isStale)
                    status.returnedStale = true;
            }
            return staleVal ? p.__staleWhileFetching : (p.__returned = p);
        }
    }
    async forceFetch(k, fetchOptions = {}) {
        const v = await this.fetch(k, fetchOptions);
        if (v === undefined)
            throw new Error('fetch() returned undefined');
        return v;
    }
    memo(k, memoOptions = {}) {
        const memoMethod = this.#memoMethod;
        if (!memoMethod) {
            throw new Error('no memoMethod provided to constructor');
        }
        const { context, forceRefresh, ...options } = memoOptions;
        const v = this.get(k, options);
        if (!forceRefresh && v !== undefined)
            return v;
        const vv = memoMethod(k, v, {
            options,
            context,
        });
        this.set(k, vv, options);
        return vv;
    }
    /**
     * Return a value from the cache. Will update the recency of the cache
     * entry found.
     *
     * If the key is not found, get() will return `undefined`.
     */
    get(k, getOptions = {}) {
        const { allowStale = this.allowStale, updateAgeOnGet = this.updateAgeOnGet, noDeleteOnStaleGet = this.noDeleteOnStaleGet, status, } = getOptions;
        const index = this.#keyMap.get(k);
        if (index !== undefined) {
            const value = this.#valList[index];
            const fetching = this.#isBackgroundFetch(value);
            if (status)
                this.#statusTTL(status, index);
            if (this.#isStale(index)) {
                if (status)
                    status.get = 'stale';
                // delete only if not an in-flight background fetch
                if (!fetching) {
                    if (!noDeleteOnStaleGet) {
                        this.#delete(k, 'expire');
                    }
                    if (status && allowStale)
                        status.returnedStale = true;
                    return allowStale ? value : undefined;
                }
                else {
                    if (status &&
                        allowStale &&
                        value.__staleWhileFetching !== undefined) {
                        status.returnedStale = true;
                    }
                    return allowStale ? value.__staleWhileFetching : undefined;
                }
            }
            else {
                if (status)
                    status.get = 'hit';
                // if we're currently fetching it, we don't actually have it yet
                // it's not stale, which means this isn't a staleWhileRefetching.
                // If it's not stale, and fetching, AND has a __staleWhileFetching
                // value, then that means the user fetched with {forceRefresh:true},
                // so it's safe to return that value.
                if (fetching) {
                    return value.__staleWhileFetching;
                }
                this.#moveToTail(index);
                if (updateAgeOnGet) {
                    this.#updateItemAge(index);
                }
                return value;
            }
        }
        else if (status) {
            status.get = 'miss';
        }
    }
    #connect(p, n) {
        this.#prev[n] = p;
        this.#next[p] = n;
    }
    #moveToTail(index) {
        // if tail already, nothing to do
        // if head, move head to next[index]
        // else
        //   move next[prev[index]] to next[index] (head has no prev)
        //   move prev[next[index]] to prev[index]
        // prev[index] = tail
        // next[tail] = index
        // tail = index
        if (index !== this.#tail) {
            if (index === this.#head) {
                this.#head = this.#next[index];
            }
            else {
                this.#connect(this.#prev[index], this.#next[index]);
            }
            this.#connect(this.#tail, index);
            this.#tail = index;
        }
    }
    /**
     * Deletes a key out of the cache.
     *
     * Returns true if the key was deleted, false otherwise.
     */
    delete(k) {
        return this.#delete(k, 'delete');
    }
    #delete(k, reason) {
        let deleted = false;
        if (this.#size !== 0) {
            const index = this.#keyMap.get(k);
            if (index !== undefined) {
                deleted = true;
                if (this.#size === 1) {
                    this.#clear(reason);
                }
                else {
                    this.#removeItemSize(index);
                    const v = this.#valList[index];
                    if (this.#isBackgroundFetch(v)) {
                        v.__abortController.abort(new Error('deleted'));
                    }
                    else if (this.#hasDispose || this.#hasDisposeAfter) {
                        if (this.#hasDispose) {
                            this.#dispose?.(v, k, reason);
                        }
                        if (this.#hasDisposeAfter) {
                            this.#disposed?.push([v, k, reason]);
                        }
                    }
                    this.#keyMap.delete(k);
                    this.#keyList[index] = undefined;
                    this.#valList[index] = undefined;
                    if (index === this.#tail) {
                        this.#tail = this.#prev[index];
                    }
                    else if (index === this.#head) {
                        this.#head = this.#next[index];
                    }
                    else {
                        const pi = this.#prev[index];
                        this.#next[pi] = this.#next[index];
                        const ni = this.#next[index];
                        this.#prev[ni] = this.#prev[index];
                    }
                    this.#size--;
                    this.#free.push(index);
                }
            }
        }
        if (this.#hasDisposeAfter && this.#disposed?.length) {
            const dt = this.#disposed;
            let task;
            while ((task = dt?.shift())) {
                this.#disposeAfter?.(...task);
            }
        }
        return deleted;
    }
    /**
     * Clear the cache entirely, throwing away all values.
     */
    clear() {
        return this.#clear('delete');
    }
    #clear(reason) {
        for (const index of this.#rindexes({ allowStale: true })) {
            const v = this.#valList[index];
            if (this.#isBackgroundFetch(v)) {
                v.__abortController.abort(new Error('deleted'));
            }
            else {
                const k = this.#keyList[index];
                if (this.#hasDispose) {
                    this.#dispose?.(v, k, reason);
                }
                if (this.#hasDisposeAfter) {
                    this.#disposed?.push([v, k, reason]);
                }
            }
        }
        this.#keyMap.clear();
        this.#valList.fill(undefined);
        this.#keyList.fill(undefined);
        if (this.#ttls && this.#starts) {
            this.#ttls.fill(0);
            this.#starts.fill(0);
        }
        if (this.#sizes) {
            this.#sizes.fill(0);
        }
        this.#head = 0;
        this.#tail = 0;
        this.#free.length = 0;
        this.#calculatedSize = 0;
        this.#size = 0;
        if (this.#hasDisposeAfter && this.#disposed) {
            const dt = this.#disposed;
            let task;
            while ((task = dt?.shift())) {
                this.#disposeAfter?.(...task);
            }
        }
    }
}
exports.LRUCache = LRUCache;
//# sourceMappingURL=index.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    /**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
declare function plural(val: number): number;
declare const _default: (string | number | number[] | (string | undefined)[] | typeof plural | (string[] | undefined)[] | {
    ARS: string[];
    AUD: string[];
    BEF: string[];
    BMD: string[];
    BND: string[];
    BYN: (string | undefined)[];
    BZD: string[];
    CAD: string[];
    CLP: string[];
    CNY: (string | undefined)[];
    COP: string[];
    CYP: string[];
    DZD: string[];
    EGP: (string | undefined)[];
    FJD: string[];
    FKP: string[];
    FRF: string[];
    GBP: string[];
    GIP: string[];
    HKD: (string | undefined)[];
    IEP: string[];
    ILP: string[];
    ITL: string[];
    JPY: (string | undefined)[];
    KMF: (string | undefined)[];
    LBP: string[];
    MTP: string[];
    MXN: string[];
    NAD: string[];
    NIO: (string | undefined)[];
    NZD: string[];
    PHP: (string | undefined)[];
    RHD: string[];
    RON: (string | undefined)[];
    RWF: (string | undefined)[];
    SBD: string[];
    SGD: string[];
    SRD: string[];
    TOP: (string | undefined)[];
    TTD: string[];
    TWD: (string | undefined)[];
    USD: string[];
    UYU: string[];
    WST: string[];
    XCD: (string | undefined)[];
    XPF: string[];
    ZMW: (string | undefined)[];
} | undefined)[];
export default _default;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               Copyright (c) 2011-2023 James Halliday (mail@substack.net) and Isaac Z. Schlueter (i@izs.me)

This project is free software released under the MIT license:

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    # debug
[![Build Status](https://travis-ci.org/visionmedia/debug.svg?branch=master)](https://travis-ci.org/visionmedia/debug)  [![Coverage Status](https://coveralls.io/repos/github/visionmedia/debug/badge.svg?branch=master)](https://coveralls.io/github/visionmedia/debug?branch=master)  [![Slack](https://visionmedia-community-slackin.now.sh/badge.svg)](https://visionmedia-community-slackin.now.sh/) [![OpenCollective](https://opencollective.com/debug/backers/badge.svg)](#backers) 
[![OpenCollective](https://opencollective.com/debug/sponsors/badge.svg)](#sponsors)



A tiny node.js debugging utility modelled after node core's debugging technique.

**Discussion around the V3 API is under way [here](https://github.com/visionmedia/debug/issues/370)**

## Installation

```bash
$ npm install debug
```

## Usage

`debug` exposes a function; simply pass this function the name of your module, and it will return a decorated version of `console.error` for you to pass debug statements to. This will allow you to toggle the debug output for different parts of your module as well as the module as a whole.

Example _app.js_:

```js
var debug = require('debug')('http')
  , http = require('http')
  , name = 'My App';

// fake app

debug('booting %s', name);

http.createServer(function(req, res){
  debug(req.method + ' ' + req.url);
  res.end('hello\n');
}).listen(3000, function(){
  debug('listening');
});

// fake worker of some kind

require('./worker');
```

Example _worker.js_:

```js
var debug = require('debug')('worker');

setInterval(function(){
  debug('doing some work');
}, 1000);
```

 The __DEBUG__ environment variable is then used to enable these based on space or comma-delimited names. Here are some examples:

  ![debug http and worker](http://f.cl.ly/items/18471z1H402O24072r1J/Screenshot.png)

  ![debug worker](http://f.cl.ly/items/1X413v1a3M0d3C2c1E0i/Screenshot.png)

#### Windows note

 On Windows the environment variable is set using the `set` command.

 ```cmd
 set DEBUG=*,-not_this
 ```

 Note that PowerShell uses different syntax to set environment variables.

 ```cmd
 $env:DEBUG = "*,-not_this"
  ```

Then, run the program to be debugged as usual.

## Millisecond diff

  When actively developing an application it can be useful to see when the time spent between one `debug()` call and the next. Suppose for example you invoke `debug()` before requesting a resource, and after as well, the "+NNNms" will show you how much time was spent between calls.

  ![](http://f.cl.ly/items/2i3h1d3t121M2Z1A3Q0N/Screenshot.png)

  When stdout is not a TTY, `Date#toUTCString()` is used, making it more useful for logging the debug information as shown below:

  ![](http://f.cl.ly/items/112H3i0e0o0P0a2Q2r11/Screenshot.png)

## Conventions

  If you're using this in one or more of your libraries, you _should_ use the name of your library so that developers may toggle debugging as desired without guessing names. If you have more than one debuggers you _should_ prefix them with your library name and use ":" to separate features. For example "bodyParser" from Connect would then be "connect:bodyParser".

## Wildcards

  The `*` character may be used as a wildcard. Suppose for example your library has debuggers named "connect:bodyParser", "connect:compress", "connect:session", instead of listing all three with `DEBUG=connect:bodyParser,connect:compress,connect:session`, you may simply do `DEBUG=connect:*`, or to run everything using this module simply use `DEBUG=*`.

  You can also exclude specific debuggers by prefixing them with a "-" character.  For example, `DEBUG=*,-connect:*` would include all debuggers except those starting with "connect:".

## Environment Variables

  When running through Node.js, you can set a few environment variables that will
  change the behavior of the debug logging:

| Name      | Purpose                                         |
|-----------|-------------------------------------------------|
| `DEBUG`   | Enables/disables specific debugging namespaces. |
| `DEBUG_COLORS`| Whether or not to use colors in the debug output. |
| `DEBUG_DEPTH` | Object inspection depth. |
| `DEBUG_SHOW_HIDDEN` | Shows hidden properties on inspected objects. |


  __Note:__ The environment variables beginning with `DEBUG_` end up being
  converted into an Options object that gets used with `%o`/`%O` formatters.
  See the Node.js documentation for
  [`util.inspect()`](https://nodejs.org/api/util.html#util_util_inspect_object_options)
  for the complete list.

## Formatters


  Debug uses [printf-style](https://wikipedia.org/wiki/Printf_format_string) formatting. Below are the officially supported formatters:

| Formatter | Representation |
|-----------|----------------|
| `%O`      | Pretty-print an Object on multiple lines. |
| `%o`      | Pretty-print an Object all on a single line. |
| `%s`      | String. |
| `%d`      | Number (both integer and float). |
| `%j`      | JSON. Replaced with the string '[Circular]' if the argument contains circular references. |
| `%%`      | Single percent sign ('%'). This does not consume an argument. |

### Custom formatters

  You can add custom formatters by extending the `debug.formatters` object. For example, if you wanted to add support for rendering a Buffer as hex with `%h`, you could do something like:

```js
const createDebug = require('debug')
createDebug.formatters.h = (v) => {
  return v.toString('hex')
}

// …elsewhere
const debug = createDebug('foo')
debug('this is hex: %h', new Buffer('hello world'))
//   foo this is hex: 68656c6c6f20776f726c6421 +0ms
```

## Browser support
  You can build a browser-ready script using [browserify](https://github.com/substack/node-browserify),
  or just use the [browserify-as-a-service](https://wzrd.in/) [build](https://wzrd.in/standalone/debug@latest),
  if you don't want to build it yourself.

  Debug's enable state is currently persisted by `localStorage`.
  Consider the situation shown below where you have `worker:a` and `worker:b`,
  and wish to debug both. You can enable this using `localStorage.debug`:

```js
localStorage.debug = 'worker:*'
```

And then refresh the page.

```js
a = debug('worker:a');
b = debug('worker:b');

setInterval(function(){
  a('doing some work');
}, 1000);

setInterval(function(){
  b('doing some work');
}, 1200);
```

#### Web Inspector Colors

  Colors are also enabled on "Web Inspectors" that understand the `%c` formatting
  option. These are WebKit web inspectors, Firefox ([since version
  31](https://hacks.mozilla.org/2014/05/editable-box-model-multiple-selection-sublime-text-keys-much-more-firefox-developer-tools-episode-31/))
  and the Firebug plugin for Firefox (any version).

  Colored output looks something like:

  ![](https://cloud.githubusercontent.com/assets/71256/3139768/b98c5fd8-e8ef-11e3-862a-f7253b6f47c6.png)


## Output streams

  By default `debug` will log to stderr, however this can be configured per-namespace by overriding the `log` method:

Example _stdout.js_:

```js
var debug = require('debug');
var error = debug('app:error');

// by default stderr is used
error('goes to stderr!');

var log = debug('app:log');
// set this namespace to log via console.log
log.log = console.log.bind(console); // don't forget to bind to console!
log('goes to stdout');
error('still goes to stderr!');

// set all output to go via console.info
// overrides all per-namespace log settings
debug.log = console.info.bind(console);
error('now goes to stdout via console.info');
log('still goes to stdout, but via console.info now');
```


## Authors

 - TJ Holowaychuk
 - Nathan Rajlich
 - Andrew Rhyne
 
## Backers

Support us with a monthly donation and help us continue our activities. [[Become a backer](https://opencollective.com/debug#backer)]

<a href="https://opencollective.com/debug/backer/0/website" target="_blank"><img src="https://opencollective.com/debug/backer/0/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/1/website" target="_blank"><img src="https://opencollective.com/debug/backer/1/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/2/website" target="_blank"><img src="https://opencollective.com/debug/backer/2/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/3/website" target="_blank"><img src="https://opencollective.com/debug/backer/3/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/4/website" target="_blank"><img src="https://opencollective.com/debug/backer/4/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/5/website" target="_blank"><img src="https://opencollective.com/debug/backer/5/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/6/website" target="_blank"><img src="https://opencollective.com/debug/backer/6/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/7/website" target="_blank"><img src="https://opencollective.com/debug/backer/7/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/8/website" target="_blank"><img src="https://opencollective.com/debug/backer/8/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/9/website" target="_blank"><img src="https://opencollective.com/debug/backer/9/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/10/website" target="_blank"><img src="https://opencollective.com/debug/backer/10/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/11/website" target="_blank"><img src="https://opencollective.com/debug/backer/11/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/12/website" target="_blank"><img src="https://opencollective.com/debug/backer/12/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/13/website" target="_blank"><img src="https://opencollective.com/debug/backer/13/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/14/website" target="_blank"><img src="https://opencollective.com/debug/backer/14/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/15/website" target="_blank"><img src="https://opencollective.com/debug/backer/15/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/16/website" target="_blank"><img src="https://opencollective.com/debug/backer/16/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/17/website" target="_blank"><img src="https://opencollective.com/debug/backer/17/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/18/website" target="_blank"><img src="https://opencollective.com/debug/backer/18/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/19/website" target="_blank"><img src="https://opencollective.com/debug/backer/19/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/20/website" target="_blank"><img src="https://opencollective.com/debug/backer/20/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/21/website" target="_blank"><img src="https://opencollective.com/debug/backer/21/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/22/website" target="_blank"><img src="https://opencollective.com/debug/backer/22/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/23/website" target="_blank"><img src="https://opencollective.com/debug/backer/23/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/24/website" target="_blank"><img src="https://opencollective.com/debug/backer/24/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/25/website" target="_blank"><img src="https://opencollective.com/debug/backer/25/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/26/website" target="_blank"><img src="https://opencollective.com/debug/backer/26/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/27/website" target="_blank"><img src="https://opencollective.com/debug/backer/27/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/28/website" target="_blank"><img src="https://opencollective.com/debug/backer/28/avatar.svg"></a>
<a href="https://opencollective.com/debug/backer/29/website" target="_blank"><img src="https://opencollective.com/debug/backer/29/avatar.svg"></a>


## Sponsors

Become a sponsor and get your logo on our README on Github with a link to your site. [[Become a sponsor](https://opencollective.com/debug#sponsor)]

<a href="https://opencollective.com/debug/sponsor/0/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/0/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/1/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/1/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/2/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/2/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/3/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/3/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/4/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/4/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/5/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/5/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/6/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/6/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/7/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/7/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/8/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/8/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/9/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/9/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/10/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/10/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/11/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/11/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/12/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/12/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/13/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/13/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/14/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/14/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/15/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/15/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/16/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/16/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/17/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/17/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/18/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/18/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/19/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/19/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/20/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/20/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/21/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/21/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/22/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/22/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/23/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/23/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/24/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/24/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/25/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/25/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/26/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/26/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/27/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/27/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/28/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/28/avatar.svg"></a>
<a href="https://opencollective.com/debug/sponsor/29/website" target="_blank"><img src="https://opencollective.com/debug/sponsor/29/avatar.svg"></a>

## License

(The MIT License)

Copyright (c) 2014-2016 TJ Holowaychuk &lt;tj@vision-media.ca&gt;

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
'Software'), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  "use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasMagic = void 0;
const minimatch_1 = require("minimatch");
/**
 * Return true if the patterns provided contain any magic glob characters,
 * given the options provided.
 *
 * Brace expansion is not considered "magic" unless the `magicalBraces` option
 * is set, as brace expansion just turns one string into an array of strings.
 * So a pattern like `'x{a,b}y'` would return `false`, because `'xay'` and
 * `'xby'` both do not contain any magic glob characters, and it's treated the
 * same as if you had called it on `['xay', 'xby']`. When `magicalBraces:true`
 * is in the options, brace expansion _is_ treated as a pattern having magic.
 */
const hasMagic = (pattern, options = {}) => {
    if (!Array.isArray(pattern)) {
        pattern = [pattern];
    }
    for (const p of pattern) {
        if (new minimatch_1.Minimatch(p, options).hasMagic())
            return true;
    }
    return false;
};
exports.hasMagic = hasMagic;
//# sourceMappingURL=has-magic.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              // Karma configuration
// Generated on Fri Dec 16 2016 13:09:51 GMT+0000 (UTC)

module.exports = function(config) {
  config.set({

    // base path that will be used to resolve all patterns (eg. files, exclude)
    basePath: '',


    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['mocha', 'chai', 'sinon'],


    // list of files / patterns to load in the browser
    files: [
      'dist/debug.js',
      'test/*spec.js'
    ],


    // list of files to exclude
    exclude: [
      'src/node.js'
    ],


    // preprocess matching files before serving them to the browser
    // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
    preprocessors: {
    },

    // test results reporter to use
    // possible values: 'dots', 'progress'
    // available reporters: https://npmjs.org/browse/keyword/karma-reporter
    reporters: ['progress'],


    // web server port
    port: 9876,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: true,


    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['PhantomJS'],


    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: false,

    // Concurrency level
    // how many browser should be started simultaneous
    concurrency: Infinity
  })
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        "use strict";var G=(l,t,e)=>{if(!t.has(l))throw TypeError("Cannot "+e)};var j=(l,t,e)=>(G(l,t,"read from private field"),e?e.call(l):t.get(l)),I=(l,t,e)=>{if(t.has(l))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(l):t.set(l,e)},x=(l,t,e,i)=>(G(l,t,"write to private field"),i?i.call(l,e):t.set(l,e),e);Object.defineProperty(exports,"__esModule",{value:!0});exports.LRUCache=void 0;var T=typeof performance=="object"&&performance&&typeof performance.now=="function"?performance:Date,P=new Set,U=typeof process=="object"&&process?process:{},H=(l,t,e,i)=>{typeof U.emitWarning=="function"?U.emitWarning(l,t,e,i):console.error(`[${e}] ${t}: ${l}`)},D=globalThis.AbortController,N=globalThis.AbortSignal;if(typeof D>"u"){N=class{onabort;_onabort=[];reason;aborted=!1;addEventListener(i,s){this._onabort.push(s)}},D=class{constructor(){t()}signal=new N;abort(i){if(!this.signal.aborted){this.signal.reason=i,this.signal.aborted=!0;for(let s of this.signal._onabort)s(i);this.signal.onabort?.(i)}}};let l=U.env?.LRU_CACHE_IGNORE_AC_WARNING!=="1",t=()=>{l&&(l=!1,H("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.","NO_ABORT_CONTROLLER","ENOTSUP",t))}}var V=l=>!P.has(l),Y=Symbol("type"),A=l=>l&&l===Math.floor(l)&&l>0&&isFinite(l),k=l=>A(l)?l<=Math.pow(2,8)?Uint8Array:l<=Math.pow(2,16)?Uint16Array:l<=Math.pow(2,32)?Uint32Array:l<=Number.MAX_SAFE_INTEGER?E:null:null,E=class extends Array{constructor(t){super(t),this.fill(0)}},v,O=class{heap;length;static create(t){let e=k(t);if(!e)return[];x(O,v,!0);let i=new O(t,e);return x(O,v,!1),i}constructor(t,e){if(!j(O,v))throw new TypeError("instantiate Stack using Stack.create(n)");this.heap=new e(t),this.length=0}push(t){this.heap[this.length++]=t}pop(){return this.heap[--this.length]}},W=O;v=new WeakMap,I(W,v,!1);var C=class{#g;#f;#p;#w;#R;#W;ttl;ttlResolution;ttlAutopurge;updateAgeOnGet;updateAgeOnHas;allowStale;noDisposeOnSet;noUpdateTTL;maxEntrySize;sizeCalculation;noDeleteOnFetchRejection;noDeleteOnStaleGet;allowStaleOnFetchAbort;allowStaleOnFetchRejection;ignoreFetchAbort;#n;#S;#s;#i;#t;#l;#c;#o;#h;#_;#r;#b;#m;#u;#y;#E;#a;static unsafeExposeInternals(t){return{starts:t.#m,ttls:t.#u,sizes:t.#b,keyMap:t.#s,keyList:t.#i,valList:t.#t,next:t.#l,prev:t.#c,get head(){return t.#o},get tail(){return t.#h},free:t.#_,isBackgroundFetch:e=>t.#e(e),backgroundFetch:(e,i,s,n)=>t.#x(e,i,s,n),moveToTail:e=>t.#C(e),indexes:e=>t.#A(e),rindexes:e=>t.#F(e),isStale:e=>t.#d(e)}}get max(){return this.#g}get maxSize(){return this.#f}get calculatedSize(){return this.#S}get size(){return this.#n}get fetchMethod(){return this.#R}get memoMethod(){return this.#W}get dispose(){return this.#p}get disposeAfter(){return this.#w}constructor(t){let{max:e=0,ttl:i,ttlResolution:s=1,ttlAutopurge:n,updateAgeOnGet:h,updateAgeOnHas:o,allowStale:r,dispose:g,disposeAfter:b,noDisposeOnSet:f,noUpdateTTL:u,maxSize:c=0,maxEntrySize:F=0,sizeCalculation:d,fetchMethod:S,memoMethod:a,noDeleteOnFetchRejection:w,noDeleteOnStaleGet:m,allowStaleOnFetchRejection:p,allowStaleOnFetchAbort:_,ignoreFetchAbort:z}=t;if(e!==0&&!A(e))throw new TypeError("max option must be a nonnegative integer");let y=e?k(e):Array;if(!y)throw new Error("invalid max value: "+e);if(this.#g=e,this.#f=c,this.maxEntrySize=F||this.#f,this.sizeCalculation=d,this.sizeCalculation){if(!this.#f&&!this.maxEntrySize)throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");if(typeof this.sizeCalculation!="function")throw new TypeError("sizeCalculation set to non-function")}if(a!==void 0&&typeof a!="function")throw new TypeError("memoMethod must be a function if defined");if(this.#W=a,S!==void 0&&typeof S!="function")throw new TypeError("fetchMethod must be a function if specified");if(this.#R=S,this.#E=!!S,this.#s=new Map,this.#i=new Array(e).fill(void 0),this.#t=new Array(e).fill(void 0),this.#l=new y(e),this.#c=new y(e),this.#o=0,this.#h=0,this.#_=W.create(e),this.#n=0,this.#S=0,typeof g=="function"&&(this.#p=g),typeof b=="function"?(this.#w=b,this.#r=[]):(this.#w=void 0,this.#r=void 0),this.#y=!!this.#p,this.#a=!!this.#w,this.noDisposeOnSet=!!f,this.noUpdateTTL=!!u,this.noDeleteOnFetchRejection=!!w,this.allowStaleOnFetchRejection=!!p,this.allowStaleOnFetchAbort=!!_,this.ignoreFetchAbort=!!z,this.maxEntrySize!==0){if(this.#f!==0&&!A(this.#f))throw new TypeError("maxSize must be a positive integer if specified");if(!A(this.maxEntrySize))throw new TypeError("maxEntrySize must be a positive integer if specified");this.#P()}if(this.allowStale=!!r,this.noDeleteOnStaleGet=!!m,this.updateAgeOnGet=!!h,this.updateAgeOnHas=!!o,this.ttlResolution=A(s)||s===0?s:1,this.ttlAutopurge=!!n,this.ttl=i||0,this.ttl){if(!A(this.ttl))throw new TypeError("ttl must be a positive integer if specified");this.#U()}if(this.#g===0&&this.ttl===0&&this.#f===0)throw new TypeError("At least one of max, maxSize, or ttl is required");if(!this.ttlAutopurge&&!this.#g&&!this.#f){let R="LRU_CACHE_UNBOUNDED";V(R)&&(P.add(R),H("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.","UnboundedCacheWarning",R,C))}}getRemainingTTL(t){return this.#s.has(t)?1/0:0}#U(){let t=new E(this.#g),e=new E(this.#g);this.#u=t,this.#m=e,this.#M=(n,h,o=T.now())=>{if(e[n]=h!==0?o:0,t[n]=h,h!==0&&this.ttlAutopurge){let r=setTimeout(()=>{this.#d(n)&&this.#T(this.#i[n],"expire")},h+1);r.unref&&r.unref()}},this.#v=n=>{e[n]=t[n]!==0?T.now():0},this.#O=(n,h)=>{if(t[h]){let o=t[h],r=e[h];if(!o||!r)return;n.ttl=o,n.start=r,n.now=i||s();let g=n.now-r;n.remainingTTL=o-g}};let i=0,s=()=>{let n=T.now();if(this.ttlResolution>0){i=n;let h=setTimeout(()=>i=0,this.ttlResolution);h.unref&&h.unref()}return n};this.getRemainingTTL=n=>{let h=this.#s.get(n);if(h===void 0)return 0;let o=t[h],r=e[h];if(!o||!r)return 1/0;let g=(i||s())-r;return o-g},this.#d=n=>{let h=e[n],o=t[n];return!!o&&!!h&&(i||s())-h>o}}#v=()=>{};#O=()=>{};#M=()=>{};#d=()=>!1;#P(){let t=new E(this.#g);this.#S=0,this.#b=t,this.#z=e=>{this.#S-=t[e],t[e]=0},this.#G=(e,i,s,n)=>{if(this.#e(i))return 0;if(!A(s))if(n){if(typeof n!="function")throw new TypeError("sizeCalculation must be a function");if(s=n(i,e),!A(s))throw new TypeError("sizeCalculation return invalid (expect positive integer)")}else throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");return s},this.#D=(e,i,s)=>{if(t[e]=i,this.#f){let n=this.#f-t[e];for(;this.#S>n;)this.#L(!0)}this.#S+=t[e],s&&(s.entrySize=i,s.totalCalculatedSize=this.#S)}}#z=t=>{};#D=(t,e,i)=>{};#G=(t,e,i,s)=>{if(i||s)throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");return 0};*#A({allowStale:t=this.allowStale}={}){if(this.#n)for(let e=this.#h;!(!this.#j(e)||((t||!this.#d(e))&&(yield e),e===this.#o));)e=this.#c[e]}*#F({allowStale:t=this.allowStale}={}){if(this.#n)for(let e=this.#o;!(!this.#j(e)||((t||!this.#d(e))&&(yield e),e===this.#h));)e=this.#l[e]}#j(t){return t!==void 0&&this.#s.get(this.#i[t])===t}*entries(){for(let t of this.#A())this.#t[t]!==void 0&&this.#i[t]!==void 0&&!this.#e(this.#t[t])&&(yield[this.#i[t],this.#t[t]])}*rentries(){for(let t of this.#F())this.#t[t]!==void 0&&this.#i[t]!==void 0&&!this.#e(this.#t[t])&&(yield[this.#i[t],this.#t[t]])}*keys(){for(let t of this.#A()){let e=this.#i[t];e!==void 0&&!this.#e(this.#t[t])&&(yield e)}}*rkeys(){for(let t of this.#F()){let e=this.#i[t];e!==void 0&&!this.#e(this.#t[t])&&(yield e)}}*values(){for(let t of this.#A())this.#t[t]!==void 0&&!this.#e(this.#t[t])&&(yield this.#t[t])}*rvalues(){for(let t of this.#F())this.#t[t]!==void 0&&!this.#e(this.#t[t])&&(yield this.#t[t])}[Symbol.iterator](){return this.entries()}[Symbol.toStringTag]="LRUCache";find(t,e={}){for(let i of this.#A()){let s=this.#t[i],n=this.#e(s)?s.__staleWhileFetching:s;if(n!==void 0&&t(n,this.#i[i],this))return this.get(this.#i[i],e)}}forEach(t,e=this){for(let i of this.#A()){let s=this.#t[i],n=this.#e(s)?s.__staleWhileFetching:s;n!==void 0&&t.call(e,n,this.#i[i],this)}}rforEach(t,e=this){for(let i of this.#F()){let s=this.#t[i],n=this.#e(s)?s.__staleWhileFetching:s;n!==void 0&&t.call(e,n,this.#i[i],this)}}purgeStale(){let t=!1;for(let e of this.#F({allowStale:!0}))this.#d(e)&&(this.#T(this.#i[e],"expire"),t=!0);return t}info(t){let e=this.#s.get(t);if(e===void 0)return;let i=this.#t[e],s=this.#e(i)?i.__staleWhileFetching:i;if(s===void 0)return;let n={value:s};if(this.#u&&this.#m){let h=this.#u[e],o=this.#m[e];if(h&&o){let r=h-(T.now()-o);n.ttl=r,n.start=Date.now()}}return this.#b&&(n.size=this.#b[e]),n}dump(){let t=[];for(let e of this.#A({allowStale:!0})){let i=this.#i[e],s=this.#t[e],n=this.#e(s)?s.__staleWhileFetching:s;if(n===void 0||i===void 0)continue;let h={value:n};if(this.#u&&this.#m){h.ttl=this.#u[e];let o=T.now()-this.#m[e];h.start=Math.floor(Date.now()-o)}this.#b&&(h.size=this.#b[e]),t.unshift([i,h])}return t}load(t){this.clear();for(let[e,i]of t){if(i.start){let s=Date.now()-i.start;i.start=T.now()-s}this.set(e,i.value,i)}}set(t,e,i={}){if(e===void 0)return this.delete(t),this;let{ttl:s=this.ttl,start:n,noDisposeOnSet:h=this.noDisposeOnSet,sizeCalculation:o=this.sizeCalculation,status:r}=i,{noUpdateTTL:g=this.noUpdateTTL}=i,b=this.#G(t,e,i.size||0,o);if(this.maxEntrySize&&b>this.maxEntrySize)return r&&(r.set="miss",r.maxEntrySizeExceeded=!0),this.#T(t,"set"),this;let f=this.#n===0?void 0:this.#s.get(t);if(f===void 0)f=this.#n===0?this.#h:this.#_.length!==0?this.#_.pop():this.#n===this.#g?this.#L(!1):this.#n,this.#i[f]=t,this.#t[f]=e,this.#s.set(t,f),this.#l[this.#h]=f,this.#c[f]=this.#h,this.#h=f,this.#n++,this.#D(f,b,r),r&&(r.set="add"),g=!1;else{this.#C(f);let u=this.#t[f];if(e!==u){if(this.#E&&this.#e(u)){u.__abortController.abort(new Error("replaced"));let{__staleWhileFetching:c}=u;c!==void 0&&!h&&(this.#y&&this.#p?.(c,t,"set"),this.#a&&this.#r?.push([c,t,"set"]))}else h||(this.#y&&this.#p?.(u,t,"set"),this.#a&&this.#r?.push([u,t,"set"]));if(this.#z(f),this.#D(f,b,r),this.#t[f]=e,r){r.set="replace";let c=u&&this.#e(u)?u.__staleWhileFetching:u;c!==void 0&&(r.oldValue=c)}}else r&&(r.set="update")}if(s!==0&&!this.#u&&this.#U(),this.#u&&(g||this.#M(f,s,n),r&&this.#O(r,f)),!h&&this.#a&&this.#r){let u=this.#r,c;for(;c=u?.shift();)this.#w?.(...c)}return this}pop(){try{for(;this.#n;){let t=this.#t[this.#o];if(this.#L(!0),this.#e(t)){if(t.__staleWhileFetching)return t.__staleWhileFetching}else if(t!==void 0)return t}}finally{if(this.#a&&this.#r){let t=this.#r,e;for(;e=t?.shift();)this.#w?.(...e)}}}#L(t){let e=this.#o,i=this.#i[e],s=this.#t[e];return this.#E&&this.#e(s)?s.__abortController.abort(new Error("evicted")):(this.#y||this.#a)&&(this.#y&&this.#p?.(s,i,"evict"),this.#a&&this.#r?.push([s,i,"evict"])),this.#z(e),t&&(this.#i[e]=void 0,this.#t[e]=void 0,this.#_.push(e)),this.#n===1?(this.#o=this.#h=0,this.#_.length=0):this.#o=this.#l[e],this.#s.delete(i),this.#n--,e}has(t,e={}){let{updateAgeOnHas:i=this.updateAgeOnHas,status:s}=e,n=this.#s.get(t);if(n!==void 0){let h=this.#t[n];if(this.#e(h)&&h.__staleWhileFetching===void 0)return!1;if(this.#d(n))s&&(s.has="stale",this.#O(s,n));else return i&&this.#v(n),s&&(s.has="hit",this.#O(s,n)),!0}else s&&(s.has="miss");return!1}peek(t,e={}){let{allowStale:i=this.allowStale}=e,s=this.#s.get(t);if(s===void 0||!i&&this.#d(s))return;let n=this.#t[s];return this.#e(n)?n.__staleWhileFetching:n}#x(t,e,i,s){let n=e===void 0?void 0:this.#t[e];if(this.#e(n))return n;let h=new D,{signal:o}=i;o?.addEventListener("abort",()=>h.abort(o.reason),{signal:h.signal});let r={signal:h.signal,options:i,context:s},g=(d,S=!1)=>{let{aborted:a}=h.signal,w=i.ignoreFetchAbort&&d!==void 0;if(i.status&&(a&&!S?(i.status.fetchAborted=!0,i.status.fetchError=h.signal.reason,w&&(i.status.fetchAbortIgnored=!0)):i.status.fetchResolved=!0),a&&!w&&!S)return f(h.signal.reason);let m=c;return this.#t[e]===c&&(d===void 0?m.__staleWhileFetching?this.#t[e]=m.__staleWhileFetching:this.#T(t,"fetch"):(i.status&&(i.status.fetchUpdated=!0),this.set(t,d,r.options))),d},b=d=>(i.status&&(i.status.fetchRejected=!0,i.status.fetchError=d),f(d)),f=d=>{let{aborted:S}=h.signal,a=S&&i.allowStaleOnFetchAbort,w=a||i.allowStaleOnFetchRejection,m=w||i.noDeleteOnFetchRejection,p=c;if(this.#t[e]===c&&(!m||p.__staleWhileFetching===void 0?this.#T(t,"fetch"):a||(this.#t[e]=p.__staleWhileFetching)),w)return i.status&&p.__staleWhileFetching!==void 0&&(i.status.returnedStale=!0),p.__staleWhileFetching;if(p.__returned===p)throw d},u=(d,S)=>{let a=this.#R?.(t,n,r);a&&a instanceof Promise&&a.then(w=>d(w===void 0?void 0:w),S),h.signal.addEventListener("abort",()=>{(!i.ignoreFetchAbort||i.allowStaleOnFetchAbort)&&(d(void 0),i.allowStaleOnFetchAbort&&(d=w=>g(w,!0)))})};i.status&&(i.status.fetchDispatched=!0);let c=new Promise(u).then(g,b),F=Object.assign(c,{__abortController:h,__staleWhileFetching:n,__returned:void 0});return e===void 0?(this.set(t,F,{...r.options,status:void 0}),e=this.#s.get(t)):this.#t[e]=F,F}#e(t){if(!this.#E)return!1;let e=t;return!!e&&e instanceof Promise&&e.hasOwnProperty("__staleWhileFetching")&&e.__abortController instanceof D}async fetch(t,e={}){let{allowStale:i=this.allowStale,updateAgeOnGet:s=this.updateAgeOnGet,noDeleteOnStaleGet:n=this.noDeleteOnStaleGet,ttl:h=this.ttl,noDisposeOnSet:o=this.noDisposeOnSet,size:r=0,sizeCalculation:g=this.sizeCalculation,noUpdateTTL:b=this.noUpdateTTL,noDeleteOnFetchRejection:f=this.noDeleteOnFetchRejection,allowStaleOnFetchRejection:u=this.allowStaleOnFetchRejection,ignoreFetchAbort:c=this.ignoreFetchAbort,allowStaleOnFetchAbort:F=this.allowStaleOnFetchAbort,context:d,forceRefresh:S=!1,status:a,signal:w}=e;if(!this.#E)return a&&(a.fetch="get"),this.get(t,{allowStale:i,updateAgeOnGet:s,noDeleteOnStaleGet:n,status:a});let m={allowStale:i,updateAgeOnGet:s,noDeleteOnStaleGet:n,ttl:h,noDisposeOnSet:o,size:r,sizeCalculation:g,noUpdateTTL:b,noDeleteOnFetchRejection:f,allowStaleOnFetchRejection:u,allowStaleOnFetchAbort:F,ignoreFetchAbort:c,status:a,signal:w},p=this.#s.get(t);if(p===void 0){a&&(a.fetch="miss");let _=this.#x(t,p,m,d);return _.__returned=_}else{let _=this.#t[p];if(this.#e(_)){let M=i&&_.__staleWhileFetching!==void 0;return a&&(a.fetch="inflight",M&&(a.returnedStale=!0)),M?_.__staleWhileFetching:_.__returned=_}let z=this.#d(p);if(!S&&!z)return a&&(a.fetch="hit"),this.#C(p),s&&this.#v(p),a&&this.#O(a,p),_;let y=this.#x(t,p,m,d),L=y.__staleWhileFetching!==void 0&&i;return a&&(a.fetch=z?"stale":"refresh",L&&z&&(a.returnedStale=!0)),L?y.__staleWhileFetching:y.__returned=y}}async forceFetch(t,e={}){let i=await this.fetch(t,e);if(i===void 0)throw new Error("fetch() returned undefined");return i}memo(t,e={}){let i=this.#W;if(!i)throw new Error("no memoMethod provided to constructor");let{context:s,forceRefresh:n,...h}=e,o=this.get(t,h);if(!n&&o!==void 0)return o;let r=i(t,o,{options:h,context:s});return this.set(t,r,h),r}get(t,e={}){let{allowStale:i=this.allowStale,updateAgeOnGet:s=this.updateAgeOnGet,noDeleteOnStaleGet:n=this.noDeleteOnStaleGet,status:h}=e,o=this.#s.get(t);if(o!==void 0){let r=this.#t[o],g=this.#e(r);return h&&this.#O(h,o),this.#d(o)?(h&&(h.get="stale"),g?(h&&i&&r.__staleWhileFetching!==void 0&&(h.returnedStale=!0),i?r.__staleWhileFetching:void 0):(n||this.#T(t,"expire"),h&&i&&(h.returnedStale=!0),i?r:void 0)):(h&&(h.get="hit"),g?r.__staleWhileFetching:(this.#C(o),s&&this.#v(o),r))}else h&&(h.get="miss")}#I(t,e){this.#c[e]=t,this.#l[t]=e}#C(t){t!==this.#h&&(t===this.#o?this.#o=this.#l[t]:this.#I(this.#c[t],this.#l[t]),this.#I(this.#h,t),this.#h=t)}delete(t){return this.#T(t,"delete")}#T(t,e){let i=!1;if(this.#n!==0){let s=this.#s.get(t);if(s!==void 0)if(i=!0,this.#n===1)this.#N(e);else{this.#z(s);let n=this.#t[s];if(this.#e(n)?n.__abortController.abort(new Error("deleted")):(this.#y||this.#a)&&(this.#y&&this.#p?.(n,t,e),this.#a&&this.#r?.push([n,t,e])),this.#s.delete(t),this.#i[s]=void 0,this.#t[s]=void 0,s===this.#h)this.#h=this.#c[s];else if(s===this.#o)this.#o=this.#l[s];else{let h=this.#c[s];this.#l[h]=this.#l[s];let o=this.#l[s];this.#c[o]=this.#c[s]}this.#n--,this.#_.push(s)}}if(this.#a&&this.#r?.length){let s=this.#r,n;for(;n=s?.shift();)this.#w?.(...n)}return i}clear(){return this.#N("delete")}#N(t){for(let e of this.#F({allowStale:!0})){let i=this.#t[e];if(this.#e(i))i.__abortController.abort(new Error("deleted"));else{let s=this.#i[e];this.#y&&this.#p?.(i,s,t),this.#a&&this.#r?.push([i,s,t])}}if(this.#s.clear(),this.#t.fill(void 0),this.#i.fill(void 0),this.#u&&this.#m&&(this.#u.fill(0),this.#m.fill(0)),this.#b&&this.#b.fill(0),this.#o=0,this.#h=0,this.#_.length=0,this.#S=0,this.#n=0,this.#a&&this.#r){let e=this.#r,i;for(;i=e?.shift();)this.#w?.(...i)}}};exports.LRUCache=C;
//# sourceMappingURL=index.min.js.map
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   {"version":3,"file":"index.d.ts","sourceRoot":"","sources":["../../src/index.ts"],"names":[],"mappings":"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"}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      