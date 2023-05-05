let container;
let camera, textureCamera, textureScene, scene, renderer, renderer2;
let uniforms;
let texture, rtTexture1, rtTexture2, environment, pooltex;

var width = 512
var height = 512

function init() {

    // make the scene we will render to the RenderTarget
    // make the scene we will render to the real canvas

    container = document.getElementById('container');

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    renderer2 = new THREE.WebGLRenderer();
    renderer2.setSize(width, height);

    container.appendChild(renderer.domElement);
    container.appendChild(renderer2.domElement);

    
    // make the render target scene
    textureScene = new THREE.Scene();
    textureCamera = new THREE.PerspectiveCamera(
        75,
        1,
        0.1,
        1000);

    textureCamera.position.z = 5


    textureRenderTarget = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBFormat
    });

    textureCamera.position.z = 2;
    textureCamera.lookAt(new THREE.Vector3(0, 0, 0))
    textureScene.add(textureCamera)

    var uniforms = {
        u_time: {
            type: "f",
            value: 0.0
        }
    };

    //the one we render off-screen
    var textureMaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: `
    varying vec2 vUV;

    void main() {
    vUV = uv;

    // Convert UV to absolute XY.
    vec2 xy = uv * 2.0 - 1.0;

    // Draw at end of clip space to allow occlusion.
    gl_Position = vec4(xy, 1.0, 1.0);
    }`,
        
        fragmentShader: `
    varying vec2 vUV;
    uniform float u_time;
    void main() {
        float t = length(vUV) * 10.0;
        float x = sin(t + u_time) / 3.0;
        gl_FragColor.rgb = vec3(x, x, x);
    }
    `
    });


    var box = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 16, 16), textureMaterial);
    textureScene.add(box);

   

    // make the real scene
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(
        75,
        1,
        0.1,
        1000);
    camera.position.z = 2;
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    scene.add(camera);

    var map = new THREE.TextureLoader().load('tiling-mosaic.png' );

    var material = new THREE.MeshPhongMaterial({
        shininess: 0.1,
        map,
        specular: 0.7,
        bumpMap: textureRenderTarget.texture,
        displacementMap: textureRenderTarget.texture,
        //normalMap: textureRenderTarget.texture,
        displacementScale: 0.2,
        bumpScale: 0.2
    });
    
    material.side = THREE.DoubleSide;
    // the real scene has a mesh and a light
    var mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2, 16, 16), material);
    mesh.position.set(0, 0, 0);
  
    var light = new THREE.PointLight(0xffffff, 0.9);
    light.position.set(0, 0, 10);

    scene.add(mesh);
    scene.add(light);

    //mesh.rotation.x += 0.005
    //mesh.rotation.y += 0.01
    //mesh.rotation.z -= 0.022


    function animate() {
        renderer.render(textureScene, textureCamera, textureRenderTarget, true);
        renderer.render(scene, camera);
        renderer2.render(textureScene, textureCamera)
        uniforms.u_time.value += 0.05;
        requestAnimationFrame(animate);
    }
    animate();
    
}

init()

