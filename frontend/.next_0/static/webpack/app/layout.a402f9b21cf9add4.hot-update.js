code and will cause errors at runtime.
	 */
	emitOnErrors?: boolean;

	/**
	 * Also flag chunks as loaded which contain a subset of the modules.
	 */
	flagIncludedChunks?: boolean;

	/**
	 * Creates a module-internal dependency graph for top level symbols, exports and imports, to improve unused exports detection.
	 */
	innerGraph?: boolean;

	/**
	 * Rename exports when possible to generate shorter code (depends on optimization.usedExports and optimization.providedExports, true/"deterministic": generate short deterministic names optimized for caching, "size": generate the shortest possible names).
	 */
	mangleExports?: boolean | "deterministic" | "size";

	/**
	 * Reduce size of WASM by changing imports to shorter strings.
	 */
	mangleWasmImports?: boolean;

	/**
	 * Merge chunks which contain the same modules.
	 */
	mergeDuplicateChunks?: boolean;

	/**
	 * Enable minimizing the output. Uses optimization.minimizer.
	 */
	minimize?: boolean;

	/**
	 * Minimizer(s) to use for minimizing the output.
	 */
	minimizer?: (
		| undefined
		| null
		| false
		| ""
		| 0
		| ((this: Compiler, compiler: Compiler) => void)
		| WebpackPluginInstance
		| "..."
	)[];

	/**
	 * Define the algorithm to choose module ids (natural: numeric ids in order of usage, named: readable ids for better debugging, hashed: (deprecated) short hashes as ids for better long term caching, deterministic: numeric hash ids for better long term caching, size: numeric ids focused on minimal initial download size, false: no algorithm used, as custom one can be provided via plugin).
	 */
	moduleIds?: false | "natural" | "named" | "deterministic" | "size" | "hashed";

	/**
	 * Avoid emitting assets when errors occur (deprecated: use 'emitOnErrors' instead).
	 */
	noEmitOnErrors?: boolean;

	/**
	 * Set process.env.NODE_ENV to a specific value.
	 */
	nodeEnv?: string | false;

	/**
	 * Generate records with relative paths to be able to move the context folder.
	 */
	portableRecords?: boolean;

	/**
	 * Figure out which exports are provided by modules to generate more efficient code.
	 */
	providedExports?: boolean;

	/**
	 * Use real [contenthash] based on final content of the assets.
	 */
	realContentHash?: boolean;

	/**
	 * Removes modules from chunks when these modules are already included in all parents.
	 */
	removeAvailableModules?: boolean;

	/**
	 * Remove chunks which are empty.
	 */
	removeEmptyChunks?: boolean;

	/**
	 * Create an additional chunk which contains only the webpack runtime and chunk hash maps.
	 */
	runtimeChunk?:
		| boolean
		| "single"
		| "multiple"
		| {
				/**
				 * The name or name factory for the runtime chunks.
				 */
				name?: string | Function;
		  };

	/**
	 * Skip over modules which contain no side effects when exports are not used (false: disabled, 'flag': only use manually placed side effects flag, true: also analyse source code for side effects).
	 */
	sideEffects?: boolean | "flag";

	/**
	 * Optimize duplication and caching by splitting chunks by shared modules and cache group.
	 */
	splitChunks?: false | OptimizationSplitChunksOptions;

	/**
	 * Figure out which exports are used by modules to mangle export names, omit unused exports and generate more efficient code (true: analyse used exports for each runtime, "global": analyse exports globally for all runtimes combined).
	 */
	usedExports?: boolean | "global";
}

/**
 * Options object for describing behavior of a cache group selecting modules that should be cached together.
 */
declare interface OptimizationSplitChunksCacheGroup {
	/**
	 * Sets the name delimiter for created chunks.
	 */
	automaticNameDelimiter?: string;

	/**
	 * Select chunks for determining cache group content (defaults to "initial", "initial" and "all" requires adding these chunks to the HTML).
	 */
	chunks?: RegExp | "all" | "initial" | "async" | ((chunk: Chunk) => boolean);

	/**
	 * Ignore minimum size, minimum chunks and maximum requests and always create chunks for this cache group.
	 */
	enforce?: boolean;

	/**
	 * Size threshold at which splitting is enforced and other restrictions (minRemainingSize, maxAsyncRequests, maxInitialRequests) are ignored.
	 */
	enforceSizeThreshold?: number | { [index: string]: number };

	/**
	 * Sets the template for the filename for created chunks.
	 */
	filename?: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * Sets the hint for chunk id.
	 */
	idHint?: string;

	/**
	 * Assign modules to a cache group by module layer.
	 */
	layer?: string | Function | RegExp;

	/**
	 * Maximum number of requests which are accepted for on-demand loading.
	 */
	maxAsyncRequests?: number;

	/**
	 * Maximal size hint for the on-demand chunks.
	 */
	maxAsyncSize?: number | { [index: string]: number };

	/**
	 * Maximum number of initial chunks which are accepted for an entry point.
	 */
	maxInitialRequests?: number;

	/**
	 * Maximal size hint for the initial chunks.
	 */
	maxInitialSize?: number | { [index: string]: number };

	/**
	 * Maximal size hint for the created chunks.
	 */
	maxSize?: number | { [index: string]: number };

	/**
	 * Minimum number of times a module has to be duplicated until it's considered for splitting.
	 */
	minChunks?: number;

	/**
	 * Minimal size for the chunks the stay after moving the modules to a new chunk.
	 */
	minRemainingSize?: number | { [index: string]: number };

	/**
	 * Minimal size for the created chunk.
	 */
	minSize?: number | { [index: string]: number };

	/**
	 * Minimum size reduction due to the created chunk.
	 */
	minSizeReduction?: number | { [index: string]: number };

	/**
	 * Give chunks for this cache group a name (chunks with equal name are merged).
	 */
	name?: string | false | Function;

	/**
	 * Priority of this cache group.
	 */
	priority?: number;

	/**
	 * Try to reuse existing chunk (with name) when it has matching modules.
	 */
	reuseExistingChunk?: boolean;

	/**
	 * Assign modules to a cache group by module name.
	 */
	test?: string | Function | RegExp;

	/**
	 * Assign modules to a cache group by module type.
	 */
	type?: string | Function | RegExp;

	/**
	 * Compare used exports when checking common modules. Modules will only be put in the same chunk when exports are equal.
	 */
	usedExports?: boolean;
}

/**
 * Options object for splitting chunks into smaller chunks.
 */
declare interface OptimizationSplitChunksOptions {
	/**
	 * Sets the name delimiter for created chunks.
	 */
	automaticNameDelimiter?: string;

	/**
	 * Assign modules to a cache group (modules from different cache groups are tried to keep in separate chunks, default categories: 'default', 'defaultVendors').
	 */
	cacheGroups?: {
		[index: string]:
			| string
			| false
			| Function
			| RegExp
			| OptimizationSplitChunksCacheGroup;
	};

