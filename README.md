# Quickbox

Quickbox creates 3D-printable housings for PCBs quickly ;)

## Example

The example creates a box for my [Relay PCB](https://github.com/jue89/homie/tree/e0ac7c5c169492dfbcdd71f9aee6d2f9dbe502f9/devices/relay/pcb) with:
 * [M3 press-fit screw inserts](https://www.3djake.de/3djake/gewindeeinsaetze-50er-set) for the box and PCB mountings
 * [M3 countersunk screws](https://www.reichelt.de/flach-senkkopfschrauben-schlitz-m3-10-mm-200-stueck-ssk-m3x10-200-p65736.html) for the box
 * [M3 cylinderhead screws](https://www.reichelt.de/zylinderkopfschrauben-schlitz-m3-6-mm-200-stueck-szk-m3x6-200-p65692.html?&trstct=pol_0&nbc=1) for PCB mountings

```js
const {Box} = require('quickbox');
const {TR, BR, BL, TL, CC, BC} = require('quickbox/alignment');
const {rectangle} = require('quickbox/elements');

const box = new Box({
	/* All units in mm */
	tolerances: {
		/* 3D prints aren't perfect.
		 * The oversize option adds a gap at every point the 3D print
		 * touches any other object like jacks, PCB, ... */
		oversize: 0.2
	},
	box: {
		/* Box radius */
		radius: 6,

		/* Wall thickness. Make sure to select a multiple of the 3D
		 * printer's nozzle diameter for best printing results. */
		wall: 1.6,

		/* Box height */
		height: 30,

		/* Box screws: */
		boxScrew: {
			/* Diameter of the thread insert */
			threadInsertDiameter: 4,

			/* Height of the thread insert */
			threadInsertHeight: 5.7,

			/* Screw diameter */
			screwDiameter: 3,

			/* Screw head diameter */
			screwHeadDiamter: 5.6
		},

		/* Inner PCB mounting screws: */
		mountingScrew: {
			/* Diameter of the thread insert */
			threadInsertDiameter: 4,

			/* Height of the thread insert */
			threadInsertHeight: 5.7,

			/* Diameter of the dome the PCB is resting on */
			domeDiameter: 12
		}
	},
	pcb: {
		/* Size of the rectangular PCB */
		size: [55.88, 46.99],

		/* PCB thickness */
		thickness: 1.5,

		/* Padding measured from the PCB edge to the outer box edge
		 *        N   E     S   W */
		padding: [15, 6.48, 15, 7.49]
	},
	mounts: [
		/* Center positions of the PCB mounts.
		 * The left bottom corner of the PCB is point [0, 0] */
		[35.56, 3.81],
		[35.56, 43.18],
	],
	breakouts: [{
		/* Side of the PCB:
		 * 'n': Northern side, upper edge
		 * 'e': Eastern side, right edge
		 * 's': Southern side, lower edge
		 * 'w': Western side, left edge */
		face: 'w',

		/* Position of [0, 0]:
		 * 'pcb-left': Left upper corner when locking on the PCB's side
		 * 'center': Center of the box */
		anchor: 'pcb-left',

		/* 2D sketch of the breakouts:
		 * breakout-name: geom2 */
		sketch: {
			j8_5: BL([0.635, 0], rectangle({size: [45.72, 10.3]}))
		}
	}, {
		face: 'e',
		anchor: 'pcb-left',
		sketch: {
			j4: BC([6.35, 0], rectangle({size: [11.36, 10.3]})),
			j3: BC([24.13, 1.02], rectangle({size: [11.31, 15.11]})),
			j1: BC([40.64, 1.02], rectangle({size: [11.31, 15.11]}))
		}
	}]
});

box.createBaseSTL('relay-base.stl');
box.createCapSTL('relay-cap.stl');
```
