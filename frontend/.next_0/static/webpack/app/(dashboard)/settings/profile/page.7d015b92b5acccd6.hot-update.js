ts.
	 */
	alias?:
		| {
				/**
				 * New request.
				 */
				alias: string | false | string[];
				/**
				 * Request to be redirected.
				 */
				name: string;
				/**
				 * Redirect only exact matching request.
				 */
				onlyModule?: boolean;
		  }[]
		| { [index: string]: string | false | string[] };

	/**
	 * Fields in the description file (usually package.json) which are used to redirect requests inside the module.
	 */
	aliasFields?: (string | string[])[];

	/**
	 * Extra resolve options per dependency category. Typical categories are "commonjs", "amd", "esm".
	 */
	byDependency?: { [index: string]: ResolveOptions };

	/**
	 * Enable caching of successfully resolved requests (cache entries are revalidated).
	 */
	cache?: boolean;

	/**
	 * Predicate function to decide which requests should be cached.
	 */
	cachePredicate?: (request: ResolveRequest) => boolean;

	/**
	 * Include the context information in the cache identifier when caching.
	 */
	cacheWithContext?: boolean;

	/**
	 * Condition names for exports field entry point.
	 */
	conditionNames?: string[];

	/**
	 * Filenames used to find a description file (like a package.json).
	 */
	descriptionFiles?: string[];

	/**
	 * Enforce the resolver to use one of the extensions from the extensions option (User must specify requests without extension).
	 */
	enforceExtension?: boolean;

	/**
	 * Field names from the description file (usually package.json) which are used to provide entry points of a package.
	 */
	exportsFields?: string[];

	/**
	 * An object which maps extension to extension aliases.
	 */
	extensionAlias?: { [index: string]: string | string[] };

	/**
	 * Extensions added to the request when trying to find the file.
	 */
	extensions?: string[];

	/**
	 * Redirect module requests when normal resolving fails.
	 */
	fallback?:
		| {
				/**
				 * New request.
				 */
				alias: string | false | string[];
				/**
				 * Request to be redirected.
				 */
				name: string;
				/**
				 * Redirect only exact matching request.
				 */
				onlyModule?: boolean;
		  }[]
		| { [index: string]: string | false | string[] };

	/**
	 * Filesystem for the resolver.
	 */
	fileSystem?: InputFileSystem;

	/**
	 * Treats the request specified by the user as fully specified, meaning no extensions are added and the mainFiles in directories are not resolved (This doesn't affect requests from mainFields, aliasFields or aliases).
	 */
	fullySpecified?: boolean;

	/**
	 * Field names from the description file (usually package.json) which are used to provide internal request of a package (requests starting with # are considered as internal).
	 */
	importsFields?: string[];

	/**
	 * Field names from the description file (package.json) which are used to find the default entry point.
	 */
	mainFields?: (string | string[])[];

	/**
	 * Filenames used to find the default entry point if there is no description file or main field.
	 */
	mainFiles?: string[];

	/**
	 * Folder names or directory paths where to find modules.
	 */
	modules?: string[];

	/**
	 * Plugins for the resolver.
	 */
	plugins?: (
		| undefined
		| null
		| false
		| ""
		| 0
		| {
				[index: string]: any;
				/**
				 * The run point of the plugin, required method.
				 */
				apply: (arg0: Resolver) => void;
		  }
		| ((this: Resolver, arg1: Resolver) => void)
		| "..."
	)[];

	/**
	 * Prefer to resolve server-relative URLs (starting with '/') as absolute paths before falling back to resolve in 'resolve.roots'.
	 */
	preferAbsolute?: boolean;

	/**
	 * Prefer to resolve module requests as relative request and fallback to resolving as module.
	 */
	preferRelative?: boolean;

	/**
	 * Custom resolver.
	 */
	resolver?: Resolver;

	/**
	 * A list of resolve restrictions. Resolve results must fulfill all of these restrictions to resolve successfully. Other resolve paths are taken when restrictions are not met.
	 */
	restrictions?: (string | RegExp)[];

	/**
	 * A list of directories in which requests that are server-relative URLs (starting with '/') are resolved.
	 */
	roots?: string[];

	/**
	 * Enable resolving symlinks to the original location.
	 */
	symlinks?: boolean;

	/**
	 * Enable caching of successfully resolved requests (cache entries are not revalidated).
	 */
	unsafeCache?: boolean | { [index: string]: any };

	/**
	 * Use synchronous filesystem calls for the resolver.
	 */
	useSyncFileSystemCalls?: boolean;
}
declare interface ResolveOptionsResolverFactoryObject1 {
	alias: AliasOption[];
	fallback: AliasOption[];
	aliasFields: Set<string | string[]>;
	extensionAlias: ExtensionAliasOption[];
	cachePredicate: (arg0: ResolveRequest) => boolean;
	cacheWithContext: boolean;

