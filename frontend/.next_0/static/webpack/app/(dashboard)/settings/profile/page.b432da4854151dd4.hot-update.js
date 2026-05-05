s: Pattern[], path: Path, opts: O)\n  constructor(patterns: Pattern[], path: Path, opts: O) {\n    this.patterns = patterns\n    this.path = path\n    this.opts = opts\n    this.#sep = !opts.posix && opts.platform === 'win32' ? '\\\\' : '/'\n    this.includeChildMatches = opts.includeChildMatches !== false\n    if (opts.ignore || !this.includeChildMatches) {\n      this.#ignore = makeIgnore(opts.ignore ?? [], opts)\n      if (\n        !this.includeChildMatches &&\n        typeof this.#ignore.add !== 'function'\n      ) {\n        const m = 'cannot ignore child matches, ignore lacks add() method.'\n        throw new Error(m)\n      }\n    }\n    // ignore, always set with maxDepth, but it's optional on the\n    // GlobOptions type\n    /* c8 ignore start */\n    this.maxDepth = opts.maxDepth || Infinity\n    /* c8 ignore stop */\n    if (opts.signal) {\n      this.signal = opts.signal\n      this.signal.addEventListener('abort', () => {\n        this.#onResume.length = 0\n      })\n    }\n  }\n\n  #ignored(path: Path): boolean {\n    return this.seen.has(path) || !!this.#ignore?.ignored?.(path)\n  }\n  #childrenIgnored(path: Path): boolean {\n    return !!this.#ignore?.childrenIgnored?.(path)\n  }\n\n  // backpressure mechanism\n  pause() {\n    this.paused = true\n  }\n  resume() {\n    /* c8 ignore start */\n    if (this.signal?.aborted) return\n    /* c8 ignore stop */\n    this.paused = false\n    let fn: (() => any) | undefined = undefined\n    while (!this.paused && (fn = this.#onResume.shift())) {\n      fn()\n    }\n  }\n  onResume(fn: () => any) {\n    if (this.signal?.aborted) return\n    /* c8 ignore start */\n    if (!this.paused) {\n      fn()\n    } else {\n      /* c8 ignore stop */\n      this.#onResume.push(fn)\n    }\n  }\n\n  // do the requisite realpath/stat checking, and return the path\n  // to add or undefined to filter it out.\n  async matchCheck(e: Path, ifDir: boolean): Promise<Path | undefined> {\n    if (ifDir && this.opts.nodir) return undefined\n    let rpc: Path | undefined\n    if (this.opts.realpath) {\n      rpc = e.realpathCached() || (await e.realpath())\n      if (!rpc) return undefined\n      e = rpc\n    }\n    const needStat = e.isUnknown() || this.opts.stat\n    const s = needStat ? await e.lstat() : e\n    if (this.opts.follow && this.opts.nodir && s?.isSymbolicLink()) {\n      const target = await s.realpath()\n      /* c8 ignore start */\n      if (target && (target.isUnknown() || this.opts.stat)) {\n        await target.lstat()\n      }\n      /* c8 ignore stop */\n    }\n    return this.matchCheckTest(s, ifDir)\n  }\n\n  matchCheckTest(e: Path | undefined, ifDir: boolean): Path | undefined {\n    return (\n        e &&\n          (this.maxDepth === Infinity || e.depth() <= this.maxDepth) &&\n          (!ifDir || e.canReaddir()) &&\n          (!this.opts.nodir || !e.isDirectory()) &&\n          (!this.opts.nodir ||\n            !this.opts.follow ||\n            !e.isSymbolicLink() ||\n            !e.realpathCached()?.isDirectory()) &&\n          !this.#ignored(e)\n      ) ?\n        e\n      : undefined\n  }\n\n  matchCheckSync(e: Path, ifDir: boolean): Path | undefined {\n    if (ifDir && this.opts.nodir) return undefined\n    let rpc: Path | undefined\n    if (this.opts.realpath) {\n      rpc = e.realpathCached() || e.realpathSync()\n      if (!rpc) return undefined\n      e = rpc\n    }\n    const needStat = e.isUnknown() || this.opts.stat\n    const s = needStat ? e.lstatSync() : e\n    if (this.opts.follow && this.opts.nodir && s?.isSymbolicLink()) {\n      const target = s.realpathSync()\n      if (target && (target?.isUnknown() || this.opts.stat)) {\n        target.lstatSync()\n      }\n    }\n    return this.matchCheckTest(s, ifDir)\n  }\n\n  abstract matchEmit(p: Result<O>): void\n  abstract matchEmit(p: string | Path): void\n\n  matchFinish(e: Path, absolute: boolean) {\n    if (this.#ignored(e)) return\n    // we know we have an ignore if this is false, but TS doesn't\n    if (!this.includeChildMatches && this.#ignore?.add) {\n      const ign = `${e.relativePosix()}/**`\n      this.#ignore.add(ign)\n    }\n    const abs =\n      this.opts.absolute === undefined ? absolute : this.opts.absolute\n    this.seen.add(e)\n    const mark = this.opts.mark && e.isDirectory() ? this.#sep : ''\n    // ok, we have what we need!\n    if (this.opts.withFileTypes) {\n      this.matchEmit(e)\n    } else if (abs) {\n      const abs = this.opts.posix ? e.fullpathPosix() : e.fullpath()\n      this.matchEmit(abs + mark)\n    } else {\n      const rel = this.opts.posix ? e.relativePosix() : e.relative()\n      const pre =\n        this.opts.dotRelative && !rel.startsWith('..' + this.#sep) ?\n          '.' + this.#sep\n        : ''\n      this.matchEmit(!rel ? '.' + mark : pre + rel + mark)\n    }\n  }\n\n  async match(e: Path, absolute: boolean, ifDir: boolean): Promise<void> {\n    const p = await this.matchCheck(e, ifDir)\n    if (p) this.matchFinish(p, absolute)\n  }\n\n  matchSync(e: Path, absolute: boolean, ifDir: boolean): void {\n    const p = this.matchCheckSync(e, ifDir)\n    if (p) this.matchFinish(p, absolute)\n  }\n\n  walkCB(target: Path, patterns: Pattern[], cb: () => any) {\n    /* c8 ignore start */\n    if (this.signal?.aborted) cb()\n    /* c8 ignore stop */\n    this.walkCB2(target, patterns, new Processor(this.opts), cb)\n  }\n\n  walkCB2(\n    target: Path,\n    patterns: Pattern[],\n    processor: Processor,\n    cb: () => any,\n  ) {\n    if (this.#childrenIgnored(target)) return cb()\n    if (this.signal?.aborted) cb()\n    if (this.paused) {\n      this.onResume(() => this.walkCB2(target, patterns, processor, cb))\n      return\n    }\n    processor.processPatterns(target, patterns)\n\n    // done processing.  all of the above is sync, can be abstracted out.\n    // subwalks is a map of paths to the entry filters they need\n    // matches is a map of paths to [absolute, ifDir] tuples.\n    let tasks = 1\n    const next = () => {\n      if (--tasks === 0) cb()\n    }\n\n    for (const [m, absolute, ifDir] of processor.matches.entries()) {\n      if (this.#ignored(m)) continue\n      tasks++\n      this.match(m, absolute, ifDir).then(() => next())\n    }\n\n    for (const t of processor.subwalkTargets()) {\n      if (this.maxDepth !== Infinity && t.depth() >= this.maxDepth) {\n        continue\n      }\n      tasks++\n      const childrenCached = t.readdirCached()\n      if (t.calledReaddir())\n        this.walkCB3(t, childrenCached, processor, next)\n      else {\n        t.readdirCB(\n          (_, entries) => this.walkCB3(t, entries, processor, next),\n          true,\n        )\n      }\n    }\n\n    next()\n  }\n\n  walkCB3(\n    target: Path,\n    entries: Path[],\n    processor: Processor,\n    cb: () => any,\n  ) {\n    processor = processor.filterEntries(target, entries)\n\n    let tasks = 1\n    const next = () => {\n      if (--tasks === 0) cb()\n    }\n\n    for (const [m, absolute, ifDir] of processor.matches.entries()) {\n      if (this.#ignored(m)) continue\n      tasks++\n      this.match(m, absolute, ifDir).then(() => next())\n    }\n    for (const [target, patterns] of processor.subwalks.entries()) {\n      tasks++\n      this.walkCB2(target, patterns, processor.child(), next)\n    }\n\n    next()\n  }\n\n  walkCBSync(target: Path, patterns: Pattern[], cb: () => any) {\n    /* c8 ignore start */\n    if (this.signal?.aborted) cb()\n    /* c8 ignore stop */\n    this.walkCB2Sync(target, patterns, new Processor(this.opts), cb)\n  }\n\n  walkCB2Sync(\n    target: Path,\n    patterns: Pattern[],\n    processor: Processor,\n    cb: () => any,\n  ) {\n    if (this.#childrenIgnored(target)) return cb()\n    if (this.signal?.aborted) cb()\n    if (this.paused) {\n      this.onResume(() =>\n        this.walkCB2Sync(target, patterns, processor, cb),\n      )\n      return\n    }\n    processor.processPatterns(target, patterns)\n\n    // done processing.  all of the above is sync, can be abstracted out.\n    // subwalks is a map of paths to the entry filters they need\n    // matches is a map of paths to [absolute, ifDir] tuples.\n    let tasks = 1\n    const next = () => {\n      if (--tasks === 0) cb()\n    }\n\n    for (const [m, absolute, ifDir] of processor.matches.entries()) {\n      if (this.#ignored(m)) continue\n      this.matchSync(m, absolute, ifDir)\n    }\n\n    for (const t of processor.subwalkTargets()) {\n      if (this.maxDepth !== Infinity && t.depth() >= this.maxDepth) {\n        continue\n      }\n      tasks++\n      const children = t.readdirSync()\n      this.walkCB3Sync(t, children, processor, next)\n    }\n\n    next()\n  }\n\n  walkCB3Sync(\n    target: Path,\n    entries: Path[],\n    processor: Processor,\n    cb: () => any,\n  ) {\n    processor = processor.filterEntries(target, entries)\n\n    let tasks = 1\n    const next = () => {\n      if (--tasks === 0) cb()\n    }\n\n    for (const [m, absolute, ifDir] of processor.matches.entries()) {\n      if (this.#ignored(m)) continue\n      this.matchSync(m, absolute, ifDir)\n    }\n    for (const [target, patterns] of processor.subwalks.entries()) {\n      tasks++\n      this.walkCB2Sync(target, patterns, processor.child(), next)\n    }\n\n    next()\n  }\n}\n\nexport class GlobWalker<\n  O extends GlobWalkerOpts = GlobWalkerOpts,\n> extends GlobUtil<O> {\n  matches = new Set<Result<O>>()\n\n  constructor(patterns: Pattern[], path: Path, opts: O) {\n    super(patterns, path, opts)\n  }\n\n  matchEmit(e: Result<O>): void {\n    this.matches.add(e)\n  }\n\n  async walk(): Promise<Set<Result<O>>> {\n    if (this.signal?.aborted) throw this.signal.reason\n    if (this.path.isUnknown()) {\n      await this.path.lstat()\n    }\n    await new Promise((res, rej) => {\n      this.walkCB(this.path, this.patterns, () => {\n        if (this.signal?.aborted) {\n          rej(this.signal.reason)\n        } else {\n          res(this.matches)\n        }\n      })\n    })\n    return this.matches\n  }\n\n  walkSync(): Set<Result<O>> {\n    if (this.signal?.aborted) throw this.signal.reason\n    if (this.path.isUnknown()) {\n      this.path.lstatSync()\n    }\n    // nothing for the callback to do, because this never pauses\n    this.walkCBSync(this.path, this.patterns, () => {\n      if (this.signal?.aborted) throw this.signal.reason\n    })\n    return this.matches\n  }\n}\n\nexport class GlobStream<\n  O extends GlobWalkerOpts = GlobWalkerOpts,\n> extends GlobUtil<O> {\n  results: Minipass<Result<O>, Result<O>>\n\n  constructor(patterns: Pattern[], path: Path, opts: O) {\n    super(patterns, path, opts)\n    this.results = new Minipass<Result<O>, Result<O>>({\n      signal: this.signal,\n      objectMode: true,\n    })\n    this.results.on('drain', () => this.resume())\n    this.results.on('resume', () => this.resume())\n  }\n\n  matchEmit(e: Result<O>): void {\n    this.results.write(e)\n    if (!this.results.flowing) this.pause()\n  }\n\n  stream(): MatchStream<O> {\n    const target = this.path\n    if (target.isUnknown()) {\n      target.lstat().then(() => {\n        this.walkCB(target, this.patterns, () => this.results.end())\n      })\n    } else {\n      this.walkCB(target, this.patterns, () => this.results.end())\n    }\n    return this.results\n  }\n\n  streamSync(): MatchStream<O> {\n    if (this.path.isUnknown()) {\n      this.path.lstatSync()\n    }\n    this.walkCBSync(this.path, this.patterns, () => this.results.end())\n    return this.results\n  }\n}\n"]}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     {
  "author": "Isaac Z. Schlueter <i@izs.me> (http://blog.izs.me)",
  "name": "minimatch",
  "description": "a glob matcher in javascript",
  "version": "9.0.5",
  "repository": {
    "type": "git",
    "url": "git://github.com/isaacs/minimatch.git"
  },
  "main": "./dist/commonjs/index.js",
  "types": "./dist/commonjs/index.d.ts",
  "exports": {
    "./package.json": "./package.json",
    ".": {
      "import": {
        "types": "./dist/esm/index.d.ts",
        "default": "./dist/esm/index.js"
      },
      "require": {
        "types": "./dist/commonjs/index.d.ts",
        "default": "./dist/commonjs/index.js"
      }
    }
  },
  "files": [
    "dist"
  ],
  "scripts": {
    "preversion": "npm test",
    "postversion": "npm publish",
    "prepublishOnly": "git push origin --follow-tags",
    "prepare": "tshy",
    "pretest": "npm run prepare",
    "presnap": "npm run prepare",
    "test": "tap",
    "snap": "tap",
    "format": "prettier --write . --loglevel warn",
    "benchmark": "node benchmark/index.js",
    "typedoc": "typedoc --tsconfig tsconfig-esm.json ./src/*.ts"
  },
  "prettier": {
    "semi": false,
    "printWidth": 80,
    "tabWidth": 2,
    "useTabs": false,
    "singleQuote": true,
    "jsxSingleQuote": false,
    "bracketSameLine": true,
    "arrowParens": "avoid",
    "endOfLine": "lf"
  },
  "engines": {
    "node": ">=16 || 14 >=14.17"
  },
  "dependencies": {
    "brace-expansion": "^2.0.1"
  },
  "devDependencies": {
    "@types/brace-expansion": "^1.1.0",
    "@types/node": "^18.15.11",
    "@types/tap": "^15.0.8",
    "eslint-config-prettier": "^8.6.0",
    "mkdirp": "1",
    "prettier": "^2.8.2",
    "tap": "^18.7.2",
    "ts-node": "^10.9.1",
    "tshy": "^1.12.0",
    "typedoc": "^0.23.21",
    "typescript": "^4.9.3"
  },
  "funding": {
    "url": "https://github.com/sponsors/isaacs"
  },
  "license": "ISC",
  "tshy": {
    "exports": {
      "./package.json": "./package.json",
      ".": "./src/index.ts"
    }
  },
  "type": "module"
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             /**