/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Tobias Koppers @sokra
*/

"use strict";

/** @typedef {import("./Resolver").ResolveRequest} ResolveRequest */

/**
 * @template T
 * @template Z
 * @callback Iterator
 * @param {T} item item
 * @param {(err?: null|Error, result?: null|Z) => void} callback callback
 * @param {number} i index
 * @returns {void}
 */

/**
 * @template T
 * @template Z
 * @param {T[]} array array
 * @param {Iterator<T, Z>} iterator iterator
 * @param {(err?: null|Error, result?: null|Z, i?: number) => void} callback callback after all items are iterated
 * @returns {void}
 */
module.exports = function forEachBail(array, iterator, callback) {
	if (array.length === 0) return ca