	/**
	 * A list of exports field condition names.
	 */
	conditionNames: Set<string>;
	descriptionFiles: string[];
	enforceExtension: boolean;
	exportsFields: Set<string | string[]>;
	importsFields: Set<string | string[]>;
	extensions: Set<string>;
	fileSystem: FileSystem;
	unsafeCache: false | object;
	symlinks: boolean;
	resolver?: Resolver;
	modules: (string | string[])[];
	mainFields: { name: string[]; forceRelative: boolean }[];
	mainFiles: Set<string>;
	plugins: Plugin[];
	pnpApi: null | PnpApi;
	roots: Set<string>;
	fullySpecified: boolean;
	resolveToContext: boolean;
	restrictions: Set<string | RegExp>;
	preferRelative: boolean;
	preferAbsolute: boolean;
}
declare interface ResolveOptionsResolverFactoryObject2 {
	/**
	 * A list of module alias configurations or an object which maps key to value
	 */
	alias?: AliasOption[] | AliasOptions;

	/**
	 * A list of module alias configurations or an object which maps key to value, applied only after modules option
	 */
	fallback?: AliasOption[] | AliasOptions;

	/**
	 * An object which maps extension to extension aliases
	 */
	extensionAlias?: ExtensionAliasOptions;

	/**
	 * A list of alias fields in description files
	 */
	aliasFields?: (string | string[])[];

	/**
	 * A function which decides whether a request should be cached or not. An object is passed with at least `path` and `request` properties.
	 */
	cachePredicate?: (arg0: ResolveRequest) => boolean;

	/**
	 * Whether or not the unsafeCache should include request context as part of the cache key.
	 */
	cacheWithContext?: boolean;

	/**
	 * A list of description files to read from
	 */
	descriptionFiles?: string[];

	/**
	 * A list of exports field condition names.
	 */
	conditionNames?: string[];

	/**
	 * Enforce that a extension from extensions must be used
	 */
	enforceExtension?: boolean;

	/**
	 * A list of exports fields in description files
	 */
	exportsFields?: (string | string[])[];

	/**
	 * A list of imports fields in description files
	 */
	importsFields?: (string | string[])[];

	/**
	 * A list of extensions which should be tried for files
	 */
	extensions?: string[];

	/**
	 * The file system which should be used
	 */
	fileSystem: FileSystem;

	/**
	 * Use this cache object to unsafely cache the successful requests
	 */
	unsafeCache?: boolean | object;

	/**
	 * Resolve symlinks to their symlinked location
	 */
	symlinks?: boolean;

	/**
	 * A prepared Resolver to which the plugins are attached
	 */
	resolver?: Resolver;

	/**
	 * A list of directories to resolve modules from, can be absolute path or folder name
	 */
	modules?: string | string[];

	/**
	 * A list of main fields in description files
	 */
	mainFields?: (
		| string
		| string[]
		| { name: string | string[]; forceRelative: boolean }
	)[];

	/**
	 * A list of main files in directories
	 */
	mainFiles?: string[];

	/**
	 * A list of additional resolve plugins which should be applied
	 */
	plugins?: Plugin[];

	/**
	 * A PnP API that should be used - null is "never", undefined is "auto"
	 */
	pnpApi?: null | PnpApi;

	/**
	 * A list of root paths
	 */
	roots?: string[];

	/**
	 * The request is already fully specified and no extensions or directories are resolved for it
	 */
	fullySpecified?: boolean;

	/**
	 * Resolve to a context instead of a file
	 */
	resolveToContext?: boolean;

	/**
	 * A list of resolve restrictions
	 */
	restrictions?: (string | RegExp)[];

	/**
	 * Use only the sync constraints of the file system calls
	 */
	useSyncFileSystemCalls?: boolean;

	/**
	 * Prefer to resolve module requests as relative requests before falling back to modules
	 */
	preferRelative?: boolean;

