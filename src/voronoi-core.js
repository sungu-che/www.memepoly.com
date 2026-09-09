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
	/* ------------------------------------------------- grid voronoi graph builder */
	function buildGridGraph(map, side, width, height) {
		var cw = width / side;
		var ch = height / side;
		var i, j;
		var centerAt = [];
		for (i = 0; i < side; i++) {
			centerAt[i] = [];
			for (j = 0; j < side; j++) {
				var c = Center();
				c.index = map.centers.length;
				c.point = { x: ((0.5 + i) / side) * width, y: ((0.5 + j) / side) * height };
				c.neighbors = [];
				c.borders = [];
				c.corners = [];
				map.centers.push(c);
				centerAt[i][j] = c;
			}
		}
		var cornerAt = [];
		for (i = 0; i <= side; i++) {
			cornerAt[i] = [];
			for (j = 0; j <= side; j++) {
				var q = Corner();
				q.index = map.corners.length;
				q.point = { x: i * cw, y: j * ch };
				q.border = (i === 0 || i === side || j === 0 || j === side);
				q.touches = [];
				q.protrudes = [];
				q.adjacent = [];
				map.corners.push(q);
				cornerAt[i][j] = q;
			}
		}
		function addToCenterList(list, c) {
			if (c !== null && list.indexOf(c) < 0) { list.push(c); }
		}
		function addToCornerList(list, q) {
			if (q !== null && list.indexOf(q) < 0) { list.push(q); }
		}
		function makeEdge(d0, d1, v0, v1) {
			var e = Edge();
			e.index = map.edges.length;
			e.river = 0;
			map.edges.push(e);
			e.d0 = d0;
			e.d1 = d1;
			e.v0 = v0;
			e.v1 = v1;
			e.midpoint = (v0 !== null && v1 !== null)
				? Point.interpolate(v0.point, v1.point, 0.5)
				: null;
			if (d0 !== null) { d0.borders.push(e); }
			if (d1 !== null) { d1.borders.push(e); }
			if (v0 !== null) { v0.protrudes.push(e); }
			if (v1 !== null) { v1.protrudes.push(e); }
			if (d0 !== null && d1 !== null) {
				addToCenterList(d0.neighbors, d1);
				addToCenterList(d1.neighbors, d0);
			}
			if (v0 !== null && v1 !== null) {
				addToCornerList(v0.adjacent, v1);
				addToCornerList(v1.adjacent, v0);
			}
			if (d0 !== null) {
				addToCornerList(d0.corners, v0);
				addToCornerList(d0.corners, v1);
			}
			if (d1 !== null) {
				addToCornerList(d1.corners, v0);
				addToCornerList(d1.corners, v1);
			}
			if (v0 !== null) {
				addToCenterList(v0.touches, d0);
				addToCenterList(v0.touches, d1);
			}
			if (v1 !== null) {
				addToCenterList(v1.touches, d0);
				addToCenterList(v1.touches, d1);
			}
			return e;
		}
		for (i = 0; i < side; i++) {
			for (j = 0; j < side; j++) {
				if (i + 1 < side) {
					makeEdge(centerAt[i][j], centerAt[i + 1][j],
						cornerAt[i + 1][j], cornerAt[i + 1][j + 1]);
				}
				if (j + 1 < side) {
					makeEdge(centerAt[i][j], centerAt[i][j + 1],
						cornerAt[i][j + 1], cornerAt[i + 1][j + 1]);
				}
			}
		}
		for (i = 0; i < side; i++) {
			makeEdge(centerAt[i][0], null, cornerAt[i][0], cornerAt[i + 1][0]);
			makeEdge(centerAt[i][side - 1], null, cornerAt[i][side], cornerAt[i + 1][side]);
		}
		for (j = 0; j < side; j++) {
			makeEdge(centerAt[0][j], null, cornerAt[0][j], cornerAt[0][j + 1]);
			makeEdge(centerAt[side - 1][j], null, cornerAt[side][j], cornerAt[side][j + 1]);
		}
		map.grid = { side: side, cw: cw, ch: ch, centerAt: centerAt, cornerAt: cornerAt };
	}
	/* -------------------------------------------------------------- [29] map */
	var DEFAULT_LAKE_THRESHOLD = 0.3;
	var DEFAULT_NUMBER_OF_POINTS = 1000;
	function getBiome(p) {
		if (p.ocean) { return "OCEAN"; }
		if (p.water) {
			if (p.elevation < 0.1) { return "MARSH"; }
			if (p.elevation > 0.8) { return "ICE"; }
			return "LAKE";
		}
		if (p.coast) { return "BEACH"; }
		if (p.elevation > 0.8) {
			if (p.moisture > 0.5) { return "SNOW"; }
			if (p.moisture > 0.33) { return "TUNDRA"; }
			if (p.moisture > 0.16) { return "BARE"; }
			return "SCORCHED";
		}
		if (p.elevation > 0.6) {
			if (p.moisture > 0.66) { return "TAIGA"; }
			if (p.moisture > 0.33) { return "SHRUBLAND"; }
			return "TEMPERATE_DESERT";
		}
		if (p.elevation > 0.3) {
			if (p.moisture > 0.83) { return "TEMPERATE_RAIN_FOREST"; }
			if (p.moisture > 0.5) { return "TEMPERATE_DECIDUOUS_FOREST"; }
			if (p.moisture > 0.16) { return "GRASSLAND"; }
			return "TEMPERATE_DESERT";
		}
		if (p.moisture > 0.66) { return "TROPICAL_RAIN_FOREST"; }
		if (p.moisture > 0.33) { return "TROPICAL_SEASONAL_FOREST"; }
		if (p.moisture > 0.16) { return "GRASSLAND"; }
		return "SUBTROPICAL_DESERT";
	}
	function Map(size) {
		var map = {};
		map.SIZE = size;
		map.islandShape = null;
		map.mapRandom = PMPRNG();
		map.needsMoreRandomness = false;
		map.points = [];
		map.centers = [];
		map.corners = [];
		map.edges = [];
		map.newIsland = function (shape, seed) {
			map.islandShape = shape;
			map.mapRandom.seed = seed;
		};
		map.reset = function () {
			map.points = [];
			map.centers = [];
			map.corners = [];
			map.edges = [];
		};
		map.go0PlacePoints = function (numPoints, selector) {
			map.needsMoreRandomness = PointSelector.needsMoreRandomness(selector);
			numPoints = def(numPoints, DEFAULT_NUMBER_OF_POINTS);
			map.reset();
			map.points = selector(numPoints);
		};
		map.go1BuildGraph = function (side) {
			buildGridGraph(map, side, map.SIZE.width, map.SIZE.height);
			map.improveCorners();
			map.points = null;
		};
		map.go2AssignElevations = function (lakeThreshold) {
			lakeThreshold = def(lakeThreshold, DEFAULT_LAKE_THRESHOLD);
			map.assignCornerElevations();
			map.assignOceanCoastAndLand(lakeThreshold);
			map.redistributeElevations(map.landCorners(map.corners));
			var i;
			for (i = 0; i < map.corners.length; i++) {
				var q = map.corners[i];
				if (q.ocean || q.coast) { q.elevation = 0; }
			}
			map.assignPolygonElevations();
		};
		map.go3AssignMoisture = function (riverChance) {
			riverChance = def(riverChance, null);
			map.calculateDownslopes();
			map.calculateWatersheds();
			map.createRivers(riverChance);
			map.assignCornerMoisture();
			map.redistributeMoisture(map.landCorners(map.corners));
			map.assignPolygonMoisture();
		};
		map.go4DecorateMap = function () {
			map.assignBiomes();
		};
		map.improveCorners = function () {
			var newCorners = [];
			var i, j;
			for (i = 0; i < map.corners.length; i++) {
				var q = map.corners[i];
				if (q.border) {
					newCorners[q.index] = q.point;
				} else {
					var p = { x: 0, y: 0 };
					for (j = 0; j < q.touches.length; j++) {
						p.x += q.touches[j].point.x;
						p.y += q.touches[j].point.y;
					}
					p.x /= q.touches.length;
					p.y /= q.touches.length;
					newCorners[q.index] = p;
				}
			}
			for (i = 0; i < map.corners.length; i++) {
				map.corners[i].point = newCorners[i];
			}
			for (i = 0; i < map.edges.length; i++) {
				var e = map.edges[i];
				if (e.v0 !== null && e.v1 !== null) {
					e.midpoint = Point.interpolate(e.v0.point, e.v1.point, 0.5);
				}
			}
		};
		map.landCorners = function (corners) {
			var out = [];
			for (var i = 0; i < corners.length; i++) {
				var q = corners[i];
				if (!q.ocean && !q.coast) { out.push(q); }
			}
			return out;
		};
		map.assignCornerElevations = function () {
			var i, queue = [];
			for (i = 0; i < map.corners.length; i++) {
				map.corners[i].water = !map.inside(map.corners[i].point);
			}
			for (i = 0; i < map.corners.length; i++) {
				var q = map.corners[i];
				if (q.border) {
					q.elevation = 0;
					queue.push(q);
				} else {
					q.elevation = Number.POSITIVE_INFINITY;
				}
			}
			while (queue.length > 0) {
				var c = queue.shift();
				for (var n = 0; n < c.adjacent.length; n++) {
					var s = c.adjacent[n];
					var newElevation = 0.01 + c.elevation;
					if (!c.water && !s.water) {
						newElevation += 1;
						if (map.needsMoreRandomness) {
							newElevation += map.mapRandom.nextDouble();
						}
					}
					if (newElevation < s.elevation) {
						s.elevation = newElevation;
						queue.push(s);
					}
				}
			}
		};
		map.redistributeElevations = function (locations) {
			locations.sort(function (a, b) {
				if (a.elevation > b.elevation) { return 1; }
				if (a.elevation < b.elevation) { return -1; }
				if (a.index > b.index) { return 1; }
				if (a.index < b.index) { return -1; }
				return 0;
			});
			for (var i = 0; i < locations.length; i++) {
				var y = i / (locations.length - 1);
				var x = Math.sqrt(1.1) - Math.sqrt(1.1 * (1 - y));
				if (x > 1) { x = 1; }
				locations[i].elevation = x;
			}
		};
		map.redistributeMoisture = function (locations) {
			locations.sort(function (a, b) {
				if (a.moisture > b.moisture) { return 1; }
				if (a.moisture < b.moisture) { return -1; }
				if (a.index > b.index) { return 1; }
				if (a.index < b.index) { return -1; }
				return 0;
			});
			for (var i = 0; i < locations.length; i++) {
				locations[i].moisture = i / (locations.length - 1);
			}
		};
		map.assignOceanCoastAndLand = function (lakeThreshold) {
			var i, j, queue = [];
			for (i = 0; i < map.centers.length; i++) {
				var p = map.centers[i];
				var numWater = 0;
				for (j = 0; j < p.corners.length; j++) {
					var q = p.corners[j];
					if (q.border) {
						p.border = true;
						p.ocean = true;
						q.water = true;
						queue.push(p);
					}
					if (q.water) { numWater += 1; }
				}
				p.water = (p.ocean || numWater >= p.corners.length * lakeThreshold);
			}
			while (queue.length > 0) {
				var c = queue.shift();
				for (j = 0; j < c.neighbors.length; j++) {
					var r = c.neighbors[j];
					if (r.water && !r.ocean) {
						r.ocean = true;
						queue.push(r);
					}
				}
			}
			for (i = 0; i < map.centers.length; i++) {
				var pc = map.centers[i];
				var numOcean = 0, numLand = 0;
				for (j = 0; j < pc.neighbors.length; j++) {
					numOcean += intFromBoolean(pc.neighbors[j].ocean);
					numLand += intFromBoolean(!pc.neighbors[j].water);
				}
				pc.coast = (numOcean > 0) && (numLand > 0);
			}
			for (i = 0; i < map.corners.length; i++) {
				var qc = map.corners[i];
				var oceanCount = 0, landCount = 0;
				for (j = 0; j < qc.touches.length; j++) {
					oceanCount += intFromBoolean(qc.touches[j].ocean);
					landCount += intFromBoolean(!qc.touches[j].water);
				}
				qc.ocean = (oceanCount === qc.touches.length);
				qc.coast = (oceanCount > 0) && (landCount > 0);
				qc.water = qc.border || ((landCount !== qc.touches.length) && !qc.coast);
			}
		};
		map.assignPolygonElevations = function () {
			for (var i = 0; i < map.centers.length; i++) {
				var p = map.centers[i];
				var sum = 0;
				for (var j = 0; j < p.corners.length; j++) {
					sum += p.corners[j].elevation;
				}
				p.elevation = sum / p.corners.length;
			}
		};
		map.calculateDownslopes = function () {
			for (var i = 0; i < map.corners.length; i++) {
				var q = map.corners[i];
				var r = q;
				for (var j = 0; j < q.adjacent.length; j++) {
					if (q.adjacent[j].elevation <= r.elevation) { r = q.adjacent[j]; }
				}
				q.downslope = r;
			}
		};
		map.calculateWatersheds = function () {
			var i, j, q, r, changed;
			for (i = 0; i < map.corners.length; i++) {
				q = map.corners[i];
				q.watershed = q;
				if (!q.ocean && !q.coast) { q.watershed = q.downslope; }
			}
			for (i = 0; i < 100; i++) {
				changed = false;
				for (j = 0; j < map.corners.length; j++) {
					q = map.corners[j];
					if (!q.ocean && !q.coast && !q.watershed.coast) {
						r = q.downslope.watershed;
						if (!r.ocean) { q.watershed = r; }
						changed = true;
					}
				}
				if (!changed) { break; }
			}
			for (i = 0; i < map.corners.length; i++) {
				q = map.corners[i];
				r = q.watershed;
				r.watershedSize = 1 + (r.watershedSize || 0);
			}
		};
		map.createRivers = function (riverChance) {
			riverChance = coalesce(riverChance, toInt((map.SIZE.width + map.SIZE.height) / 4));
			for (var i = 0; i < riverChance; i++) {
				var q = map.corners[map.mapRandom.nextIntRange(0, map.corners.length - 1)];
				if (q.ocean || q.elevation < 0.3 || q.elevation > 0.9) { continue; }
				while (!q.coast && q !== q.downslope) {
					var edge = map.lookupEdgeFromCorner(q, q.downslope);
					edge.river = edge.river + 1;
					q.river = (q.river || 0) + 1;
					q.downslope.river = (q.downslope.river || 0) + 1;
					q = q.downslope;
				}
			}
		};
		map.assignCornerMoisture = function () {
			var i, queue = [];
			for (i = 0; i < map.corners.length; i++) {
				var q = map.corners[i];
				if ((q.water || q.river > 0) && !q.ocean) {
					q.moisture = q.river > 0 ? Math.min(3, 0.2 * q.river) : 1;
					queue.push(q);
				} else {
					q.moisture = 0;
				}
			}
			while (queue.length > 0) {
				var c = queue.shift();
				for (var j = 0; j < c.adjacent.length; j++) {
					var r = c.adjacent[j];
					var newMoisture = c.moisture * 0.9;
					if (newMoisture > r.moisture) {
						r.moisture = newMoisture;
						queue.push(r);
					}
				}
			}
			for (i = 0; i < map.corners.length; i++) {
				var qc = map.corners[i];
				if (qc.ocean || qc.coast) { qc.moisture = 1; }
			}
		};
		map.assignPolygonMoisture = function () {
			for (var i = 0; i < map.centers.length; i++) {
				var p = map.centers[i];
				var sum = 0;
				for (var j = 0; j < p.corners.length; j++) {
					var q = p.corners[j];
					if (q.moisture > 1) { q.moisture = 1; }
					sum += q.moisture;
				}
				p.moisture = sum / p.corners.length;
			}
		};
		map.assignBiomes = function () {
			for (var i = 0; i < map.centers.length; i++) {
				map.centers[i].biome = getBiome(map.centers[i]);
			}
		};
		map.lookupEdgeFromCenter = function (p, r) {
			for (var i = 0; i < p.borders.length; i++) {
				var e = p.borders[i];
				if (e.d0 === r || e.d1 === r) { return e; }
			}
			return null;
		};
		map.lookupEdgeFromCorner = function (q, s) {
			for (var i = 0; i < q.protrudes.length; i++) {
				var e = q.protrudes[i];
				if (e.v0 === s || e.v1 === s) { return e; }
			}
			return null;
		};
		map.inside = function (p) {
			return map.islandShape({
				x: 2 * (p.x / map.SIZE.width - 0.5),
				y: 2 * (p.y / map.SIZE.height - 0.5)
			});
		};
		map.reset();
		return map;
	}
	/* ------------------------------------------------------ hash -> seed helper */
	function hashToSeeds(hash) {
		hash = (hash + "").replace(/^0x/, "").toLowerCase();
		if (!hash) { return null; }
		while (hash.length < 16) { hash += hash; }
		var seed = parseInt(hash.substr(0, 8), 16);
		var shapeSeed = parseInt(hash.substr(8, 8), 16);
		if (isNaN(seed) || seed === 0) { seed = 1; }
		if (isNaN(shapeSeed) || shapeSeed === 0) { shapeSeed = 1; }
		return {
			seed: seed % INT32_MAX,
			shapeSeed: shapeSeed % INT32_MAX
		};
	}
	function renderFlat(tiles, options) {
		options = options || {};
		var scale = def(options.scale, 2);
		var colors = options.colors || {};
		var waterColor = def(options.waterColor, "#2a2a4a");
		var landColor = def(options.landColor, "#6a6a6a");

		if (!tiles || !tiles.length) {
			return "";
		}

		try {
			var minX = Infinity, minZ = Infinity;
			var maxX = -Infinity, maxZ = -Infinity;
			var m, t;

			for (m = 0; m < tiles.length; m++) {
				t = tiles[m];
				if (!t || typeof t.x === "undefined" || typeof t.z === "undefined") { continue; }
				if (!t.biome) { continue; }
				if (t.x < minX) { minX = t.x; }
				if (t.x > maxX) { maxX = t.x; }
				if (t.z < minZ) { minZ = t.z; }
				if (t.z > maxZ) { maxZ = t.z; }
			}

			if (minX === Infinity) { return ""; }

			var w = (maxX - minX + 1) * scale;
			var h = (maxZ - minZ + 1) * scale;
			var canvas = document.createElement("canvas");
			canvas.width = w;
			canvas.height = h;

			var ctx = canvas.getContext("2d");
			ctx.clearRect(0, 0, w, h);

			var filled = 0;
			for (m = 0; m < tiles.length; m++) {
				t = tiles[m];
				if (!t || typeof t.x === "undefined" || typeof t.z === "undefined") { continue; }
				if (!t.biome) { continue; }

				var color = colors["#" + t.biome] || colors[t.biome];
				if (!color) {
					color = t.water ? waterColor : landColor;
				}
				ctx.fillStyle = color;
				ctx.fillRect((t.x - minX) * scale, (t.z - minZ) * scale, scale, scale);
				filled++;
			}

			if (!filled) { return ""; }
			return canvas.toDataURL("image/png");
		} catch (err) {
			return "";
		}
	}
	/* ------------------------------------------------------------------- build */
	function build(opts) {
		opts = opts || {};
		var side = def(opts.side, 100);
		var width = def(opts.width, 400);
		var height = def(opts.height, 400);
		var seeds = null;
		if (typeof opts.seed !== "undefined" && typeof opts.shapeSeed !== "undefined") {
			seeds = { seed: opts.seed * 1, shapeSeed: opts.shapeSeed * 1 };
		} else {
			seeds = hashToSeeds(opts.hash);
		}
		if (!seeds) { return null; }
		var map = Map({ width: width, height: height });
		var shapeName = def(opts.islandShape, "radial");
		var shape;
		if (shapeName === "perlin") {
			shape = IslandShape.makePerlin(seeds.shapeSeed, def(opts.oceanRatio, 0.5));
		} else if (shapeName === "square") {
			shape = IslandShape.makeSquare();
		} else if (shapeName === "blob") {
			shape = IslandShape.makeBlob();
		} else if (shapeName === "noise") {
			shape = IslandShape.makeNoise(seeds.shapeSeed);
		} else {
			shape = IslandShape.makeRadial(seeds.shapeSeed, def(opts.islandFactor, 1.07));
		}
		map.newIsland(shape, seeds.seed);
		var selector = PointSelector.generateSquare(width, height);
		map.go0PlacePoints(side * side, selector);
		map.go1BuildGraph(side);
		map.go2AssignElevations(def(opts.lakeThreshold, 0.3));
		map.go3AssignMoisture(def(opts.riverChance, 120));
		map.go4DecorateMap();
		var tiles = {};
		for (var idx = 0; idx < map.centers.length; idx++) {
			var c = map.centers[idx];
			var i = toInt(idx / side);
			var j = idx % side;
			var bx = i - side / 2 + 0.5;
			var bz = (j - side) + 0.5;
			tiles[bx + ":" + bz] = {
				index: idx,
				biome: c.biome,
				elevation: c.elevation,
				moisture: c.moisture,
				water: c.water ? true : false,
				ocean: c.ocean ? true : false,
				coast: c.coast ? true : false,
				x: bx,
				y: c.elevation + 0.5,
				z: bz
			};
		}
		return {
			map: map,
			side: side,
			width: width,
			height: height,
			seed: seeds.seed,
			shapeSeed: seeds.shapeSeed,
			tiles: tiles
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
		Edge: Edge,
		Map: Map,
		getBiome: getBiome,
		hashToSeeds: hashToSeeds,
		build: build,
		renderFlat: renderFlat,
		DEFAULT_LAKE_THRESHOLD: DEFAULT_LAKE_THRESHOLD
	};
});