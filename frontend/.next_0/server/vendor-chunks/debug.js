 as long as all\n  // the parts match.\n  matchOne(file: string[], pattern: ParseReturn[], partial: boolean = false) {\n    const options = this.options\n\n    // UNC paths like //?/X:/... can match X:/... and vice versa\n    // Drive letters in absolute drive or unc paths are always compared\n    // case-insensitively.\n    if (this.isWindows) {\n      const fileDrive = typeof file[0] === 'string' && /^[a-z]:$/i.test(file[0])\n      const fileUNC =\n        !fileDrive &&\n        file[0] === '' &&\n        file[1] === '' &&\n        file[2] === '?' &&\n        /^[a-z]:$/i.test(file[3])\n\n      const patternDrive =\n        typeof pattern[0] === 'string' && /^[a-z]:$/i.test(pattern[0])\n      const patternUNC =\n        !patternDrive &&\n        pattern[0] === '' &&\n        pattern[1] === '' &&\n        pattern[2] === '?' &&\n        typeof pattern[3] === 'string' &&\n        /^[a-z]:$/i.test(pattern[3])\n\n      const fdi = fileUNC ? 3 : fileDrive ? 0 : undefined\n      const pdi = patternUNC ? 3 : patternDrive ? 0 : undefined\n      if (typeof fdi === 'number' && typeof pdi === 'number') {\n        const [fd, pd]: [string, string] = [file[fdi], pattern[pdi] as string]\n        if (fd.toLowerCase() === pd.toLowerCase()) {\n          pattern[pdi] = fd\n          if (pdi > fdi) {\n            pattern = pattern.slice(pdi)\n          } else if (fdi > pdi) {\n            file = file.slice(fdi)\n          }\n        }\n      }\n    }\n\n    // resolve and reduce . and .. portions in the file as well.\n    // dont' need to do the second phase, because it's only one string[]\n    const { optimizationLevel = 1 } = this.options\n    if (optimizationLevel >= 2) {\n      file = this.levelTwoFileOptimize(file)\n    }\n\n    this.debug('matchOne', this, { file, pattern })\n    this.debug('matchOne', file.length, pattern.length)\n\n    for (\n      var fi = 0, pi = 0, fl = file.length, pl = pattern.length;\n      fi < fl && pi < pl;\n      fi++, pi++\n    ) {\n      this.debug('matchOne loop')\n      var p = pattern[pi]\n      var f = file[fi]\n\n      this.debug(pattern, p, f)\n\n      // should be impossible.\n      // some invalid regexp stuff in the set.\n      /* c8 ignore start */\n      if (p === false) {\n        return false\n      }\n      /* c8 ignore stop */\n\n      if (p === GLOBSTAR) {\n        this.debug('GLOBSTAR', [pattern, p, f])\n\n        // \"**\"\n        // a/**/b/**/c would match the following:\n        // a/b/x/y/z/c\n        // a/x/y/z/b/c\n        // a/b/x/b/x/c\n        // a/b/c\n        // To do this, take the rest of the pattern after\n        // the **, and see if it would match the file remainder.\n        // If so, return success.\n        // If not, the ** \"swallows\" a segment, and try again.\n        // This is recursively awful.\n        //\n        // a/**/b/**/c matching a/b/x/y/z/c\n        // - a matches a\n        // - doublestar\n        //   - matchOne(b/x/y/z/c, b/**/c)\n        //     - b matches b\n        //     - doublestar\n        //       - matchOne(x/y/z/c, c) -> no\n        //       - matchOne(y/z/c, c) -> no\n        //       - matchOne(z/c, c) -> no\n        //       - matchOne(c, c) yes, hit\n        var fr = fi\n        var pr = pi + 1\n        if (pr === pl) {\n          this.debug('** at the end')\n          // a ** at the end will just swallow the rest.\n          // We have found a match.\n          // however, it will not swallow /.x, unless\n          // options.dot is set.\n          // . and .. are *never* matched by **, for explosively\n          // exponential reasons.\n          for (; fi < fl; fi++) {\n            if (\n              file[fi] === '.' ||\n              file[fi] === '..' ||\n              (!options.dot && file[fi].charAt(0) === '.')\n            )\n              return false\n          }\n          return true\n        }\n\n        // ok, let's see if we can swallow whatever we can.\n        while (fr < fl) {\n          var swallowee = file[fr]\n\n          this.debug('\\nglobstar while', file, fr, pattern, pr, swallowee)\n\n          // XXX remove this slice.  Just pass the start index.\n          if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {\n            this.debug('globstar found match!', fr, fl, swallowee)\n            // found a match.\n            return true\n          } else {\n            // can't swallow \".\" or \"..\" ever.\n            // can only swallow \".foo\" when explicitly asked.\n            if (\n              swallowee === '.' ||\n              swallowee === '..' ||\n              (!options.dot && swallowee.charAt(0) === '.')\n            ) {\n              this.debug('dot detected!', file, fr, pattern, pr)\n              break\n            }\n\n            // ** swallows a segment, and continue.\n            this.debug('globstar swallow a segment, and continue')\n            fr++\n          }\n        }\n\n        // no match was found.\n        // However, in partial mode, we can't say this is necessarily over.\n        /* c8 ignore start */\n        if (partial) {\n          // ran out of file\n          this.debug('\\n>>> no match, partial?', file, fr, pattern, pr)\n          if (fr === fl) {\n            return true\n          }\n        }\n        /* c8 ignore stop */\n        return false\n      }\n\n      // something other than **\n      // non-magic patterns just have to match exactly\n      // patterns with magic have been turned into regexps.\n      let hit: boolean\n      if (typeof p === 'string') {\n        hit = f === p\n        this.debug('string match', p, f, hit)\n      } else {\n        hit = p.test(f)\n        this.debug('pattern match', p, f, hit)\n      }\n\n      if (!hit) return false\n    }\n\n    // Note: ending in / means that we'll get a final \"\"\n    // at the end of the pattern.  This can only match a\n    // corresponding \"\" at the end of the file.\n    // If the file ends in /, then it can only match a\n    // a pattern that ends in /, unless the pattern just\n    // doesn't have any more for it. But, a/b/ should *not*\n    // match \"a/b/*\", even though \"\" matches against the\n    // [^/]*? pattern, except in partial mode, where it might\n    // simply not be reached yet.\n    // However, a/b/ should still satisfy a/*\n\n    // now either we fell off the end of the pattern, or we're done.\n    if (fi === fl && pi === pl) {\n      // ran out of pattern and filename at the same time.\n      // an exact hit!\n      return true\n    } else if (fi === fl) {\n      // ran out of file, but still had pattern left.\n      // this is ok if we're doing the match as part of\n      // a glob fs traversal.\n      return partial\n    } else if (pi === pl) {\n      // ran out of pattern, still have file left.\n      // this is only acceptable if we're on the very last\n      // empty segment of a file with a trailing slash.\n      // a/* should match a/b/\n      return fi === fl - 1 && file[fi] === ''\n\n      /* c8 ignore start */\n    } else {\n      // should be unreachable.\n      throw new Error('wtf?')\n    }\n    /* c8 ignore stop */\n  }\n\n  braceExpand() {\n    return braceExpand(this.pattern, this.options)\n  }\n\n  parse(pattern: string): ParseReturn {\n    assertValidPattern(pattern)\n\n    const options = this.options\n\n    // shortcuts\n    if (pattern === '**') return GLOBSTAR\n    if (pattern === '') return ''\n\n    // far and away, the most common glob pattern parts are\n    // *, *.*, and *.<ext>  Add a fast check method for those.\n    let m: RegExpMatchArray | null\n    let fastTest: null | ((f: string) => boolean) = null\n    if ((m = pattern.match(starRE))) {\n      fastTest = options.dot ? starTestDot : starTest\n    } else if ((m = pattern.match(starDotExtRE))) {\n      fastTest = (\n        options.nocase\n          ? options.dot\n            ? starDotExtTestNocaseDot\n            : starDotExtTestNocase\n          : options.dot\n          ? starDotExtTestDot\n          : starDotExtTest\n      )(m[1])\n    } else if ((m = pattern.match(qmarksRE))) {\n      fastTest = (\n        options.nocase\n          ? options.dot\n            ? qmarksTestNocaseDot\n            : qmarksTestNocase\n          : options.dot\n          ? qmarksTestDot\n          : qmarksTest\n      )(m)\n    } else if ((m = pattern.match(starDotStarRE))) {\n      fastTest = options.dot ? starDotStarTestDot : starDotStarTest\n    } else if ((m = pattern.match(dotStarRE))) {\n      fastTest = dotStarTest\n    }\n\n    const re = AST.fromGlob(pattern, this.options).toMMPattern()\n    if (fastTest && typeof re === 'object') {\n      // Avoids overriding in frozen environments\n      Reflect.defineProperty(re, 'test', { value: fastTest })\n    }\n    return re\n  }\n\n  makeRe() {\n    if (this.regexp || this.regexp === false) return this.regexp\n\n    // at this point, this.set is a 2d array of partial\n    // pattern strings, or \"**\".\n    //\n    // It's better to use .match().  This function shouldn't\n    // be used, really, but it's pretty convenient sometimes,\n    // when you just want to work with a regex.\n    const set = this.set\n\n    if (!set.length) {\n      this.regexp = false\n      return this.regexp\n    }\n    const options = this.options\n\n    const twoStar = options.noglobstar\n      ? star\n      : options.dot\n      ? twoStarDot\n      : twoStarNoDot\n    const flags = new Set(options.nocase ? ['i'] : [])\n\n    // regexpify non-globstar patterns\n    // if ** is only item, then we just do one twoStar\n    // if ** is first, and there are more, prepend (\\/|twoStar\\/)? to next\n    // if ** is last, append (\\/twoStar|) to previous\n    // if ** is in the middle, append (\\/|\\/twoStar\\/) to previous\n    // then filter out GLOBSTAR symbols\n    let re = set\n      .map(pattern => {\n        const pp: (string | typeof GLOBSTAR)[] = pattern.map(p => {\n          if (p instanceof RegExp) {\n            for (const f of p.flags.split('')) flags.add(f)\n          }\n          return typeof p === 'string'\n            ? regExpEscape(p)\n            : p === GLOBSTAR\n            ? GLOBSTAR\n            : p._src\n        }) as (string | typeof GLOBSTAR)[]\n        pp.forEach((p, i) => {\n          const next = pp[i + 1]\n          const prev = pp[i - 1]\n          if (p !== GLOBSTAR || prev === GLOBSTAR) {\n            return\n          }\n          if (prev === undefined) {\n            if (next !== undefined && next !== GLOBSTAR) {\n              pp[i + 1] = '(?:\\\\/|' + twoStar + '\\\\/)?' + next\n            } else {\n              pp[i] = twoStar\n            }\n          } else if (next === undefined) {\n            pp[i - 1] = prev + '(?:\\\\/|' + twoStar + ')?'\n          } else if (next !== GLOBSTAR) {\n            pp[i - 1] = prev + '(?:\\\\/|\\\\/' + twoStar + '\\\\/)' + next\n            pp[i + 1] = GLOBSTAR\n          }\n        })\n        return pp.filter(p => p !== GLOBSTAR).join('/')\n      })\n      .join('|')\n\n    // need to wrap in parens if we had more than one thing with |,\n    // otherwise only the first will be anchored to ^ and the last to $\n    const [open, close] = set.length > 1 ? ['(?:', ')'] : ['', '']\n    // must match entire pattern\n    // ending in a * or ** will make it less strict.\n    re = '^' + open + re + close + '$'\n\n    // can match anything, as long as it's not this.\n    if (this.negate) re = '^(?!' + re + ').+$'\n\n    try {\n      this.regexp = new RegExp(re, [...flags].join(''))\n      /* c8 ignore start */\n    } catch (ex) {\n      // should be impossible\n      this.regexp = false\n    }\n    /* c8 ignore stop */\n    return this.regexp\n  }\n\n  slashSplit(p: string) {\n    // if p starts with // on windows, we preserve that\n    // so that UNC paths aren't broken.  Otherwise, any number of\n    // / characters are coalesced into one, unless\n    // preserveMultipleSlashes is set to true.\n    if (this.preserveMultipleSlashes) {\n      return p.split('/')\n    } else if (this.isWindows && /^\\/\\/[^\\/]+/.test(p)) {\n      // add an extra '' for the one we lose\n      return ['', ...p.split(/\\/+/)]\n    } else {\n      return p.split(/\\/+/)\n    }\n  }\n\n  match(f: string, partial = this.partial) {\n    this.debug('match', f, this.pattern)\n    // short-circuit in the case of busted things.\n    // comments, etc.\n    if (this.comment) {\n      return false\n    }\n    if (this.empty) {\n      return f === ''\n    }\n\n    if (f === '/' && partial) {\n      return true\n    }\n\n    const options = this.options\n\n    // windows: need to use /, not \\\n    if (this.isWindows) {\n      f = f.split('\\\\').join('/')\n    }\n\n    // treat the test path as a set of pathparts.\n    const ff = this.slashSplit(f)\n    this.debug(this.pattern, 'split', ff)\n\n    // just ONE of the pattern sets in this.set needs to match\n    // in order for it to be valid.  If negating, then just one\n    // match means that we have failed.\n    // Either way, return on the first hit.\n\n    const set = this.set\n    this.debug(this.pattern, 'set', set)\n\n    // Find the basename of the path by looking for the last non-empty segment\n    let filename: string = ff[ff.length - 1]\n    if (!filename) {\n      for (let i = ff.length - 2; !filename && i >= 0; i--) {\n        filename = ff[i]\n      }\n    }\n\n    for (let i = 0; i < set.length; i++) {\n      const pattern = set[i]\n      let file = ff\n      if (options.matchBase && pattern.length === 1) {\n        file = [filename]\n      }\n      const hit = this.matchOne(file, pattern, partial)\n      if (hit) {\n        if (options.flipNegate) {\n          return true\n        }\n        return !this.negate\n      }\n    }\n\n    // didn't get any hits.  this is success if it's a negative\n    // pattern, failure otherwise.\n    if (options.flipNegate) {\n      return false\n    }\n    return this.negate\n  }\n\n  static defaults(def: MinimatchOptions) {\n    return minimatch.defaults(def).Minimatch\n  }\n}\n/* c8 ignore start */\nexport { AST } from './ast.js'\nexport { escape } from './escape.js'\nexport { unescape } from './unescape.js'\n/* c8 ignore stop */\nminimatch.AST = AST\nminimatch.Minimatch = Minimatch\nminimatch.escape = escape\nminimatch.unescape = unescape\n"]}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 {"version":3,"file":"index.d.ts","sourceRoot":"","sources":["../../src/index.ts"],"names":[],"mappings":"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"}                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           /*!
 * finalhandler
 * Copyright(c) 2014-2022 Douglas Christopher Wilson
 * MIT Licensed
 */

