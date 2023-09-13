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
  // creates buffers with position, normal, texcoord, and vertex color
  // data for primitives by calling gl.createBuffer, gl.bindBuffer,
  // and gl.bufferData
  const cubeBufferInfo = primitives.createCubeWithVertexColorsBufferInfo(gl, 20);
  
  // setup GLSL program
  var programInfo = webglUtils.createProgramInfo(gl, ["cube_vs", "cube_fs"]);
  var sphereProgramInfo = webglUtils.createProgramInfo(gl, ["ball_vs", "ball_fs"]);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

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

    // Upload the canvas to the cubemap face.
    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 512;
    const height = 512;
    const format = gl.RGBA;
    const type = gl.UNSIGNED_BYTE;

    // setup each face so it's immediately renderable
    gl.texImage2D(target, level, internalFormat, width, height, 0, format, type, null);

    // Asynchronously load an image
    const image = new Image();
    image.src = url;
    image.addEventListener('load', function() {
      // Now that the image has loaded make copy it to the texture.
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeTex);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });
  
  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  // Uniforms for each object.
  
  var cubePositions = [
    [10, -30, 100],
    [-110, 0, -90],
    [160, 50, -400],
    [80, -70, -600],
    [200, -20, -140],
    [-80, -50, -400],
  ]
  
  var cubeUniforms = {
    u_matrix: m4.identity(),
    u_texture: cubeTex,
    u_LightPosition: ballPosition,
    u_CameraPosition: cameraPosition,
  };
  var cubes = cubePositions.map((position) => ({
    position,
    visible: true,
  }));

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

  
  var ballPosition = [0, 0, 0];
  var ballVelocity = [0, 0, 0];
  
  
  canvas.addEventListener("click", shootBall);

    function shootBall(event) {
        // Calculate the direction from the camera to the target
        if (shots > 0) {
          airAudio.play();
          var rayDirection = m4.normalize(m4.subtractVectors(target, cameraPosition));
          
          // Set the initial position and velocity of the ball
          ballPosition = cameraPosition.slice(); // Copy camera position
          ballVelocity = [rayDirection[0] * 2, rayDirection[1] * 2, rayDirection[2] * 2]; // Adjust velocity as needed
          shots -= 1;
        }
    }

    // Function to check if the ball hits an object
    function checkCollision(position) {
      for (const cube of cubes) {
          if (cube.visible) {
              const distance = m4.distance(position, cube.position);
              if (distance < 20) { // Adjust this threshold as needed
                  cube.visible = false; // Cube disappears on collision
                  popAudio.play();
                  totalPoints += 1;
                  return true; // Collision detected
              }
          }
      }
      return false; // No collision
  }

  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time) {
    time *= 0.001;

    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    ballPosition[0] += ballVelocity[0] * 2;
    ballPosition[1] += ballVelocity[1] * 2;
    ballPosition[2] += ballVelocity[2] * 2;

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

    if (checkCollision(ballPosition)) {
      // Ball hit an object, so reset its position and velocity
      ballPosition = [0, 0, 0];
      ballVelocity = [0, 0, 0];
    }

    var cubeXRotation   = -time;
    var cubeYRotation   = time;
    var cubeScale = [1, 1, 1];

    var sphereXRotation   = -time * 20;
    var sphereYRotation   = time *20;
    var sphereScale = [1, 1, 1];

    // ------ Draw the sphere --------

    gl.useProgram(sphereProgramInfo.program);

    webglUtils.setBuffersAndAttributes(gl, sphereProgramInfo, sphereBufferInfo);
        
    var sphereUniforms = {
      u_colorMult: [0.5, 1, 0.5, 1],
      u_matrix: m4.identity(),
      u_LightPosition: ballPosition,
    };

    
    // console.log(ballPosition)
    
    sphereUniforms.u_matrix = computeMatrix(
        viewProjectionMatrix,
        ballPosition,
        sphereXRotation,
        sphereYRotation,
        sphereScale
    );

    // Set the uniforms we just computed
    webglUtils.setUniforms(sphereProgramInfo, sphereUniforms);

    gl.drawArrays(gl.TRIANGLES, 0, sphereBufferInfo.numElements);

    // ------ Draw the cube --------

    // Setup all the needed attributes.
    gl.useProgram(programInfo.program);

    webglUtils.setBuffersAndAttributes(gl, programInfo, cubeBufferInfo);

    for (const cube of cubes) {
      if (cube.visible) {
          cubeUniforms.u_matrix = computeMatrix(
              viewProjectionMatrix,
              cube.position,
              cubeXRotation,
              cubeYRotation,
              cubeScale
          );

          cubeUniforms.u_CameraPosition = cameraPosition;
          cubeUniforms.u_LightPosition = ballPosition;
          // Set the uniforms we just computed
          webglUtils.setUniforms(programInfo, cubeUniforms);

          gl.drawArrays(gl.TRIANGLES, 0, cubeBufferInfo.numElements);
      }
  }
    requestAnimationFrame(drawScene);
  }
}

main();