	/**
	 * Prefer to resolve server-relative urls as absolute paths before falling back to resolve in roots
	 */
	preferAbsolute?: boolean;
}
type ResolveOptionsWithDependencyType = ResolveOptions & {
	dependencyType?: string;
	resolveToContext?: boolean;
};
type ResolvePluginInstance =
	| {
			[index: string]: any;
			/**
			 * The run point of the plugin, required method.
			 */
			apply: (arg0: Resolver) => void;
	  }
	| ((this: Resolver, arg1: Resolver) => void);
type ResolveRequest = BaseResolveRequest & Partial<ParsedIdentifier>;
declare interface ResolvedContextFileSystemInfoEntry {
	safeTime: number;
	timestampHash?: string;
}
declare interface ResolvedContextTimestampAndHash {
	safeTime: number;
	timestampHash?: string;
	hash: string;
}
declare interface ResolvedOptions {
	/**
	 * - platform target properties
	 */
	platform: false | PlatformTargetProperties;
}
declare abstract class Resolver {
	fileSystem: FileSystem;
	options: ResolveOptionsResolverFactoryObject1;
	hooks: KnownHooks;
	ensureHook(
		name:
			| string
			| AsyncSeriesBailHook<
					[ResolveRequest, ResolveContext],
					null | ResolveRequest
			  >
	): AsyncSeriesBailHook<
		[ResolveRequest, ResolveContext],
		null | ResolveRequest
	>;
	getHook(
		name:
			| string
			| AsyncSeriesBailHook<
					[ResolveRequest, ResolveContext],
					null | ResolveRequest
			  >
	): AsyncSeriesBailHook<
		[ResolveRequest, ResolveContext],
		null | ResolveRequest
	>;
	resolveSync(context: object, path: string, request: string): string | false;
	resolve(
		context: object,
		path: string,
		request: string,
		resolveContext: ResolveContext,
		callback: (
			err: null | ErrorWithDetail,
			res?: string | false,
			req?: ResolveRequest
		) => void
	): void;
	doResolve(
		hook: AsyncSeriesBailHook<
			[ResolveRequest, ResolveContext],
			null | ResolveRequest
		>,
		request: ResolveRequest,
		message: null | string,
		resolveContext: ResolveContext,
		callback: (err?: null | Error, result?: ResolveRequest) => void
	): void;
	parse(identifier: string): ParsedIdentifier;
	isModule(path: string): boolean;
	isPrivate(path: string): boolean;
	isDirectory(path: string): boolean;
	join(path: string, request: string): string;
	normalize(path: string): string;
}
declare interface ResolverCache {
	direct: WeakMap<object, ResolverWithOptions>;
	stringified: Map<string, ResolverWithOptions>;
}
declare abstract class ResolverFactory {
	hooks: Readonly<{
		resolveOptions: HookMap<
			SyncWaterfallHook<[ResolveOptionsWithDependencyType]>
		>;
		resolver: HookMap<
			SyncHook<
				[
					Resolver,
					ResolveOptionsResolverFactoryObject2,
					ResolveOptionsWithDependencyType
				]
			>
		>;
	}>;
	cache: Map<string, ResolverCache>;
	get(
		type: string,
		resolveOptions?: ResolveOptionsWithDependencyType
	): ResolverWithOptions;
}
type ResolverWithOptions = Resolver & WithOptions;

declare interface ResourceDataWithData {
	resource: string;
	path?: string;
	query?: string;
	fragment?: string;
	context?: string;
	data: Record<string, any>;
}
declare abstract class RestoreProvidedData {
	exports: any;
	otherProvided: any;
	otherCanMangleProvide: any;
	otherTerminalBinding: any;
	serialize(__0: ObjectSerializerContext): void;
}
declare interface RmDirOptions {
	maxRetries?: number;
	recursive?: boolean;
	retryDelay?: number;
}
declare interface Rmdir {
	(
		file: PathLikeFs,
		callback: (arg0: null | NodeJS.ErrnoException) => void
	): void;
	(
		file: PathLikeFs,
		options: RmDirOptions,
		callback: (arg0: null | NodeJS.ErrnoException) => void
	): void;
}
type Rule = string | RegExp;
declare interface RuleSet {
	/**
	 * map of references in the rule set (may grow over time)
	 */
	references: Map<string, any>;

