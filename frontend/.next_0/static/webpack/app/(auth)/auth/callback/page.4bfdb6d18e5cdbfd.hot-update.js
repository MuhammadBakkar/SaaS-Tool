nst byte2 = src[position++] & 0x3f;
				const byte3 = src[position++] & 0x3f;
				const byte4 = src[position++] & 0x3f;
				let unit = ((byte1 & 0x07) << 0x12) | (byte2 << 0x0c) | (byte3 << 0x06) | byte4;
				if (unit > 0xffff) {
					unit -= 0x10000;
					units.push(((unit >>> 10) & 0x3ff) | 0xd800);
					unit = 0xdc00 | (unit & 0x3ff);
				}
				units.push(unit);
			} else {
				units.push(byte1);
			}

			if (units.length >= 0x1000) {
				result += fromCharCode.apply(String, units);
				units.length = 0;
			}
		}

		if (units.length > 0) {
			result += fromCharCode.apply(String, units);
		}

		return result
	}
	function readString(source, start, length) {
		let existingSrc = src;
		src = source;
		position = start;
		try {
			return readStringJS(length);
		} finally {
			src = existingSrc;
		}
	}

	function readArray(length) {
		let array = new Array(length);
		for (let i = 0; i < length; i++) {
			array[i] = read();
		}
		if (currentUnpackr.freezeData)
			return Object.freeze(array)
		return array
	}

	function readMap(length) {
		if (currentUnpackr.mapsAsObjects) {
			let object = {};
			for (let i = 0; i < length; i++) {
				let key = readKey();
				if (key === '__proto__')
					key = '__proto_';
				object[key] = read();
			}
			return object
		} else {
			let map = new Map();
			for (let i = 0; i < length; i++) {
				map.set(read(), read());
			}
			return map
		}
	}

	var fromCharCode = String.fromCharCode;
	function longStringInJS(length) {
		let start = position;
		let bytes = new Array(length);
		for (let i = 0; i < length; i++) {
			const byte = src[position++];
			if ((byte & 0x80) > 0) {
					position = start;
					return
				}
				bytes[i] = byte;
			}
			return fromCharCode.apply(String, bytes)
	}
	function shortStringInJS(length) {
		if (length < 4) {
			if (length < 2) {
				if (length === 0)
					return ''
				else {
					let a = src[position++];
					if ((a & 0x80) > 1) {
						position -= 1;
						return
					}
					return fromCharCode(a)
				}
			} else {
				let a = src[position++];
				let b = src[position++];
				if ((a & 0x80) > 0 || (b & 0x80) > 0) {
					position -= 2;
					return
				}
				if (length < 3)
					return fromCharCode(a, b)
				let c = src[position++];
				if ((c & 0x80) > 0) {
					position -= 3;
					return
				}
				return fromCharCode(a, b, c)
			}
		} else {
			let a = src[position++];
			let b = src[position++];
			let c = src[position++];
			let d = src[position++];
			if ((a & 0x80) > 0 || (b & 0x80) > 0 || (c & 0x80) > 0 || (d & 0x80) > 0) {
				position -= 4;
				return
			}
			if (length < 6) {
				if (length === 4)
					return fromCharCode(a, b, c, d)
				else {
					let e = src[position++];
					if ((e & 0x80) > 0) {
						position -= 5;
						return
					}
					return fromCharCode(a, b, c, d, e)
				}
			} else if (length < 8) {
				let e = src[position++];
				let f = src[position++];
				if ((e & 0x80) > 0 || (f & 0x80) > 0) {
					position -= 6;
					return
				}
				if (length < 7)
					return fromCharCode(a, b, c, d, e, f)
				let g = src[position++];
				if ((g & 0x80) > 0) {
					position -= 7;
					return
				}
				return fromCharCode(a, b, c, d, e, f, g)
			} else {
				let e = src[position++];
				let f = src[position++];
				let g = src[position++];
				let h = src[position++];
				if ((e & 0x80) > 0 || (f & 0x80) > 0 || (g & 0x80) > 0 || (h & 0x80) > 0) {
					position -= 8;
					return
				}
				if (length < 10) {
					if (length === 8)
						return fromCharCode(a, b, c, d, e, f, g, h)
					else {
						let i = src[position++];
						if ((i & 0x80) > 0) {
							position -= 9;
							return
						}
						return fromCharCode(a, b, c, d, e, f, g, h, i)
					}
				} else if (length < 12) {
					let i = src[position++];
					let j = src[position++];
					if ((i & 0x80) > 0 || (j & 0x80) > 0) {
						position -= 10;
						return
					}
					if (length < 11)
						return fromCharCode(a, b, c, d, e, f, g, h, i, j)
					let k = src[position++];
					if ((k & 0x80) > 0) {
						position -= 11;
						return
					}
					return fromCharCode(a, b, c, d, e, f, g, h, i, j, k)
				} else {
					let i = src[position++];
					let j = src[position++];
					let k = src[position++];
					let l = src[position++];
					if ((i & 0x80) > 0 || (j & 0x80) > 0 || (k & 0x80) > 0 || (l & 0x80) > 0) {
						position -= 12;
						return
					}
					if (length < 14) {
						if (length === 12)
							return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l)
						else {
							let m = src[position++];
							if ((m & 0x80) > 0) {
								position -= 13;
								return
							}
							return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m)
						}
					} else {
						let m = src[position++];
						let n = src[position++];
						if ((m & 0x80) > 0 || (n & 0x80) > 0) {
							position -= 14;
							return
						}
						if (length < 15)
							return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n)
						let o = src[position++];
						if ((o & 0x80) > 0) {
							position -= 15;
							return
						}
						return fromCharCode(a, b, c, d, e, f, g, h, i, j, k, l, m, n, o)
					}
				}
			}
		}
	}

	function readOnlyJSString() {
		let token = src[position++];
		let length;
		if (token < 0xc0) {
			// fixstr
			length = token - 0xa0;
		} else {
			switch(token) {
				case 0xd9:
				// str 8
					length = src[position++];
					break
				case 0xda:
				// str 16
					length = dataView.getUint16(position);
					position += 2;
					break
				case 0xdb:
				// str 32
					length = dataView.getUint32(position);
					position += 4;
					break
				default:
					throw new Error('Expected string')
			}
		}
		return readStringJS(length)
	}


	function readBin(length) {
		return currentUnpackr.copyBuffers ?
			// specifically use the copying slice (not the node one)
			Uint8Array.prototype.slice.call(src, position, position += length) :
			src.subarray(position, position += length)
	}
	function readExt(length) {
		let type = src[position++];
		if (currentExtensions[type]) {
			let end;
			return currentExtensions[type](src.subarray(position, end = (position += length)), (readPosition) => {
				position = readPosition;
				try {
					return read();
				} finally {
					position = end;
				}
			})
		}
		else
			throw new Error('Unknown extension type ' + type)
	}

	var keyCache = new Array(4096);
	function readKey() {
		let length = src[position++];
		if (length >= 0xa0 && length < 0xc0) {
			// fixstr, potentially use key cache
			length = length - 0xa0;
			if (srcStringEnd >= position) // if it has been extracted, must use it (and faster anyway)
				return srcString.slice(position - srcStringStart, (position += length) - srcStringStart)
			else if (!(srcStringEnd == 0 && srcEnd < 180))
				return readFixedString(length)
		} else { // not cacheable, go back and do a standard read
			position--;
			return asSafeString(read())
		}
		let key = ((length << 5) ^ (length > 1 ? dataView.getUint16(position) : length > 0 ? src[position] : 0)) & 0xfff;
		let entry = keyCache[key];
		let checkPosition = position;
		let end = position + length - 3;
		let chunk;
		let i = 0;
		if (entry && entry.bytes == length) {
			while (checkPosition < end) {
				chunk = dataView.getUint32(checkPosition);
				if (chunk != entry[i++]) {
					checkPosition = 0x70000000;
					break
				}
				checkPosition += 4;
			}
			end += 3;
			while (checkPosition < end) {
				chunk = src[checkPosition++];
				if (chunk != entry[i++]) {
					checkPosition = 0x70000000;
					break
				}
			}
			if (checkPosition === end) {
				position = checkPosition;
				return entry.string
			}
			end -= 3;
			checkPosition = position;
		}
		entry = [];
		keyCache[key] = entry;
		entry.bytes = length;
		while (checkPosition < end) {
			chunk = dataView.getUint32(checkPosition);
			entry.push(chunk);
			checkPosition += 4;
		}
		end += 3;
		while (checkPosition < end) {
			chunk = src[checkPosition++];
			entry.push(chunk);
		}
		// for small blocks, avoiding the overhead of the extract call is helpful
		let string = length < 16 ? shortStringInJS(length) : longStringInJS(length);
		if (string != null)
			return entry.string = string
		return entry.string = readFixedString(length)
	}

	function asSafeString(property) {
		// protect against expensive (DoS) string conversions
		if (typeof property === 'string') return property;
		if (typeof property === 'number' || typeof property === 'boolean' || typeof property === 'bigint') return property.toString();
		if (property == null) return property + '';
		if (currentUnpackr.allowArraysInMapKeys && Array.isArray(property) && property.flat().every(item => ['string', 'number', 'boolean', 'bigint'].includes(typeof item))) {
			return property.flat().toString();
		}
		throw new Error(`Invalid property type for record: ${typeof property}`);
	}
	// the registration of the record definition extension (as "r")
	const recordDefinition = (id, highByte) => {
		let structure = read().map(asSafeString); // ensure that all keys are strings and
		// that the array is mutable
		let firstByte = id;
		if (highByte !== undefined) {
			id = id < 32 ? -((highByte << 5) + id) : ((highByte << 5) + id);
			structure.highByte = highByte;
		}
		let existingStructure = currentStructures[id];
		// If it is a shared structure, we need to restore any changes after reading.
		// Also in sequential mode, we may get incomplete reads and thus errors, and we need to restore
		// to the state prior to an incomplete read in order to properly resume.
		if (existingStructure && (existingStructure.isShared || sequentialMode)) {
			(currentStructures.restoreStructures || (currentStructures.restoreStructures = []))[id] = existingStructure;
		}
		currentStructures[id] = structure;
		structure.read = createStructureReader(structure, firstByte);
		return structure.read()
	};
	currentExtensions[0] = () => {}; // notepack defines extension 0 to mean undefined, so use that as the default here
	currentExtensions[0].noBuffer = true;

	currentExtensions[0x42] = data => {
		let headLength = (data.byteLength % 8) || 8;
		let head = BigInt(data[0] & 0x80 ? data[0] - 0x100 : data[0]);
		for (let i = 1; i < headLength; i++) {
			head <<= BigInt(8);
			head += BigInt(data[i]);
		}
		if (data.byteLength !== headLength) {
			let view = new DataView(data.buffer, data.byteOffset, data.byteLength);
			let decode = (start, end) => {
				let length = end - start;
				if (length <= 40) {
					let out = view.getBigUint64(start);
					for (let i = start + 8; i < end; i += 8) {
						out <<= BigInt(64n);
						out |= view.getBigUint64(i);
					}
					return out
				}
				// if (length === 8) return view.getBigUint64(start)
				let middle = start + (length >> 4 << 3);
				let left = decode(start, middle);
				let right = decode(middle, end);
				return (left << BigInt((end - middle) * 8)) | right
			};
			head = (head << BigInt((view.byteLength - headLength) * 8)) | decode(headLength, view.byteLength);
		}
		return head
	};

	let errors = {
		Error, EvalError, RangeError, ReferenceError, SyntaxError, TypeError, URIError, AggregateError: typeof AggregateError === 'function' ? AggregateError : null,
	};
	currentExtensions[0x65] = () => {
		let data = read();
		if (!errors[data[0]]) {
			let error = Error(data[1], { cause: data[2] });
			error.name = data[0];
			return error
		}
		return errors[data[0]](data[1], { cause: data[2] })
	};

	currentExtensions[0x69] = (data) => {
		// id extension (for structured clones)
		if (currentUnpackr.structuredClone === false) throw new Error('Structured clone extension is disabled')
		let id = dataView.getUint32(position - 4);
		if (!referenceMap)
			referenceMap = new Map();
		let token = src[position];
		let target;
		// TODO: handle any other types that can cycle and make the code more robust if there are other extensions
		if (token >= 0x90 && token < 0xa0 || token == 0xdc || token == 0xdd)
			target = [];
		else if (token >= 0x80 && token < 0x90 || token == 0xde || token == 0xdf)
			target = new Map();
		else if ((token >= 0xc7 && token <= 0xc9 || token >= 0xd4 && token <= 0xd8) && src[position + 1] === 0x73)
			target = new Set();
		else
			target = {};

		let refEntry = { target }; // a placeholder object
		referenceMap.set(id, refEntry);
		let targetProperties = read(); // read the next value as the target object to id
		if (!refEntry.used) {
			// no cycle, can just use the returned read object
			return refEntry.target = targetProperties // replace the placeholder with the real one
		} else {
			// there is a cycle, so we have to assign properties to original target
			Object.assign(target, targetProperties);
		}

		// copy over map/set entries if we're able to
		if (target instanceof Map)
			for (let [k, v] of targetProperties.entries()) target.set(k, v);
		if (target instanceof Set)
			for (let i of Array.from(targetProperties)) target.add(i);
		return target
	};

	currentExtensions[0x70] = (data) => {
		// pointer extension (for structured clones)
		if (currentUnpackr.structuredClone === false) throw new Error('Structured clone extension is disabled')
		let id = dataView.getUint32(position - 4);
		let refEntry = referenceMap.get(id);
		refEntry.used = true;
		return refEntry.target
	};

	currentExtensions[0x73] = () => new Set(read());

	const typedArrays = ['Int8','Uint8','Uint8Clamped','Int16','Uint16','Int32','Uint32','Float32','Float64','BigInt64','BigUint64'].map(type => type + 'Array');

	let glbl = typeof globalThis === 'object' ? globalThis : window;
	currentExtensions[0x74] = (data) => {
		let typeCode = data[0];
		// we always have to slice to get a new ArrayBuffer that is aligned
		let buffer = Uint8Array.prototype.slice.call(data, 1).buffer;

		let typedArrayName = typedArrays[typeCode];
		if (!typedArrayName) {
			if (typeCode === 16) return buffer
			if (typeCode === 17) return new DataView(buffer)
			throw new Error('Could not find typed array for code ' + typeCode)
		}
		return new glbl[typedArrayName](buffer)
	};
	currentExtensions[0x78] = () => {
		let data = read();
		return new RegExp(data[0], data[1])
	};
	const TEMP_BUNDLE = [];
	currentExtensions[0x62] = (data) => {
		let dataSize = (data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3];
		let dataPosition = position;
		position += dataSize - data.length;
		bundledStrings = TEMP_BUNDLE;
		bundledStrings = [readOnlyJSString(), readOnlyJSString()];
		bundledStrings.position0 = 0;
		bundledStrings.position1 = 0;
		bundledStrings.postBundlePosition = position;
		position = dataPosition;
		return read()
	};

	currentExtensions[0xff] = (data) => {
		// 32-bit date extension
		if (data.length == 4)
			return new Date((data[0] * 0x1000000 + (data[1] << 16) + (data[2] << 8) + data[3]) * 1000)
		else if (data.length == 8)
			return new Date(
				((data[0] << 22) + (data[1] << 14) + (data[2] << 6) + (data[3] >> 2)) / 1000000 +
				((data[3] & 0x3) * 0x100000000 + data[4] * 0x1000000 + (data[5] << 16) + (data[6] << 8) + data[7]) * 1000)
		else if (data.length == 12)
			return new Date(
				((data[0] << 24) + (data[1] << 16) + (data[2] << 8) + data[3]) / 1000000 +
				(((data[4] & 0x80) ? -0x1000000000000 : 0) + data[6] * 0x10000000000 + data[7] * 0x100000000 + data[8] * 0x1000000 + (data[9] << 16) + (data[10] << 8) + data[11]) * 1000)
		else
			return new Date('invalid')
	};
	// registration of bulk record definition?
	// currentExtensions[0x52] = () =>

	function saveState(callback) {
		if (onSaveState)
			onSaveState();
		let savedSrcEnd = srcEnd;
		let savedPosition = position;
		let savedStringPosition = stringPosition;
		let savedSrcStringStart = srcStringStart;
		let savedSrcStringEnd = srcStringEnd;
		let savedSrcString = srcString;
		let savedStrings = strings;
		let savedReferenceMap = referenceMap;
		let savedBundledStrings = bundledStrings;

		// TODO: We may need to revisit this if we do more external calls to user code (since it could be slow)
		let savedSrc = new Uint8Array(src.slice(0, srcEnd)); // we copy the data in case it changes while external data is processed
		let savedStructures = currentStructures;
		let savedStructuresContents = currentStructures.slice(0, currentStructures.length);
		let savedPackr = currentUnpackr;
		let savedSequentialMode = sequentialMode;
		let value = callback();
		srcEnd = savedSrcEnd;
		position = savedPosition;
		stringPosition = savedStringPosition;
		srcStringStart = savedSrcStringStart;
		srcStringEnd = savedSrcStringEnd;
		srcString = savedSrcString;
		strings = savedStrings;
		referenceMap = savedReferenceMap;
		bundledStrings = savedBundledStrings;
		src = savedSrc;
		sequentialMode = savedSequentialMode;
		currentStructures = savedStructures;
		currentStructures.splice(0, currentStructures.length, ...savedStructuresContents);
		currentUnpackr = savedPackr;
		dataView = new DataView(src.buffer, src.byteOffset, src.byteLength);
		return value
	}
	function clearSource() {
		src = null;
		referenceMap = null;
		currentStructures = null;
	}

	function addExtension(extension) {
		if (extension.unpack)
			currentExtensions[extension.type] = extension.unpack;
		else
			currentExtensions[extension.type] = extension;
	}

	const mult10 = new Array(147); // this is a table matching binary exponents to the multiplier to determine significant digit rounding
	for (let i = 0; i < 256; i++) {
		mult10[i] = +('1e' + Math.floor(45.15 - i * 0.30103));
	}
	const Decoder = Unpackr;
	var defaultUnpackr = new Unpackr({ useRecords: false });
	const unpack = defaultUnpackr.unpack;
	const unpackMultiple = defaultUnpackr.unpackMultiple;
	const decode = defaultUnpackr.unpack;
	const FLOAT32_OPTIONS = {
		NEVER: 0,
		ALWAYS: 1,
		DECIMAL_ROUND: 3,
		DECIMAL_FIT: 4
	};
	let f32Array = new Float32Array(1);
	let u8Array = new Uint8Array(f32Array.buffer, 0, 4);
	function roundFloat32(float32Number) {
		f32Array[0] = float32Number;
		let multiplier = mult10[((u8Array[3] & 0x7f) << 1) | (u8Array[2] >> 7)];
		return ((multiplier * float32Number + (float32Number > 0 ? 0.5 : -0.5)) >> 0) / multiplier
	}
	function setRea