	/**
	 * Select chunks for determining shared modules (defaults to "async", "initial" and "all" requires adding these chunks to the HTML).
	 */
	chunks?: RegExp | "all" | "initial" | "async" | ((chunk: Chunk) => boolean);

	/**
	 * Sets the size types which are used when a number is used for sizes.
	 */
	defaultSizeTypes?: string[];

	/**
	 * Size threshold at which splitting is enforced and other restrictions (minRemainingSize, maxAsyncRequests, maxInitialRequests) are ignored.
	 */
	enforceSizeThreshold?: number | { [index: string]: number };

	/**
	 * Options for modules not selected by any other cache group.
	 */
	fallbackCacheGroup?: {
		/**
		 * Sets the name delimiter for created chunks.
		 */
		automaticNameDelimiter?: string;
		/**
		 * Select chunks for determining shared modules (defaults to "async", "initial" and "all" requires adding these chunks to the HTML).
		 */
		chunks?: RegExp | "all" | "initial" | "async" | ((chunk: Chunk) => boolean);
		/**
		 * Maximal size hint for the on-demand chunks.
		 */
		maxAsyncSize?: number | { [index: string]: number };
		/**
		 * Maximal size hint for the initial chunks.
		 */
		maxInitialSize?: number | { [index: string]: number };
		/**
		 * Maximal size hint for the created chunks.
		 */
		maxSize?: number | { [index: string]: number };
		/**
		 * Minimal size for the created chunk.
		 */
		minSize?: number | { [index: string]: number };
		/**
		 * Minimum size reduction due to the created chunk.
		 */
		minSizeReduction?: number | { [index: string]: number };
	};

	/**
	 * Sets the template for the filename for created chunks.
	 */
	filename?: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * Prevents exposing path info when creating names for parts splitted by maxSize.
	 */
	hidePathInfo?: boolean;

	/**
	 * Maximum number of requests which are accepted for on-demand loading.
	 */
	maxAsyncRequests?: number;

	/**
	 * Maximal size hint for the on-demand chunks.
	 */
	maxAsyncSize?: number | { [index: string]: number };

	/**
	 * Maximum number of initial chunks which are accepted for an entry point.
	 */
	maxInitialRequests?: number;

	/**
	 * Maximal size hint for the initial chunks.
	 */
	maxInitialSize?: number | { [index: string]: number };

	/**
	 * Maximal size hint for the created chunks.
	 */
	maxSize?: number | { [index: string]: number };

	/**
	 * Minimum number of times a module has to be duplicated until it's considered for splitting.
	 */
	minChunks?: number;

	/**
	 * Minimal size for the chunks the stay after moving the modules to a new chunk.
	 */
	minRemainingSize?: number | { [index: string]: number };

	/**
	 * Minimal size for the created chunks.
	 */
	minSize?: number | { [index: string]: number };

	/**
	 * Minimum size reduction due to the created chunk.
	 */
	minSizeReduction?: number | { [index: string]: number };

	/**
	 * Give chunks created a name (chunks with equal name are merged).
	 */
	name?: string | false | Function;

	/**
	 * Compare used exports when checking common modules. Modules will only be put in the same chunk when exports are equal.
	 */
	usedExports?: boolean;
}
declare interface Options {
	/**
	 * source
	 */
	source: string;

	/**
	 * absolute context path to which lib ident is relative to
	 */
	context: string;

	/**
	 * content
	 */
	content: DllReferencePluginOptionsContent;

	/**
	 * type
	 */
	type?: "object" | "require";

	/**
	 * extensions
	 */
	extensions?: string[];

	/**
	 * scope
	 */
	scope?: string;

	/**
	 * object for caching
	 */
	associatedObjectForCache?: object;
}
declare abstract class OptionsApply {
	process(
		options: WebpackOptionsNormalized,
		compiler: Compiler
	): WebpackOptionsNormalized;
}
declare interface OriginRecord {
	module: null | Module;
	loc: DependencyLocation;
	request: string;
}
declare class OriginalSource extends Source {
	constructor(source: string | Buffer, name: string);
	getName(): string;
}

/**
 * Options affecting the output of the compilation. `output` options tell webpack how to write the compiled files to disk.
 */
declare interface Output {
	/**
	 * Add a container for define/require functions in the AMD module.
	 */
	amdContainer?: string;

	/**
	 * The filename of asset modules as relative path inside the 'output.path' directory.
	 */
	assetModuleFilename?:
		| string
		| ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * Enable/disable creating async chunks that are loaded on demand.
	 */
	asyncChunks?: boolean;

	/**
	 * Add a comment in the UMD wrapper.
	 */
	auxiliaryComment?: string | LibraryCustomUmdCommentObject;

	/**
	 * Add charset attribute for script tag.
	 */
	charset?: boolean;

	/**
	 * Specifies the filename template of output files of non-initial chunks on disk. You must **not** specify an absolute path here, but the path may contain folders separated by '/'! The specified path is joined with the value of the 'output.path' option to determine the location on disk.
	 */
	chunkFilename?:
		| string
		| ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * The format of chunks (formats included by default are 'array-push' (web/WebWorker), 'commonjs' (node.js), 'module' (ESM), but others might be added by plugins).
	 */
	chunkFormat?: string | false;

	/**
	 * Number of milliseconds before chunk request expires.
	 */
	chunkLoadTimeout?: number;

	/**
	 * The method of loading chunks (methods included by default are 'jsonp' (web), 'import' (ESM), 'importScripts' (WebWorker), 'require' (sync node.js), 'async-node' (async node.js), but others might be added by plugins).
	 */
	chunkLoading?: string | false;

	/**
	 * The global variable used by webpack for loading of chunks.
	 */
	chunkLoadingGlobal?: string;

	/**
	 * Clean the output directory before emit.
	 */
	clean?: boolean | CleanOptions;

	/**
	 * Check if to be emitted file already exists and have the same content before writing to output filesystem.
	 */
	compareBeforeEmit?: boolean;

	/**
	 * This option enables cross-origin loading of chunks.
	 */
	crossOriginLoading?: false | "anonymous" | "use-credentials";

	/**
	 * Specifies the filename template of non-initial output css files on disk. You must **not** specify an absolute path here, but the path may contain folders separated by '/'! The specified path is joined with the value of the 'output.path' option to determine the location on disk.
	 */
	cssChunkFilename?:
		| string
		| ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * Specifies the filename template of output css files on disk. You must **not** specify an absolute path here, but the path may contain folders separated by '/'! The specified path is joined with the value of the 'output.path' option to determine the location on disk.
	 */
	cssFilename?:
		| string
		| ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * Similar to `output.devtoolModuleFilenameTemplate`, but used in the case of duplicate module identifiers.
	 */
	devtoolFallbackModuleFilenameTemplate?: string | Function;

	/**
	 * Filename template string of function for the sources array in a generated SourceMap.
	 */
	devtoolModuleFilenameTemplate?: string | Function;

