const jscad = require('@jscad/modeling');
const {circle, rectangle, square} = jscad.primitives;
const {geom2} = jscad.geometries;
const {fromPoints} = geom2;

module.exports = {circle, rectangle, square, fromPoints};
