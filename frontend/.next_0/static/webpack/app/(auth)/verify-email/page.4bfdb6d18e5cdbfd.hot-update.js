 */
    maxReadSize?: number;
    /**
     * Filter modes of entries being unpacked, like `process.umask()`
     *
     * @internal
     */
    umask?: number;
    /**
     * Default mode for directories. Used for all implicitly created directories,
     * and any directories in the archive that do not have a mode field.
     *
     * @internal
     */
    dmode?: number;
    /**
     * default mode for files
     *
     * @internal
     */
    fmode?: number;
    /**
     * Map that tracks which directories already exist, for extraction
     *
     * @internal
     */
    dirCache?: Map<string, boolean>;
    /**
     * maximum supported size of meta entries. Defaults to 1MB
     *
     * @internal
     */
    maxMetaEntrySize?: number;
    /**
     * A Map object containing the device and inode value for any file whose
     * `nlink` value is greater than 1, to identify hard links when creating
     * archives.
     *
     * @internal
     */
    linkCache?: Map<LinkCacheKey, string>;
    /**
     * A map object containing the results of `fs.readdir()` calls.
     *
     * @internal
     */
    readdirCache?: Map<string, string[]>;
    /**
     * A cache of all `lstat` results, for use in creating archives.
     *
     * @internal
     */
    statCache?: Map<string, Stats>;
    /**
     * Number of concurrent jobs to run when creating archives.
     *
     * Defaults to 4.
     *
     * @internal
     */
    jobs?: number;
    /**
     * Automatically set to true on Windows systems.
     *
     * When extracting, causes behavior where filenames containing `<|>?:`
     * characters are converted to windows-compatible escape sequences in the
     * created filesystem entries.
     *
     * When packing, causes behavior where paths replace `\` with `/`, and
     * filenames containing the windows-compatible escaped forms of `<|>?:` are
     * converted to actual `<|>?:` characters in the archive.
     *
     * @internal
     */
    win32?: boolean;
    /**
     * For `WriteEntry` objects, the absolute path to the entry on the
     * filesystem. By default, this is `resolve(cwd, entry.path)`, but it can be
     * overridden explicitly.
     *
     * @internal
     */
    absolute?: string;
    /**
     * Used with Parser stream interface, to attach and take over when the
     * stream is completely parsed. If this is set, then the prefinish,
     * finish, and end events will not fire, and are the responsibility of
     * the ondone method to emit properly.
     *
     * @internal
     */
    ondone?: () => void;
    /**
     * Mostly for testing, but potentially useful in some cases.
     * Forcibly trigger a chown on every entry, no matter what.
     */
    forceChown?: boolean;
    /**
     * ambiguous deprecated name for {@link onReadEntry}
     *
     * @deprecated
     */
    onentry?: (entry: ReadEntry) => any;
}
export type TarOptionsSync = TarOptions & {
    sync: true;
};
export type TarOptionsAsync = TarOptions & {
    sync?: false;
};
export type TarOptionsFile = TarOptions & {
    file: string;
};
export type TarOptionsNoFile = TarOptions & {
    file?: undefined;
};
export type TarOptionsSyncFile = TarOptionsSync & TarOptionsFile;
export type TarOptionsAsyncFile = TarOptionsAsync & TarOptionsFile;
export type TarOptionsSyncNoFile = TarOptionsSync & TarOptionsNoFile;
export type TarOptionsAsyncNoFile = TarOptionsAsync & TarOptionsNoFile;
export type LinkCacheKey = `${number}:${number}`;
export interface TarOptionsWithAliases extends TarOptions {
    /**
     * The effective current working directory for this tar command
     */
    C?: TarOptions['cwd'];
    /**
     * The tar file to be read and/or written. When this is set, a stream
     * is not returned. Asynchronous commands will return a promise indicating
     * when the operation is completed, and synchronous commands will return
     * immediately.
     */
    f?: TarOptions['file'];
    /**
     * When creating a tar archive, this can be used to compress it as well.
     * Set to `true` to use the default gzip options, or customize them as
     * needed.
     *
     * When reading, if this is unset, then the compression status will be
     * inferred from the archive data. This is generally best, unless you are
     * sure of the compression settings in use to create the archive, and want to
     * fail if the archive doesn't match expectations.
     */
    z?: TarOptions['gzip'];
    /**
     * When creating archives, preserve absolute and `..` paths in the archive,
     * rather than sanitizing them under the cwd.
     *
     * When extracting, allow absolute paths, paths containing `..`, and
     * extracting through symbolic links. By default, the root `/` is stripped
     * from absolute paths (eg, turning `/x/y/z` into `x/y/z`), paths containing
     * `..` are not extracted, and any file whose location would be modified by a
     * symbolic link is not extracted.
     *
     * **WARNING** This is almost always unsafe, and must NEVER be used on
     * archives from untrusted sources, such as user input, and every entry must
     * be validated to ensure it is safe to write. Even if the input is not
     * malicious, mistakes can cause a lot of damage!
     */
    P?: TarOptions['preservePaths'];
    /**
     * When extracting, unlink files before creating them. Without this option,
     * tar overwrites existing files, which preserves existing hardlinks. With
     * this option, existing hardlinks will be broken, as will any symlink that
     * would affect the location of an extracted file.
     */
    U?: TarOptions['unlink'];
    /**
     * When extracting, strip the specified number of path portions from the
     * entry path. For example, with `{strip: 2}`, the entry `a/b/c/d` would be
     * extracted to `{cwd}/c/d`.
     */
    'strip-components'?: TarOptions['strip'];
    /**
     * When extracting, strip the specified number of path portions from the
     * entry path. For example, with `{strip: 2}`, the entry `a/b/c/d` would be
     * extracted to `{cwd}/c/d`.
     */
    stripComponents?: TarOptions['strip'];
    /**
     * When extracting, keep the existing file on disk if it's newer than the
     * file in the archive.
     */
    'keep-newer'?: TarOptions['newer'];
    /**
     * When extracting, keep the existing file on disk if it's newer than the
     * file in the archive.
     */
    keepNewer?: TarOptions['newer'];
    /**
     * When extracting, keep the existing file on disk if it's newer than the
     * file in the archive.
     */
    'keep-newer-files'?: TarOptions['newer'];
    /**
     * When extracting, keep the existing file on disk if it's newer than the
     * file in the archive.
     */
    keepNewerFiles?: TarOptions['newer'];
    /**
     * When extracting, do not overwrite existing files at all.
     */
    k?: TarOptions['keep'];
    /**
     * When extracting, do not overwrite existing files at all.
     */
    'keep-existing'?: TarOptions['keep'];
    /**
     * When extracting, do not overwrite existing files at all.
     */
    keepExisting?: TarOptions['keep'];
    /**
     * When extracting, do not set the `mtime` value for extracted entries to
     * match the `mtime` in the archive.
     *
     * When creating archives, do not store the `mtime` value in the entry. Note
     * that this prevents properly using other mtime-based features (such as
     * `tar.update` or the `newer` option) with the resulting archive.
     */
    m?: TarOptions['noMtime'];
    /**
     * When extracting, do not set the `mtime` value for extracted entries to
     * match the `mtime` in the archive.
     *
     * When creating archives, do not store the `mtime` value in the entry. Note
     * that this prevents properly using other mtime-based features (such as
     * `tar.update` or the `newer` option) with the resulting archive.
     */
    'no-mtime'?: TarOptions['noMtime'];
    /**
     * When extracting, set the `uid` and `gid` of extracted entries to the `uid`
     * and `gid` fields in the archive. Defaults to true when run as root, and
     * false otherwise.
     *
     * If false, then files and directories will be set with the owner and group
     * of the user running the process. This is similar to `-p` in `tar(1)`, but
     * ACLs and other system-specific data is never unpacked in this
     * implementation, and modes are set by default already.
     */
    p?: TarOptions['preserveOwner'];
    /**
     * Pack the targets of symbolic links rather than the link itself.
     */
    L?: TarOptions['follow'];
    /**
     * Pack the targets of symbolic links rather than the link itself.
     */
    h?: TarOptions['follow'];
    /**
     * Deprecated option. Set explicitly false to set `chmod: true`. Ignored
     * if {@link TarOptions#chmod} is set to any boolean value.
     *
     * @deprecated
     */
    noChmod?: boolean;
}
export type TarOptionsWithAliasesSync = TarOptionsWithAliases & {
    sync: true;
};
export type TarOptionsWithAliasesAsync = TarOptionsWithAliases & {
    sync?: false;
};
export type TarOptionsWithAliasesFile = (TarOptionsWithAliases & {
    file: string;
}) | (TarOptionsWithAliases & {
    f: string;
});
export type TarOptionsWithAliasesSyncFile = TarOptionsWithAliasesSync & TarOptionsWithAliasesFile;
export type TarOptionsWithAliasesAsyncFile = TarOptionsWithAliasesAsync & TarOptionsWithAliasesFile;
export type TarOptionsWithAliasesNoFile = TarOptionsWithAliases & {
    f?: undefined;
    file?: undefined;
};
export type TarOptionsWithAliasesSyncNoFile = TarOptionsWithAliasesSync & TarOptionsWithAliasesNoFile;
export type TarOptionsWithAliasesAsyncNoFile = TarOptionsWithAliasesAsync & TarOptionsWithAliasesNoFile;
export declare const isSyncFile: <O extends TarOptions>(o: O) => o is O & TarOptions & {
    sync: true;
} & {
    file: string;
};
export declare const isAsyncFile: <O extends TarOptions>(o: O) => o is O & TarOptions & {
    sync?: false | undefined;
} & {
    file: string;
};
export declare const isSyncNoFile: <O extends TarOptions>(o: O) => o is O & TarOptions & {
    sync: true;
} & {
    file?: undefined;
};
export declare const isAsyncNoFile: <O extends TarOptions>(o: O) => o is O & TarOptions & {
    sync?: false | undefined;
} & {
    file?: undefined;
};
export declare const isSync: <O extends TarOptions>(o: O) => o is O & TarOptions & {
    sync: true;
};
export declare const isAsync: <O extends TarOptions>(o: O) => o is O & TarOptions & {
    sync?: false | undefined;
};
export declare const isFile: <O extends TarOptions>(o: O) => o is O & TarOptions & {
    file: string;
};
export declare const isNoFile: <O extends TarOptions>(o: O) => o is O & TarOptions & {
    file?: undefined;
};
export declare const dealias: (opt?: TarOptionsWithAliases) => TarOptions;
//# sourceMappingURL=options.d.ts.map                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       /**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.dev/license
 */
