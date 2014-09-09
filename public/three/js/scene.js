
var threeNgApp = angular.module("threeNgApp", []);


//Simple ThreeJS vector string formatter
var vecToString = function (vec) {
    return vec.x.toString() + ", "+ vec.y.toString() + ", " + vec.z.toString();
};

//Make a 2-second tween translation of an object between two points.
var makeTween = function (object, startVec, endVec) {
          var tween = new TWEEN.Tween( { x : startVec.x, y : startVec.y, z : startVec.z, theItem: object} )
                    .to( { x : endVec.x, y : endVec.y, z : endVec.z}, 2000 )
                    .easing( TWEEN.Easing.Linear.None )
                    .onStart( function() {
                        this.theItem.position.x = this.x;
                        this.theItem.position.y = this.y;
                        this.theItem.position.z = this.z;
                        this.theItem.geometry.verticesNeedUpdate=true;
                        this.theItem.geometry.normalsNeedUpdate = true;
                    
                    })
                    .onUpdate( function () {

                        this.theItem.position.x = this.x;
                        this.theItem.position.y = this.y;
                        this.theItem.position.z = this.z;

                        this.theItem.geometry.verticesNeedUpdate = true;
                        this.theItem.geometry.normalsNeedUpdate = true;
                     
                        //console.log("Object: " + vecToString(this.theItem.position));

                    } )
                    .onComplete(function() {
                        this.theItem.geometry.verticesNeedUpdate=true;
                        this.theItem.geometry.normalsNeedUpdate = true;
                    });

                    return tween;
                   
};

//Make a set of tween translation animations on an object in sequence from a list of points in a path
var makeAnimationChain = function(object, pointList) {
                    var tweens = [];
                    if (pointList.length <2)
                        return;
                    for (var idx = 0; idx != pointList.length; idx = idx+1) {
                        var currentVector = {x : pointList[idx][0], y : pointList[idx][1], z : pointList[idx][2]};
                        var nextVector = {x : pointList[idx+1][0], y : pointList[idx+1][1], z : pointList[idx+1][2]};
                       
                        var tween = makeTween(object, currentVector, nextVector);
                        tweens.push(tween);
                        if (idx > 0) {
                            tweens[idx-1].chain(tweens[idx]);
                        }
                        if (idx == pointList.length-2) {
                            break;
                        }

                    }
                   return tweens;
               };