'use strict'

/**
 * Module dependencies.
 * @private
 */

var debug = require('debug')('finalhandler')
var encodeUrl = require('encodeurl')
var escapeHtml = require('escape-html')
var onFinished = require('on-finished')
var parseUrl = require('parseurl')
var statuses = require('statuses')
var unpipe = require('unpipe')

/**
 * Module variables.
 * @private
 */

var DOUBLE_SPACE_REGEXP = /\x20{2}/g
var NEWLINE_REGEXP = /\n/g

/* istanbul ignore next */
var defer = typeof setImmediate === 'function'
  ? setImmediate
  : function (fn) { process.nextTick(fn.bind.apply(fn, arguments)) }
var isFinished = onFinished.isFinished

/**
 * Create a minimal HTML document.
 *
 * @param {string} message
 * @private
 */

function createHtmlDocument (message) {
  var body = escapeHtml(message)
    .replace(NEWLINE_REGEXP, '<br>')
    .replace(DOUBLE_SPACE_REGEXP, ' &nbsp;')

  return '<!DOCTYPE html>\n' +
    '<html lang="en">\n' +
    '<head>\n' +
    '<meta charset="utf-8">\n' +
    '<title>Error</title>\n' +
    '</head>\n' +
    '<body>\n' +
    '<pre>' + body + '</pre>\n' +
    '</body>\n' +
    '</html>\n'
}

