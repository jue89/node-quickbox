const {align} = require('@jscad/modeling').transforms;

function TR (point, element) {
	return align({modes: ['max', 'max'], grouped: true, relativeTo: point}, element);
}

function BR (point, element) {
	return align({modes: ['max', 'min'], grouped: true, relativeTo: point}, element);
}

function BL (point, element) {
	return align({modes: ['min', 'min'], grouped: true, relativeTo: point}, element);
}

function TL (point, element) {
	return align({modes: ['min', 'max'], grouped: true, relativeTo: point}, element);
}

function CC (point, element) {
	return align({modes: ['center', 'center'], grouped: true, relativeTo: point}, element);
}

function BC (point, element) {
	return align({modes: ['center', 'min'], grouped: true, relativeTo: point}, element);
}

module.exports = {TR, BR, BL, TL, CC, BC};
