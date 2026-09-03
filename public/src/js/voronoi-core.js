/*
Map generation project
<http://www-cs-students.stanford.edu/~amitp/game-programming/polygon-map-generation/>
Copyright 2010 Amit J Patel <amitp@cs.stanford.edu>

licensed under the MIT Open Source license
<http://www.opensource.org/licenses/mit-license.php>


Permission is hereby granted, free of charge, to any person obtaining 
a copy of this software and associated documentation files (the 
"Software"), to deal in the Software without restriction, including 
without limitation the rights to use, copy, modify, merge, publish, 
distribute, sublicense, and/or sell copies of the Software, and to 
permit persons to whom the Software is furnished to do so, subject to 
the following conditions: 
  
The above copyright notice and this permission notice shall be included 
in all copies or substantial portions of the Software. 
  
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, 
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF 
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. 
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY 
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, 
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
*/
(function (root, factory) {
	if (typeof module === "object" && module.exports) {
		module.exports = factory();
	} else {
		root.VoronoiCore = factory();
	}
})(typeof self !== "undefined" ? self : this, function () {
	"use strict";

	/* ---------------------------------------------------------- janicek/core */
	function def(v, d) {
		return typeof v === "undefined" ? d : v;
	}
	function toInt(v) {
		return 0 | v;
	}
	function coalesce() {
		for (var i = 0; i < arguments.length; i++) {
			var v = arguments[i];
			if (v !== null && typeof v !== "undefined") {
				return v;
			}
		}
		return undefined;
	}
	function isUndefinedOrNull(v) {
		return typeof v === "undefined" || v === null;
	}

	/* -------------------------------------------------- as3/conversion-core */
	function intFromBoolean(b) {
		return b ? 1 : 0;
	}
	function booleanFromInt(n) {
		return n !== null && n > 0;
	}

	/* ------------------------------------------------------- as3/point-core */
	var Point = {
		distanceFromOrigin: function (p) {
			return Math.sqrt(p.x * p.x + p.y * p.y);
		},
		distance: function (a, b) {
			return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
		},
		interpolate: function (a, b, f) {
			return { x: (a.x - b.x) * f + b.x, y: (a.y - b.y) * f + b.y };
		},
		normalize: function (p, len) {
			if (p.x === 0 && p.y === 0) {
				p.x = len;
			} else {
				var s = len / Math.sqrt(p.x * p.x + p.y * p.y);
				p.x *= s;
				p.y *= s;
			}
		},
		add: function (a, b) {
			return { x: b.x + a.x, y: b.y + a.y };
		},
		subtract: function (a, b) {
			return { x: a.x - b.x, y: a.y - b.y };
		},
		hash: function (p) {
			return p.x + "," + p.y;
		}
	};

	/* -------------------------------------------------------- as3/rectangle */
	function Rectangle(x, y, w, h) {
		return { x: x || 0, y: y || 0, width: w || 0, height: h || 0 };
	}
	Rectangle.core = function (r) {
		return {
			left: function () { return r.x; },
			right: function () { return r.x + r.width; },
			top: function () { return r.y; },
			bottom: function () { return r.y + r.height; }
		};
	};

	/* ------------------------------------------------------ polygonal/pm-prng */
	function PMPRNG() {
		return {
			seed: 1,
			gen: function () {
				return (this.seed = (16807 * this.seed) % 2147483647);
			},
			nextDouble: function () {
				return this.gen() / 2147483647;
			},
			nextIntRange: function (min, max) {
				min -= 0.4999;
				max += 0.4999;
				return Math.round(min + (max - min) * this.nextDouble());
			},
			nextDoubleRange: function (min, max) {
				return min + (max - min) * this.nextDouble();
			}
		};
	}

	/* ------------------------------------------------------------ janicek/hash */
	function djb2(s) {
		var h = 5381;
		for (var i = 0; i < s.length; i++) {
			h = (h << 5) + h + s.charCodeAt(i);
		}
		return h;
	}

	/* ------------------------- janicek/pseudo-random-number-generators */
	var INT32_MAX = 2147483647;
	var PRNG = {
		makeRandomSeed: function () {
			return Math.floor(Math.random() * INT32_MAX);
		},
		nextParkMiller: function (s) {
			return (16807 * s) % INT32_MAX;
		},
		toFloat: function (s) {
			return s / INT32_MAX;
		},
		toBool: function (s) {
			return PRNG.toFloat(s) > 0.5;
		},
		toFloatRange: function (s, min, max) {
			return min + (max - min) * PRNG.toFloat(s);
		},
		toIntRange: function (s, min, max) {
			return Math.round(min - 0.4999 + (max + 0.4999 - (min - 0.4999)) * PRNG.toFloat(s));
		},
		stringToSeed: function (s) {
			return djb2(s) % INT32_MAX;
		},
		randomGenerator: function (seed, next) {
			return function () {
				return (seed = next(seed));
			};
		}
	};

	/* ---------------------------------------------------------- janicek/array2d */
	function Array2d(v) {
		var value = def(v, []);
		return {
			value: value,
			get: function (x, y) {
				return typeof value[y] === "undefined" ? null : value[y][x];
			},
			set: function (x, y, val) {
				value[y] = def(value[y], []);
				value[y][x] = val;
				return value;
			},
			dimensions: function () {
				var maxX = 0;
				for (var y = 0; y < value.length; y++) {
					if (typeof value[y] !== "undefined") {
						maxX = Math.max(maxX, value[y].length);
					}
				}
				return { x: maxX, y: value.length };
			}
		};
	}

	/* ------------------------------------------------------ janicek/perlin-noise */
	var PERM_BASE = [
		151,160,137,91,90,15,131,13,201,95,96,53,194,233,7,225,140,36,103,30,69,142,8,99,37,
		240,21,10,23,190,6,148,247,120,234,75,0,26,197,62,94,252,219,203,117,35,11,32,57,177,
		33,88,237,149,56,87,174,20,125,136,171,168,68,175,74,165,71,134,139,48,27,166,77,146,
		158,231,83,111,229,122,60,211,133,230,220,105,92,41,55,46,245,40,244,102,143,54,65,25,
		63,161,1,216,80,73,209,76,132,187,208,89,18,169,200,196,135,130,116,188,159,86,164,100,
		109,198,173,186,3,64,52,217,226,250,124,123,5,202,38,147,118,126,255,82,85,212,207,206,
		59,227,47,16,58,17,182,189,28,42,223,183,170,213,119,248,152,2,44,154,163,70,221,153,
		101,155,167,43,172,9,129,22,39,253,19,98,108,110,79,113,224,232,178,185,112,104,218,
		246,97,228,251,34,242,193,238,210,144,12,191,179,162,241,81,51,145,235,249,14,239,107,
		49,192,214,31,181,199,106,157,184,84,204,176,115,121,50,45,127,4,150,254,138,236,205,
		93,222,114,67,29,24,72,243,141,128,195,78,66,215,61,156,180
	];
	var PERM = PERM_BASE.concat(PERM_BASE);

	function makePerlinNoise(width, height, px, py, pz, seed, octaves, falloff) {
		seed = seed || 666;
		octaves = octaves || 4;
		falloff = falloff || 0.5;
		var i;
		var s1 = (seed = (16807 * seed) % 2147483647);
		var s2 = (seed = (16807 * seed) % 2147483647);
		var s3 = (seed = (16807 * seed) % 2147483647);
		var freq = [];
		var amp = [];
		var total = 0;
		for (i = 0; i < octaves; i++) {
			var f = Math.pow(2, i);
			var a = Math.pow(falloff, i);
			total += a;
			freq.push(f);
			amp.push(a);
		}
		total = 1 / total;
		var out = Array2d([]);
		var baseX = px * (1 / 64) + s1;
		py = py * (1 / 64) + s2;
		pz = pz * (1 / 64) + s3;
		var ty;
		for (ty = 0; ty < height; ty++) {
			px = baseX;
			var tx;
			for (tx = 0; tx < width; tx++) {
				var sum = 0;
				for (i = 0; i < octaves; i++) {
					var fr = freq[i];
					var am = amp[i];
					var X = px * fr, Y = py * fr, Z = pz * fr;
					var fX = X - (X % 1), fY = Y - (Y % 1), fZ = Z - (Z % 1);
					var iX = 255 & fX, iY = 255 & fY, iZ = 255 & fZ;
					X -= fX; Y -= fY; Z -= fZ;
					var u = X * X * X * (X * (6 * X - 15) + 10);
					var v = Y * Y * Y * (Y * (6 * Y - 15) + 10);
					var w = Z * Z * Z * (Z * (6 * Z - 15) + 10);
					var A = PERM[iX] + iY, AA = PERM[A] + iZ, AB = PERM[A + 1] + iZ;
					var B = PERM[iX + 1] + iY, BA = PERM[B] + iZ, BB = PERM[B + 1] + iZ;
					var X1 = X - 1, Y1 = Y - 1, Z1 = Z - 1;
					var h;

					h = 15 & PERM[BB + 1];
					var g1 = (0 == (1 & h) ? (h < 8 ? X1 : Y1) : (h < 8 ? -X1 : -Y1)) +
						(0 == (2 & h) ? (h < 4 ? Y1 : (12 === h ? X1 : Z1)) : (h < 4 ? -Y1 : (14 === h ? -X1 : -Z1)));
					h = 15 & PERM[AB + 1];
					var g2 = (0 == (1 & h) ? (h < 8 ? X : Y1) : (h < 8 ? -X : -Y1)) +
						(0 == (2 & h) ? (h < 4 ? Y1 : (12 === h ? X : Z1)) : (h < 4 ? -Y1 : (14 === h ? -X : -Z1)));
					h = 15 & PERM[BA + 1];
					var g3 = (0 == (1 & h) ? (h < 8 ? X1 : Y) : (h < 8 ? -X1 : -Y)) +
						(0 == (2 & h) ? (h < 4 ? Y : (12 === h ? X1 : Z1)) : (h < 4 ? -Y : (14 === h ? -X1 : -Z1)));
					h = 15 & PERM[AA + 1];
					var g4 = (0 == (1 & h) ? (h < 8 ? X : Y) : (h < 8 ? -X : -Y)) +
						(0 == (2 & h) ? (h < 4 ? Y : (12 === h ? X : Z1)) : (h < 4 ? -Y : (14 === h ? -X : -Z1)));
					h = 15 & PERM[BB];
					var g5 = (0 == (1 & h) ? (h < 8 ? X1 : Y1) : (h < 8 ? -X1 : -Y1)) +
						(0 == (2 & h) ? (h < 4 ? Y1 : (12 === h ? X1 : Z)) : (h < 4 ? -Y1 : (14 === h ? -X1 : -Z)));
					h = 15 & PERM[AB];
					var g6 = (0 == (1 & h) ? (h < 8 ? X : Y1) : (h < 8 ? -X : -Y1)) +
						(0 == (2 & h) ? (h < 4 ? Y1 : (12 === h ? X : Z)) : (h < 4 ? -Y1 : (14 === h ? -X : -Z)));
					h = 15 & PERM[BA];
					var g7 = (0 == (1 & h) ? (h < 8 ? X1 : Y) : (h < 8 ? -X1 : -Y)) +
						(0 == (2 & h) ? (h < 4 ? Y : (12 === h ? X1 : Z)) : (h < 4 ? -Y : (14 === h ? -X1 : -Z)));
					h = 15 & PERM[AA];
					var g8 = (0 == (1 & h) ? (h < 8 ? X : Y) : (h < 8 ? -X : -Y)) +
						(0 == (2 & h) ? (h < 4 ? Y : (12 === h ? X : Z)) : (h < 4 ? -Y : (14 === h ? -X : -Z)));

					g2 += u * (g1 - g2);
					g4 += u * (g3 - g4);
					g6 += u * (g5 - g6);
					g8 += u * (g7 - g8);
					g4 += v * (g2 - g4);
					g8 += v * (g6 - g8);
					sum += (g8 + w * (g4 - g8)) * am;
				}
				var c = 128 * (sum * total + 1);
				out.set(tx, ty, 4278190080 | (c << 16) | (c << 8) | c);
				px += 1 / 64;
			}
			py += 1 / 64;
		}
		return out.value;
	}

	/* ------------------------------------------------------------ island-shape */
	var IslandShape = {
		makeRadial: function (seed, islandFactor) {
			islandFactor = def(islandFactor, 1.07);
			var rnd = PMPRNG();
			rnd.seed = seed;
			var bumps = rnd.nextIntRange(1, 6);
			var startAngle = rnd.nextDoubleRange(0, 2 * Math.PI);
			var dipAngle = rnd.nextDoubleRange(0, 2 * Math.PI);
			var dipWidth = rnd.nextDoubleRange(0.2, 0.7);
			return function (q) {
				var angle = Math.atan2(q.y, q.x);
				var length = 0.5 * (Math.max(Math.abs(q.x), Math.abs(q.y)) + Point.distanceFromOrigin(q));
				var r1 = 0.5 + 0.4 * Math.sin(startAngle + bumps * angle + Math.cos((bumps + 3) * angle));
				var r2 = 0.7 - 0.2 * Math.sin(startAngle + bumps * angle - Math.sin((bumps + 2) * angle));
				if (Math.abs(angle - dipAngle) < dipWidth ||
					Math.abs(angle - dipAngle + 2 * Math.PI) < dipWidth ||
					Math.abs(angle - dipAngle - 2 * Math.PI) < dipWidth) {
					r1 = r2 = 0.2;
				}
				return length < r1 || (length > r1 * islandFactor && length < r2);
			};
		},
		makePerlin: function (seed, oceanRatio) {
			oceanRatio = def(oceanRatio, 0.5);
			var threshold = 0.4 * oceanRatio + 0.1;
			var bmp = Array2d(makePerlinNoise(256, 256, 1, 1, 1, seed, 8));
			return function (q) {
				var c = (255 & bmp.get(toInt(128 * (q.x + 1)), toInt(128 * (q.y + 1)))) / 255;
				return c > threshold + threshold * Point.distanceFromOrigin(q) * Point.distanceFromOrigin(q);
			};
		},
		makeSquare: function () {
			return function () { return true; };
		},
		makeBlob: function () {
			return function (q) {
				var eye1 = Point.distanceFromOrigin({ x: q.x - 0.2, y: q.y / 2 + 0.2 }) < 0.05;
				var eye2 = Point.distanceFromOrigin({ x: q.x + 0.2, y: q.y / 2 + 0.2 }) < 0.05;
				var body = Point.distanceFromOrigin(q) < 0.8 - 0.18 * Math.sin(5 * Math.atan2(q.y, q.x));
				return body && !eye1 && !eye2;
			};
		},
		makeNoise: function (seed) {
			return function () {
				seed = PRNG.nextParkMiller(seed);
				return PRNG.toBool(seed);
			};
		},
		makeBitmap: function (grid) {
			var bmp = Array2d(grid);
			var dim = bmp.dimensions();
			return function (q) {
				return bmp.get(toInt(((q.x + 1) / 2) * dim.x), toInt(((q.y + 1) / 2) * dim.y));
			};
		}
	};

	/* ----------------------------------------------------------- point-selector */
	var PointSelector = {
		generateRandom: function (width, height, seed) {
			return function (n) {
				var rnd = PMPRNG();
				rnd.seed = seed;
				var pts = [];
				for (var i = 0; i < n; i++) {
					pts.push({
						x: rnd.nextDoubleRange(10, width - 10),
						y: rnd.nextDoubleRange(10, height - 10)
					});
				}
				return pts;
			};
		},
		generateSquare: function (width, height) {
			return function (n) {
				var pts = [];
				var side = Math.sqrt(n);
				for (var x = 0; x < side; x++) {
					for (var y = 0; y < side; y++) {
						pts.push({
							x: ((0.5 + x) / side) * width,
							y: ((0.5 + y) / side) * height
						});
					}
				}
				return pts;
			};
		},
		generateHexagon: function (width, height) {
			return function (n) {
				var pts = [];
				var side = Math.sqrt(n);
				for (var x = 0; x < side; x++) {
					for (var y = 0; y < side; y++) {
						pts.push({
							x: ((0.5 + x) / side) * width,
							y: ((0.25 + 0.5 * (x % 2) + y) / side) * height
						});
					}
				}
				return pts;
			};
		},
		needsMoreRandomness: function (fn) {
			return fn === PointSelector.generateSquare || fn === PointSelector.generateHexagon;
		}
	};

	/* --------------------------------------------------------------- graph nodes */
	function Center() {
		return {
			index: null, point: null, water: null, ocean: null, coast: null,
			border: null, biome: null, elevation: null, moisture: null,
			neighbors: null, borders: null, corners: null
		};
	}
	function Corner() {
		return {
			index: null, point: null, ocean: null, water: null, coast: null,
			border: null, elevation: null, moisture: null,
			touches: null, protrudes: null, adjacent: null,
			river: null, downslope: null, watershed: null, watershedSize: null
		};
	}
	function Edge() {
		return {
			index: 0, d0: null, d1: null, v0: null, v1: null,
			midpoint: null, river: 0
		};
	}

	return {
		def: def,
		toInt: toInt,
		coalesce: coalesce,
		isUndefinedOrNull: isUndefinedOrNull,
		intFromBoolean: intFromBoolean,
		booleanFromInt: booleanFromInt,
		Point: Point,
		Rectangle: Rectangle,
		PMPRNG: PMPRNG,
		PRNG: PRNG,
		djb2: djb2,
		Array2d: Array2d,
		makePerlinNoise: makePerlinNoise,
		IslandShape: IslandShape,
		PointSelector: PointSelector,
		Center: Center,
		Corner: Corner,
		Edge: Edge
	};
});