/**
 * Module exports.
 * @public
 */

module.exports = finalhandler

/**
 * Create a function to handle the final response.
 *
 * @param {Request} req
 * @param {Response} res
 * @param {Object} [options]
 * @return {Function}
 * @public
 */

function finalhandler (req, res, options) {
  var opts = options || {}

  // get environment
  var env = opts.env || process.env.NODE_ENV || 'development'

  // get error callback
  var onerror = opts.onerror

  return function (err) {
    var headers
    var msg
    var status

    // ignore 404 on in-flight response
    if (!err && headersSent(res)) {
      debug('cannot 404 after headers sent')
      return
    }

    // unhandled error
    if (err) {
      // respect status code from error
      status = getErrorStatusCode(err)

      if (status === undefined) {
        // fallback to status code on response
        status = getResponseStatusCode(res)
      } else {
        // respect headers from error
        headers = getErrorHeaders(err)
      }

      // get error message
      msg = getErrorMessage(err, status, env)
    } else {
      // not found
      status = 404
      msg = 'Cannot ' + req.method + ' ' + encodeUrl(getResourceName(req))
    }

    debug('default %s', status)

    // schedule onerror callback
    if (err && onerror) {
      defer(onerror, err, req, res)
    }

    // cannot actually respond
    if (headersSent(res)) {
      debug('cannot %d after headers sent', status)
      if (req.socket) {
        req.socket.destroy()
      }
      return
    }

    // send response
    send(req, res, status, headers, msg)
  }
}

