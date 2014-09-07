function animation(pointArray) {
        this.points = pointArray;
        this.pointIndex = 0;
        this.stepIndex = 0;
        this.steps = pointArray.length*10;
        this.next = function() {
                return [1,2];
            }
        }
