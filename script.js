import * as THREE from './modulos/three.module.js';
import {OrbitControls} from './modulos/OrbitControls.js';
import {GLTFLoader} from './modulos/GLTFLoader.js';
import {RGBELoader} from './modulos/RGBELoader.js';
import { EffectComposer } from './modulos/EffectComposer.js';
import { RenderPass } from './modulos/RenderPass.js';
import {UnrealBloomPass} from './modulos/UnrealBloomPass.js'

let scene, camera, renderer, controls;
let pmremGenerator;
let loadingManager;
const canvas = document.getElementById('canvas');
let composer;

const params = {
    exposure: 1,
    bloomStrength: 0.5,
    bloomThreshold: 0.8,
    bloomRadius: 0.1
};

init();
function init(){
    createScene();
    createRenderer();
    createCamera();
    //loadManager();
    createControls();
    cargarModelo('3dmodel/scene 1.glb');
    createFloor();
    lighting();
    createComposer();
    render();
    window.addEventListener('resize', render, false);
}

function createScene(){
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xCBDFC8);
    //loadHDRI();

}
function createCamera(){
    const fov = 75
    const aspect = renderer.domElement.clientWidth/renderer.domElement.clientHeight;
    const near = 0.1;
    const far = 20;
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.z = -8.460;//10
    camera.position.y = 5.242;//5
    camera.position.x = 0.972;//2
    //camera.fov = 20
}
function createRenderer(){
    renderer = new THREE.WebGLRenderer({canvas, antialias: true});
    renderer.outputEncoding = THREE.sRGBEncoding;
    // renderer.gammaOutput = true;
    // renderer.gammaFactor = 2.2;
    renderer.setPixelRatio(1);
    pmremGenerator = new THREE.PMREMGenerator( renderer );
	pmremGenerator.compileEquirectangularShader();
}
function createControls(){
    controls = new OrbitControls(camera, renderer.domElement);
    controls.minDistance = 5;
    controls.maxDistance = 10;
    controls.enableDamping = true;
    controls.dampingFactor = 1;
    controls.addEventListener('change', render);
    controls.maxPolarAngle = Math.PI /2.2
}
function render(){
    onWindowResize();
    renderer.render(scene, camera);
    //composer.render();
}

function cargarModelo(patch){
    const loader = new GLTFLoader(loadingManager);
    loader.load(patch, gltf =>{

        //podria utilizar esto para recorrer todos los materiales y si son emissive aplicarle bloom
        // console.log(gltf.scene.children[0].children[0].material.emissive != undefined);
        // console.log(gltf.scene.children[0].children[1].material.emissive === undefined);
        //recorrer los child de un objeto
        gltf.scene.traverse(child =>{
            if(child.isMesh){
                if(child.material.emissive != undefined){
                    console.log(child.material);
                }
            }
        })
        scene.add(gltf.scene);
        render();
    }, undefined, error =>{
        console.error(error);
    });
}

function lighting(){
    const directionalLight = new THREE.DirectionalLight(0xFFFFFF, 1);
    scene.add(directionalLight);

    const light = new THREE.HemisphereLight(0xffffff, 0xffffff, 1);
    scene.add(light);

    const ambient = new THREE.AmbientLight(0x352847);
    scene.add(ambient);
}

function loadHDRI(){
    new RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .setPath('hdri/')
        .load('studio.hdr', texture =>{
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            //scene.background = envMap;
            scene.environment = envMap;
            texture.dispose();
            pmremGenerator.dispose();
            render();
        });
}


function onWindowResize() {
    if(resizeRendererToDisplaySize()){
        const width = renderer.domElement.clientWidth;
        const height = renderer.domElement.clientHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
    }
}

function loadManager(){
    loadingManager = new THREE.LoadingManager(()=>{
        const loadingScreen = document.getElementById('loading-screen');
        loadingScreen.classList.add('fade-out');
        loadingScreen.addEventListener('transitionend', e =>{
            e.target.remove();
        });
    });
}

function resizeRendererToDisplaySize() {
    const canvas = renderer.domElement;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    const needResize = canvas.width !== width || canvas.height !== height;
    if (needResize) {
        renderer.setSize(width, height, false);
        composer.setSize( width, height );
    }
    return needResize;
}

function createComposer(){
    const bloomPass = new UnrealBloomPass( new THREE.Vector2( window.innerWidth, window.innerHeight ), 1.5, 0.4, 0.85 );
	bloomPass.threshold = params.bloomThreshold;
	bloomPass.strength = params.bloomStrength;
	bloomPass.radius = params.bloomRadius;

    composer = new EffectComposer( renderer );
	composer.addPass(new RenderPass( scene, camera ));
	composer.addPass( bloomPass );
}

// function createFloor(){
//     const loader = new THREE.TextureLoader();
//     const alphaText = loader.load('./3dmodel/Texture/mask.jpg')
//     const texture = loader.load('./3dmodel/Texture/image.jpg');
//     const geometry = new THREE.PlaneGeometry();
//     // const material = new THREE.MeshBasicMaterial({alphaMap: texture, alphaTest: 0});
//     const material = new THREE.MeshBasicMaterial({alphaMap: alphaText, map: texture, transparent: true, blending: 5});//custom blending
//     // material.blending = THREE.AdditiveBlending;
//     console.log(material);
//     const mesh = new THREE.Mesh(geometry, material);
//     mesh.scale.set(12,12,1);
//     mesh.rotation.x = -Math.PI /2;
//     scene.add(mesh);
// }
function createFloor(){
    const patch = '3dmodel/floor.glb';
    const loaderText = new THREE.TextureLoader();
    const alphaText = loaderText.load('./3dmodel/Texture/mask.jpg');

    const loader = new GLTFLoader(loadingManager);
    loader.load(patch, gltf =>{
        gltf.scene.children[0].material.alphaMap = alphaText;
        gltf.scene.children[0].material.blending = 5;
        scene.add(gltf.scene);
        render();
    }, undefined, error =>{
        console.error(error);
    });
}