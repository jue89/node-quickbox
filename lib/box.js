const jscad = require('@jscad/modeling');
const {circle, rectangle, square} = jscad.primitives;
const {union, subtract} = jscad.booleans;
const {hull} = jscad.hulls;
const {extrudeLinear, extrudeRotate} = jscad.extrusions;
const {offset} = jscad.expansions;
const {align, translateZ, translate, rotateX, rotateZ} = jscad.transforms;
const {geom2} = jscad.geometries;
const {degToRad} = jscad.utils;

function boxSketchOuter ({size, radius}) {
	const x = size[0] / 2 - radius;
	const y = size[1] / 2 - radius;
	return hull(
		circle({radius, center: [x, y]}),
		circle({radius, center: [x, -y]}),
		circle({radius, center: [-x, y]}),
		circle({radius, center: [-x, -y]})
	);
}

function boxSketchInnerEdge ({center, radius}) {
	const x = radius / 2;
	const y = radius / 2;
	const getCenter = (quadrant) => {
		if (quadrant == 1) return [center[0] + x, center[1] + y];
		if (quadrant == 2) return [center[0] + x, center[1] - y];
		if (quadrant == 3) return [center[0] - x, center[1] - y];
		if (quadrant == 4) return [center[0] - x, center[1] + y];
	};
	const size = radius;
	const items = [circle({center, radius})];
	if (center[0] > 0 || center[1] > 0) {
		items.push(square({size, center: getCenter(1)}));
	}
	if (center[0] > 0 || center[1] < 0) {
		items.push(square({size, center: getCenter(2)}));
	}
	if (center[0] < 0 || center[1] < 0) {
		items.push(square({size, center: getCenter(3)}));
	}
	if (center[0] < 0 || center[1] > 0) {
		items.push(square({size, center: getCenter(4)}));
	}
	return union(items);
}

function boxSketchInner ({size, wall, radius, retract}) {
	const circleX = size[0] / 2 - radius;
	const circleY = size[1] / 2 - radius;
	const circleRadius = radius + retract;
	const rectSize = size.map((a) => a - 2 * wall - 2 * retract);
	return subtract(
		rectangle({size: rectSize}),
		boxSketchInnerEdge({radius: circleRadius, center: [circleX, circleY]}),
		boxSketchInnerEdge({radius: circleRadius, center: [circleX, -circleY]}),
		boxSketchInnerEdge({radius: circleRadius, center: [-circleX, circleY]}),
		boxSketchInnerEdge({radius: circleRadius, center: [-circleX, -circleY]})
	);
}

function boxSketchScrew ({size, radius, screwRadius}) {
	const x = size[0] / 2 - radius;
	const y = size[1] / 2 - radius;
	return union(
		circle({radius: screwRadius, center: [x, y]}),
		circle({radius: screwRadius, center: [x, -y]}),
		circle({radius: screwRadius, center: [-x, y]}),
		circle({radius: screwRadius, center: [-x, -y]}),
	);
}

function boxScrewHead ({center, height, screwRadius, screwHeadRadius, screwHeadHeight}) {
	return translate([...center, 0], extrudeRotate({segments: 32}, geom2.fromPoints([
		[0, 0],
		[screwHeadRadius, 0],
		[screwRadius, screwHeadHeight],
		[screwRadius, height],
		[0, height]
	])));
}

function boxScrewHeads ({size, radius, height, screwRadius, screwHeadRadius, screwHeadHeight}) {
	const x = size[0] / 2 - radius;
	const y = size[1] / 2 - radius;
	return union(
		boxScrewHead({center: [x, y], height, screwRadius, screwHeadRadius, screwHeadHeight}),
		boxScrewHead({center: [x, -y], height, screwRadius, screwHeadRadius, screwHeadHeight}),
		boxScrewHead({center: [-x, y], height, screwRadius, screwHeadRadius, screwHeadHeight}),
		boxScrewHead({center: [-x, -y], height, screwRadius, screwHeadRadius, screwHeadHeight})
	);
}

function boxBase ({size, radius, wall, screwRadius, threadRadius, threadHeight}) {
	const height = size[2];
	size = size.slice(0, 2);
	return subtract(
		translateZ(-wall, extrudeLinear({height}, boxSketchOuter({size, wall, radius}))),
		extrudeLinear({height}, boxSketchInner({size, wall, radius, retract: 0})),
		extrudeLinear({height}, boxSketchScrew({size, wall, radius, screwRadius})),
		translateZ(height - wall - threadHeight, extrudeLinear({height: threadHeight}, boxSketchScrew({size, wall, radius, screwRadius: threadRadius})))
	);
}

function boxCap ({size, radius, wall, screwRadius, screwHeadRadius, oversize}) {
	const screwHeadHeight = (screwHeadRadius - screwRadius);
	const height = wall + screwHeadHeight;
	return subtract(
		union(
			extrudeLinear({height}, boxSketchOuter({size, wall, radius})),
			extrudeLinear({height: height + wall}, boxSketchInner({size, wall, radius, retract: oversize})),
		),
		translateZ(wall, extrudeLinear({height: height + 1}, boxSketchInner({size, wall, radius, retract: oversize + wall}))),
		boxScrewHeads({size, radius, height: height + 1, screwRadius, screwHeadHeight, screwHeadRadius})
	);
}

function mountingHole ({center, height, innerRadius, outerRadius}) {
	return subtract(
		extrudeLinear({height}, circle({center, radius: outerRadius})),
		extrudeLinear({height}, circle({center, radius: innerRadius}))
	);
}

function addMountingHoles ({origin, threadHeight, threadRadius, domeRadius, points}, box) {
	box = align({
		modes: ['min', 'min', 'min'],
		relativeTo: origin.map((n) => -n)
	}, box);
	const items = points.map((center) => {
		return mountingHole({center, height: threadHeight, innerRadius: threadRadius, outerRadius: domeRadius});
	});
	items.unshift(box);
	return union(items);
}

function removeBreakouts ({geoms, oversize, face, wall, alignModes, alignAnchor}, box) {
	const deg90 = degToRad(90);
	switch (face) {
		case 'n': face = 2; break;
		case 'e': face = 3; break;
		case 's': face = 0; break;
		case 'w': face = 1; break;
	}
	for (let i = 0; i < face; i++) box = rotateZ(deg90, box);
	box = rotateX(-deg90, box);
	box = align({
		modes: [...alignModes, 'max'],
		relativeTo: [...alignAnchor, wall + 1]
	}, box);
	box = subtract(
		box,
		geoms.map((g) => extrudeLinear({height: wall + 2}, offset({delta: oversize}, g)))
	);
	box = rotateX(deg90, box);
	for (let i = 0; i < face; i++) box = rotateZ(-deg90, box);
	return box;
}

module.exports = {boxBase, boxCap, addMountingHoles, removeBreakouts};