//Main (and only) angular controller for the body of index.html
threeNgApp.controller("RenderCtrl", function ($scope, $http) {
    $scope.debug = false;
    $scope.orbitSpeed = 0;
    $scope.continueRender = true;

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

    //Make a box with given dimensions and color with simple shaded material
    $scope.makeBox = function (length, width, depth, color) {
        var geometry = new THREE.BoxGeometry(length, width, depth);
        var material = $scope.makeMaterial(color, false);
        return new THREE.Mesh(geometry, material);
    };

    //Make a box from S4F JSON data 
    $scope.makeBoxFromJson = function (jsonItem) {
        var geometry = $scope.makeBox(jsonItem.Data.Parameters.Length, jsonItem.Data.Parameters.Width, jsonItem.Data.Parameters.Depth, new $scope.color(jsonItem.Data.Color));
        $scope.basicInit(geometry, jsonItem);
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
        $scope.basicInit(geometry, jsonItem);
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
        $scope.basicInit(geometry, jsonItem);
        //geometry.skipTranslate = true;  //We don't rotate planes in animations currently, so add this extra attribute.
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
        $scope.basicInit(geometry, jsonItem);
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
        $scope.basicInit(geometry, jsonItem);
        return geometry;
    };

    //Make a simple shaded material to show basic highlights of a given color-with optional normal map
    $scope.makeMaterial = function (color, useNormalMap) {
        var material = new THREE.MeshPhongMaterial({
            transparent: true, 
            opacity: 0.75,
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
            $scope.animationTracks = sceneJsonParsed.AnimationTracks;
            $scope.currentJson = $scope.prettyPrintJSON(sceneJsonParsed);
            $scope.setText($scope.prettyPrintJSON(sceneJsonParsed), false);
            $scope.updateRender();
            if ($scope.debug) {
                console.log(status);
                console.log(headers);
                console.log(config);
            }
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
        if ($scope.debug) {
            console.log(text);
        }
        var parsed = JSON.parse(text);
        $scope.sceneItems = $scope.createSceneItems(parsed);
        $scope.animationTracks = parsed.AnimationTracks;
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
        renderer.setSize(window.innerWidth / 2.5, window.innerHeight / 2);
        document.getElementById("RenderWindow").appendChild(renderer.domElement);
        if ($scope.continueRender === false) {
            $scope.continueRender = true;
        }
        return renderer;
    };

    //Basic scene template setup -- create scene, add lights, and return scene object
    $scope.newScene = function () {
        var scene = new THREE.Scene();
       // var ambientLight = new THREE.AmbientLight(0x111111);
        //scene.add(ambientLight);
        // Simple directional lighting, just to show some highlights
        //var directionalLight = new THREE.DirectionalLight(0x333333);
        //directionalLight.position.set(50, 50, 50);
        //directionalLight.castShadow = true;
        //directionalLight.shadowCameraNear = 0.1;
        //directionalLight.shadowCameraFar = 5;
        //scene.add(directionalLight);

        var spotLight = new THREE.SpotLight(0xffffff);
        spotLight.position.set(20, 40, 20);
        spotLight.castShadow = true;
        //spotLight.angle = Math.PI / 2.5;
        spotLight.shadowCameraNear = 20;
        spotLight.shadowCameraFar = 150;
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
        $scope.sceneItems.forEach(function (item) {
                item.rotation.x = item.originalRotation.x;
                item.rotation.y = item.originalRotation.y;
                item.rotation.z = item.originalRotation.z;
            }
        );
    };

    //Main render animation loop -- draws all items in scene, rotates objects and camera in each frame.
    $scope.renderImpl = function () {
        TWEEN.update();  //update individual object animations
        requestAnimationFrame($scope.renderImpl);
        if ($scope.continueRender === false) {
            return;
        }
        //Rotate each item in the scene a bit in each frame
        if ($scope.sceneItems) {
            $scope.sceneItems.forEach(function (item) {
               //none
            });
            //Orbit the camera around the items in the scene a bit each frame.
            $scope.camera.position.y = 2;
            $scope.camera.position.x = $scope.camera.position.x * Math.cos($scope.orbitSpeed/1000) + $scope.camera.position.z * Math.sin($scope.orbitSpeed/1000);
            $scope.camera.position.z = $scope.camera.position.z * Math.cos($scope.orbitSpeed/1000) - $scope.camera.position.x * Math.sin($scope.orbitSpeed/1000);
            $scope.camera.lookAt($scope.scene.position);
            $scope.renderer.render($scope.scene, $scope.camera);
        }
    };

    //Animate all the objects in a scene from the animation-track data supplied in the json file.
    //Known issue --only one animation per scene (at a time) is currently supported -- currently investigating.
    $scope.animateObjects = function () {
         if ($scope.sceneItems) {
            $scope.sceneItems.forEach(function (item) {
                //if (!item.skipTranslate) {
                    var itemPath = [];
                    //See if an animation track was defined
                    var animationTrackPoints = $scope.animationTracks[item.animationTrack];
                    if (animationTrackPoints) {
                        //Add the original position of the object as the first point
                        itemPath.push([item.position.x, item.position.y, item.position.z]);
                        animationTrackPoints.forEach(function (trackPoint) {
                            itemPath.push(trackPoint);
                        });
                        //Return to the object's original position
                        itemPath.push([item.position.x, item.position.y, item.position.z])
                        //Make the set of animations and start them.
                        var tweens = makeAnimationChain(item, itemPath);
                        tweens[0].start();
                    }
                //}
            });
        }
    }

    //Main entrypoint into the render loop -- initialize with "Room" scene.
    $scope.mainRender = function () {
        $scope.showRoomScene();
        $scope.renderImpl();
    };
    //Instantiate ace JSON editor
    var editor = ace.edit("editor");
    editor.setTheme("ace/theme/chrome");
    editor.getSession().setMode("ace/mode/json");
    //editor.getSession().setUseWrapMode(true);
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
            if ($scope.debug) {
                console.log(chopped);
            }
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
        template: '<input type="range" min="-10" max="10" value="0" ng-model="orbitSpeed" style="width:100px; display:inline"/>',
        link: function (scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function () {
                scope.$apply(function () {
                    scope.orbitSpeed = rangeControl.val();
                });
            });
        }
    };
});