	/**
	 * Module namespace to use when interpolating filename template string for the sources array in a generated SourceMap. Defaults to `output.library` if not set. It's useful for avoiding runtime collisions in sourcemaps from multiple webpack projects built as libraries.
	 */
	devtoolNamespace?: string;

	/**
	 * List of chunk loading types enabled for use by entry points.
	 */
	enabledChunkLoadingTypes?: string[];

	/**
	 * List of library types enabled for use by entry points.
	 */
	enabledLibraryTypes?: string[];

	/**
	 * List of wasm loading types enabled for use by entry points.
	 */
	enabledWasmLoadingTypes?: string[];

	/**
	 * The abilities of the environment where the webpack generated code should run.
	 */
	environment?: Environment;

	/**
	 * Specifies the filename of output files on disk. You must **not** specify an absolute path here, but the path may contain folders separated by '/'! The specified path is joined with the value of the 'output.path' option to determine the location on disk.
	 */
	filename?: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * An expression which is used to address the global object/scope in runtime code.
	 */
	globalObject?: string;

	/**
	 * Digest type used for the hash.
	 */
	hashDigest?: string;

	/**
	 * Number of chars which are used for the hash.
	 */
	hashDigestLength?: number;

	/**
	 * Algorithm used for generation the hash (see node.js crypto package).
	 */
	hashFunction?: string | typeof Hash;

	/**
	 * Any string which is added to the hash to salt it.
	 */
	hashSalt?: string;

	/**
	 * The filename of the Hot Update Chunks. They are inside the output.path directory.
	 */
	hotUpdateChunkFilename?: string;

	/**
	 * The global variable used by webpack for loading of hot update chunks.
	 */
	hotUpdateGlobal?: string;

	/**
	 * The filename of the Hot Update Main File. It is inside the 'output.path' directory.
	 */
	hotUpdateMainFilename?: string;

	/**
	 * Ignore warnings in the browser.
	 */
	ignoreBrowserWarnings?: boolean;

	/**
	 * Wrap javascript code into IIFE's to avoid leaking into global scope.
	 */
	iife?: boolean;

	/**
	 * The name of the native import() function (can be exchanged for a polyfill).
	 */
	importFunctionName?: string;

	/**
	 * The name of the native import.meta object (can be exchanged for a polyfill).
	 */
	importMetaName?: string;

	/**
	 * Make the output files a library, exporting the exports of the entry point.
	 */
	library?: string | string[] | LibraryOptions | LibraryCustomUmdObject;

	/**
	 * Specify which export should be exposed as library.
	 */
	libraryExport?: string | string[];

	/**
	 * Type of library (types included by default are 'var', 'module', 'assign', 'assign-properties', 'this', 'window', 'self', 'global', 'commonjs', 'commonjs2', 'commonjs-module', 'commonjs-static', 'amd', 'amd-require', 'umd', 'umd2', 'jsonp', 'system', but others might be added by plugins).
	 */
	libraryTarget?: string;

	/**
	 * Output javascript files as module source type.
	 */
	module?: boolean;

	/**
	 * The output directory as **absolute path** (required).
	 */
	path?: string;

	/**
	 * Include comments with information about the modules.
	 */
	pathinfo?: boolean | "verbose";

	/**
	 * The 'publicPath' specifies the public URL address of the output files when referenced in a browser.
	 */
	publicPath?: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * This option enables loading async chunks via a custom script type, such as script type="module".
	 */
	scriptType?: false | "module" | "text/javascript";

	/**
	 * The filename of the SourceMaps for the JavaScript files. They are inside the 'output.path' directory.
	 */
	sourceMapFilename?: string;

	/**
	 * Prefixes every line of the source in the bundle with this string.
	 */
	sourcePrefix?: string;

	/**
	 * Handles error in module loading correctly at a performance cost. This will handle module error compatible with the EcmaScript Modules spec.
	 */
	strictModuleErrorHandling?: boolean;

	/**
	 * Handles exceptions in module loading correctly at a performance cost (Deprecated). This will handle module error compatible with the Node.js CommonJS way.
	 */
	strictModuleExceptionHandling?: boolean;

	/**
	 * Use a Trusted Types policy to create urls for chunks. 'output.uniqueName' is used a default policy name. Passing a string sets a custom policy name.
	 */
	trustedTypes?: string | true | TrustedTypes;

	/**
	 * If `output.libraryTarget` is set to umd and `output.library` is set, setting this to true will name the AMD module.
	 */
	umdNamedDefine?: boolean;

	/**
	 * A unique name of the webpack build to avoid multiple webpack runtimes to conflict when using globals.
	 */
	uniqueName?: string;

	/**
	 * The method of loading WebAssembly Modules (methods included by default are 'fetch' (web/WebWorker), 'async-node' (node.js), but others might be added by plugins).
	 */
	wasmLoading?: string | false;

	/**
	 * The filename of WebAssembly modules as relative path inside the 'output.path' directory.
	 */
	webassemblyModuleFilename?: string;

	/**
	 * The method of loading chunks (methods included by default are 'jsonp' (web), 'import' (ESM), 'importScripts' (WebWorker), 'require' (sync node.js), 'async-node' (async node.js), but others might be added by plugins).
	 */
	workerChunkLoading?: string | false;

	/**
	 * Worker public path. Much like the public path, this sets the location where the worker script file is intended to be found. If not set, webpack will use the publicPath. Don't set this option unless your worker scripts are located at a different path from your other script files.
	 */
	workerPublicPath?: string;

	/**
	 * The method of loading WebAssembly Modules (methods included by default are 'fetch' (web/WebWorker), 'async-node' (node.js), but others might be added by plugins).
	 */
	workerWasmLoading?: string | false;
}
declare interface OutputFileSystem {
	writeFile: WriteFile;
	mkdir: Mkdir;
	readdir?: ReaddirFs;
	rmdir?: Rmdir;
	unlink?: (
		arg0: PathLikeFs,
		arg1: (arg0: null | NodeJS.ErrnoException) => void
	) => void;
	stat: StatFs;
	lstat?: LStatFs;
	readFile: ReadFileFs;
	join?: (arg0: string, arg1: string) => string;
	relative?: (arg0: string, arg1: string) => string;
	dirname?: (arg0: string) => string;
}

/**
 * Normalized options affecting the output of the compilation. `output` options tell webpack how to write the compiled files to disk.
 */
declare interface OutputNormalized {
	/**
	 * The filename of asset modules as relative path inside the 'output.path' directory.
	 */
	assetModuleFilename?:
		| string
		| ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * Enable/disable creating async chunks that are loaded on demand.
	 */
	asyncChunks?: boolean;

	/**
	 * Add charset attribute for script tag.
	 */
	charset?: boolean;

