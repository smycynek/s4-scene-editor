
var threeNgApp = angular.module("threeNgApp", []);

threeNgApp.controller("RenderCtrl", function ($scope, $http) {
    //Bind UI controls
    $scope.setFast = function () { $scope.fastCamera = true; $scope.increment = $scope.bigIncrement; };
    $scope.setSlow = function () { $scope.fastCamera = false; $scope.increment = $scope.smallIncrement; };
    $scope.bigIncrement = 0.01;
    $scope.smallIncrement = 0.003;
    $scope.increment = $scope.smallIncrement;
    $scope.rotation = 0;
    $scope.continueRender = true;
    $scope.fastCamera = false;
    $scope.count = 0;
    $scope.direction = true;
    $scope.stop = function () { $scope.continueRender = false; };
    $scope.start = function () { $scope.continueRender = true; };

    //Create color values from RGB inputs or hex strings
    $scope.colorT = function (red, blue, green) {
        this.color = blue + (green << 8) + (red << 16);
    };


    $scope.color = function (hexValue) {
        this.color = parseInt(hexValue, 16);
    };


    $scope.scaleColor = function(color, scale) {
        var red;
        var green;
        var blue;
        red =   (color.color & 0xff0000) >> 16;
        green = (color.color & 0x00ff00) >> 8;
        blue =  (color.color & 0x0000ff);
        return new $scope.colorT(Math.floor(red * scale), Math.floor(blue * scale), Math.floor(green * scale));
    };

    $scope.basicInit = function(geometry, jsonParameters) {
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
        var material = $scope.makeMaterial(color, true);
        return new THREE.Mesh(geometry, material);
    };

    //Make a box from S4F JSON data 
    $scope.makeBoxFromJson = function (jsonItem) {
        var geometry = $scope.makeBox(jsonItem.Data.Parameters.Length, jsonItem.Data.Parameters.Width, jsonItem.Data.Parameters.Depth, new $scope.color(jsonItem.Data.Color));
        $scope.basicInit(geometry, jsonItem.Data);
        return geometry;
    };

    $scope.makeExtrusion = function(profile, depth, color) {
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

    $scope.makeExtrusionFromJson = function(jsonItem) {
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
        geometry.skipRotate = true;
        return geometry;
    };

    //Same as for box, but for cylinder
    $scope.makeCylinder = function (radiusTop, radiusBottom, height, verticalSegments, horizontalSegments, closed, color) {
        var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, verticalSegments, horizontalSegments, closed);
        var material = $scope.makeMaterial(color, true);
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
        var material = $scope.makeMaterial(color, true);
        return new THREE.Mesh(geometry, material);
    };

    //Same as for box, but for cone
    $scope.makeConeFromJson = function (jsonItem) {
        var geometry = $scope.makeCone(jsonItem.Data.Parameters.Radius, jsonItem.Data.Parameters.Height, 40, 40, false, new $scope.color(jsonItem.Data.Color));
        $scope.basicInit(geometry, jsonItem.Data);
        return geometry;
    };

    //Make a simple shaded material to show basic highlights of a given color.
    $scope.makeMaterial = function (color, useTexture) {
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

        if (useTexture) {
            var normalMap = THREE.ImageUtils.loadTexture("./assets/normalMap4.png");
            material.normalMap = normalMap;
            material.normalScale = new THREE.Vector2(0.5, 0.5);
        }
        return material;
    };

    $scope.makeCamera = function() {
        var camera =  new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        camera.position.z = 5;
        return camera;
    };


    //Refresh JSON scene from server and place in web-page text view.
    $scope.showGeneralScene = function() {
        //Get JSON S4F data containing geometry and textures
        $http({ method: 'GET', url: '/three/data/shapes.json' }).success(function (sceneJsonParsed, status, headers, config) {
            $scope.currentJson = JSON.stringify(sceneJsonParsed);
            $scope.updateRender();
        });
    };

//Refresh JSON scene from server and place in web-page text view.
    $scope.showRoomScene = function() {
        //Get JSON S4F data containing geometry and textures
        $http({ method: 'GET', url: '/three/data/rooms.json' }).success(function (sceneJsonParsed, status, headers, config) {
            $scope.currentJson = JSON.stringify(sceneJsonParsed);
            $scope.updateRender();
        });
    };

    ///Update the scene with the json text in the web-page text view.
    $scope.updateRender = function() {
        if ($scope.sceneItems) {
            //Remove old scene items
            $scope.sceneItems.forEach(function (item) {
                $scope.scene.remove(item);
            });
        }
        $scope.sceneItems = $scope.createSceneItems(JSON.parse($scope.currentJson));
            
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

    $scope.makeRenderer = function() {
        var renderer = new THREE.WebGLRenderer();
        renderer.shadowMapEnabled = true;
        renderer.setSize(window.innerWidth / 3, window.innerHeight / 3);
        document.getElementById("RenderWindow").appendChild(renderer.domElement);
        if ($scope.continueRender == false)
            $scope.continueRender = true;
                return renderer;
    };

    $scope.newScene = function() {
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
        spotLight.position.set(-10,10,10);
        spotLight.castShadow = true;
        spotLight.angle = Math.PI/2.5;
        scene.add(spotLight);
        return scene;
    };

    $scope.createSceneItems=function(jsonS4Data) {
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
                    aplane.name="theplane";
                    sceneItems.push(aplane);
                    break;
                case "Extrusion":
                    var anextrusion = $scope.makeExtrusionFromJson(item);
                    sceneItems.push(anextrusion);
                default:
            }
        });
            return sceneItems;
    };

    $scope.clearRotation = function() {
        $scope.rotation = 0;
        $scope.sceneItems.forEach(function(item) {
            if(!item.skipRotate) {
                item.rotation.x = item.originalRotation.x;
                item.rotation.y = item.originalRotation.y;
            }
        });
    };
    $scope.renderImpl = function() {
        requestAnimationFrame($scope.renderImpl);
        if ($scope.continueRender == false)
            return;
        //Rotate each item in the scene a bit in each frame
        $scope.sceneItems.forEach(function (item) {
            if (!item.skipRotate) {
                item.rotation.x += $scope.rotation / 500;
                item.rotation.y += $scope.rotation / 1000;
            }
        });
                //Orbit the camera around the items in the scene a bit each frame.
            
        $scope.camera.position.y = 2;
        $scope.camera.position.x = $scope.camera.position.x * Math.cos($scope.increment) + $scope.camera.position.z * Math.sin($scope.increment);
        $scope.camera.position.z = $scope.camera.position.z * Math.cos($scope.increment) - $scope.camera.position.x * Math.sin($scope.increment);
        $scope.camera.lookAt($scope.scene.position);
        $scope.renderer.render($scope.scene, $scope.camera);
    };

    //Main entrypoint into the render loop
    $scope.mainRender = function () {
        //Get JSON S4F data containing geometry and textures
        $http({ method: 'GET', url: '/three/data/rooms.json' }).success(function (sceneJsonParsed, status, headers, config) {
          
           $scope.currentJson =JSON.stringify(sceneJsonParsed);
           $scope.updateRender();
           $scope.renderImpl();
        });
    };
});


threeNgApp.directive("range",function(){
    return {
        restrict: "E",
        template: '<input type="range" min="-20" max="20" value="0" ng-model="rotation" style="width:100px; display:inline"/>',
        link: function(scope,element){
            var rangeControl = element.find("input");
            rangeControl.bind("change",function(){
                scope.$apply(function(){
                    scope.rotation = rangeControl.val();
                });
     
            });
        }
    };
});