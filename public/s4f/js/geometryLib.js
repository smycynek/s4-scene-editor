//routines to create geometry -- requires sceneLib.js and lib folder

//Make a box with given dimensions and color with simple shaded material
var makeBox = function (length, width, depth, color) {
    var geometry = new THREE.BoxGeometry(length, width, depth);
    var material = makeMaterial(color, false);
    return new THREE.Mesh(geometry, material);
};

//Make a box from S4F JSON data 
var makeBoxFromJson = function (jsonItem) {
    var geometry = makeBox(jsonItem.Data.Parameters.Length, jsonItem.Data.Parameters.Width, jsonItem.Data.Parameters.Depth, new color(jsonItem.Data.Color));
    basicInit(geometry, jsonItem);
    return geometry;
};

//Make an extrusion of a given depth and color along a given profile (array of 2d arrays of doubles)
var makeExtrusion = function (profile, depth, color) {
    var shapePoints = [];
    profile.forEach(function (item) {
        shapePoints.push(new THREE.Vector2(item[0], item[1]));
    });
    var extrusionSettings = {
        amount: depth,
        curveSegmentss: 1,
        bevelThickness: 1,
        bevelSize: 0,
        bevelEnabled: false,
        material: 1,
        extrudeMaterial: 1
    };

    var shape = new THREE.Shape(shapePoints);
    var geometry = new THREE.ExtrudeGeometry(shape, extrusionSettings);
    var material = makeMaterial(color, false);
    return new THREE.Mesh(geometry, material);
};

//Make an extrusion from S4F JSON data 
var makeExtrusionFromJson = function (jsonItem) {
    var geometry = makeExtrusion(jsonItem.Data.Parameters.Profile, jsonItem.Data.Parameters.Depth, new color(jsonItem.Data.Color));
    basicInit(geometry, jsonItem);
    return geometry;
};

//Make a plane with given dimensions and color with simple shaded material
var makePlane = function (width, height, color) {
    var geometry = new THREE.PlaneGeometry(width, height, 2, 2);
    var material = makeMaterial(color, true);
    return new THREE.Mesh(geometry, material);
};

//Make a plane from S4F JSON data 
var makePlaneFromJson = function (jsonItem) {
    var geometry = makePlane(jsonItem.Data.Parameters.Width, jsonItem.Data.Parameters.Height, new color(jsonItem.Data.Color));
    basicInit(geometry, jsonItem);
    return geometry;
};

//Same as for box, but for cylinder
var makeCylinder = function (radiusTop, radiusBottom, height, verticalSegments, horizontalSegments, closed, color) {
    var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, verticalSegments, horizontalSegments, closed);
    var material = makeMaterial(color, false);
    return new THREE.Mesh(geometry, material);
};

//Same as for box, but for cylinder
var makeCylinderFromJson = function (jsonItem) {
    var geometry = makeCylinder(jsonItem.Data.Parameters.Radius, jsonItem.Data.Parameters.Radius, jsonItem.Data.Parameters.Height, 40, 40, false, new color(jsonItem.Data.Color));
    basicInit(geometry, jsonItem);
};

//Same as for box, but for cone
var makeCone = function (radiusBottom, height, verticalSegments, horizontalSegments, closed, color) {
    var geometry = new THREE.CylinderGeometry(0, radiusBottom, height, verticalSegments, horizontalSegments, closed);
    var material = makeMaterial(color, false);
    return new THREE.Mesh(geometry, material);
};

var makeConeFromJson = function (jsonItem) {
    var geometry = makeCone(jsonItem.Data.Parameters.Radius, jsonItem.Data.Parameters.Height, 40, 40, false, new color(jsonItem.Data.Color));
    basicInit(geometry, jsonItem);
    return geometry;
};