	/**
	 * Specifies the filename template of output files of non-initial chunks on disk. You must **not** specify an absolute path here, but the path may contain folders separated by '/'! The specified path is joined with the value of the 'output.path' option to determine the location on disk.
	 */
	chunkFilename?:
		| string
		| ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * The format of chunks (formats included by default are 'array-push' (web/WebWorker), 'commonjs' (node.js), 'module' (ESM), but others might be added by plugins).
	 */
	chunkFormat?: string | false;

	/**
	 * Number of milliseconds before chunk request expires.
	 */
	chunkLoadTimeout?: number;

	/**
	 * The method of loading chunks (methods included by default are 'jsonp' (web), 'import' (ESM), 'importScripts' (WebWorker), 'require' (sync node.js), 'async-node' (async node.js), but others might be added by plugins).
	 */
	chunkLoading?: string | false;

	/**
	 * The global variable used by webpack for loading of chunks.
	 */
	chunkLoadingGlobal?: string;

	/**
	 * Clean the output directory before emit.
	 */
	clean?: boolean | CleanOptions;

	/**
	 * Check if to be emitted file already exists and have the same content before writing to output filesystem.
	 */
	compareBeforeEmit?: boolean;

	/**
	 * This option enables cross-origin loading of chunks.
	 */
	crossOriginLoading?: false | "anonymous" | "use-credentials";

	/**
	 * Specifies the filename template of non-initial output css files on disk. You must **not** specify an absolute path here, but the path may contain folders separated by '/'! The specified path is joined with the value of the 'output.path' option to determine the location on disk.
	 */
	cssChunkFilename?:
		| string
		| ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * Specifies the filename template of output css files on disk. You must **not** specify an absolute path here, but the path may contain folders separated by '/'! The specified path is joined with the value of the 'output.path' option to determine the location on disk.
	 */
	cssFilename?:
		| string
		| ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * Similar to `output.devtoolModuleFilenameTemplate`, but used in the case of duplicate module identifiers.
	 */
	devtoolFallbackModuleFilenameTemplate?: string | Function;

	/**
	 * Filename template string of function for the sources array in a generated SourceMap.
	 */
	devtoolModuleFilenameTemplate?: string | Function;

	/**
	 * Module namespace to use when interpolating filename template string for the sources array in a generated SourceMap. Defaults to `output.library` if not set. It's useful for avoiding runtime collisions in sourcemaps from multiple webpack projects built as libraries.
	 */
	devtoolNamespace?: string;

	/**
	 * List of chunk loading types enabled for use by entry points.
	 */
	enabledChunkLoadingTypes: string[];

	/**
	 * List of library types enabled for use by entry points.
	 */
	enabledLibraryTypes: string[];

	/**
	 * List of wasm loading types enabled for use by entry points.
	 */
	enabledWasmLoadingTypes: string[];

	/**
	 * The abilities of the environment where the webpack generated code should run.
	 */
	environment: Environment;

	/**
	 * Specifies the filename of output files on disk. You must **not** specify an absolute path here, but the path may contain folders separated by '/'! The specified path is joined with the value of the 'output.path' option to determine the location on disk.
	 */
	filename?: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * An expression which is used to address the global object/scope in runtime code.
	 */
	globalObject?: string;

	/**
	 * Digest type used for the hash.
	 */
	hashDigest?: string;

	/**
	 * Number of chars which are used for the hash.
	 */
	hashDigestLength?: number;

	/**
	 * Algorithm used for generation the hash (see node.js crypto package).
	 */
	hashFunction?: string | typeof Hash;

	/**
	 * Any string which is added to the hash to salt it.
	 */
	hashSalt?: string;

	/**
	 * The filename of the Hot Update Chunks. They are inside the output.path directory.
	 */
	hotUpdateChunkFilename?: string;

	/**
	 * The global variable used by webpack for loading of hot update chunks.
	 */
	hotUpdateGlobal?: string;

	/**
	 * The filename of the Hot Update Main File. It is inside the 'output.path' directory.
	 */
	hotUpdateMainFilename?: string;

	/**
	 * Ignore warnings in the browser.
	 */
	ignoreBrowserWarnings?: boolean;

	/**
	 * Wrap javascript code into IIFE's to avoid leaking into global scope.
	 */
	iife?: boolean;

	/**
	 * The name of the native import() function (can be exchanged for a polyfill).
	 */
	importFunctionName?: string;

	/**
	 * The name of the native import.meta object (can be exchanged for a polyfill).
	 */
	importMetaName?: string;

	/**
	 * Options for library.
	 */
	library?: LibraryOptions;

	/**
	 * Output javascript files as module source type.
	 */
	module?: boolean;

	/**
	 * The output directory as **absolute path** (required).
	 */
	path?: string;

	/**
	 * Include comments with information about the modules.
	 */
	pathinfo?: boolean | "verbose";

	/**
	 * The 'publicPath' specifies the public URL address of the output files when referenced in a browser.
	 */
	publicPath?: string | ((pathData: PathData, assetInfo?: AssetInfo) => string);

	/**
	 * This option enables loading async chunks via a custom script type, such as script type="module".
	 */
	scriptType?: false | "module" | "text/javascript";

	/**
	 * The filename of the SourceMaps for the JavaScript files. They are inside the 'output.path' directory.
	 */
	sourceMapFilename?: string;

	/**
	 * Prefixes every line of the source in the bundle with this string.
	 */
	sourcePrefix?: string;

	/**
	 * Handles error in module loading correctly at a performance cost. This will handle module error compatible with the EcmaScript Modules spec.
	 */
	strictModuleErrorHandling?: boolean;

	/**
	 * Handles exceptions in module loading correctly at a performance cost (Deprecated). This will handle module error compatible with the Node.js CommonJS way.
	 */
	strictModuleExceptionHandling?: boolean;

	/**
	 * Use a Trusted Types policy to create urls for chunks.
	 */
	trustedTypes?: TrustedTypes;

	/**
	 * A unique name of the webpack build to avoid multiple webpack runtimes to conflict when using globals.
	 */
	uniqueName?: string;

	/**
	 * The method of loading WebAssembly Modules (methods included by default are 'fetch' (web/WebWorker), 'async-node' (node.js), but others might be added by plugins).
	 */
	wasmLoading?: string | false;

	/**
	 * The filename of WebAssembly modules as relative path inside the 'output.path' directory.
	 */
	webassemblyModuleFilename?: string;

	/**
	 * The method of loading chunks (methods included by default are 'jsonp' (web), 'import' (ESM), 'importScripts' (WebWorker), 'require' (sync node.js), 'async-node' (async node.js), but others might be added by plugins).
	 */
	workerChunkLoading?: string | false;

	/**
	 * Worker public path. Much like the public path, this sets the location where the worker script file is intended to be found. If not set, webpack will use the publicPath. Don't set this option unless your worker scripts are located at a different path from your other script files.
	 */
	workerPublicPath?: string;

