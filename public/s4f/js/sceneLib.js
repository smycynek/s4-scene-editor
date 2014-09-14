//General routines for setting up scene -- requires lib folder.

//Simple ThreeJS vector string formatter
var vecToString = function (vec) {
    return vec.x.toString() + ", " + vec.y.toString() + ", " + vec.z.toString();
};

 //Format json with indents and newlines for presentation
var prettyPrintJSON = function (parsedJson) {
    return JSON.stringify(parsedJson, null, '\t');
};

 var chopQuotes = function (str) {
    return str.substring(1, str.length - 1);
};

//The Ace editor reads escaped quotes as literal characters rather than quote marks.
//This reformats the text to work properly with Ace.
var formatCode = function (str, chop) {
    if (chop) {
        return chopQuotes(str.replace(/\\/g, ''));
    }
    return str.replace(/\\/g, '');
};


//Create color values from RGB inputs
var colorByTriple = function (red, green, blue) {
    this.color = blue + (green << 8) + (red << 16);
};

// Create color values from hex strings
var color = function (hexValue) {
    this.color = parseInt(hexValue, 16);
};

//Create a new color with RGB values scaled by a factor.
var scaleColor = function (color, scale) {
    var red;
    var green;
    var blue;
    red =   (color.color & 0xff0000) >> 16;
    green = (color.color & 0x00ff00) >> 8;
    blue =  (color.color & 0x0000ff);

    return new colorByTriple(Math.floor(red * scale), Math.floor(blue * scale), Math.floor(green * scale));
};

//Set basic translation, rotation, and other parameters on an object from parsed JSON input
var basicInit = function (geometry, jsonParameters) {
    geometry.position.x = jsonParameters.Data.Position.X;
    geometry.position.y = jsonParameters.Data.Position.Y;
    geometry.position.z = jsonParameters.Data.Position.Z;
    geometry.rotation.x = jsonParameters.Data.Rotation.X;
    geometry.rotation.y = jsonParameters.Data.Rotation.Y;
    geometry.rotation.z = jsonParameters.Data.Rotation.Z;
    geometry.animationTrack = jsonParameters.AnimationTrack;
    geometry.originalRotation = {x : geometry.rotation.x, y : geometry.rotation.y, z: geometry.rotation.z};
    geometry.originalPosition = {x : geometry.position.x, y: geometry.position.y, z: geometry.position.z};
    geometry.castShadow = true;
    geometry.receiveShadow = true;
};


//Make a simple shaded material to show basic highlights of a given color-with optional normal map
var makeMaterial = function (color, useNormalMap) {
    var material = new THREE.MeshPhongMaterial({
        transparent: true,
        opacity: 0.75,
            // light
            specular: scaleColor(color, 1.05).color,
            // intermediate
            color: color.color,
            // dark
            emissive: scaleColor(color, 0.95).color,
            shininess: 160,
            side : THREE.DoubleSide
        });

    if (useNormalMap) {
        var normalMap = THREE.ImageUtils.loadTexture("./assets/normalMap4.png");
        material.normalMap = normalMap;
        material.normalScale = new THREE.Vector2(0.5, 0.5);
    }
    return material;
};


    //Simple default camera
    var makeCamera = function () {
        var camera =  new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        return camera;
    };

//Basic scene template setup -- create scene, add lights, and return scene object
var newScene = function () {
    var scene = new THREE.Scene();
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(20, 40, 20);
    spotLight.castShadow = true;
        //spotLight.angle = Math.PI / 2.5;
        spotLight.shadowCameraNear = 20;
        spotLight.shadowCameraFar = 150;
        scene.add(spotLight);
        return scene;
};



