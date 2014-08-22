
var threeNgApp = angular.module("threeNgApp", []);

threeNgApp.controller("RenderCtrl", function ($scope, $http) {
    //Bind UI controls
    $scope.setFast = function () { $scope.fastCamera = true; $scope.increment = $scope.bigIncrement; };
    $scope.setSlow = function () { $scope.fastCamera = false; $scope.increment = $scope.smallIncrement; };
    $scope.bigIncrement = .01;
    $scope.smallIncrement = .003;
    $scope.increment = $scope.smallIncrement;
    $scope.rotation = 10;
    $scope.continueRender = true;
    $scope.fastCamera = false;
    $scope.count = 0;
    $scope.direction = true;
    $scope.stop = function () { $scope.continueRender = false; }
    $scope.start = function () { $scope.continueRender = true; }

    //Create color values from RGB inputs or hex strings
    $scope.color = function (red, blue, green) {
        this.color = (green) + (blue << 8) + (red << 16);
    };

    $scope.color = function (hexValue) {
        this.color = parseInt(hexValue);
    };

    //Make a box with given dimensions and color with simple shaded material
    $scope.makeBox = function (length, width, depth, color) {
        var geometry = new THREE.BoxGeometry(length, width, depth);
        var material = $scope.makeMaterial(color);
        return new THREE.Mesh(geometry, material);
    };

    //Make a box from SSSSF JSON data 
    $scope.makeBoxFromJson = function (jsonItem) {
        var box = $scope.makeBox(jsonItem.Data.Length, jsonItem.Data.Width, jsonItem.Data.Depth, new $scope.color(jsonItem.Data.Color));
        box.position.x = jsonItem.Data.X;
        box.position.y = jsonItem.Data.Y;
        box.position.z = jsonItem.Data.Z;
        return box;
    };

    //Same as for box, but for cylinder
    $scope.makeCylinder = function (radiusTop, radiusBottom, height, verticalSegments, horizontalSegments, closed, color) {
        var geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, verticalSegments, horizontalSegments, closed);
        var material = $scope.makeMaterial(color);
        return new THREE.Mesh(geometry, material);
    };

    //Same as for box, but for cylinder
    $scope.makeCylinderFromJson = function (jsonItem) {
        var cylinder = $scope.makeCylinder(jsonItem.Data.Radius, jsonItem.Data.Radius, jsonItem.Data.Height, 40, 40, false, new $scope.color(jsonItem.Data.Color));
        cylinder.position.x = jsonItem.Data.X;
        cylinder.position.y = jsonItem.Data.Y;
        cylinder.position.z = jsonItem.Data.Z;
        return cylinder;
    };

    //Same as for box, but for cone
    $scope.makeCone = function (radiusBottom, height, verticalSegments, horizontalSegments, closed, color) {
        var geometry = new THREE.CylinderGeometry(0, radiusBottom, height, verticalSegments, horizontalSegments, closed);
        var material = $scope.makeMaterial(color);
        return new THREE.Mesh(geometry, material);
    };

    //Same as for box, but for cone
    $scope.makeConeFromJson = function (jsonItem) {
        var cone = $scope.makeCone(jsonItem.Data.Radius, jsonItem.Data.Height, 40, 40, false, new $scope.color(jsonItem.Data.Color));
        cone.position.x = jsonItem.Data.X;
        cone.position.y = jsonItem.Data.Y;
        cone.position.z = jsonItem.Data.Z;
        return cone;
    };

    //Make a simple shaded material to show basic highlights of a given color.
    $scope.makeMaterial = function (colorValue) {
        return new THREE.MeshPhongMaterial({
            // light
            specular: colorValue.color,
            // intermediate
            color: colorValue.color,
            // dark
            emissive: colorValue.color,
            shininess: 160
        })
    };

    $scope.makeCamera = function() {
      var camera =  new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
      camera.position.z = 5;
      return camera;
  };


//Refresh JSON scene from server and place in web-page text view.
$scope.refreshJsonText = function() 
{
  //Get JSON S4F data containing geometry and textures
  $http({ method: 'GET', url: '/three/js/shapes.json' }).success(function (sceneJsonParsed, status, headers, config) {
    $scope.currentJson =JSON.stringify(sceneJsonParsed);

})};

///Update the scene with the json text in the web-page text view.
$scope.updateRender = function() 
{

            //Add items to scene
            $scope.sceneItems.forEach(function (item) {
                $scope.scene.remove(item);
            });
            $scope.sceneItems = $scope.createSceneItems(JSON.parse($scope.currentJson));
            
            $scope.camera = $scope.makeCamera();
            //Create ThreeJS scene
            $scope.scene = $scope.newScene();
            $scope.renderer = $scope.makeRenderer();
            
            var tmp = $scope.renderer.domElement;

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
            var directionalLight = new THREE.DirectionalLight(0xffffff);
            directionalLight.position.set(1, 2, 1).normalize();
            scene.add(directionalLight);
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
                    default:
                }
            });
            return sceneItems;
        };

        $scope.renderImpl = function() {

          requestAnimationFrame($scope.renderImpl);
          if ($scope.continueRender == false)
            return;
                //Rotate each item in the scene a bit in each frame
                $scope.sceneItems.forEach(function (item) {
                    item.rotation.x += $scope.rotation / 500;
                    item.rotation.y += $scope.rotation / 1000;
                });
                //Orbit the camera around the items in the scene a bit each frame.
                if ($scope.direction)
                    $scope.camera.rotation.y += $scope.increment;
                else
                    $scope.camera.rotation.y -= $scope.increment;
                $scope.count += 1;

                if ($scope.count == 100) {
                    $scope.count = 0;
                    $scope.direction = !$scope.direction;
                }
                $scope.renderer.render($scope.scene, $scope.camera);

            };

    //Main entrypoint into the render loop
    $scope.mainRender = function () {

        //Get JSON S4F data containing geometry and textures
        $http({ method: 'GET', url: '/three/js/shapes.json' }).success(function (sceneJsonParsed, status, headers, config) {
            $scope.currentJson =JSON.stringify(sceneJsonParsed);
            $scope.camera = $scope.makeCamera();
            //Create ThreeJS scene
            $scope.scene = $scope.newScene();
            $scope.renderer = $scope.makeRenderer();
            //Iterate through parsed JSON retrieved above and create geometry in the scene from its data.
            $scope.sceneItems = $scope.createSceneItems(JSON.parse($scope.currentJson));
            //Add items to scene
            $scope.sceneItems.forEach(function (item) {
                $scope.scene.add(item);
            });


            $scope.renderImpl();
        });
    };
}
);