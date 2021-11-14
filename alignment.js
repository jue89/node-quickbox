const {align} = require('@jscad/modeling').transforms;

function TR (point, element) {
	return align({modes: ['max', 'max'], relativeTo: point}, element);
}

function BR (point, element) {
	return align({modes: ['max', 'min'], relativeTo: point}, element);
}

function BL (point, element) {
	return align({modes: ['min', 'min'], relativeTo: point}, element);
}

function TL (point, element) {
	return align({modes: ['min', 'max'], relativeTo: point}, element);
}

function CC (point, element) {
	return align({modes: ['center', 'center'], relativeTo: point}, element);
}

function BC (point, element) {
	return align({modes: ['center', 'min'], relativeTo: point}, element);
}

module.exports = {TR, BR, BL, TL, CC, BC};