	/**
	 * execute the rule set
	 */
	exec: (arg0: EffectData) => Effect[];
}
type RuleSetCondition =
	| string
	| RegExp
	| ((value: string) => boolean)
	| RuleSetLogicalConditions
	| RuleSetCondition[];
type RuleSetConditionAbsolute =
	| string
	| RegExp
	| ((value: string) => boolean)
	| RuleSetLogicalConditionsAbsolute
	| RuleSetConditionAbsolute[];
type RuleSetConditionOrConditions =
	| string
	| RegExp
	| ((value: string) => boolean)
	| RuleSetLogicalConditions
	| RuleSetCondition[];

/**
 * Logic operators used in a condition matcher.
 */
declare interface RuleSetLogicalConditions {
	/**
	 * Logical AND.
	 */
	and?: RuleSetCondition[];

	/**
	 * Logical NOT.
	 */
	not?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditions
		| RuleSetCondition[];

	/**
	 * Logical OR.
	 */
	or?: RuleSetCondition[];
}

/**
 * Logic operators used in a condition matcher.
 */
declare interface RuleSetLogicalConditionsAbsolute {
	/**
	 * Logical AND.
	 */
	and?: RuleSetConditionAbsolute[];

	/**
	 * Logical NOT.
	 */
	not?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditionsAbsolute
		| RuleSetConditionAbsolute[];

	/**
	 * Logical OR.
	 */
	or?: RuleSetConditionAbsolute[];
}

/**
 * A rule description with conditions and effects for modules.
 */
declare interface RuleSetRule {
	/**
	 * Match on import assertions of the dependency.
	 */
	assert?: { [index: string]: RuleSetConditionOrConditions };

	/**
	 * Match the child compiler name.
	 */
	compiler?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditions
		| RuleSetCondition[];

	/**
	 * Match dependency type.
	 */
	dependency?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditions
		| RuleSetCondition[];

	/**
	 * Match values of properties in the description file (usually package.json).
	 */
	descriptionData?: { [index: string]: RuleSetConditionOrConditions };

	/**
	 * Enforce this rule as pre or post step.
	 */
	enforce?: "pre" | "post";

	/**
	 * Shortcut for resource.exclude.
	 */
	exclude?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditionsAbsolute
		| RuleSetConditionAbsolute[];

	/**
	 * The options for the module generator.
	 */
	generator?: { [index: string]: any };

	/**
	 * Shortcut for resource.include.
	 */
	include?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditionsAbsolute
		| RuleSetConditionAbsolute[];

	/**
	 * Match the issuer of the module (The module pointing to this module).
	 */
	issuer?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditionsAbsolute
		| RuleSetConditionAbsolute[];

	/**
	 * Match layer of the issuer of this module (The module pointing to this module).
	 */
	issuerLayer?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditions
		| RuleSetCondition[];

	/**
	 * Specifies the layer in which the module should be placed in.
	 */
	layer?: string;

	/**
	 * Shortcut for use.loader.
	 */
	loader?: string;

	/**
	 * Match module mimetype when load from Data URI.
	 */
	mimetype?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditions
		| RuleSetCondition[];

	/**
	 * Only execute the first matching rule in this array.
	 */
	oneOf?: (undefined | null | false | "" | 0 | RuleSetRule)[];

	/**
	 * Shortcut for use.options.
	 */
	options?: string | { [index: string]: any };

	/**
	 * Options for parsing.
	 */
	parser?: { [index: string]: any };

	/**
	 * Match the real resource path of the module.
	 */
	realResource?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditionsAbsolute
		| RuleSetConditionAbsolute[];

	/**
	 * Options for the resolver.
	 */
	resolve?: ResolveOptions;

	/**
	 * Match the resource path of the module.
	 */
	resource?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditionsAbsolute
		| RuleSetConditionAbsolute[];

	/**
	 * Match the resource fragment of the module.
	 */
	resourceFragment?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditions
		| RuleSetCondition[];

	/**
	 * Match the resource query of the module.
	 */
	resourceQuery?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditions
		| RuleSetCondition[];

	/**
	 * Match and execute these rules when this rule is matched.
	 */
	rules?: (undefined | null | false | "" | 0 | RuleSetRule)[];

	/**
	 * Match module scheme.
	 */
	scheme?:
		| string
		| RegExp
		| ((value: string) => boolean)
		| RuleSetLogicalConditions
		| RuleS