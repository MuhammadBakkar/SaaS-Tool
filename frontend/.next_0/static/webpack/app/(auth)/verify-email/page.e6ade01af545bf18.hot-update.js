import { map } from '../operators/map';
import { Observable } from '../Observable';
import { AjaxResponse } from './AjaxResponse';
import { AjaxTimeoutError, AjaxError } from './errors';
function ajaxGet(url, headers) {
    return ajax({ method: 'GET', url, headers });
}
function ajaxPost(url, body, headers) {
    return ajax({ method: 'POST', url, body, headers });
}
function ajaxDelete(url, headers) {
    return ajax({ method: 'DELETE', url, headers });
}
function ajaxPut(url, body, headers) {
    return ajax({ method: 'PUT', url, body, headers });
}
function ajaxPatch(url, body, headers) {
    return ajax({ method: 'PATCH', url, body, headers });
}
const mapResponse = map((x) => x.response);
function ajaxGetJSON(url, headers) {
    return mapResponse(ajax({
        method: 'GET',
        url,
        headers,
    }));
}
export const ajax = (() => {
    const create = (urlOrConfig) => {
        const config = typeof urlOrConfig === 'string'
            ? {
                url: urlOrConfig,
            }
            : urlOrConfig;
        return fromAjax(config);
    };
    create.get = ajaxGet;
    create.post = ajaxPost;
    create.delete = ajaxDelete;
    create.put = ajaxPut;
    create.patch = ajaxPatch;
    create.getJSON = ajaxGetJSON;
    return create;
})();
const UPLOAD = 'upload';
const DOWNLOAD = 'download';
const LOADSTART = 'loadstart';
const PROGRESS = 'progress';
const LOAD = 'load';
export function fromAjax(init) {
    return new Observable((destination) => {
        var _a, _b;
        const config = Object.assign({ async: true, crossDomain: false, withCredentials: false, method: 'GET', timeout: 0, responseType: 'json' }, init);
        const { queryParams, body: configuredBody, headers: configuredHeaders } = config;
        let url = config.url;
        if (!url) {
            throw new TypeError('url is required');
        }
        if (queryParams) {
            let searchParams;
            if (url.includes('?')) {
                const parts = url.split('?');
                if (2 < parts.length) {
                    throw new TypeError('invalid url');
                }
                searchParams = new URLSearchParams(parts[1]);
                new URLSearchParams(queryParams).forEach((value, key) => searchParams.set(key, value));
                url = parts[0] + '?' + searchParams;
            }
            else {
                searchParams = new URLSearchParams(queryParams);
                url = url + '?' + searchParams;
            }
        }
        const headers = {};
        if (configuredHeaders) {
            for (const key in configuredHeaders) {
                if (configuredHeaders.hasOwnProperty(key)) {
                    headers[key.toLowerCase()] = configuredHeaders[key];
                }
            }
        }
        const crossDomain = config.crossDomain;
        if (!crossDomain && !('x-requested-with' in headers)) {
            headers['x-requested-with'] = 'XMLHttpRequest';
        }
        const { withCredentials, xsrfCookieName, xsrfHeaderName } = config;
        if ((withCredentials || !crossDomain) && xsrfCookieName && xsrfHeaderName) {
            const xsrfCookie = (_b = (_a = document === null || document === void 0 ? void 0 : document.cookie.match(new RegExp(`(^|;\\s*)(${xsrfCookieName})=([^;]*)`))) === null || _a === void 0 ? void 0 : _a.pop()) !== null && _b !== void 0 ? _b : '';
            if (xsrfCookie) {
                headers[xsrfHeaderName] = xsrfCookie;
            }
        }
        const body = extractContentTypeAndMaybeSerializeBody(configuredBody, headers);
        const _request = Object.assign(Object.assign({}, config), { url,
            headers,
            body });
        let xhr;
        xhr = init.createXHR ? init.createXHR() : new XMLHttpRequest();
        {
            const { progressSubscriber, includeDownloadProgress = false, includeUploadProgress = false } = init;
            const addErrorEvent = (type, errorFactory) => {
                xhr.addEventListener(type, () => {
                    var _a;
                    const error = errorFactory();
                    (_a = progressSubscriber === null || progressSubscriber === void 0 ? void 0 : progressSubscriber.error) === null || _a === void 0 ? void 0 : _a.call(progressSubscriber, error);
                    destination.error(error);
                });
            };
            addErrorEvent('timeout', () => new AjaxTimeoutError(xhr, _request));
            addErrorEvent('abort', () => new AjaxError('aborted', xhr, _request));
            const createResponse = (direction, event) => new AjaxResponse(event, xhr, _request, `${direction}_${event.type}`);
            const addProgressEvent = (target, type, direction) => {
                target.addEventListener(type, (event) => {
                    destination.next(createResponse(direction, event));
                });
            };
            if (includeUploadProgress) {
                [LOADSTART, PROGRESS, LOAD].forEach((type) => addProgressEvent(xhr.upload, type, UPLOAD));
            }
            if (progressSubscriber) {
                [LOADSTART, PROGRESS].forEach((type) => xhr.upload.addEventListener(type, (e) => { var _a; return (_a = progressSubscriber === null || progressSubscriber === void 0 ? void 0 : progressSubscriber.next) === null || _a === void 0 ? void 0 : _a.call(progressSubscriber, e); }));
            }
            if (includeDownloadProgress) {
                [LOADSTART, PROGRESS].forEach((type) => addProgressEvent(xhr, type, DOWNLOAD));
            }
            const emitError = (status) => {
                const msg = 'ajax error' + (status ? ' ' + status : '');
                destination.error(new AjaxError(msg, xhr, _request));
            };
            xhr.addEventListener('error', (e) => {
                var _a;
                (_a = progressSubscriber === null || progressSubscriber === void 0 ? void 0 : progressSubscriber.error) === null || _a === void 0 ? void 0 : _a.call(progressSubscriber, e);
                emitError();
            });
            xhr.addEventListener(LOAD, (event) => {
                var _a, _b;
                const { status } = xhr;
                if (status < 400) {
                    (_a = progressSubscriber === null || progressSubscriber === void 0 ? void 0 : progressSubscriber.complete) === null || _a === void 0 ? void 0 : _a.call(progressSubscriber);
                    let response;
                    try {
                        response = createResponse(DOWNLOAD, event);
                    }
                    catch (err) {
                        destination.error(err);
                        return;
                    }
                    destination.next(response);
                    destination.complete();
                }
                else {
                    (_b = progressSubscriber === null || progressSubscriber === void 0 ? void 0 : progressSubscriber.error) === null || _b === void 0 ? void 0 : _b.call(progressSubscriber, event);
                    emitError(status);
                }
            });
        }
        const { user, method, async } = _request;
        if (user) {
            xhr.open(method, url, async, user, _request.password);
        }
        else {
            xhr.open(method, url, async);
        }
        if (async) {
            xhr.timeout = _request.timeout;
            xhr.responseType = _request.responseType;
        }
        if ('withCredentials' in xhr) {
            xhr.withCredentials = _request.withCredentials;
        }
        for (const key in headers) {
            if (headers.hasOwnProperty(key)) {
                xhr.setRequestHeader(key, headers[key]);
            }
        }
        if (body) {
            xhr.send(body);
        }
        else {
            xhr.send();
        }
        return () => {
            if (xhr && xhr.readyState !== 4) {
                xhr.abort();
            }
        };
    });
}
function extractContentTypeAndMaybeSerializeBody(body, headers) {
    var _a;
    if (!body ||
        typeof body === 'string' ||
        isFormData(body) ||
        isURLSearchParams(body) ||
        isArrayBuffer(body) ||
        isFile(body) ||
        isBlob(body) ||
        isReadableStream(body)) {
        return body;
    }
    if (isArrayBufferView(body)) {
        return body.buffer;
    }
    if (typeof body === 'object') {
        headers['content-type'] = (_a = headers['content-type']) !== null && _a !== void 0 ? _a : 'application/json;charset=utf-8';
        return JSON.stringify(body);
    }
    throw new TypeError('Unknown body type');
}
const _toString = Object.prototype.toString;
function toStringCheck(obj, name) {
    return _toString.call(obj) === `[object ${name}]`;
}
function isArrayBuffer(body) {
    return toStringCheck(body, 'ArrayBuffer');
}
function isFile(body) {
    return toStringCheck(body, 'File');
}
function isBlob(body) {
    return toStringCheck(body, 'Blob');
}
function isArrayBufferView(body) {
    return typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView(body);
}
function isFormData(body) {
    return typeof FormData !== 'undefined' && body instanceof FormData;
}
function isURLSearchParams(body) {
    return typeof URLSearchParams !== 'undefined' && body instanceof URLSearchParams;
}
function isReadableStream(body) {
    return typeof ReadableStream !== 'undefined' && body instanceof ReadableStream;
}
//# sourceMappingURL=ajax.js.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       "use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.ROOT_CONFIG_FILENAMES = void 0;
exports.findConfigUpwards = findConfigUpwards;
exports.findRelativeConfig = findRelativeConfig;
exports.findRootConfig = findRootConfig;
exports.loadConfig = loadConfig;
exports.resolveShowConfigPath = resolveShowConfigPath;
function _debug() {
  const data = require("debug");
  _debug = function () {
    return data;
  };
  return data;
}
function _fs() {
  const data = require("fs");
  _fs = function () {
    return data;
  };
  return data;
}
function _path() {
  const data = require("path");
  _path = function () {
    return data;
  };
  return data;
}
function _json() {
  const data = require("json5");
  _json = function () {
    return data;
  };
  return data;
}
function _gensync() {
  const data = require("gensync");
  _gensync = function () {
    return data;
  };
  return data;
}
var _caching = require("../caching.js");
var _configApi = require("../helpers/config-api.js");
var _utils = require("./utils.js");
var _moduleTypes = require("./module-types.js");
var _patternToRegex = require("../pattern-to-regex.js");
var _configError = require("../../errors/config-error.js");
var fs = require("../../gensync-utils/fs.js");
require("module");
var _rewriteStackTrace = require("../../errors/rewrite-stack-trace.js");
var _async = require("../../gensync-utils/async.js");
const debug = _debug()("babel:config:loading:files:configuration");
const ROOT_CONFIG_FILENAMES = exports.ROOT_CONFIG_FILENAMES = ["babel.config.js", "babel.config.cjs", "babel.config.mjs", "babel.config.json", "babel.config.cts"];
const RELATIVE_CONFIG_FILENAMES = [".babelrc", ".babelrc.js", ".babelrc.cjs", ".babelrc.mjs", ".babelrc.json", ".babelrc.cts"];
const BABELIGNORE_FILENAME = ".babelignore";
const runConfig = (0, _caching.makeWeakCache)(function* runConfig(options, cache) {
  yield* [];
  return {
    options: (0, _rewriteStackTrace.endHiddenCallStack)(options)((0, _configApi.makeConfigAPI)(cache)),
    cacheNeedsConfiguration: !cache.configured()
  };
});
function* readConfigCode(filepath, data) {
  if (!_fs().existsSync(filepath)) return null;
  let options = yield* (0, _moduleTypes.default)(filepath, (yield* (0, _async.isAsync)()) ? "auto" : "require", "You appear to be using a native ECMAScript module configuration " + "file, which is only supported when running Babel asynchronously " + "or when using the Node.js `--experimental-require-module` flag.", "You appear to be using a configuration file that contains top-level " + "await, which is only supported when running Babel asynchronously.");
  let cacheNeedsConfiguration = false;
  if (typeof options === "function") {
    ({
      options,
      cacheNeedsConfiguration
    } = yield* runConfig(options, data));
  }
  if (!options || typeof options !== "object" || Array.isArray(options)) {
    throw new _configError.default(`Configuration should be an exported JavaScript object.`, filepath);
  }
  if (typeof options.then === "function") {
    options.catch == null || options.catch(() => {});
    throw new _configError.default(`You appear to be using an async configuration, ` + `which your current version of Babel does not support. ` + `We may add support for this in the future, ` + `but if you're on the most recent version of @babel/core and still ` + `seeing this error, then you'll need to synchronously return your config.`, filepath);
  }
  if (cacheNeedsConfiguration) throwConfigError(filepath);
  return buildConfigFileObject(options, filepath);
}
const cfboaf = new WeakMap();
function buildConfigFileObject(options, filepath) {
  let configFilesByFilepath = cfboaf.get(options);
  if (!configFilesByFilepath) {
    cfboaf.set(options, configFilesByFilepath = new Map());
  }
  let configFile = configFilesByFilepath.get(filepath);
  if (!configFile) {
    configFile = {
      filepath,
      dirname: _path().dirname(filepath),
      options
    };
    configFilesByFilepath.set(filepath, configFile);
  }
  return configFile;
}
const packageToBabelConfig = (0, _caching.makeWeakCacheSync)(file => {
  const babel = file.options["babel"];
  if (babel === undefined) return null;
  if (typeof babel !== "object" || Array.isArray(babel) || babel === null) {
    throw new _configError.default(`.babel property must be an object`, file.filepath);
  }
  return {
    filepath: file.filepath,
    dirname: file.dirname,
    options: babel
  };
});
const readConfigJSON5 = (0, _utils.makeStaticFileCache)((filepath, content) => {
  let options;
  try {
    options = _json().parse(content);
  } catch (err) {
    throw new _configError.default(`Error while parsing config - ${err.message}`, filepath);
  }
  if (!options) throw new _configError.default(`No config detected`, filepath);
  if (typeof options !== "object") {
    throw new _configError.default(`Config returned typeof ${typeof options}`, filepath);
  }
  if (Array.isArray(options)) {
    throw new _configError.default(`Expected config object but found array`, filepath);
  }
  delete options["$schema"];
  return {
    filepath,
    dirname: _path().dirname(filepath),
    options
  };
});
const readIgnoreConfig = (0, _utils.makeStaticFileCache)((filepath, content) => {
  const ignoreDir = _path().dirname(filepath);
  const ignorePatterns = content.split("\n").map(line => line.replace(/#.*$/, "").trim()).filter(Boolean);
  for (const pattern of ignorePatterns) {
    if (pattern[0] === "!") {
      throw new _configError.default(`Negation of file paths is not supported.`, filepath);
    }
  }
  return {
    filepath,
    dirname: _path().dirname(filepath),
    ignore: ignorePatterns.map(pattern => (0, _patternToRegex.default)(pattern, ignoreDir))
  };
});
function findConfigUpwards(rootDir) {
  let dirname = rootDir;
  for (;;) {
    for (const filename of ROOT_CONFIG_FILENAMES) {
      if (_fs().existsSync(_path().join(dirname, filename))) {
        return dirname;
      }
    }
    const nextDir = _path().dirname(dirname);
    if (dirname === nextDir) break;
    dirname = nextDir;
  }
  return null;
}
function* findRelativeConfig(packageData, envName, caller) {
  let config = null;
  let ignore = null;
  const dirname = _path().dirname(packageData.filepath);
  for (const loc of packageData.directories) {
    if (!config) {
      var _packageData$pkg;
      config = yield* loadOneConfig(RELATIVE_CONFIG_FILENAMES, loc, envName, caller, ((_packageData$pkg = packageData.pkg) == null ? void 0 : _packageData$pkg.dirname) === loc ? packageToBabelConfig(packageData.pkg) : null);
    }
    if (!ignore) {
      const ignoreLoc = _path().join(loc, BABELIGNORE_FILENAME);
      ignore = yield* readIgnoreConfig(ignoreLoc);
      if (ignore) {
        debug("Found ignore %o from %o.", ignore.filepath, dirname);
      }
    }
  }
  return {
    config,
    ignore
  };
}
function findRootConfig(dirname, envName, caller) {
  return loadOneConfig(ROOT_CONFIG_FILENAMES, dirname, envName, caller);
}
function* loadOneConfig(names, dirname, envName, caller, previousConfig = null) {
  const configs = yield* _gensync().all(names.map(filename => readConfig(_path().join(dirname, filename), envName, caller)));
  const config = configs.reduce((previousConfig, config) => {
    if (config && previousConfig) {
      throw new _configError.default(`Multiple configuration files found. Please remove one:\n` + ` - ${_path().basename(previousConfig.filepath)}\n` + ` - ${config.filepath}\n` + `from ${dirname}`);
    }
    return config || previousConfig;
  }, previousConfig);
  if (config) {
    debug("Found configuration %o from %o.", config.filepath, dirname);
  }
  return config;
}
function* loadConfig(name, dirname, envName, caller) {
  const filepath = (((v, w) => (v = v.split("."), w = w.split("."), +v[0] > +w[0] || v[0] == w[0] && +v[1] >= +w[1]))(process.versions.node, "8.9") ? require.resolve : (r, {
    paths: [b]
  }, M = require("module")) => {
    let f = M._findPath(r, M._nodeModulePaths(b).concat(b));
    if (f) return f;
    f = new Error(`Cannot resolve module '${r}'`);
    f.code = "MODULE_NOT_FOUND";
    throw f;
  })(name, {
    paths: [dirname]
  });
  const conf = yield* readConfig(filepath, envName, caller);
  if (!conf) {
    throw new _configError.default(`Config file contains no configuration data`, filepath);
  }
  debug("Loaded config %o from %o.", name, dirname);
  return conf;
}
function readConfig(filepath, envName, caller) {
  const ext = _path().extname(filepath);
  switch (ext) {
    case ".js":
    case ".cjs":
    case ".mjs":
    case ".ts":
    case ".cts":
    case ".mts":
      return readConfigCode(filepath, {
        envName,
        caller
      });
    default:
      return readConfigJSON5(filepath);
  }
}
function* resolveShowConfigPath(dirname) {
  const targetPath = process.env.BABEL_SHOW_CONFIG_FOR;
  if (targetPath != null) {
    const absolutePath = _path().resolve(dirname, targetPath);
    const stats = yield* fs.stat(absolutePath);
    if (!stats.isFile()) {
      throw new Error(`${absolutePath}: BABEL_SHOW_CONFIG_FOR must refer to a regular file, directories are not supported.`);
    }
    return absolutePath;
  }
  return null;
}
function throwConfigError(filepath) {
  throw new _configError.default(`\
Caching was left unconfigured. Babel's plugins, presets, and .babelrc.js files can be configured
for various types of caching, using the first param of their handler functions:

module.exports = function(api) {
  // The API exposes the following:

  // Cache the returned value forever and don't call this function again.
  api.cache(true);

  // Don't cache at all. Not recommended because it will be very slow.
  api.cache(false);

  // Cached based on the value of some function. If this function returns a value different from
  // a previously-encountered value, the plugins will re-evaluate.
  var env = api.cache(() => process.env.NODE_ENV);

  // If testing for a specific env, we recommend specifics to avoid instantiating a plugin for
  // any possible NODE_ENV value that might come up during plugin execution.
  var isProd = api.cache(() => process.env.NODE_ENV === "production");

  // .cache(fn) will perform a linear search though instances to find the matching plugin based
  // based on previous instantiated plugins. If you want to recreate the plugin and discard the
  // previous instance whenever something changes, you may use:
  var isProd = api.cache.invalidate(() => process.env.NODE_ENV === "production");

  // Note, we also expose the following more-verbose versions of the above examples:
  api.cache.forever(); // api.cache(true)
  api.cache.never();   // api.cache(false)
  api.cache.using(fn); // api.cache(fn)

  // Return the value that will be cached.
  return { };
};`, filepath);
}
0 && 0;

//# sourceMappingURL=configuration.js.map
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               0ˆóÍTƒÍÆFåz&kçPÓS0”âœ_Sè§pa°K0ƒ<;PŠ®2¸D¸"©œaÚ‘Û.Ÿ ÌàŸ…úú-ê<Û÷°ËA ¶©¨ßÜáx«›oİ`»óFp”%}¸>ã‘í¯"XY’åúËˆ¬ÓlŠ?m¯
PøúçŞüDáfZthşİ¹Ã¹ ¤;‹ğÇÂÑà½¤FÚER•Ó!°æ„/óéÛ¬û÷Á@š´ONtÇ¨ãÅ·Ÿ¦Áî¹àºÑ{Z#ŠœÖ¾¦ª0ÿ?kğ%^ÄĞ„ôSòQaLŞdm¿NÙl2›Õ|¾1rä²ø÷&ò#^ÏP§¥ÊÍV¨Ll!&ƒ@ˆwêMKEâüLyğ½	s
<vĞ?ö^	Ø¬½9s>7–êô¥Úyâ1h¦PÈ©`ÆzÔæ6±;Ãû¢1ÉcÇ»š‡zÊNÕwfoChEöÙ.A‰ş"¡Ùğ³şWxBÅPK5Û\¤Ê*Å.Å¹<ÔÕ6f‚i²h&²2›¬„·4Fƒî*S!c™ËÕ‡H–¤P)á"\‹‰ï’J±Ñ"Tæ¿ØÿG,.‹~QïæwÄ†0L—ÿ@ÇkÓäl:9™(W?ÄÕ1*şÄªÅRƒ§è¥Íåõ¬ğÃ©Øl’]T#ˆßÄ¶qÁ4Æ’‹¤¡1ÈCwl??O”ĞbšîÒ½tÕ5n1÷"¹#".]ª)(&u‘Äœù9ú»æô^ï’&tµ9åÜmĞšC´Lù"´6ŞiÔ1m¯w½c©T‚‰ä:Î}f.
+SÆËãªLcŠ3ôWFˆûkşéíèo¦¬3A½&¸Aá›‹[Û–)Şô’™xj[£mô£ñå†Š©7ˆ{ÚÙ!:ëãgàˆIƒC¤d2Ls36$Uj2h%^|İp¿øˆoĞŸ†hh&yI=î¥2»…ØŠÕ``¼_ÈÜìÕÚå"º»}šO)†©µ‡œlv´ŠÛ9ùCéu@"Õ×í¡ëÉ‡Ÿ¯– ËÂ'€„sÀ`Ë#¾05ÄÇ½ˆUdñjRôK˜o	NåÒşş1–¢gm@^tõ§SÓåu›UÎœ" ;"Ú•Õ6Ñ‰ãÿ³Õ®îk,©ÀY·¼ğßûXÚ'¸µºpHVë»¤ğÎ4Ş1ø¯Ü×>?z¼${Gg™rÌ6Hò¶lú\2	—br¿MúåjÊÉ}h¿NˆÁJÊÛ¥1ÏÊÄrÜ–ãG›‘aÀ@ïWÏÃ0Å¡&–,È*%'W¤éZFŠñkç šîk¾9Vh‰°GÌ»ÔÛpnúÖ¸jàüA:›¤’±%#ê0#É»uÁ„×z4â›g‰æÈZõÓRÁŞ3Z®4c#>â¼\ ğ´‹ìB•Üg|E&ªƒíÔY½hˆÎopŞœ¦€´‹ù¤B~›C9ÁŒù7íº}¤¡ûŠ¹–¿@¤yøö?—X/"Xv­ÀÎ‹%}8ú‚€vƒä}Âë¸œ%8Ì°“2?#CĞo¦¾@ê[¬öŞ1„«$ß—b]ëq×°uÈm÷*8}û#dàà…<¢³Ì=¾×ÜMèïcl…³c0«3“£`9FEÏèë.(ªtnC /§¼ù¹u ö«`L’/”Ú0–±y•!ÁÙJ%ëF¡"Dúv©¡X¿Òi|Üš\ÿzŞ-Y–WPQ×»6§‚ú(LÖŸª8ş€ôèOóÅ_¨  ñÍ™¤d²³<
» `¶2±‘¬ƒmü‡Ë:¡/:ğÁ¸XeÑ¸úÿ1µ9HÑ‹Xƒo^yœ>Õb€·‰Ì®ûÙï½ò~ÕaAp³Ø’ö“-^á€§+i¢@îFfIáC¿ÍfKÁĞ¡ŠFt£.l[âÍ~R2DªeP#&§­¤ÁX{­ ’(ãW@åéyXkñ *‡ù:¹Ã€GÈÄWWp¬Ñ²7÷ß1¹ƒôŒîMá³•yq›şâQÖæ—ø,p2½¨°ÉëØ‰.Ç“vØe¤?.Ú>ÅOF!µÜljQxvjãº$ô¦²D± Ÿò£ÿ
4=u&+}€•Zöº+¬(o˜½“€Têéïñê<5m?ö¶Œ6®Å¨Gûl^†Í7Y.È9Äê>¨v9 m¯$ºÌW|’P§kş¨ÖymŒ'
ÒŠK#®ca]1®ç_|.L¾U“ÁĞÇPÏ0Rïm¶?0Bµ£&H(¿¯@ğ²lôD*|n¹uGİúZÖUÛ¼5õšKbæ¡f‘·Çvˆ2‰¡,&'SHÙˆŠ¿•JÜ(Œ'T`­¸ŒÜ{gunM/b¿ŸÄpT2)"^“oG%§móÉÇ/İÎom8“º9R÷Õs¶B7²®Tè÷á ¥–PjäÔ"ë›ÜŒyH³­§‡.3ÒüÚ(5dS=Nxû½åF”ˆM»×šl(¤>S˜5htÕšEÎĞƒ`$)è-`J‰´\³‰s4ıûUÉ¦“—6üo>"/Î6uÁœîâ¸¢ZÅ•ªT‡’Ü¤¤å4²>ÍJ–Yºı~Š~"Gû’#ĞŠèXR†”%@álôT.Ä
C{§Ç…Ã¾:Ìøo3Ù0-zQF©? ºLsÒ*õÜ2—¨iÙª~I'¥ş±®2uqHÀw3{Íè	š™İúEl±ÓøA³7²Ó»xû|÷»ÏÎ?ëlã©ÍËøØøĞA«æ–I7C€è~§ (-,–¡™ùM®û¹úfiúÏ£“9V$ëÓÛ»½?àÄV²¨˜&Â­!BÒÌÑ(gÿ®Ï§õ÷Ûg‡Jæ¸$€W\Š“YÁ •å~"Wè›uF) kÈO5*VçŒ)µJie‰u”;ò•7½DŠç¤ı¬^e©Ó@¨¢<:ö¨œõú˜“Eÿ¹ò£÷päê¹ Vu(ë¥Ø¡!İ&a‘âoLYô7Ç‡.ö ğ•v<`Eª…qĞHrOGZ¯Ê"¤:9g­¤j¶s*tÊv;ı
/Sº'­Üp€Õ”^û%²~)3‹1ˆfE"¼‚Öé÷ÇÎ'@Õ;ÄÁuz]¸õóÌwd·>¨BÏ@Ö€yú¹ØôŠjÏWˆˆÖå|-ãÃQŞ*T9÷y×ˆBû'VæH`´©j†YÕKc#u—ç´êÇ §ä ÖªªğTñHBª³~(0S×ÀÇĞšdCHñb|Ñ«$dŠ8Ä{ä{Îø¦oE@r™8gZ^tM!mªÃKÃ¨´–S–u†<¯øË{ïßvßB,Ã·²ÿ­SÄã=a\›S‚bø°gZ¤ÛŒ­˜"¯äÅÚnçº6¤{JÕÖĞ´ŠB÷	¢ÌÖ"’f¯ÖÁî Xb§ØpÍÄ‹á¼Æ‡â·Ï°õãtyTˆhqxÊ™°÷qùïµ}*vHëÏ½¢r¶.0À?+Ø4±D*Xêİı|k±R,†ÊúŠ®şòNÿådvw:£ˆn‹¢b™ ÈÄÆ8şÇZŞêfÏJÏ—!£5°³ ¤åí'«|[ƒÇÒ˜ÏpTy® ‚6 Óö‰üå Ş#¥ì£ˆ<9V­wvR­+ºc®¾Àõ„S0W‡©tüåŸì%˜±!ôš¢¤€9”CNã#°_Ÿş­%] |½‹Öµæ79ÿÄ×¦®^ø^Ä€®QIlDÉ*À}›™çÚ­}¨Š*ƒ3İı"Œ%i²-ÈÊq¸òsL¤¡Hšo5m:?×&¡îuºpI“‘Èì×“Ì…ú
íİäÖ½+Ğ…NÃ¨jÀ?‚9±³wUZ…RÁsè""½-,\2ü‘»À5¨ÊÚE}ÜÊ/¬¹èy321á‹$‘½Ÿë2µd6®iÇõcŒÃ	ØöÄè E"cÆWd<‹ÔqéÊƒ 7™­sª"”«zŞX©°~/e%õ/y)'¡Õ2ˆ%ÛĞ+DÿbrpÕ|áş-^¥4¨'	Óô\³h0¨+ >» Ç²‘jx|±Šò:áxß5Ì*µ
äÏ[É¤GÛƒâCÙÈ³ı$Aî‡ +kNùüŞšR8@¢Xn¡ºâ”½,[ÏÇ&M€[>­vá¿êçè·›DÍ
'¢HÒyöÎeÂZ÷	g{Ù®äQÅÛ‘20õÏ¹¤µ:Ş]qÅğWA,ax ËÔ½9dIÓæ•õõ¥4^Îº:Mğ– *ÕÔ–µ64Z»Û·ç=ó,ëÙx©Û»}-q¡Q£
kÃtÎ“&”†¥³È#X•k­§‰ÏŠrá'‰9Q-¹xÎ°Ö“"DôÏ{5”Èáì²ONXÓaLŠ¨@›œ@H±
&lá0¬Ï=cdDI$¢N5+ˆ‘ƒU¨ùğOÿ¨_°îL­ÈõŸ~ßßúĞßÉÈê•Å 5ªõ?Á¥*wu‹‹¢] 6(`Ó×ÊÍj±º0¥PÃÆ›äPq5wZÿLZ£Äf¤¡» à“PÙÄ}àyjŞ«ñUÖö±E;
ñ€¤Ş*?aÓæ®gqµ_Šèˆ¹“9u_?|Ap­¤YMsÌ6	DD—%ˆ"'™K›©•‡şL
…•‹¹ç+À˜¥8§Ç´œåaîeÏ|XöÑ`gƒ¥¸½ËjÛüŠÂŸÉû¸$‹‰KXàdfĞíÍ}0Ù;ÎU
1ı|dÉMşJ	t’Üß°±?òFsèm2º¨F4=úİ÷rñíEĞyºåíC˜…1Ÿ„)¤Äğúù\×‘yJ-DFv3×ˆÒw¿EÊÿ¬ÃÜ²9oı2·lÈ1x;õsÂöãôâê´™XÅ´Œè[¡sQ7>½?E3óÏjxµò	j*T( Fíñ	¬1_+°2©e8ŸV¥®¶r.GNì·µ6« ºu-6T@¯Ÿ×Ep3¥¦±ys¹yPË5Ó±yäï I«ñˆó(C‘¨h™ğ*°µ€9~Á´_ŠŒ.9)zz×s;ş}{m!÷äò«œ•&µïÌFZö±’^ÔGÃÖù¶¶YPìJ-¡ÊN´eÈğê×·J÷ÿAi$Tã+wnD÷ñƒˆ¹uùÅÉì6Â `óuÉ›9*Àù= {İĞ–Üä¨•’›‹§/»YÒ¤a|ClÄ©Ub“‚©¹3†0,3íº3³ZÄøqêÍW¨{(ËoXõÇôòÉpn¬½‘iğ¥ÍlĞ²BÜ%˜©ë…ßqo·Ä«š<zoz"Â!›bÃT»|{ùª@'›qxïxo[ô·DkÙ~·[î~,®àÖFŞ;	×.cÊ§EE¤“+Â‡l/ìd¤õQo›¢[õUã41‡·¥ÓŸc„&d3ÃÅ~°aE³.ñ_¬r¼
¼Êl" 6R#Èıš¯h§ÍÄ¼¯lÚ†ÉYß‚{´@Œœ²ùRíÌĞ`àï¸üv˜ô…ñíK<»3:H_¹B£¿›	ş4qĞ0O³ö«¬¿éj"	Íl60T–Ï\ß¬Vš•w;èûãG7<¢±7ëGÁÁ°3Ó@$‰dFê\›wÇYÓbøí«Í|µ¯ÁH¥‘%êÔäD–¸Ïû#-UøÌÂxl åW~»•*HlúX)Ä²Õé^Ûf®ƒZv>Ç˜¶è¸lF mµ#ûÄù´=¿Ü¶&;eÎ'ºv'ñóaÌ^hF²äzrÕeOÓñê{`•ã4s¾z‡õ”úËÏBƒ<ƒÏ_ïzY
`ËSK	Â­hr·ÇfeH™Ï0ôÎ¯lò7äÓX6ŠæGx)€C1dãâ…ş›cx'êY¦Øšk¸Ë,OˆŸóO‰lFÕµCšGY{-9áÄ’\;}Â)or¹Í‘&êováü1è¨cGUÊdâ«4Y™ô	ƒ~OoxÑ.¯”ÿäÌu°â¤;z‚‹o_zm‘‰R(Çw¾hìc0	ïÂg³I­¿ñ·4ÄúIJÓó¿WO²ª©”çmã¾v¹T|-«‘ºH˜”³<o;o…ñ-?5gÿ[Ê>¥ €şU(h¶TĞ4ïXÓ|lgu!£Î6’>÷ı¸*BövìFª[ ¿,O†İ~Kµ¸ÿ® QKùSXLo%liˆpµ46®jpqÕiÕWr·Ã†Ô›úæ“A&j1Ú#BzgYAÉaÅà¸;^…ù²JÌu¼,ÈpLÃ7eÉ{AbòÌÆMï$·2ö2ÍØ[Vm³n-©M¥§ápñwVĞÄ BÒ•<v`4YIµÕÛbgí5ÀDÚ .oÊ*¡,Í)Zw×²”—¿oLh@ÙkgQßÇÅŒ¹¹é–ë¸ÜHä–ØĞ9.9è}¦IVQ~C†šåÿûĞ®#ı -Qå€RBMgOåqü›Ö™E±MeªñamŠŸƒÈ0ø–ºfYû¤F>úÃ-§šì^«ErÀ<Fr2ud{|n#¸Ô_ÄÓ<=$äë0Lå²$¦È™d’…Ú[uûiKŒDE©*V`ĞŠó'¡+˜'ééÕìœì<£˜Ÿ^+,,q†ÁeÜÌ`¨t•‰İ™ıªQ	ò—)@xõÊÄ«&ø@À‡YO#°ÉÊ‡ÈÎ8ìpÍşM—DÖó–YÌ¯<h?w×øHg~üRIÅpŞÒ€pyÊŠ»®ùNõÑá•¨„A—°Å¶<Y*Wù9…j/F±Eˆ¥‹®eº°ÑG¦LA¤BéÉEBıE§ƒ£h›‚¿¥ukg¹„A2P]égIÑ¸bZPÇärİ_ğã|j­•úæ›éØyì2¶!èt%3gc¶ëšwÏy÷M#™Dq' /öi2îÀy1è«:kg{~æÿœí(~vŠ=ıæà‰]ßÛ"Ã_ô$‚lÕv83T¼ÿxÓ´ò7¿R²g=gà¶´Nn&±kJnäéX
qTÙ¬\~W™“9c!—' ¿‘Î3Û¨"<'\í®ÆÃú(Êİ9¥À²Œeé‚æ.}ä^É—$¨ò1ê½èp·LZ	ÙÜAì–ÈÌ§²=1e,^[5Ö1¾npâ±tºÀ¥©û‚~&yaz"[íò‰M±•ĞH'Ê›ßj7"A¾°°ZşñMæàİP¾W›3ú×ªêÖe&íwÔúo)²µ]ÃpNĞ½>;0ÿÜÏ,ºGËÜÚ6<†º•›FÉ·2*€f’>ÜH­†+ê’kì÷…;^¤­çq!“”™­õä4mÕM=€Æ„ƒ;ûJ1Ø$—«¾Ş9©ÍHÔùôŒyêBk =f3ÇÛ&†agÏ‘Ò ÂnÒr×¾ˆ€R5‚'}±Ç´â™êbWÈ^ûb[Ÿ÷Ÿû–ƒR^K³B÷Põøá5/îsW
^í. +êGwŸÕñŠ*÷?Çr éKI=ÔrŸpuÊ]eõêtL¸«®^·íİõ¤ñe;KÅbMLŸÂ´œ¸>g˜`GãÙ´YyäG›=™ĞÔÜ)X&‚>\[ŒW-_ützä
B¢8Á9AÕ¢a*B~"ßô¬ô­f$¥á=ßàÜ]Î³ıı	±â¿Á—cº*¿†ÀÇšû]ö} |ıòöê‹…æA^™`M¦Ä­€Ç~E¢øq²ãñã 0ı•÷>Ö kjæÏ›¬rÖ0–>Ûûf–ıXAl¡ID¾Æšâ,U·v! ŒF™Ódpì/ıÜÁ¤–œå–lx„°&¦dn±5 æ‡PÆ}+wÏ~ =F ¢º*™“ßdŠÃ±.@Œ¹…„1É¨YM{LpÆÆÅZ. 
ì˜Ä—~b)éË:áR§`|_eı+6ŞvÂŸêNõuÛÀ¨73NñŞÊuœ÷RP]À”m¼'L'oz§`ÈºĞ{©Çà-!î„‚Íµ÷µré·[&1énLnÛ]ê[P§Ø/¬¿Ü*õªF¥yœëÒzTíâ"3E]D›[åÓ\MÉ6ÑI<'m©gòì>‚‹GÂƒ‚€Ps¢‚ÄC·?Š2°½£ï	˜)‡Ó¶>ÿ$±ùå£lˆ^İtsÆk÷@H¦]+#[4tì3PÏNpÆ-z­ó’Ã{c­¥iÍ«©'õJ†H+«vè²ãYŸ¬òÅ^fø¨°_²É!~VS2ıí¯¼á¤„ÈşÊˆìmçúr#¥ë5ãvş¬ë÷à:4Fÿy¤ı¶:{8Í%0ß$å~n‡Fsˆâ¤üĞ¬–y.NŒU~L€¸[Ïc¬Z‘o&éàJ*è‰EıCÁõ\ıâSb°¿˜3·õDôë˜í	Ô”Fİ¹<.UåK-E>‹,Vd¶ºUYO©ZùŞ÷¼cV’Mƒ^S­¤	“¢®`ÓáH{©fíåPÖ¯ÆÃ7Y^3eû	ë°IdĞ­èEÛù½ZF6áxSrš¶Ú(D‘oôU¯XÈÈ?’¤bm|IN’Å»0=îşÇÛ0ÌÖiÜ ±7ËŠl¶o–«¸0å\”±5½è:\räY¯_Ù$Ñ§]ÌqôÖ‡é©Œõ±×‰šxõhN^Eå™Æ¼á*O5;zæRÈÎ‹DAŠ!S¤ÑF¦-'üÒªœ'^ÄE•ˆnÒÌÚhßO:%—Uüpêö•ÇÆzE}´ëŠ‡šL“¡ğ€ÊMdä…‚Éâ‰^ÏğI1DWÿ.¤ïÃ0 á©Ã·C¬§ù/—êaP¯íg?ºÑp°õöŸ|Jë/(<tHFYè\Ë¶¿ƒâÔÑ…u#ÜØ +zÓûoÀA×:†Á0–zC¿©)á-şd!%
‰–§äfDÎ«ÿh„vf£á2ßä«ÌZ
ÅG‹zk¾×ë›q±:e)÷ú8ª;W?Ãê‰×"îèåÈ¼zø£ĞÇ‘¹yI\áh˜‡5,Ş}J£¹K®P?½-®}mUZo œÂÈ›m¾¼Ğº€pI‚8w]|ŒÌ¤Da§=&+¯ñÆSõ6¾cU'Ÿ»wfNo½€{‚l™N„_ EŒØÚ›,AÀÚÒ…äåÅƒæ
[˜^ÓìÙñ<J<è4üÎYîÀ:,ñdL©«¾ZÇIÛm&–É–÷ílc ƒÈµ“k_|¥ºYnÂö•J–¶Z6Ê[Ğ+}(×-LxÓ›oœ^ĞYsx=f‡)Ü¸Qº*QBÙ&É9¤1Àq”‘xÈUB¼_ÅÑBc)·—MbiÈşâ§öL2EÈgµ<‹ùÉÎøÜ´£<ÁÛâÒÌåÜ*¨¹Ş;1€°4V!	h¨`:ªí¾F€ g÷h{ŒïK„b&^I_ª,h‰9÷¢vŠqÒCœU¢ªğwtn£,ó kç´#V%ôç…Ôõ"„(Ì#ÂkèÚ	7~İü»ëLíê)9úÈ+ç—«Ã(^ÂCìA_dl’×Z ¦~ M.=İÖíÎÚ4GÙA×ŠÒk@B…4ü3P6b“_Îã¼-¾{0Ë†lD' TÛÚş†b‹·,z7iú·K “Ç:Ùoz¾=Ö%†àGMz ÛlY³Zy`e À]R•WtMˆ›G&díúRFñşğû‚â)ï5;fl`ó¤µ6b[æhJ`%¤şjJN­ES}“rfM‚†(}lÜÍ,ô}ÅğÓX÷µƒÎÆûBŸ|€CÊ>«]}Ê[vú0»ü¤ùT;Ş"IİÜ<ÏÆë9ûå¦Å_öZ¨åÜ!7Òán³µ¨­ş½pıÛšXÅTDğD€âç"ù‹Iú(–©tZR	*²Ù dİ+Ó¥-@’áƒ½„;«¼g_e,Üìi‘ëÀÍX5×7(™äüò&w`wbá[qo!$²¹+ÍVmÉ9øˆó‰kH”h–›6º´”Äİ#©èØ¹†b.¼p‚ûµÔ\ğğC)³Ü3v[Ş¸‹QdCÿD÷^(j³³î÷ _Á%á	)&Šˆ”VKe|ï[!öE/åbHááR1$·Å‰RrXtT,3–Ú(qc“f%]—ØvÂÚqRãÃÓ4fˆ‚ü;Â¨Wj×TƒL­Ê•xöX%ëuìC½{·šør`ƒ
I&8jSQRÓCª(K«(qÈe0ÀS…Ncó„>\A£Mìñï"°¬´¼\¯õ¯K¬b˜ç•êØöÍâ|GUÊ1s€ë’­!]‹—üÏƒ!¦™‹”Õ:ÔĞÖ- ş°‡/õïó÷“nßÄpQ¶CìSë 4`çcÍ¦õH©ÿ í‰uâ³^¤JHpšrOäåğÖ—Ş®ÉIO;‡ƒ«;O6âã>'}¦;yäbºº
Iƒc¡´Pçëòlà¢D¤a×1÷Õm=+v7cIõ¶£±Ùˆ=­±* Twâ’eÆĞ#Ãtéà©yFoê[KCyˆXv
qåCM·a‘&åÔò˜J	Í<õr“£îj	ß!²„ÚÌ®Î×”9{’’l2DÙ\Âª/U-¡©·$"àš­Å~2¤ŸM’JQ{ov:xÂÌ¼¬@=‘Œ3Èhì×¶Tã¯.|,s£€0-B¸‰)Ô~Hş¥œha\:¶x¸h§24)t˜¤	–Ø™ûß™ÈÃó€‡_3                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           