	/**
	 * The method of loading WebAssembly Modules (methods included by default are 'fetch' (web/WebWorker), 'async-node' (node.js), but others might be added by plugins).
	 */
	workerWasmLoading?: string | false;
}
declare interface ParameterizedComparator<TArg, T> {
	(arg0: TArg): Comparator<T>;
}
declare interface ParsedIdentifier {
	request: string;
	query: string;
	fragment: string;
	directory: boolean;
	module: boolean;
	file: boolean;
	internal: boolean;
}
declare class Parser {
	constructor();
	parse(
		source: string | Buffer | PreparsedAst,
		state: ParserState
	): ParserState;
}
declare interface ParserOptions {
	[index: string]: any;
}
type ParserOptionsByModuleType = ParserOptionsByModuleTypeKnown &
	ParserOptionsByModuleTypeUnknown;

/**
 * Specify options for each parser.
 */
declare interface ParserOptionsByModuleTypeKnown {
	/**
	 * Parser options for asset modules.
	 */
	asset?: AssetParserOptions;

	/**
	 * No parser options are supported for this module type.
	 */
	"asset/inline"?: EmptyParserOptions;

	/**
	 * No parser options are supported for this module type.
	 */
	"asset/resource"?: EmptyParserOptions;

	/**
	 * No parser options are supported for this module type.
	 */
	"asset/source"?: EmptyParserOptions;

	/**
	 * Parser options for css modules.
	 */
	css?: CssParserOptions;

	/**
	 * Parser options for css/auto modules.
	 */
	"css/auto"?: CssAutoParserOptions;

	/**
	 * Parser options for css/global modules.
	 */
	"css/global"?: CssGlobalParserOptions;

	/**
	 * Parser options for css/module modules.
	 */
	"css/module"?: CssModuleParserOptions;

	/**
	 * Parser options for javascript modules.
	 */
	javascript?: JavascriptParserOptions;

	/**
	 * Parser options for javascript modules.
	 */
	"javascript/auto"?: JavascriptParserOptions;

	/**
	 * Parser options for javascript modules.
	 */
	"javascript/dynamic"?: JavascriptParserOptions;

	/**
	 * Parser options for javascript modules.
	 */
	"javascript/esm"?: JavascriptParserOptions;
}

/**
 * Specify options for each parser.
 */
declare interface ParserOptionsByModuleTypeUnknown {
	[index: string]: { [index: string]: any };
}
type ParserState = Record<string, any> & ParserStateBase;
declare interface ParserStateBase {
	source: string | Buffer;
	current: NormalModule;
	module: NormalModule;
	compilation: Compilation;
	options: { [index: string]: any };
}
declare interface PathData {
	chunkGraph?: ChunkGraph;
	hash?: string;
	hashWithLength?: (arg0: number) => string;
	chunk?: Chunk | ChunkPathData;
	module?: Module | ModulePathData;
	runtime?: RuntimeSpec;
	filename?: string;
	basename?: string;
	query?: string;
	contentHashType?: string;
	contentHash?: string;
	contentHashWithLength?: (arg0: number) => string;
	noChunkHash?: boolean;
	url?: string;
}
type PathLikeFs = string | Buffer | URL;
type PathLikeTypes = string | Buffer | URL_url;
type PathOrFileDescriptorFs = string | number | Buffer | URL;
type PathOrFileDescriptorTypes = string | number | Buffer | URL_url;
type Pattern =
	| Identifier
	| MemberExpression
	| ObjectPattern
	| ArrayPattern
	| RestElement
	| AssignmentPattern;

/**
 * Configuration object for web performance recommendations.
 */
declare interface PerformanceOptions {
	/**
	 * Filter function to select assets that are checked.
	 */
	assetFilter?: Function;

	/**
	 * Sets the format of the hints: warnings, errors or nothing at all.
	 */
	hints?: false | "error" | "warning";

	/**
	 * File size limit (in bytes) when exceeded, that webpack will provide performance hints.
	 */
	maxAssetSize?: number;

	/**
	 * Total size of an entry point (in bytes).
	 */
	maxEntrypointSize?: number;
}
declare interface PitchLoaderDefinitionFunction<
	OptionsType = {},
	ContextAdditions = {}
> {
	(
		this: NormalModuleLoaderContext<OptionsType> &
			LoaderRunnerLoaderContext<OptionsType> &
			LoaderPluginLoaderContext &
			HotModuleReplacementPluginLoaderContext &
			ContextAdditions,
		remainingRequest: string,
		previousRequest: string,
		data: object
	): string | void | Buffer | Promise<string | Buffer>;
}
declare class PlatformPlugin {
	constructor(platform: Partial<PlatformTargetProperties>);
	platform: Partial<PlatformTargetProperties>;

	/**
	 * Apply the plugin
	 */
	apply(compiler: Compiler): void;
}
declare interface PlatformTargetProperties {
	/**
	 * web platform, importing of http(s) and std: is available
	 */
	web: null | boolean;

	/**
	 * browser platform, running in a normal web browser
	 */
	browser: null | boolean;

	/**
	 * (Web)Worker platform, running in a web/shared/service worker
	 */
	webworker: null | boolean;

	/**
	 * node platform, require of node built-in modules is available
	 */
	node: null | boolean;

	/**
	 * nwjs platform, require of legacy nw.gui is available
	 */
	nwjs: null | boolean;

	/**
	 * electron platform, require of some electron built-in modules is available
	 */
	electron: null | boolean;
}
type Plugin =
	| undefined
	| null
	| false
	| ""
	| 0
	| { apply: (arg0: Resolver) => void }
	| ((this: Resolver, arg1: Resolver) => void);
declare interface PnpApi {
	resolveToUnqualified: (
		arg0: string,
		arg1: string,
		arg2: object
	) => null | string;
}
declare class PrefetchPlugin {
	constructor(context: string, request?: string);
	context: null | string;
	request: string;

	/**
	 * Apply the plugin
	 */
	apply(compiler: Compiler): void;
}
declare class PrefixSource extends Source {
	constructor(prefix: string, source: string | Source);
	original(): Source;
	getPrefix(): string;
}
declare interface PreparsedAst {
	[index: string]: any;
}
declare interface PrintedElement {
	element: string;
	content: string;
}
declare interface Problem {
	type: ProblemType;
	path: string;
	argument: string;
	value?: any;
	index?: number;
	expected?: string;
}
type ProblemType =
	| "unknown-argument"
	| "unexpected-non-array-in-path"
	| "unexpected-non-object-in-path"
	| "multiple-values-unexpected"
	| "invalid-value";
declare interface ProcessAssetsAdditionalOptions {
	additionalAssets?: true | Function;
}
declare class Profiler {
	constructor(inspector?: any);
	session: any;
	inspector: any;
	hasSession(): boolean;
	startProfiling(): Promise<void> | Promise<[any, any, any]>;
	sendCommand(method: string, params?: object): Promise<any>;
	destroy(): Promise<void>;
	stopProfiling(): Promise<{ profile: any }>;
}
declare class ProfilingPlugin {
	constructor(options?: ProfilingPluginOptions);
	outputPath: string;

