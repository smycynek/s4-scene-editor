
var threeNgApp = angular.module("threeNgApp", []);

//Main (and only) angular controller for the body of index.html
threeNgApp.controller("RenderCtrl", function ($scope, $http) {
    $scope.setFast = function () { $scope.fastCamera = true; $scope.increment = $scope.bigIncrement; };
    $scope.setSlow = function () { $scope.fastCamera = false; $scope.increment = $scope.smallIncrement; };
    $scope.bigIncrement = 0.01;
    $scope.smallIncrement = 0.003;
    $scope.increment = $scope.smallIncrement;
    $scope.rotation = 0;
    $scope.continueRender = true;
    $scope.fastCamera = false;
    $scope.stop = function () { $scope.continueRender = false; };
    $scope.start = function () { $scope.continueRender = true; };

    //Create color values from RGB inputs
    $scope.colorByTriple = function (red, blue, green) {
        this.color = blue + (green << 8) + (red << 16);
    };

    //Create color values from hex strings
    $scope.color = function (hexValue) {
        this.color = parseInt(hexValue, 16);
    };

    //Create a new color with RGB values scaled by a factor.
    $scope.scaleColor = function (color, scale) {
        var red;
        var green;
        var blue;
        red =   (color.color & 0xff0000) >> 16;
        green = (color.color & 0x00ff00) >> 8;
        blue =  (color.color & 0x0000ff);
        return new $scope.colorByTriple(Math.floor(red * scale), Math.floor(blue * scale), Math.floor(green * scale));
    };

    //Set basic translation, rotation, and other parameters on an object from parsed JSON input
    $scope.basicInit = function (geometry, jsonParameters) {
        geometry.position.x = jsonParameters.Position.X;
        geometry.position.y = jsonParameters.Position.Y;
        geometry.position.z = jsonParameters.Position.Z;
        geometry.rotation.x = jsonParameters.Rotation.X;
        geometry.rotation.y = jsonParameters.Rotation.Y;
        geometry.rotation.z = jsonParameters.Rotation.Z;

        geometry.originalRotation = {x : geometry.rotation.x, y : geometry.rotation.y};
        geometry.castShadow = true;
        geometry.receiveShadow = true;
    };

    //Make a box with given dimensions and color with simple shaded material
    $scope.makeBox = function (length, width, depth, color) {
        var geometry = new THREE.BoxGeometry(length, width, depth);
        var material = $scope.makeMaterial(color, false);
        return new THREE.Mesh(geometry, material);
    };

    //Make a box from S4F JSON data 
    $scope.makeBoxFromJson = function (jsonItem) {
        var geometry = $scope.makeBox(jsonItem.Data.Parameters.Length, jsonItem.Data.Parameters.Width, jsonItem.Data.Parameters.Depth, new $scope.color(jsonItem.Data.Color));
        $scope.basicInit(geometry, jsonItem.Data);
        return geometry;
    };

    //Make an extrusion of a given depth and color along a given profile (array of 2d arrays of doubles)
    $scope.makeExtrusion = function (profile, depth, color) {
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
        var material = $scope.makeMaterial(color, false);
        return new THREE.Mesh(geometry, material);
    };

    //Make an extrusion from S4F JSON data 
    $scope.makeExtrusionFromJson = function (jsonItem) {
        var geometry = $scope.makeExtrusion(jsonItem.Data.Parameters.Profile, jsonItem.Data.Parameters.Depth, new $scope.color(jsonItem.Data.Color));
        $scope.basicInit(geometry, jsonItem.Data);
        return geometry;
    };

    //Make a box with given dimensions and color with simple shaded material
    $scope.makePlane = function (width, height, color) {
        var geometry = new THREE.PlaneGeometry(width, height, 2, 2);
        var material = $scope.makeMaterial(color, true);
        return new THREE.Mesh(geometry, material);
    };

    //Make a box from S4F JSON data 
    $scope.makePlaneFromJson = function (jsonItem) {
        var geometry = $scope.makePlane(jsonItem.Data.Parameters.Width, jsonItem.Data.Parameters.Height, new $scope.color(jsonItem.Data.Color));
        $scope.basicInit(geometry, jsonItem.Data);
        geometry.skipRotate = true;  //We don't rotate planes in animations currently, so add this extra attribute.
        return geometry;
    };

    //Same as for box, but for cylinder
    $scope.makeCylinder = function (radiusTop, radiusBottom, height, verticalSegments, horizontalSegments, closed, color) {
        var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, verticalSegments, horizontalSegments, closed);
        var material = $scope.makeMaterial(color, false);
        return new THREE.Mesh(geometry, material);
    };

    //Same as for box, but for cylinder
    $scope.makeCylinderFromJson = function (jsonItem) {
        var geometry = $scope.makeCylinder(jsonItem.Data.Parameters.Radius, jsonItem.Data.Parameters.Radius, jsonItem.Data.Parameters.Height, 40, 40, false, new $scope.color(jsonItem.Data.Color));
        $scope.basicInit(geometry, jsonItem.Data);
        return geometry;
    };

    //Same as for box, but for cone
    $scope.makeCone = function (radiusBottom, height, verticalSegments, horizontalSegments, closed, color) {
        var geometry = new THREE.CylinderGeometry(0, radiusBottom, height, verticalSegments, horizontalSegments, closed);
        var material = $scope.makeMaterial(color, false);
        return new THREE.Mesh(geometry, material);
    };

    //Same as for box, but for cone
    $scope.makeConeFromJson = function (jsonItem) {
        var geometry = $scope.makeCone(jsonItem.Data.Parameters.Radius, jsonItem.Data.Parameters.Height, 40, 40, false, new $scope.color(jsonItem.Data.Color));
        $scope.basicInit(geometry, jsonItem.Data);
        return geometry;
    };

    //Make a simple shaded material to show basic highlights of a given color-with optional normal map
    $scope.makeMaterial = function (color, useNormalMap) {
        var material = new THREE.MeshPhongMaterial({
            // light
            specular: $scope.scaleColor(color, 1.05).color,
            // intermediate
            color: color.color,
            // dark
            emissive: $scope.scaleColor(color, 0.95).color,
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
    $scope.makeCamera = function () {
        var camera =  new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        return camera;
    };

    //Format json with indents and newlines for presentation
    $scope.prettyPrintJSON = function (parsedJson) {
        return JSON.stringify(parsedJson, null, '\t');
    };

   //Update the scene with the JSON from a given url string
    $scope.showScene = function (url) {
        $http({ method: 'GET', url: url }).success(function (sceneJsonParsed, status, headers, config) {
            $scope.currentJson = $scope.prettyPrintJSON(sceneJsonParsed);
            $scope.setText($scope.prettyPrintJSON(sceneJsonParsed), false);
            $scope.updateRender();
            console.log(status);
            console.log(headers);
            console.log(config);
        }
            );
    };

    //Refresh JSON scene from server and place in web-page text view.
    $scope.showGeneralScene = function () {
        //Get JSON S4F data containing geometry and textures
        $scope.showScene('/three/data/shapes.json');
    };

    //Refresh JSON scene from server and place in web-page text view.
    $scope.showSimpleScene = function () {
        //Get JSON S4F data containing geometry and textures
        $scope.showScene('/three/data/simple.json');
    };

     //Refresh JSON scene from server and place in web-page text view.
    $scope.showRoomScene = function () {
        //Get JSON S4F data containing geometry and textures
        $scope.showScene('/three/data/rooms.json');
    };

    ///Update the scene with the json text in the web-page text view.
    $scope.updateRender = function () {
        if ($scope.sceneItems) {
            //Remove old scene items
            $scope.sceneItems.forEach(function (item) {
                $scope.scene.remove(item);
            });
        }
        var text = $scope.getText(false);
        console.log(text);
        var parsed = JSON.parse(text);
        $scope.sceneItems = $scope.createSceneItems(parsed);
        $scope.camera = $scope.makeCamera();
        //Create ThreeJS scene
        $scope.scene = $scope.newScene();
        $scope.renderer = $scope.makeRenderer();
        var rw = document.getElementById("RenderWindow");
        while (rw.firstChild) {
            rw.removeChild(rw.firstChild);
        }
        rw.appendChild($scope.renderer.domElement);

        //Add items to scene
        $scope.sceneItems.forEach(function (item) {
            $scope.scene.add(item);
        });
    };

    //Create render context with reasonable default settings for a medium sized window in an
    //html document with div "RenderWindow"
    $scope.makeRenderer = function () {
        var renderer = new THREE.WebGLRenderer();
        renderer.shadowMapEnabled = true;
        renderer.setSize(window.innerWidth / 3.5, window.innerHeight / 3);
        document.getElementById("RenderWindow").appendChild(renderer.domElement);
        if ($scope.continueRender === false) {
            $scope.continueRender = true;
        }
        return renderer;
    };

    //Basic scene template setup -- create scene, add lights, and return scene object
    $scope.newScene = function () {
        var scene = new THREE.Scene();
        var ambientLight = new THREE.AmbientLight(0x111111);
        scene.add(ambientLight);
        // Simple directional lighting, just to show some highlights
        var directionalLight = new THREE.DirectionalLight(0x333333);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadowCameraNear = 0.1;
        directionalLight.shadowCameraFar = 5;
        scene.add(directionalLight);

        var spotLight = new THREE.SpotLight(0x999999);
        spotLight.position.set(-10, 10, 10);
        spotLight.castShadow = true;
        spotLight.angle = Math.PI / 2.5;
        scene.add(spotLight);
        return scene;
    };

    //Iterate through user json data and create 3JS geometry objects based on data
    $scope.createSceneItems = function (jsonS4Data) {
        var sceneItems = [];
        jsonS4Data.ShapeList.forEach(function (item) {
            switch (item.Type) {
            case "Box":
                var cube = $scope.makeBoxFromJson(item);
                sceneItems.push(cube);
                break;
            case "Cylinder":
                var cylinder = $scope.makeCylinderFromJson(item);
                sceneItems.push(cylinder);
                break;
            case "Cone":
                var cone = $scope.makeConeFromJson(item);
                sceneItems.push(cone);
                break;
            case "Plane":
                var aplane = $scope.makePlaneFromJson(item);
                aplane.name = "theplane";
                sceneItems.push(aplane);
                break;
            case "Extrusion":
                var anextrusion = $scope.makeExtrusionFromJson(item);
                sceneItems.push(anextrusion);
                break;
            default:
            }
        });
        return sceneItems;
    };

    //Reset rotation on all scene items back to original settings -- set rotation speed to 0
    $scope.clearRotation = function () {
        $scope.rotation = 0;
        $scope.sceneItems.forEach(function (item) {
            if (!item.skipRotate) {
                item.rotation.x = item.originalRotation.x;
                item.rotation.y = item.originalRotation.y;
            }
        });
    };

    //Main render animation loop -- draws all items in scene, rotates objects and camera in each frame.
    $scope.renderImpl = function () {
        requestAnimationFrame($scope.renderImpl);
        if ($scope.continueRender === false) {
            return;
        }
        //Rotate each item in the scene a bit in each frame
        if ($scope.sceneItems) {
            $scope.sceneItems.forEach(function (item) {
                if (!item.skipRotate) {
                    item.rotation.x += $scope.rotation / 500;
                }
            });
            //Orbit the camera around the items in the scene a bit each frame.
            $scope.camera.position.y = 2;
            $scope.camera.position.x = $scope.camera.position.x * Math.cos($scope.increment) + $scope.camera.position.z * Math.sin($scope.increment);
            $scope.camera.position.z = $scope.camera.position.z * Math.cos($scope.increment) - $scope.camera.position.x * Math.sin($scope.increment);
            $scope.camera.lookAt($scope.scene.position);
            $scope.renderer.render($scope.scene, $scope.camera);
        }
    };

    //Main entrypoint into the render loop -- initialize with "Room" scene.
    $scope.mainRender = function () {
        $scope.showRoomScene();
        $scope.renderImpl();
    };
    //Instantiate ace JSON editor
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/json");
    editor.getSession().setUseWrapMode(true);
    editor.getSession().setTabSize(2);

//Set the ace editor in the angular scope
    $scope.editor = editor;

    $scope.chopQuotes = function (str) {
        return str.substring(1, str.length - 1);
    };

    //The Ace editor reads escaped quotes as literal characters rather than quote marks.
    //This reformats the text to work properly with Ace.
    $scope.formatCode = function (str, chop) {
        if (chop) {
            return $scope.chopQuotes(str.replace(/\\/g, ''));
        }
        return str.replace(/\\/g, '');
    };

    //Get the text in the ACE editor -- option to remove leading and trailing quote marks
    $scope.getText = function (chopQuotes) {
        if (chopQuotes) {
            var chopped = $scope.chopQuotes($scope.editor.getValue());
            console.log(chopped);
            return chopped;
        }
        return $scope.editor.getValue();
    };

    //Set the text in the ACE editor for presentation -- option to remove leading and trailing quote marks
    $scope.setText = function (json, chopText) {
        $scope.editor.setValue($scope.formatCode(json, chopText));
        $scope.editor.moveCursorTo(0, 0);
    };

});


//Extra directive to create an html range input that binds its value to an angular scope variable.
//(Needed only for IE -- other browers do it natively)
threeNgApp.directive("range", function () {
    return {
        restrict: "E",
        template: '<input type="range" min="-20" max="20" value="0" ng-model="rotation" style="width:100px; display:inline"/>',
        link: function (scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function () {
                scope.$apply(function () {
                    scope.rotation = rangeControl.val();
                });
            });
        }
    };
});