import ts from 'typescript';
import { ImportedSymbolsTracker } from '../../../../imports';
import { ClassMember, Decorator, ReflectionHost } from '../../../../reflection';
import { ImportManager } from '../../../../translator';
/** Function that can be used to transform class properties. */
export type PropertyTransform = (member: Pick<ClassMember, 'name' | 'accessLevel' | 'value'> & {
    node: ts.PropertyDeclaration;
}, sourceFile: ts.SourceFile, host: ReflectionHost, factory: ts.NodeFactory, importTracker: ImportedSymbolsTracker, importManager: ImportManager, classDecorator: Decorator, isCore: boolean) => ts.PropertyDeclaration;
/**
 * Creates an import and access for a given Angular core import while
 * ensuring the decorator symbol access can be traced back to an Angular core
 * import in order to make the synthetic decorator compatible with the JIT
 * decorator downlevel transform.
 */
export declare function createSyntheticAngularCoreDecoratorAccess(factory: ts.NodeFactory, importManager: ImportManager, ngClassDecorator: Decorator, sourceFile: ts.SourceFile, decoratorName: string): ts.PropertyAccessExpression;
/** Casts the given expression as `any`. */
export declare function castAsAny(factory: ts.NodeFactory, expr: ts.Expression): ts.Expression;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          /// <reference types="node" resolution-mode="require"/>
import { type GzipOptions, type ZlibOptions } from 'minizlib';
import { type Stats } from 'node:fs';
import { type ReadEntry } from './read-entry.js';
import { type WarnData } from './warn-method.js';
import { WriteEntry } from './write-entry.js';
/**
 * The options that can be provided to tar commands.
 *
 * Note that some of these are only relevant for certain commands, since
 * they are specific to reading or writing.
 *
 * Aliases are provided in the {@link TarOptionsWithAliases} type.
 */
export interface TarOptions {
    /**
     * Perform all I/O operations synchronously. If the stream is ended
     * immediately, then it will be processed entirely synchronously.
     */
    sync?: boolean;
    /**
     * The tar file to be read and/or written. When this is set, a stream
     * is not returned. Asynchronous commands will return a promise indicating
     * when the operation is completed, and synchronous commands will return
     * immediately.
     */
    file?: string;
    /**
     * Treat warnings as crash-worthy errors. Defaults false.
     */
    strict?: boolean;
    /**
     * The effective current working directory for this tar command
     */
    cwd?: string;
    /**
     * When creating a tar archive, this can be used to compress it as well.
     * Set to `true` to use the default gzip options, or customize them as
     * needed.
     *
     * When reading, if this is unset, then the compression status will be
     * inferred from the archive data. This is generally best, unless you are
     * sure of the compression settings in use to create the archive, 