	/**
	 * Apply the plugin
	 */
	apply(compiler: Compiler): void;
	static Profiler: typeof Profiler;
}
declare interface ProfilingPluginOptions {
	/**
	 * Path to the output file e.g. `path.resolve(__dirname, 'profiling/events.json')`. Defaults to `events.json`.
	 */
	outputPath?: string;
}
declare class ProgressPlugin {
	constructor(options?: ProgressPluginArgument);
	profile?: null | boolean;
	handler?: (percentage: number, msg: string, ...args: string[]) => void;
	modulesCount?: number;
	dependenciesCount?: number;
	showEntries?: boolean;
	showModules?: boolean;
	showDependencies?: boolean;
	showActiveModules?: boolean;
	percentBy?: null | "entries" | "modules" | "dependencies";
	apply(compiler: Compiler | MultiCompiler): void;
	static getReporter(
		compiler: Compiler
	): undefined | ((p: number, ...args: string[]) => void);
	static defaultOptions: {
		profile: boolean;
		modulesCount: number;
		dependenciesCount: number;
		modules: boolean;
		dependencies: boolean;
		activeModules: boolean;
		entries: boolean;
	};
	static createDefaultHandler: (
		profile: undefined | null | boolean,
		logger: WebpackLogger
	) => (percentage: number, msg: string, ...args: string[]) => void;
}
type ProgressPluginArgument =
	| ProgressPluginOptions
	| ((percentage: number, msg: string, ...args: string[]) => void);

/**
 * Options object for the ProgressPlugin.
 */
declare interface ProgressPluginOptions {
	/**
	 * Show active modules count and one active module in progress message.
	 */
	activeModules?: boolean;

	/**
	 * Show dependencies count in progress message.
	 */
	dependencies?: boolean;

	/**
	 * Minimum dependencies count to start with. For better progress calculation. Default: 10000.
	 */
	dependenciesCount?: number;

	/**
	 * Show entries count in progress message.
	 */
	entries?: boolean;

	/**
	 * Function that executes for every progress step.
	 */
	handler?: (percentage: number, msg: string, ...args: string[]) => void;

	/**
	 * Show modules count in progress message.
	 */
	modules?: boolean;

	/**
	 * Minimum modules count to start with. For better progress calculation. Default: 5000.
	 */
	modulesCount?: number;

	/**
	 * Collect percent algorithm. By default it calculates by a median from modules, entries and dependencies percent.
	 */
	percentBy?: null | "entries" | "modules" | "dependencies";

	/**
	 * Collect profile data for progress steps. Default: false.
	 */
	profile?: null | boolean;
}
declare class ProvidePlugin {
	constructor(definitions: Record<string, string | string[]>);
	definitions: Record<string, string | string[]>;

	/**
	 * Apply the plugin
	 */
	apply(compiler: Compiler): void;
}
declare class ProvideSharedPlugin {
	constructor(options: ProvideSharedPluginOptions);

	/**
	 * Apply the plugin
	 */
	apply(compiler: Compiler): void;
}
declare interface ProvideSharedPluginOptions {
	/**
	 * Modules that should be provided as shared modules to the share scope. When provided, property name is used to match modules, otherwise this is automatically inferred from share key.
	 */
	provides: Provides;

	/**
	 * Share scope name used for all provided modules (defaults to 'default').
	 */
	shareScope?: string;
}
type Provides = (string | ProvidesObject)[] | ProvidesObject;

/**
 * Advanced configuration for modules that should be provided as shared modules to the share scope.
 */
declare interface ProvidesConfig {
	/**
	 * Include the provided module directly instead behind an async request. This allows to use this shared module in initial load too. All possible shared modules need to be eager too.
	 */
	eager?: boolean;

	/**
	 * Key in the share scope under which the shared modules should be stored.
	 */
	shareKey?: string;

	/**
	 * Share scope name.
	 */
	shareScope?: string;

	/**
	 * Version of the provided module. Will replace lower matching versions, but not higher.
	 */
	version?: string | false;
}

/**
 * Modules that should be provided as shared modules to the share scope. Property names are used as share keys.
 */
declare interface ProvidesObject {
	[index: string]: string | ProvidesConfig;
}
declare interface RawChunkGroupOptions {
	preloadOrder?: number;
	prefetchOrder?: number;
	fetchPriority?: "auto" | "low" | "high";
}
type RawLoaderDefinition<
	OptionsType = {},
	ContextAdditions = {}
> = RawLoaderDefinitionFunction<OptionsType, ContextAdditions> & {
	raw: true;
	pitch?: PitchLoaderDefinitionFunction<OptionsType, ContextAdditions>;
};
declare interface RawLoaderDefinitionFunction<
	OptionsType = {},
	ContextAdditions = {}
> {
	(
		this: NormalModuleLoaderContext<OptionsType> &
			LoaderRunnerLoaderContext<OptionsType> &
			LoaderPluginLoaderContext &
			HotModuleReplacementPluginLoaderContext &
			ContextAdditions,
		content: Buffer,
		sourceMap?: string | SourceMap,
		additionalData?: AdditionalData
	): string | void | Buffer | Promise<string | Buffer>;
}
declare class RawSource extends Source {
	constructor(source: string | Buffer, convertToString?: boolean);
	isBuffer(): boolean;
}
declare interface RawSourceMap {
	version: number;
	sources: string[];
	names: string[];
	sourceRoot?: string;
	sourcesContent?: string[];
	mappings: string;
	file: string;
}
declare interface Read<TBuffer extends ArrayBufferView = Buffer> {
	(
		fd: number,
		buffer: TBuffer,
		offset: number,
		length: number,
		position: null | number | bigint,
		callback: (
			err: null | NodeJS.ErrnoException,
			bytesRead: number,
			buffer: TBuffer
		) => void
	): void;
	(
		fd: number,
		options: ReadAsyncOptions<TBuffer>,
		callback: (
			err: null | NodeJS.ErrnoException,
			bytesRead: number,
			buffer: TBuffer
		) => void
	): void;
	(
		fd: number,
		callback: (
			err: null | NodeJS.ErrnoException,
			bytesRead: number,
			buffer: ArrayBufferView
		) => void
	): void;
}
declare interface ReadAsyncOptions<TBuffer extends ArrayBufferView> {
	offset?: number;
	length?: number;
	position?: null | number | bigint;
	buffer?: TBuffer;
}
declare class ReadFileCompileAsyncWasmPlugin {
	constructor(__0?: ReadFileCompileAsyncWasmPluginOptions);

	/**
	 * Apply the plugin
	 */
	apply(compiler: Compiler): void;
}
declare interface ReadFileCompileAsyncWasmPluginOptions {
	/**
	 * use import?
	 */
	import?: boolean;
}
declare class ReadFileCompileWasmPlugin {
	constructor(options?: ReadFileCompileWasmPluginOptions);
	options: ReadFileCompileWasmPluginOptions;

