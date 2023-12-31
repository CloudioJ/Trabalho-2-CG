"use strict";

function main() {
  // Get A WebGL context
  /** @type {HTMLCanvasElement} */
  var canvas = document.querySelector("#canvas");
  var gl = canvas.getContext("webgl");
  if (!gl) {
    return;
  }

  const waves = new Audio('./sounds/sandy-beach-calm-waves-water-nature-sounds-8052.mp3');
  waves.volume = 0.1;
  waves.loop = true;

  const bgMusic = new Audio('./sounds/01 Calm 1.mp3');
  bgMusic.volume = 0.5;
  bgMusic.loop = true;
  
  const envmapProgramInfo = webglUtils.createProgramInfo(
      gl, ["fbox_vs", "fbox_fs"]);
  const skyboxProgramInfo = webglUtils.createProgramInfo(
      gl, ["sky_vs", "sky_fs"]);

  const cubeBufferInfo = primitives.createCubeBufferInfo(gl, 1);
  const quadBufferInfo = primitives.createXYQuadBufferInfo(gl);

  // Create a texture.
  
  const eggTexture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, eggTexture);

    const easter = [
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
        url: './assets/Mestre.png',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
        url: './assets/Mestre.png',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
        url: './assets/Mestre.png',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
        url: './assets/Mestre.png',
      },
      {
        target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: './assets/Mestre.png',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: './assets/Mestre.png',
    },
  ]
  
  easter.forEach((egg) => {
    const {target, url} = egg;
    
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
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, eggTexture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });

  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
  const faceInfos = [
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_X,
      url: './skybox/skyrender0001.bmp',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_X,
      url: './skybox/skyrender0004.bmp',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Y,
      url: './skybox/skyrender0003.bmp',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y,
      url: './skybox/skyrender0006.bmp',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_POSITIVE_Z,
      url: './skybox/skyrender0005.bmp',
    },
    {
      target: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z,
      url: './skybox/skyrender0002.bmp',
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
      gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
      gl.texImage2D(target, level, internalFormat, format, type, image);
      gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
    });
  });

  gl.generateMipmap(gl.TEXTURE_CUBE_MAP);
  gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);

  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var fieldOfViewRadians = degToRad(60);

  // Get the starting time.
  var then = 0;
  var cubeTexture = texture;
  var skyTexture = texture;
  
  requestAnimationFrame(drawScene);
  
  // Draw the scene.
  function drawScene(time) {
    time *= 0.001;
    then = time;

    waves.play();
    bgMusic.play();
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);

    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);


    var aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
    var projectionMatrix =
        m4.perspective(fieldOfViewRadians, aspect, 0.1, 2000);

    var worldMatrix = m4.xRotation(time * 0.11);
    worldMatrix = m4.scale(worldMatrix, 50, 50, 50);

    var viewDirectionMatrix = m4.copy(view);
    viewDirectionMatrix[12] = 0;
    viewDirectionMatrix[13] = 0;
    viewDirectionMatrix[14] = 0;

    var viewDirectionProjectionMatrix = m4.multiply(
        projectionMatrix, viewDirectionMatrix);
    var viewDirectionProjectionInverseMatrix =
        m4.inverse(viewDirectionProjectionMatrix);

    if (totalPoints == 5 && time < 60) {
      cubeTexture = eggTexture;
      skyTexture = eggTexture;
    }

    // Draw the cube
    gl.depthFunc(gl.LESS); 
    gl.useProgram(envmapProgramInfo.program);
    webglUtils.setBuffersAndAttributes(gl, envmapProgramInfo, cubeBufferInfo);
    webglUtils.setUniforms(envmapProgramInfo, {
      u_world: worldMatrix,
      u_view: view,
      u_projection: projectionMatrix,
      u_texture: cubeTexture,
      u_worldCameraPosition: cameraPosition,
    });
    webglUtils.drawBufferInfo(gl, cubeBufferInfo);

    // Draw the skybox

    gl.depthFunc(gl.LEQUAL);

    gl.useProgram(skyboxProgramInfo.program);
    webglUtils.setBuffersAndAttributes(gl, skyboxProgramInfo, quadBufferInfo);
    webglUtils.setUniforms(skyboxProgramInfo, {
      u_viewDirectionProjectionInverse: viewDirectionProjectionInverseMatrix,
      u_skybox: skyTexture,
    });
    webglUtils.drawBufferInfo(gl, quadBufferInfo);

    requestAnimationFrame(drawScene);
  }
}

main();
