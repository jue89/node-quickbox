const fs = require('fs');

const jscad = require('@jscad/modeling');
const {align} = jscad.transforms;
const {generalize} = jscad.modifiers;

const stl = require('@jscad/stl-serializer');

const {boxBase, boxCap, addMountingHoles, removeBreakouts} = require('./lib/box.js');

function exec (ops) {
	let obj;
	for (let op of ops) {
		const fn = op.shift();
		const args = [...op, obj];
		obj = fn.apply(null, args);
	}
	return obj;
}

function serialize (lib, geom) {
	// Workaround: https://github.com/jscad/OpenJSCAD.org/issues/951
	geom = generalize({triangulate: true}, geom);
	const data = lib.serialize({binary: false}, geom).map((b) => Buffer.from(b));
	return Buffer.concat(data);
}

class Box {
	constructor (defintion) {
		this.defintion = defintion;
	}

	createBase () {
		const {tolerances, box, pcb, mounts, breakouts} = this.defintion;

		return exec([
			[boxBase, {
				size: [
					pcb.padding[1] + pcb.size[0] + pcb.padding[3],
					pcb.padding[0] + pcb.size[1] + pcb.padding[2],
					box.height
				],
				radius: box.radius,
				wall: box.wall,
				threadRadius: box.boxScrew.threadInsertDiameter / 2 + tolerances.oversize * 2,
			}],
			[addMountingHoles, {
				origin: [pcb.padding[3], pcb.padding[2], box.wall],
				threadHeight: box.mountingScrew.threadInsertHeight,
				threadRadius: box.mountingScrew.threadInsertDiameter / 2 + tolerances.oversize * 2,
				domeRadius: box.mountingScrew.domeDiameter / 2,
				points: mounts
			}],
			...breakouts.map(({face, anchor, sketch}) => {
				let alignModes = ['center', 'center'];
				let alignAnchor = [0, 0];
				if (anchor == 'pcb-left') {
					let offset = 0;
					switch (face) {
						case 'e': offset = pcb.padding[2]; break;
						case 's': offset = pcb.padding[3]; break;
						case 'w': offset = pcb.padding[0]; break;
						case 'n': offset = pcb.padding[1]; break;
					}
					alignModes = ['min', 'min'];
					alignAnchor = [
						-offset,
						-box.wall - box.mountingScrew.threadInsertHeight - pcb.thickness
					];
				}

				return [removeBreakouts, {
					geoms: Object.values(sketch),
					oversize: tolerances.oversize,
					face,
					alignModes, alignAnchor,
					wall: box.wall
				}];
			}),
			[align, {modes: ['center', 'center', 'min']}]
		]);
	}

	createBaseSTL (filename) {
		const data = serialize(stl, this.createBase());
		if (filename === undefined) return data;
		else fs.writeFileSync(filename, data);
	}

	createCap () {
		const {tolerances, box, pcb, mounts, breakouts} = this.defintion;
		return boxCap({
			size: [
				pcb.padding[1] + pcb.size[0] + pcb.padding[3],
				pcb.padding[0] + pcb.size[1] + pcb.padding[2]
			],
			radius: box.radius,
			wall: box.wall,
			screwRadius: box.boxScrew.screwDiameter / 2 + tolerances.oversize * 2,
			screwHeadRadius: box.boxScrew.screwHeadDiameter / 2 + tolerances.oversize * 2,
			oversize: tolerances.oversize
		});
	}

	createCapSTL (filename) {
		const data = serialize(stl, this.createCap());
		if (filename === undefined) return data;
		else fs.writeFileSync(filename, data);
	}
}

module.exports = {Box};