/**
 * Get headers from Error object.
 *
 * @param {Error} err
 * @return {object}
 * @private
 */

function getErrorHeaders (err) {
  if (!err.headers || typeof err.headers !== 'object') {
    return undefined
  }

  var headers = Object.create(null)
  var keys = Object.keys(err.headers)

  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    headers[key] = err.headers[key]
  }

  return headers
}

/**
 * Get message from Error object, fallback to status message.
 *
 * @param {Error} err
 * @param {number} status
 * @param {string} env
 * @return {string}
 * @private
 */

function getErrorMessage (err, status, env) {
  var msg

  if (env !== 'production') {
    // use err.stack, which typically includes err.message
    msg = err.stack

    // fallback to err.toString() when possible
    if (!msg && typeof err.toString === 'function') {
      msg = err.toString()
    }
  }

  return msg || statuses.message[status]
}

/**
 * Get status code from Error object.
 *
 * @param {Error} err
 * @return {number}
 * @private
 */

function getErrorStatusCode (err) {
  // check err.status
  if (typeof err.status === 'number' && err.status >= 400 && err.status < 600) {
    return err.status
  }

  // check err.statusCode
  if (typeof err.statusCode === 'number' && err.statusCode >= 400 && err.statusCode < 600) {
    return err.statusCode
  }

  return undefined
}

/**
 * Get resource name for the request.
 *
 * This is typically just the original pathname of the request
 * but will fallback to "resource" is that cannot be determined.
 *
 * @param {IncomingMessage} req
 * @return {string}
 * @private
 */

function getResourceName (req) {
  try {
    return parseUrl.original(req).pathname
  } catch (e) {
    return 'resource'
  }
}

/**
 * Get status code from response.
 *
 * @param {OutgoingMessage} res
 * @return {number}
 * @private
 */

function getResponseStatusCode (res) {
  var status = res.statusCode

  // default status code to 500 if outside valid range
  if (typeof status !== 'number' || status < 400 || status > 599) {
    status = 500
  }

  return status
}

/**
 * Determine if the response headers have been sent.
 *
 * @param {object} res
 * @returns {boolean}
 * @private
 */

function headersSent (res) {
  return typeof res.headersSent !== 'boolean'
    ? Boolean(res._header)
    : res.headersSent
}

/**
 * Send response.
 *
 * @param {IncomingMessage} req
 * @param {OutgoingMessage} res
 * @param {number} status
 * @param {object} headers
 * @param {string} message
 * @private
 */

function send (req, res, status, headers, message) {
  function write () {
    // response body
    var body = createHtmlDocument(message)

    // response status
    res.statusCode = status

    if (req.httpVersionMajor < 2) {
      res.statusMessage = statuses.message[status]
    }

    // remove any content headers
    res.removeHeader('Content-Encoding')
    res.removeHeader('Content-Language')
    res.removeHeader('Content-Range')

    // response headers
    setHeaders(res, headers)

    // security headers
    res.setHeader('Content-Security-Policy', "default-src 'none'")
    res.setHeader('X-Content-Type-Options', 'nosniff')

    // standard headers
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Length', Buffer.byteLength(body, 'utf8'))

    if (req.method === 'HEAD') {
      res.end()
      return
    }

    res.end(body, 'utf8')
  }

  if (isFinished(req)) {
    write()
    return
  }

  // unpipe everything from the request
  unpipe(req)

  // flush the request
  onFinished(req, write)
  req.resume()
}

/**
 * Set response headers from an object.
 *
 * @param {OutgoingMessage} res
 * @param {object} headers
 * @private
 */