	/**
	 * Apply the plugin
	 */
	apply(compiler: Compiler): void;
}
declare interface ReadFileCompileWasmPluginOptions {
	/**
	 * mangle imports
	 */
	mangleImports?: boolean;

	/**
	 * use import?
	 */
	import?: boolean;
}
declare interface ReadFileFs {
	(
		path: PathOrFileDescriptorFs,
		options:
			| undefined
			| null
			| ({ encoding?: null; flag?: string } & Abortable),
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Buffer) => void
	): void;
	(
		path: PathOrFileDescriptorFs,
		options:
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| ({ encoding: BufferEncoding; flag?: string } & Abortable)
			| "base64"
			| "base64url"
			| "hex",
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string) => void
	): void;
	(
		path: PathOrFileDescriptorFs,
		options:
			| undefined
			| null
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| (ObjectEncodingOptions & { flag?: string } & Abortable),
		callback: (
			arg0: null | NodeJS.ErrnoException,
			arg1?: string | Buffer
		) => void
	): void;
	(
		path: PathOrFileDescriptorFs,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Buffer) => void
	): void;
}
declare interface ReadFileSync {
	(
		path: PathOrFileDescriptorFs,
		options?: null | { encoding?: null; flag?: string }
	): Buffer;
	(
		path: PathOrFileDescriptorFs,
		options:
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| { encoding: BufferEncoding; flag?: string }
	): string;
	(
		path: PathOrFileDescriptorFs,
		options?:
			| null
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| (ObjectEncodingOptions & { flag?: string })
	): string | Buffer;
}
declare interface ReadFileTypes {
	(
		path: PathOrFileDescriptorTypes,
		options:
			| undefined
			| null
			| ({ encoding?: null; flag?: string } & Abortable),
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Buffer) => void
	): void;
	(
		path: PathOrFileDescriptorTypes,
		options:
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| ({ encoding: BufferEncoding; flag?: string } & Abortable),
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string) => void
	): void;
	(
		path: PathOrFileDescriptorTypes,
		options:
			| undefined
			| null
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| (ObjectEncodingOptions & { flag?: string } & Abortable),
		callback: (
			arg0: null | NodeJS.ErrnoException,
			arg1?: string | Buffer
		) => void
	): void;
	(
		path: PathOrFileDescriptorTypes,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Buffer) => void
	): void;
}
declare interface ReaddirFs {
	(
		path: PathLikeFs,
		options:
			| undefined
			| null
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| {
					encoding:
						| null
						| "ascii"
						| "utf8"
						| "utf-8"
						| "utf16le"
						| "utf-16le"
						| "ucs2"
						| "ucs-2"
						| "latin1"
						| "binary"
						| "base64"
						| "base64url"
						| "hex";
					withFileTypes?: false;
					recursive?: boolean;
			  },
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string[]) => void
	): void;
	(
		path: PathLikeFs,
		options:
			| "buffer"
			| { encoding: "buffer"; withFileTypes?: false; recursive?: boolean },
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Buffer[]) => void
	): void;
	(
		path: PathLikeFs,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string[]) => void
	): void;
	(
		path: PathLikeFs,
		options:
			| undefined
			| null
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| (ObjectEncodingOptions & {
					withFileTypes?: false;
					recursive?: boolean;
			  }),
		callback: (
			arg0: null | NodeJS.ErrnoException,
			arg1?: string[] | Buffer[]
		) => void
	): void;
	(
		path: PathLikeFs,
		options: ObjectEncodingOptions & {
			withFileTypes: true;
			recursive?: boolean;
		},
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Dirent[]) => void
	): void;
}
declare interface ReaddirSync {
	(
		path: PathLikeFs,
		options?:
			| null
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| {
					encoding:
						| null
						| "ascii"
						| "utf8"
						| "utf-8"
						| "utf16le"
						| "utf-16le"
						| "ucs2"
						| "ucs-2"
						| "latin1"
						| "binary"
						| "base64"
						| "base64url"
						| "hex";
					withFileTypes?: false;
					recursive?: boolean;
			  }
	): string[];
	(
		path: PathLikeFs,
		options:
			| "buffer"
			| { encoding: "buffer"; withFileTypes?: false; recursive?: boolean }
	): Buffer[];
	(
		path: PathLikeFs,
		options?:
			| null
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| (ObjectEncodingOptions & { withFileTypes?: false; recursive?: boolean })
	): string[] | Buffer[];
	(
		path: PathLikeFs,
		options: ObjectEncodingOptions & {
			withFileTypes: true;
			recursive?: boolean;
		}
	): Dirent[];
}
declare interface ReaddirTypes {
	(
		path: PathLikeTypes,
		options:
			| undefined
			| null
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| {
					encoding:
						| null
						| "ascii"
						| "utf8"
						| "utf-8"
						| "utf16le"
						| "utf-16le"
						| "ucs2"
						| "ucs-2"
						| "latin1"
						| "binary"
						| "base64"
						| "base64url"
						| "hex";
					withFileTypes?: false;
					recursive?: boolean;
			  },
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string[]) => void
	): void;
	(
		path: PathLikeTypes,
		options:
			| "buffer"
			| { encoding: "buffer"; withFileTypes?: false; recursive?: boolean },
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Buffer[]) => void
	): void;
	(
		path: PathLikeTypes,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string[]) => void
	): void;
	(
		path: PathLikeTypes,
		options:
			| undefined
			| null
			| "ascii"
			| "utf8"
			| "utf-8"
			| "utf16le"
			| "utf-16le"
			| "ucs2"
			| "ucs-2"
			| "latin1"
			| "binary"
			| "base64"
			| "base64url"
			| "hex"
			| (ObjectEncodingOptions & {
					withFileTypes?: false;
					recursive?: boolean;
			  }),
		callback: (
			arg0: null | NodeJS.ErrnoException,
			arg1?: string[] | Buffer[]
		) => void
	): void;
	(
		path: PathLikeTypes,
		options: ObjectEncodingOptions & {
			withFileTypes: true;
			recursive?: boolean;
		},
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Dirent[]) => void
	): void;
}
declare interface ReadlinkFs {
	(
		path: PathLikeFs,
		options: EncodingOption,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string) => void
	): void;
	(
		path: PathLikeFs,
		options: BufferEncodingOption,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Buffer) => void
	): void;
	(
		path: PathLikeFs,
		options: EncodingOption,
		callback: (
			arg0: null | NodeJS.ErrnoException,
			arg1?: string | Buffer
		) => void
	): void;
	(
		path: PathLikeFs,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string) => void
	): void;
}
declare interface ReadlinkSync {
	(path: PathLikeFs, options?: EncodingOption): string;
	(path: PathLikeFs, options: BufferEncodingOption): Buffer;
	(path: PathLikeFs, options?: EncodingOption): string | Buffer;
}
declare interface ReadlinkTypes {
	(
		path: PathLikeTypes,
		options: EncodingOption,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string) => void
	): void;
	(
		path: PathLikeTypes,
		options: BufferEncodingOption,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Buffer) => void
	): void;
	(
		path: PathLikeTypes,
		options: EncodingOption,
		callback: (
			arg0: null | NodeJS.ErrnoException,
			arg1?: string | Buffer
		) => void
	): void;
	(
		path: PathLikeTypes,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string) => void
	): void;
}
declare class RealContentHashPlugin {
	constructor(__0: {
		/**
		 * the hash function to use
		 */
		hashFunction: string | typeof Hash;
		/**
		 * the hash digest to use
		 */
		hashDigest: string;
	});

