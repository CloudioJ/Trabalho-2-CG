"use strict";

async function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");

  if (!gl) {
    return;
  }

  const airAudio = new Audio('./sounds/mixkit-long-hit-swoosh-1473.wav');
  const popAudio = new Audio('./sounds/pop.mp4');
  airAudio.volume = 0.1;
  
  const cubeBufferInfo = primitives.createCubeWithVertexColorsBufferInfo(gl, 20);

  var programInfo = webglUtils.createProgramInfo(gl, ["cube_vs", "cube_fs"]);
  var sphereProgramInfo = webglUtils.createProgramInfo(gl, ["ball_vs", "ball_fs"]);


  const cubeTex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTex);

  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: './assets/rubikscube.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: './assets/rubikscube.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: './assets/rubikscube.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: './assets/rubikscube.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: './assets/rubikscube.jpg',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: './assets/rubikscube.jpg',
    },
  ];

  faceInfos.forEach((faceInfo) => {
    const {target, url} = faceInfo;
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTex);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  var cubes = cubePositions.map((position) => ({
    position,
    visible: true,
  }));
  
  var cubeUniforms = {
    u_matrix: m4.identity(),
    u_texture: cubeTex,
    u_LightPosition: ballPosition,
    u_CameraPosition: cameraPosition,
  };
  

  function computeMatrix(viewProjectionMatrix, translation, xRotation, yRotation, scale) {
    var matrix = m4.identity();
    matrix = m4.translate(matrix, translation[0], translation[1], translation[2]);
      matrix = m4.xRotate(matrix, xRotation);
      matrix = m4.yRotate(matrix, yRotation);
      matrix = m4.scale(matrix, scale[0], scale[1], scale[2]);
    return m4.multiply(viewProjectionMatrix, matrix);
  }

 // ------------------ MAKE THE BALL

  const sphereBufferInfo = primitives.createSphereWithVertexColorsBufferInfo(gl, 10,12,6);
  
  canvas.addEventListener("click", shootBall);

  var ballIndex = 0;

  function shootBall(event) {
      if (shots > 0) {
        airAudio.play();
        var rayDirection = m4.normalize(m4.subtractVectors(target, cameraPosition));
        
        ballPositions[ballIndex] = cameraPosition.slice();
        ballVelocities[ballIndex] = [rayDirection[0] * 2, rayDirection[1] * 2, rayDirection[2] * 2];
        shots -= 1;
        activeBall = ballIndex;
        ballIndex++;
      }
  }

  // Function to check if the ball hits an object
  function checkCollision(position, time) {
    var startTime = time
    var elapsedTime = time - startTime;

    var i = 0;
    for (const cube of cubes) {
      if (cube.visible) {
        const distance = m4.distance(position, cube.position);
        if (distance < 60) { // Collision
          cube.visible = false;
          balloons[i].visible = false;
          balloons[i].position[1] = -100;
          popAudio.play();
          totalPoints += 1;
          return true;
        }
      }
      i++
    }
    return false; // No collision
  }

  requestAnimationFrame(drawScene);

  
  // Draw the scene.
  function drawScene(time) {
    time *= 0.001;

    const cubeMovement = [
      [10, -30 * Math.cos(time), 100],
      [-110, 0, -90 * Math.cos(time)],
      [-200 * Math.cos(time), 50, -400],
      [80  * Math.cos(time * 0.5), -70, -600],
      [200  * Math.cos(time/2 * 0.5) , 50, -140 * Math.cos(time) * Math.cos(time * 0.5)],
      [-80 * Math.cos(time * 0.5), -50, -500 * Math.sin(time / 2)],
    ]

    const cubeRotations = [
      [- time, time],
      [time, 2 * time],
      [time, + time],
      [time, time],
      [time, - time],
      [2 * time, time],
    ]

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(fov, aspect, 0.1, 2000);

    var invertedCamera = m4.inverse(camera);

    var viewProjectionMatrix = m4.multiply(
        projectionMatrix,
        invertedCamera
    )

    for(var i = 0; i < ballPositions.length; i++) {
      var balloonCenter = [ballPositions[i][0], ballPositions[i][1] - 50, ballPositions[i][2]];

      
      if (checkCollision(balloonCenter)) {
        ballPositions[i] = [1, 1, 1];
        ballVelocities[i] = [0, 0, 0];
      }
    }

    var cubeXRotation   = 0;
    var cubeYRotation   = 0;
    var cubeScale = [1, 1, 1];

    var sphereXRotation   = -time * 20;
    var sphereYRotation   = time * 20;
    var sphereScale = [1, 1, 1];

    // ------ Draw the sphere --------

    gl.useProgram(sphereProgramInfo.program);

    webglUtils.setBuffersAndAttributes(gl, sphereProgramInfo, sphereBufferInfo);
        
    for(var i = 0; i < ballPositions.length; i++) {

      ballPositions[i][0] += ballVelocities[i][0] * 2;
      ballPositions[i][1] += ballVelocities[i][1] * 2;
      ballPositions[i][2] += ballVelocities[i][2] * 2;

      var sphereUniforms = {
        u_colorMult: [0.5, 1, 0.5, 1],
        u_matrix: m4.identity(),
        u_LightPosition: ballPositions[ballIndex],
      };
      
      sphereUniforms.u_matrix = computeMatrix(
          viewProjectionMatrix,
          ballPositions[i],
          sphereXRotation,
          sphereYRotation,
          sphereScale
      );

      webglUtils.setUniforms(sphereProgramInfo, sphereUniforms);

      gl.drawArrays(gl.TRIANGLES, 0, sphereBufferInfo.numElements);
    }

    // ------ Draw the cube --------

    gl.useProgram(programInfo.program);

    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);
    
    var i = 0;
    for (const cube of cubes) {
      if (cube.visible) {

          cube.position[0] = +cubeMovement[i][0];
          cube.position[1] = cubeMovement[i][1];
          cube.position[2] = +cubeMovement[i][2];
          cubeXRotation = cubeRotations[i][0];
          cubeYRotation = cubeRotations[i][1];

          cube
          cubeUniforms.u_matrix = computeMatrix(
              viewProjectionMatrix,
              cube.position,
              cubeXRotation,
              cubeYRotation,
              cubeScale
          );

          cubeUniforms.u_CameraPosition = cameraPosition;
          cubeUniforms.u_LightPosition = ballPositions;

          webglUtils.setUniforms(programInfo, cubeUniforms);

          gl.drawArrays(gl.TRIANGLES, 0, cubeBufferInfo.numElements);
      }
      i += 1;
  }
    requestAnimationFrame(drawScene);
  }
}

main();