function setHeaders (res, headers) {
  if (!headers) {
    return
  }

  var keys = Object.keys(headers)
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i]
    res.setHeader(key, headers[key])
  }
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                var G=(l,t,e)=>{if(!t.has(l))throw TypeError("Cannot "+e)};var I=(l,t,e)=>(G(l,t,"read from private field"),e?e.call(l):t.get(l)),j=(l,t,e)=>{if(t.has(l))throw TypeError("Cannot add the same private member more than once");t instanceof WeakSet?t.add(l):t.set(l,e)},x=(l,t,e,i)=>(G(l,t,"write to private field"),i?i.call(l,e):t.set(l,e),e);var T=typeof performance=="object"&&performance&&typeof performance.now=="function"?performance:Date,P=new Set,M=typeof process=="object"&&process?process:{},H=(l,t,e,i)=>{typeof M.emitWarning=="function"?M.emitWarning(l,t,e,i):console.error(`[${e}] ${t}: ${l}`)},W=globalThis.AbortController,N=globalThis.AbortSignal;if(typeof W>"u"){N=class{onabort;_onabort=[];reason;aborted=!1;addEventListener(i,s){this._onabort.push(s)}},W=class{constructor(){t()}signal=new N;abort(i){if(!this.signal.aborted){this.signal.reason=i,this.signal.aborted=!0;for(let s of this.signal._onabort)s(i);this.signal.onabort?.(i)}}};let l=M.env?.LRU_CACHE_IGNORE_AC_WARNING!=="1",t=()=>{l&&(l=!1,H("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.","NO_ABORT_CONTROLLER","ENOTSUP",t))}}var V=l=>!P.has(l),Y=Symbol("type"),A=l=>l&&l===Math.floor(l)&&l>0&&isFinite(l),k=l=>A(l)?l<=Math.pow(2,8)?Uint8Array:l<=Math.pow(2,16)?Uint16Array:l<=Math.pow(2,32)?Uint32Array:l<=Number.MAX_SAFE_INTEGER?O:null:null,O=class extends Array{constructor(t){super(t),this.fill(0)}},z,E=class{heap;length;static create(t){let e=k(t);if(!e)return[];x(E,z,!0);let i=new E(t,e);return x(E,z,!1),i}constructor(t,e){if(!I(E,z))throw new TypeError("instantiate Stack using Stack.create(n)");this.heap=new e(t),this.length=0}push(t){this.heap[this.length++]=t}pop(){return this.heap[--this.length]}},R=E;z=new WeakMap,j(R,z,!1);var D=class{#g;#f;#p;#w;#R;#W;ttl;ttlResolution;ttlAutopurge;updateAgeOnGet;updateAgeOnHas;allowStale;noDisposeOnSet;noUpdateTTL;maxEntrySize;sizeCalculation;noDeleteOnFetchRejection;noDeleteOnStaleGet;allowStaleOnFetchAbort;allowStaleOnFetchRejection;ignoreFetchAbort;#n;#S;#s;#i;#t;#l;#c;#o;#h;#_;#r;#m;#b;#u;#y;#O;#a;static unsafeExposeInternals(t){return{starts:t.#b,ttls:t.#u,sizes:t.#m,keyMap:t.#s,keyList:t.#i,valList:t.#t,next:t.#l,prev:t.#c,get head(){return t.#o},get tail(){return t.#h},free:t.#_,isBackgroundFetch:e=>t.#e(e),backgroundFetch:(e,i,s,n)=>t.#x(e,i,s,n),moveToTail:e=>t.#C(e),indexes:e=>t.#A(e),rindexes:e=>t.#F(e),isStale:e=>t.#d(e)}}get max(){return this.#g}get maxSize(){return this.#f}get calculatedSize(){return this.#S}get size(){return this.#n}get fetchMethod(){return this.#R}get memoMethod(){return this.#W}get dispose(){return this.#p}get disposeAfter(){return this.#w}constructor(t){let{max:e=0,ttl:i,ttlResolution:s=1,ttlAutopurge:n,updateAgeOnGet:h,updateAgeOnHas:o,allowStale:r,dispose:g,disposeAfter:m,noDisposeOnSet:f,noUpdateTTL:u,maxSize:c=0,maxEntrySize:F=0,sizeCalculation:d,fetchMethod:S,memoMethod:a,noDeleteOnFetchRejection:w,noDeleteOnStaleGet:b,allowStaleOnFetchRejection:p,allowStaleOnFetchAbort:_,ignoreFetchAbort:v}=t;if(e!==0&&!A(e))throw new TypeError("max option must be a nonnegative integer");let y=e?k(e):Array;if(!y)throw new Error("invalid max value: "+e);if(this.#g=e,this.#f=c,this.maxEntrySize=F||this.#f,this.sizeCalculation=d,this.sizeCalculation){if(!this.#f&&!this.maxEntrySize)throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");if(typeof this.sizeCalculation!="function")throw new TypeError("sizeCalculation set to non-function")}if(a!==void 0&&typeof a!="function")throw new TypeError("memoMethod must be a function if defined");if(this.#W=a,S!==void 0&&typeof S!="function")throw new TypeError("fetchMethod must be a function if specified");if(this.#R=S,this.#O=!!S,this.#s=new Map,this.#i=new Array(e).fill(void 0),this.#t=new Array(e).fill(void 0),this.#l=new y(e),this.#c=new y(e),this.#o=0,this.#h=0,this.#_=R.create(e),this.#n=0,this.#S=0,typeof g=="function"&&(this.#p=g),typeof m=="function"?(this.#w=m,this.#r=[]):(this.#w=void 0,this.#r=void 0),this.#y=!!this.#p,this.#a=!!this.#w,this.noDisposeOnSet=!!f,this.noUpdateTTL=!!u,this.noDeleteOnFetchRejection=!!w,this.allowStaleOnFetchRejection=!!p,this.allowStaleOnFetchAbort=!!_,this.ignoreFetchAbort=!!v,this.maxEntrySize!==0){if(this.#f!==0&&!A(this.#f))throw new TypeError("maxSize must be a positive integer if specified");if(!A(this.maxEntrySize))throw new TypeError("maxEntrySize must be a positive integer if specified");this.#P()}if(this.allowStale=!!r,this.noDeleteOnStaleGet=!!b,this.updateAgeOnGet=!!h,this.updateAgeOnHas=!!o,this.ttlResolution=A(s)||s===0?s:1,this.ttlAutopurge=!!n,this.ttl=i||0,this.ttl){if(!A(this.ttl))throw new TypeError("ttl must be a positive integer if specified");this.#M()}if(this.#g===0&&this.ttl===0&&this.#f===0)throw new TypeError("At least one of max, maxSize, or ttl is required");if(!this.ttlAutopurge&&!this.#g&&!this.#f){let C="LRU_CACHE_UNBOUNDED";V(C)&&(P.add(C),H("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.","UnboundedCacheWarning",C,D))}}getRemainingTTL(t){return this.#s.has(t)?1/0:0}#M(){let t=new O(this.#g),e=new O(this.#g);this.#u=t,this.#b=e,this.#U=(n,h,o=T.now())=>{if(e[n]=h!==0?o:0,t[n]=h,h!==0&&this.ttlAutopurge){let r=setTimeout(()=>{this.#d(n)&&this.#T(this.#i[n],"expire")},h+1);r.unref&&r.unref()}},this.#z=n=>{e[n]=t[n]!==0?T.now():0},this.#E=(n,h)=>{if(t[h]){let o=t[h],r=e[h];if(!o||!r)return;n.ttl=o,n.start=r,n.now=i||s();let g=n.now-r;n.remainingTTL=o-g}};let i=0,s=()=>{let n=T.now();if(this.ttlResolution>0){i=n;let h=setTimeout(()=>i=0,this.ttlResolution);h.unref&&h.unref()}return n};this.getRemainingTTL=n=>{let h=this.#s.get(n);if(h===void 0)return 0;let o=t[h],r=e[h];if(!o||!r)return 1/0;let g=(i||s())-r;return o-g},this.#d=n=>{let h=e[n],o=t[n];return!!o&&!!h&&(i||s())-h>o}}#z=()=>{};#E=()=>{};#U=()=>{};#d=()=>!1;#P(){let t=new O(this.#g);this.#S=0,this.#m=t,this.#v=e=>{this.#S-=t[e],t[e]=0},this.#G=(e,i,s,n)=>{if(this.#e(i))return 0;if(!A(s))if(n){if(typeof n!="function")throw new TypeError("sizeCalculation must be a function");if(s=n(i,e),!A(s))throw new TypeError("sizeCalculation return invalid (expect positive integer)")}else throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");return s},this.#D=(e,i,s)=>{if(t[e]=i,this.#f){let n=this.#f-t[e];for(;this.#S>n;)this.#L(!0)}this.#S+=t[e],s&&(s.entrySize=i,s.totalCalculatedSize=this.#S)}}#v=t=>{};#D=(t,e,i)=>{};#G=(t,e,i,s)=>{if(i||s)throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");return 0};*#A({allowStale:t=this.allowStale}={}){if(this.#n)for(let e=this.#h;!(!this.#I(e)||((t||!this.#d(e))&&(yield e),e===this.#o));)e=this.#c[e]}*#F({allowStale:t=this.allowStale}={}){if(this.#n)for(let e=this.#o;!(!this.#I(e)||((t||!this.#d(e))&&(yield e),e===this.#h));)e=this.#l[e]}#I(t){return t!==void 0&&this.#s.get(this.#i[t])===t}*entries(){for(let t of this.#A())this.#t[t]!==void 0&&this.#i[t]!==void 0&&!this.#e(this.#t[t])&&(yield[this.#i[t],this.#t[t]])}*rentries(){for(let t of this.#F())this.#t[t]!==void 0&&this.#i[t]!==void 0&&!this.#e(this.#t[t])&&(yield[this.#i[t],this.#t[t]])}*keys(){for(let t of this.#A()){let e=this.#i[t];e!==void 0&&!this.#e(this.#t[t])&&(yield e)}}*rkeys(){for(let t of this.#F()){let e=this.#i[t];e!==void 0&&!this.#e(this.#t[t])&&(yield e)}}*values(){for(let t of this.#A())this.#t[t]!==void 0&&!this.#e(this.#t[t])&&(yield this.#t[t])}*rvalues(){for(let t of this.#F())this.#t[t]!==void 0&&!this.#e(this.#t[t])&&(yield this.#t[t])}[Symbol.iterator](){return this.entries()}[Symbol.toStringTag]="LRUCache";find(t,e={}){for(let i of this.#A()){let s=this.#t[i],n=this.#e(s)?s.__staleWhileFetching:s;if(n!==void 0&&t(n,this.#i[i],this))return this.get(this.#i[i],e)}}forEach(t,e=this){for(let i of this.#A()){let s=this.#t[i],n=this.#e(s)?s.__staleWhileFetching:s;n!==void 0&&t.call(e,n,this.#i[i],this)}}rforEach(t,e=this){for(let i of this.#F()){let s=this.#t[i],n=this.#e(s)?s.__staleWhileFetching:s;n!==void 0&&t.call(e,n,this.#i[i],this)}}purgeStale(){let t=!1;for(let e of this.#F({allowStale:!0}))this.#d(e)&&(this.#T(this.#i[e],"expire"),t=!0);return t}info(t){let e=this.#s.get(t);if(e===void 0)return;let i=this.#t[e],s=this.#e(i)?i.__staleWhileFetching:i;if(s===void 0)return;let n={value:s};if(this.#u&&this.#b){let h=this.#u[e],o=this.#b[e];if(h&&o){let r=h-(T.now()-o);n.ttl=r,n.start=Date.now()}}return this.#m&&(n.size=this.#m[e]),n}dump(){let t=[];for(let e of this.#A({allowStale:!0})){let i=this.#i[e],s=this.#t[e],n=this.#e(s)?s.__staleWhileFetching:s;if(n===void 0||i===void 0)continue;let h={value:n};if(this.#u&&this.#b){h.ttl=this.#u[e];let o=T.now()-this.#b[e];h.start=Math.floor(Date.now()-o)}this.#m&&(h.size=this.#m[e]),t.unshift([i,h])}return t}load(t){this.clear();for(let[e,i]of t){if(i.start){let s=Date.now()-i.start;i.start=T.now()-s}this.set(e,i.value,i)}}set(t,e,i={}){if(e===void 0)return this.delete(t),this;let{ttl:s=this.ttl,start:n,noDisposeOnSet:h=this.noDisposeOnSet,sizeCalculation:o=this.sizeCalculation,status:r}=i,{noUpdateTTL:g=this.noUpdateTTL}=i,m=this.#G(t,e,i.size||0,o);if(this.maxEntrySize&&m>this.maxEntrySize)return r&&(r.set="miss",r.maxEntrySizeExceeded=!0),this.#T(t,"set"),this;let f=this.#n===0?void 0:this.#s.get(t);if(f===void 0)f=this.#n===0?this.#h:this.#_.length!==0?this.#_.pop():this.#n===this.#g?this.#L(!1):this.#n,this.#i[f]=t,this.#t[f]=e,this.#s.set(t,f),this.#l[this.#h]=f,this.#c[f]=this.#h,this.#h=f,this.#n++,this.#D(f,m,r),r&&(r.set="add"),g=!1;else{this.#C(f);let u=this.#t[f];if(e!==u){if(this.#O&&this.#e(u)){u.__abortController.abort(new Error("replaced"));let{__staleWhileFetching:c}=u;c!==void 0&&!h&&(this.#y&&this.#p?.(c,t,"set"),this.#a&&this.#r?.push([c,t,"set"]))}else h||(this.#y&&this.#p?.(u,t,"set"),this.#a&&this.#r?.push([u,t,"set"]));if(this.#v(f),this.#D(f,m,r),this.#t[f]=e,r){r.set="replace";let c=u&&this.#e(u)?u.__staleWhileFetching:u;c!==void 0&&(r.oldValue=c)}}else r&&(r.set="update")}if(s!==0&&!this.#u&&this.#M(),this.#u&&(g||this.#U(f,s,n),r&&this.#E(r,f)),!h&&this.#a&&this.#r){let u=this.#r,c;for(;c=u?.shift();)this.#w?.(...c)}return this}pop(){try{for(;this.#n;){let t=this.#t[this.#o];if(this.#L(!0),this.#e(t)){if(t.__staleWhileFetching)return t.__staleWhileFetching}else if(t!==void 0)return t}}finally{if(this.#a&&this.#r){let t=this.#r,e;for(;e=t?.shift();)this.#w?.(...e)}}}#L(t){let e=this.#o,i=this.#i[e],s=this.#t[e];return this.#O&&this.#e(s)?s.__abortController.abort(new Error("evicted")):(this.#y||this.#a)&&(this.#y&&this.#p?.(s,i,"evict"),this.#a&&this.#r?.push([s,i,"evict"])),this.#v(e),t&&(this.#i[e]=void 0,this.#t[e]=void 0,this.#_.push(e)),this.#n===1?(this.#o=this.#h=0,this.#_.length=0):this.#o=this.#l[e],this.#s.delete(i),this.#n--,e}has(t,e={}){let{updateAgeOnHas:i=this.updateAgeOnHas,status:s}=e,n=this.#s.get(t);if(n!==void 0){let h=this.#t[n];if(this.#e(h)&&h.__staleWhileFetching===void 0)return!1;if(this.#d(n))s&&(s.has="stale",this.#E(s,n));else return i&&this.#z(n),s&&(s.has="hit",this.#E(s,n)),!0}else s&&(s.has="miss");return!1}peek(t,e={}){let{allowStale:i=this.allowStale}=e,s=this.#s.get(t);if(s===void 0||!i&&this.#d(s))return;let n=this.#t[s];return this.#e(n)?n.__staleWhileFetching:n}#x(t,e,i,s){let n=e===void 0?void 0:this.#t[e];if(this.#e(n))return n;let h=new W,{signal:o}=i;o?.addEventListener("abort",()=>h.abort(o.reason),{signal:h.signal});let r={signal:h.signal,options:i,context:s},g=(d,S=!1)=>{let{aborted:a}=h.signal,w=i.ignoreFetchAbort&&d!==void 0;if(i.status&&(a&&!S?(i.status.fetchAborted=!0,i.status.fetchError=h.signal.reason,w&&(i.status.fetchAbortIgnored=!0)):i.status.fetchResolved=!0),a&&!w&&!S)return f(h.signal.reason);let b=c;return this.#t[e]===c&&(d===void 0?b.__staleWhileFetching?this.#t[e]=b.__staleWhileFetching:this.#T(t,"fetch"):(i.status&&(i.status.fetchUpdated=!0),this.set(t,d,r.options))),d},m=d=>(i.status&&(i.status.fetchRejected=!0,i.status.fetchError=d),f(d)),f=d=>{let{aborted:S}=h.signal,a=S&&i.allowStaleOnFetchAbort,w=a||i.allowStaleOnFetchRejection,b=w||i.noDeleteOnFetchRejection,p=c;if(this.#t[e]===c&&(!b||p.__staleWhileFetching===void 0?this.#T(t,"fetch"):a||(this.#t[e]=p.__staleWhileFetching)),w)return i.status&&p.__staleWhileFetching!==void 0&&(i.status.returnedStale=!0),p.__staleWhileFetching;if(p.__returned===p)throw d},u=(d,S)=>{let a=this.#R?.(t,n,r);a&&a instanceof Promise&&a.then(w=>d(w===void 0?void 0:w),S),h.signal.addEventListener("abort",()=>{(!i.ignoreFetchAbort||i.allowStaleOnFetchAbort)&&(d(void 0),i.allowStaleOnFetchAbort&&(d=w=>g(w,!0)))})};i.status&&(i.status.fetchDispatched=!0);let c=new Promise(u).then(g,m),F=Object.assign(c,{__abortController:h,__staleWhileFetching:n,__returned:void 0});return e===void 0?(this.set(t,F,{...r.options,status:void 0}),e=this.#s.get(t)):this.#t[e]=F,F}#e(t){if(!this.#O)return!1;let e=t;return!!e&&e instanceof Promise&&e.hasOwnProperty("__staleWhileFetching")&&e.__abortController instanceof W}async fetch(t,e={}){let{allowStale:i=this.allowStale,updateAgeOnGet:s=this.updateAgeOnGet,noDeleteOnStaleGet:n=this.noDeleteOnStaleGet,ttl:h=this.ttl,noDisposeOnSet:o=this.noDisposeOnSet,size:r=0,sizeCalculation:g=this.sizeCalculation,noUpdateTTL:m=this.noUpdateTTL,noDeleteOnFetchRejection:f=this.noDeleteOnFetchRejection,allowStaleOnFetchRejection:u=this.allowStaleOnFetchRejection,ignoreFetchAbort:c=this.ignoreFetchAbort,allowStaleOnFetchAbort:F=this.allowStaleOnFetchAbort,context:d,forceRefresh:S=!1,status:a,signal:w}=e;if(!this.#O)return a&&(a.fetch="get"),this.get(t,{allowStale:i,updateAgeOnGet:s,noDeleteOnStaleGet:n,status:a});let b={allowStale:i,updateAgeOnGet:s,noDeleteOnStaleGet:n,ttl:h,noDisposeOnSet:o,size:r,sizeCalculation:g,noUpdateTTL:m,noDeleteOnFetchRejection:f,allowStaleOnFetchRejection:u,allowStaleOnFetchAbort:F,ignoreFetchAbort:c,status:a,signal:w},p=this.#s.get(t);if(p===void 0){a&&(a.fetch="miss");let _=this.#x(t,p,b,d);return _.__returned=_}else{let _=this.#t[p];if(this.#e(_)){let U=i&&_.__staleWhileFetching!==void 0;return a&&(a.fetch="inflight",U&&(a.returnedStale=!0)),U?_.__staleWhileFetching:_.__returned=_}let v=this.#d(p);if(!S&&!v)return a&&(a.fetch="hit"),this.#C(p),s&&this.#z(p),a&&this.#E(a,p),_;let y=this.#x(t,p,b,d),L=y.__staleWhileFetching!==void 0&&i;return a&&(a.fetch=v?"stale":"refresh",L&&v&&(a.returnedStale=!0)),L?y.__staleWhileFetching:y.__returned=y}}async forceFetch(t,e={}){let i=await this.fetch(t,e);if(i===void 0)throw new Error("fetch() returned undefined");return i}memo(t,e={}){let i=this.#W;if(!i)throw new Error("no memoMethod provided to constructor");let{context:s,forceRefresh:n,...h}=e,o=this.get(t,h);if(!n&&o!==void 0)return o;let r=i(t,o,{options:h,context:s});return this.set(t,r,h),r}get(t,e={}){let{allowStale:i=this.allowStale,updateAgeOnGet:s=this.updateAgeOnGet,noDeleteOnStaleGet:n=this.noDeleteOnStaleGet,status:h}=e,o=this.#s.get(t);if(o!==void 0){let r=this.#t[o],g=this.#e(r);return h&&this.#E(h,o),this.#d(o)?(h&&(h.get="stale"),g?(h&&i&&r.__staleWhileFetching!==void 0&&(h.returnedStale=!0),i?r.__staleWhileFetching:void 0):(n||this.#T(t,"expire"),h&&i&&(h.returnedStale=!0),i?r:void 0)):(h&&(h.get="hit"),g?r.__staleWhileFetching:(this.#C(o),s&&this.#z(o),r))}else h&&(h.get="miss")}#j(t,e){this.#c[