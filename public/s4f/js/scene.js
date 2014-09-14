//main Angular app -- requires sceneLib.js and geometryLib.js (and lib folder)

var s4fNgApp = angular.module("s4fNgApp", []);

//Main (and only) angular controller for the body of index.html
s4fNgApp.controller("RenderCtrl", function ($scope, $window, $http) {
    $scope.debug = false;
    $scope.orbitSpeed = 0;
    $scope.statusMessage = "Initializing...";
    $scope.pendingMessage = "Pending...";
    $scope.renderSizeDivisors = { width : 2.5, height : 2};
    $scope.editorDivisor = 33; //value to resize editor inline with graphics window.
    $scope.animationCount = 0;

    //A reference counting system to check for total # of animations running
    //in the scene at a given time.

    //Increment animation count
    $scope.incAnimationCount = function () {
        $scope.$apply(function () {
            $scope.animationCount = $scope.animationCount + 1;
        });
    };

    //Decrement animation count
    $scope.decAnimationCount = function () {
        $scope.$apply(function () {
            $scope.animationCount = $scope.animationCount - 1;
        });
    };
    //Return true if a new animation should not be started.
    $scope.preventNewAnimation = function () {
        if ($scope.animationCount > 0) {
                return true;
        } else {
            return false;
            }    
    };

    //Get text to display in the 'Animate' button, depending on whether new animations are currently allowed.
    $scope.getAnimationButtonText = function () {
        if ($scope.preventNewAnimation()) {
            return "Animating.......";
        } else {
            return "Run animation";
            }
    };

    //Make a 2-second tween translation of an object between two points.
    $scope.makeTween = function (object, startVec, endVec) {
        var tween = new TWEEN.Tween({ x : startVec.x, y : startVec.y, z : startVec.z, theItem: object})
                .to({ x : endVec.x, y : endVec.y, z : endVec.z}, 2000)
                .easing(TWEEN.Easing.Linear.None)
                .onStart(function () {
                    this.theItem.position.x = this.x;
                    this.theItem.position.y = this.y;
                    this.theItem.position.z = this.z;
                    this.theItem.geometry.verticesNeedUpdate = true;
                    this.theItem.geometry.normalsNeedUpdate = true;
                    $scope.incAnimationCount();
                })
                .onUpdate(function () {
                    this.theItem.position.x = this.x;
                    this.theItem.position.y = this.y;
                    this.theItem.position.z = this.z;
                    this.theItem.geometry.verticesNeedUpdate = true;
                    this.theItem.geometry.normalsNeedUpdate = true;
                })
                .onComplete(function () {
                    this.theItem.geometry.verticesNeedUpdate = true;
                    this.theItem.geometry.normalsNeedUpdate = true;
                    $scope.decAnimationCount();
                });
        return tween;
    };

    //Make a set of tween translation animations on an object in sequence from a list of points in a path
    $scope.makeAnimationChain = function (object, pointList) {
        var tweens = [];
        var idx, currentVector, nextVector, tween;
        if (pointList.length < 2) {
            return;
        }
        for (idx = 0; idx !== pointList.length; idx = idx + 1) {
            currentVector = {x : pointList[idx][0], y : pointList[idx][1], z : pointList[idx][2]};
            nextVector = {x : pointList[idx + 1][0], y : pointList[idx + 1][1], z : pointList[idx + 1][2]};
            tween = $scope.makeTween(object, currentVector, nextVector);
            tweens.push(tween);
            if (idx > 0) {
                tweens[idx - 1].chain(tweens[idx]);
            }
            if (idx === pointList.length - 2) {
                break;
            }
        }
        return tweens;
    };



    //Scale graphics window and code edito on resize
    $scope.setResize = function () {
        if ($scope.camera) {
            $scope.camera.aspect = window.innerWidth / window.innerHeight;
            $scope.camera.updateProjectionMatrix();
            $scope.renderer.setSize(window.innerWidth / $scope.renderSizeDivisors.width, window.innerHeight / $scope.renderSizeDivisors.height);
        }
        if ($scope.editor) {
            $scope.resizeEditor();
        }
    };

    //Set text line count of ace editor based on window size.
    $scope.resizeEditor = function () {
        if ($scope.editor) {
            $scope.editor.setOptions({maxLines: Math.floor(window.innerHeight / $scope.editorDivisor)});
            $scope.editor.resize();
        }
    };

    $window.addEventListener('resize', $scope.setResize);



   //Update the scene with the JSON from a given url string
    $scope.showScene = function (url) {
        $http({ method: 'GET', url: url }).success(function (sceneJsonParsed, status, headers, config) {
            $scope.animationTracks = sceneJsonParsed.AnimationTracks;
            $scope.currentJson = prettyPrintJSON(sceneJsonParsed);
            $scope.setText(prettyPrintJSON(sceneJsonParsed), false);
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
        $scope.showScene('data/shapes.json');
    };

    //Refresh JSON scene from server and place in web-page text view.
    $scope.showSimpleScene = function () {
        //Get JSON S4F data containing geometry and textures
        $scope.showScene('data/simple.json');
    };

     //Refresh JSON scene from server and place in web-page text view.
    $scope.showRoomScene = function () {
        //Get JSON S4F data containing geometry and textures
        $scope.showScene('data/rooms.json');
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
        var parsed = "";
        try {
            parsed = JSON.parse(text);
            $scope.statusMessage = "Updated";
        } catch (err) {
            $scope.statusMessage = err.message;
            $scope.editor.focus();
            return;
        }
        $scope.sceneItems = $scope.createSceneItems(parsed);
        $scope.animationTracks = parsed.AnimationTracks;
        $scope.camera = makeCamera();
        //Create ThreeJS scene
        $scope.scene = newScene();
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
        TWEEN.removeAll();
        $scope.animationCount = 0;
        $scope.editor.focus();
    };

    //Create render context with reasonable default settings for a medium sized window in an
    //html document with div "RenderWindow"
    $scope.makeRenderer = function () {
        var renderer = new THREE.WebGLRenderer();
        renderer.shadowMapEnabled = true;
        renderer.setSize(window.innerWidth / $scope.renderSizeDivisors.width, window.innerHeight / $scope.renderSizeDivisors.height);
        document.getElementById("RenderWindow").appendChild(renderer.domElement);
        return renderer;
    };


    //Iterate through user json data and create 3JS geometry objects based on data
    $scope.createSceneItems = function (jsonS4Data) {
        var sceneItems = [];
        jsonS4Data.ShapeList.forEach(function (item) {
            switch (item.Type) {
            case "Box":
                var cube = makeBoxFromJson(item);
                sceneItems.push(cube);
                break;
            case "Cylinder":
                var cylinder = makeCylinderFromJson(item);
                sceneItems.push(cylinder);
                break;
            case "Cone":
                var cone = makeConeFromJson(item);
                sceneItems.push(cone);
                break;
            case "Plane":
                var aplane = makePlaneFromJson(item);
                sceneItems.push(aplane);
                break;
            case "Extrusion":
                var anextrusion = makeExtrusionFromJson(item);
                sceneItems.push(anextrusion);
                break;
            default:
            }
        });
        return sceneItems;
    };

    //Main render animation loop -- draws all items in scene, rotates objects and camera in each frame.
    $scope.renderImpl = function () {
        TWEEN.update();  //update individual object animations
        requestAnimationFrame($scope.renderImpl);

        //Rotate each item in the scene a bit in each frame
        if ($scope.sceneItems) {
            //Orbit the camera around the items in the scene a bit each frame.
            $scope.camera.position.y = 2;
            $scope.camera.position.x = $scope.camera.position.x * Math.cos($scope.orbitSpeed / 1000) + $scope.camera.position.z * Math.sin($scope.orbitSpeed / 1000);
            $scope.camera.position.z = $scope.camera.position.z * Math.cos($scope.orbitSpeed / 1000) - $scope.camera.position.x * Math.sin($scope.orbitSpeed / 1000);
            $scope.camera.lookAt($scope.scene.position);
            $scope.renderer.render($scope.scene, $scope.camera);
        }
    };

    //Animate all the objects in a scene from the animation-track data supplied in the json file.
    $scope.animateObjects = function () {
        if ($scope.preventNewAnimation()) {
            return;
        }
        if ($scope.statusMessage === $scope.pendingMessage) {
            $scope.updateRender();
        }
        if ($scope.sceneItems) {
            $scope.sceneItems.forEach(function (item) {
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
                    itemPath.push([item.position.x, item.position.y, item.position.z]);
                    //Make the set of animations and start them.
                    var tweens = $scope.makeAnimationChain(item, itemPath);
                    tweens[0].start();
                }
            });
        }
        $scope.editor.focus();
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
    //editor.getSession().setUseWrapMode(true);
    editor.getSession().setTabSize(2);


    //Set the ace editor in the angular scope
    $scope.editor = editor;
    $scope.editor.getSession().on("change", function () {
        $scope.$apply(function () { //This will not update automatically -- need to force update
            $scope.statusMessage = $scope.pendingMessage;
        });
    });
    $scope.resizeEditor();



    //Get the text in the ACE editor -- option to remove leading and trailing quote marks
    $scope.getText = function (chopQuotes) {
        if (chopQuotes) {
            var chopped = chopQuotes($scope.editor.getValue());
            if ($scope.debug) {
                console.log(chopped);
            }
            return chopped;
        }
        return $scope.editor.getValue();
    };

    //Set the text in the ACE editor for presentation -- option to remove leading and trailing quote marks
    $scope.setText = function (json, chopText) {
        $scope.editor.setValue(formatCode(json, chopText));
        $scope.editor.moveCursorTo(0, 0);
    };

});


//Extra directive to create an html range input that binds its value to an angular scope variable.
//(Needed only for IE -- other browers do it natively)
s4fNgApp.directive("range", function () {
    return {
        restrict: "E",
        template: '<input type="range" title="Change the orbit speed and direction of the camera." min="-10" max="10" value="0" ng-model="orbitSpeed" style="width:100px; display:inline"/>',
        link: function (scope, element) {
            var rangeControl = element.find("input");
            rangeControl.bind("change", function () {
                scope.$apply(function () {
                    scope.orbitSpeed = rangeControl.val();
                    scope.editor.focus();
                });
            });
        }
    };
});
