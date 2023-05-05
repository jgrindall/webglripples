let container;
let camera, scene, renderer;
let uniforms;
let divisor = 0.1;

let newmouse = {
    x: 0,
    y: 0
};

let loader = new THREE.TextureLoader();

let texture, rtTexture1, rtTexture2, environment, pooltex;

loader.setCrossOrigin("anonymous");

loader.load(
    'https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/noise.png',
    (tex) => {
        texture = tex;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.minFilter = THREE.LinearFilter;

        loader.load(
            'https://s3-us-west-2.amazonaws.com/s.cdpn.io/982762/env_lat-lon.png',
            function environment_load(tex) {
                environment = tex;
                environment.wrapS = THREE.RepeatWrapping;
                environment.wrapT = THREE.RepeatWrapping;
                environment.minFilter = THREE.NearestMipMapNearestFilter;

                loader.load(
                    'tiling-mosaic.png',
                    function environment_load(tex) {
                        pooltex = tex;
                        pooltex.wrapS = THREE.RepeatWrapping;
                        pooltex.wrapT = THREE.RepeatWrapping;
                        pooltex.minFilter = THREE.NearestMipMapNearestFilter;

                        init();
                        animate();
                    }
                )
            }
        );
    }
);

const w = 800
const h = 400

function makeTextures(){
    
    rtTexture1 = new THREE.WebGLRenderTarget(w, h, { type: THREE.FloatType, minFilter: THREE.NearestMipMapNearestFilter });
    rtTexture2 = new THREE.WebGLRenderTarget(w, h, { type: THREE.FloatType, minFilter: THREE.NearestMipMapNearestFilter });
}

function init() {
    container = document.getElementById('container');

    camera = new THREE.Camera();
    camera.position.z = 1;

    scene = new THREE.Scene();

    var geometry = new THREE.PlaneBufferGeometry(2, 2);

    makeTextures()


    uniforms = {
        u_time: { type: "f", value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_noise: { type: "t", value: texture },
        u_buffer: { type: "t", value: rtTexture1.texture },
        u_texture: { type: "t", value: pooltex },
        u_environment: { type: "t", value: environment },
        u_mouse: { type: "v3", value: new THREE.Vector3() },
        u_frame: { type: "i", value: -1. },
        u_renderpass: { type: 'b', value: false }
    };

    var material = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById('vertexShader').textContent,
        fragmentShader: document.getElementById('fragmentShader').textContent
    });
    material.extensions.derivatives = true;

    var mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);
    renderer = new THREE.WebGLRenderer();
    container.appendChild(renderer.domElement);

    onWindowResize();
    
    document.addEventListener('pointermove', (e) => {
        e.preventDefault();
        newmouse.x = (e.pageX - w / 2) / h;
        newmouse.y = (e.pageY - h / 2) / h * -1;
    });
    document.addEventListener('pointerdown', () => {
        uniforms.u_mouse.value.z = 1;
    });
    document.addEventListener('pointerup', () => {
        uniforms.u_mouse.value.z = 0;
    });
}

function onWindowResize() {
    renderer.setSize(w, h);
    uniforms.u_resolution.value.x = w;
    uniforms.u_resolution.value.y = h;
    makeTextures()
    uniforms.u_frame.value = -1;
}

function animate(delta) {
    requestAnimationFrame(animate);
    render(delta);
}

let then = 0;
function renderTexture() {
    
    let odims = uniforms.u_resolution.value.clone();
    uniforms.u_resolution.value.x = 800;
    uniforms.u_resolution.value.y = 400;

    uniforms.u_buffer.value = rtTexture2.texture;
    uniforms.u_renderpass.value = true;

    renderer.setRenderTarget(rtTexture1);
    renderer.render(scene, camera, rtTexture1, true);

    let rtTexture1_ = rtTexture1
    rtTexture1 = rtTexture2;
    rtTexture2 = rtTexture1_;

    uniforms.u_buffer.value = rtTexture1.texture;
    uniforms.u_resolution.value = odims;
    uniforms.u_renderpass.value = false;
}
let beta = 0
function render(delta) {
    uniforms.u_frame.value++;

    uniforms.u_mouse.value.x += (newmouse.x - uniforms.u_mouse.value.x) * divisor;
    uniforms.u_mouse.value.y += (newmouse.y - uniforms.u_mouse.value.y) * divisor;

    uniforms.u_time.value = beta + delta * 0.0005;
    renderer.render(scene, camera);
    renderTexture();
}