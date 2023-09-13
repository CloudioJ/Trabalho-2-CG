function degToRad(d) {
    return d * Math.PI / 180;
}

var canvas = document.getElementById("canvas")

canvas.addEventListener("mousedown", MouseClick, false);

var cameraRotation = [0, 0]; // Initialize camera rotation angles
var isMouseDragging = false;
var previousMouseX = 0;
var previousMouseY = 0;

function MouseClick(event) {
if (event.buttons == 1) {
    isMouseDragging = true;
    previousMouseX = event.clientX;
    previousMouseY = event.clientY;
}
}

canvas.addEventListener("mousemove", MouseMove, false);

function MouseMove(event) {
    if (isMouseDragging) {
        var x = event.clientX;
        var y = event.clientY;

        var deltaX = x - previousMouseX;
        var deltaY = y - previousMouseY;

        previousMouseX = x;
        previousMouseY = y;

        // Update camera rotation based on mouse movement
        cameraRotation[0] -= degToRad(deltaY * 0.5); // Pitch
        cameraRotation[1] -= degToRad(deltaX * 0.5); // Yaw

        // Limit pitch to avoid camera flipping
        cameraRotation[0] = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, cameraRotation[0]));

        // Calculate the new target position based on camera rotation
        // var distance = m4.length(m4.subtractVectors(cameraPosition, target));
        var distance = 100000;
        target[0] = cameraPosition[0] + Math.sin(cameraRotation[1]) * Math.cos(cameraRotation[0]) * distance;
        target[1] = cameraPosition[1] + Math.sin(cameraRotation[0]) * distance;
        target[2] = cameraPosition[2] + Math.cos(cameraRotation[1]) * Math.cos(cameraRotation[0]) * distance;

        // console.log("Mouse movement: deltaX=" + deltaX + ", deltaY=" + deltaY);
    }
}

canvas.addEventListener("mouseup", MouseRelease, false);
canvas.addEventListener("mouseleave", MouseRelease, false);

function MouseRelease(event) {
    isMouseDragging = false;
}

var fov = degToRad(60);
var cameraPosition = [-50.37529, 100, 97.62443];
var target = [0, 0, 0];
var up = [0, 1, 0];
var camera = m4.lookAt(cameraPosition, target, up);
var view = m4.inverse(camera);
var animationDuration = 20000; // Animation duration in milliseconds
var cameraSpeed = 0.00005; // Speed at which the camera moves along the Z-axis

var startTime = Date.now();

var cameraPosition = calculatePoint(points, 0);
var t = 0

function animateCamera() {
    var currentTime = Date.now();
    var elapsedTime = currentTime - startTime;
    t = (currentTime % animationDuration) / animationDuration;
    

    cameraPosition = calculatePoint(points, t);
    // target = calculatePoint(points, t + 0.01);
    camera = m4.lookAt(cameraPosition, target, up);
    view = m4.inverse(camera);
    requestAnimationFrame(animateCamera);
}

animateCamera();