	/**
	 * Apply the plugin
	 */
	apply(compiler: Compiler): void;
	static getCompilationHooks(
		compilation: Compilation
	): CompilationHooksRealContentHashPlugin;
}
declare interface RealDependencyLocation {
	start: SourcePosition;
	end?: SourcePosition;
	index?: number;
}
declare interface RealPathFs {
	(
		path: PathLikeFs,
		options: EncodingOption,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string) => void
	): void;
	(
		path: PathLikeFs,
		options: BufferEncodingOption,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Buffer) => void
	): void;
	(
		path: PathLikeFs,
		options: EncodingOption,
		callback: (
			arg0: null | NodeJS.ErrnoException,
			arg1?: string | Buffer
		) => void
	): void;
	(
		path: PathLikeFs,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string) => void
	): void;
}
declare interface RealPathSync {
	(path: PathLikeFs, options?: EncodingOption): string;
	(path: PathLikeFs, options: BufferEncodingOption): Buffer;
	(path: PathLikeFs, options?: EncodingOption): string | Buffer;
}
declare interface RealPathTypes {
	(
		path: PathLikeTypes,
		options: EncodingOption,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string) => void
	): void;
	(
		path: PathLikeTypes,
		options: BufferEncodingOption,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: Buffer) => void
	): void;
	(
		path: PathLikeTypes,
		options: EncodingOption,
		callback: (
			arg0: null | NodeJS.ErrnoException,
			arg1?: string | Buffer
		) => void
	): void;
	(
		path: PathLikeTypes,
		callback: (arg0: null | NodeJS.ErrnoException, arg1?: string) => void
	): void;
}
type RecursiveArrayOrRecord<T> =
	| { [index: string]: RecursiveArrayOrRecord<T> }
	| RecursiveArrayOrRecord<T>[]
	| T;
declare interface ReferencedExport {
	/**
	 * name of the referenced export
	 */
	name: string[];

	/**
	 * when false, referenced export can not be mangled, defaults to true
	 */
	canMangle?: boolean;
}
type Remotes = (string | RemotesObject)[] | RemotesObject;

/**
 * Advanced configuration for container locations from which modules should be resolved and loaded at runtime.
 */
declare interface RemotesConfig {
	/**
	 * Container locations from which modules should be resolved and loaded at runtime.
	 */
	external: string | string[];

	/**
	 * The name of the share scope shared with this remote.
	 */
	shareScope?: string;
}

/**
 * Container locations from which modules should be resolved and loaded at runtime. Property names are used as request scopes.
 */
declare interface RemotesObject {
	[index: string]: string | RemotesConfig | string[];
}
declare interface RenderBootstrapContext {
	/**
	 * the chunk
	 */
	chunk: Chunk;

	/**
	 * results of code generation
	 */
	codeGenerationResults: CodeGenerationResults;

	/**
	 * the runtime template
	 */
	runtimeTemplate: RuntimeTemplate;

	/**
	 * the module graph
	 */
	moduleGraph: ModuleGraph;

	/**
	 * the chunk graph
	 */
	chunkGraph: ChunkGraph;

	/**
	 * hash to be used for render call
	 */
	hash: string;
}
declare interface RenderContextCssModulesPlugin {
	/**
	 * the chunk
	 */
	chunk: Chunk;

	/**
	 * the chunk graph
	 */
	chunkGraph: ChunkGraph;

	/**
	 * results of code generation
	 */
	codeGenerationResults: CodeGenerationResults;

	/**
	 * the runtime template
	 */
	runtimeTemplate: RuntimeTemplate;

	/**
	 * the unique name
	 */
	uniqueName: string;

	/**
	 * undo path to css file
	 */
	undoPath: string;

	/**
	 * modules
	 */
	modules: CssModule[];
}
declare interface RenderContextJavascriptModulesPlugin {
	/**
	 * the chunk
	 */
	chunk: Chunk;

	/**
	 * the dependency templates
	 */
	dependencyTemplates: DependencyTemplates;

	/**
	 * the runtime template
	 */
	runtimeTemplate: RuntimeTemplate;

	/**
	 * the module graph
	 */
	moduleGraph: ModuleGraph;

	/**
	 * the chunk graph
	 */
	chunkGraph: ChunkGraph;

	/**
	 * results of code generation
	 */
	codeGenerationResults: CodeGenerationResults;

	/**
	 * rendering in strict context
	 */
	strictMode?: boolean;
}
type RenderManifestEntry =
	| RenderManifestEntryTemplated
	| RenderManifestEntryStatic;
declare interface RenderManifestEntryStatic {
	render: () => Source;
	filename: string;
	info: AssetInfo;
	identifier: string;
	hash?: string;
	auxiliary?: boolean;
}
declare interface RenderManifestEntryTemplated {
	render: () => Source;
	filenameTemplate: TemplatePath;
	pathOptions?: PathData;
	info?: AssetInfo;
	identifier: string;
	hash?: string;
	auxiliary?: boolean;
}
declare interface RenderManifestOptions {
	/**
	 * the chunk used to render
	 */
	chunk: Chunk;
	hash: string;
	fullHash: string;
	outputOptions: Output;
	codeGenerationResults: CodeGenerationResults;
	moduleTemplates: { javascript: ModuleTemplate };
	dependencyTemplates: DependencyTemplates;
	runtimeTemplate: RuntimeTemplate;
	moduleGraph: ModuleGraph;
	chunkGraph: ChunkGraph;
}
declare class ReplaceSource extends Source {
	constructor(source: Source, name?: string);
	replace(start: number, end: number, newValue: string, name?: string): void;
	insert(pos: number, newValue: string, name?: string): void;
	getName(): string;
	original(): string;
	getReplacements(): {
		start: number;
		end: number;
		content: string;
		insertIndex: number;
		name: string;
	}[];
}
declare interface RequestRecord {
	[index: string]: string | string[];
}
declare abstract class RequestShortener {
	contextify: (arg0: string) => string;
	shorten(request?: null | string): undefined | null | string;
}
declare interface ResolveBuildDependenciesResult {
	/**
	 * list of files
	 */
	files: Set<string>;

	/**
	 * list of directories
	 */
	directories: Set<string>;

	/**
	 * list of missing entries
	 */
	missing: 