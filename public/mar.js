import * as THREE from '../build/three.module.js';

import Stats from './jsm/libs/stats.module.js';

import { GUI } from './jsm/libs/dat.gui.module.js';
import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { Water } from './watter.js';
import { Sky } from './sky.js';

let container, stats;
let camera, scene, renderer;
let controls, water, sun, mesh, clock;
var vertexDisplacimente;
var  geometry , geometryPostions, waterGeometry;
let alpha = 0;
let count = 0;
let velocity = {'value': 10};
let altura = {'value': 2};
let displacement, noise, uvAttribute;
let color = ['#ffffff', '#f7f7f7', '#e0e0e0', '#787878']

init();
animate();

function init() {

    container = document.getElementById( 'container' );

    //
    clock = new THREE.Clock();
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    container.appendChild( renderer.domElement );

    //
    
    scene = new THREE.Scene();
    scene.background = new THREE.Color(color[0]);
    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.set( 300, 300, 1000 );

    //

    sun = new THREE.Vector3();

    // Water

    waterGeometry = new THREE.PlaneBufferGeometry( 10000, 10000, 50, 50 );

	var noiseScale = 0.5;
	

    water = new Water(
        waterGeometry,
        {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load( './textures/waternormals.jpeg', function ( texture ) {
                // console.log(texture)
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                texture.anisotropy = 16;

            } ),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: 0x001e0f, //new THREE.Color('blue'),//0x001e0f
            distortionScale: 3.7,
            fog: scene.fog !== undefined,
            alpha: alpha
        }
    );
    water.wireframe = true;
    water.rotation.x = - Math.PI / 2;
    
    // water.updateMatrix();
  
    scene.add( water );

    // Skybox

    const sky = new Sky();
    sky.scale.setScalar( 10000 );
    // scene.add( sky );

    const skyUniforms = sky.material.uniforms;

    skyUniforms[ 'turbidity' ].value = 100;
    skyUniforms[ 'rayleigh' ].value = 20;
    skyUniforms[ 'mieCoefficient' ].value = 0.0005;
    skyUniforms[ 'mieDirectionalG' ].value = 0.8;

    const parameters = {
        elevation: 100,
        azimuth: 180
    };


    const pmremGenerator = new THREE.PMREMGenerator( renderer );

    function updateSun() {

        const phi = THREE.MathUtils.degToRad( 90 - parameters.elevation );
        const theta = THREE.MathUtils.degToRad( parameters.azimuth );

        sun.setFromSphericalCoords( 1, phi, theta );

        sky.material.uniforms[ 'sunPosition' ].value.copy( sun );
        water.material.uniforms[ 'sunDirection' ].value.copy( sun ).normalize();

        scene.environment = pmremGenerator.fromScene( sky ).texture;

    }

    vertexDisplacimente = 4.0;
    displacement = new Float32Array( water.geometry.attributes.position.count );
    noise = new Float32Array( water.geometry.attributes.position.count );

    for ( let i = 0; i < displacement.length; i ++ ) {
        noise[ i ] = Math.random() * 5;
    }

    water.geometry.setAttribute( 'displacement', new THREE.BufferAttribute( displacement, 1 ) );
    updateSun();

    //
    geometry = new THREE.BoxGeometry( 30, 30, 30 );

    const material = new THREE.MeshStandardMaterial( { roughness: 0 } );

    controls = new OrbitControls( camera, renderer.domElement );
    controls.maxPolarAngle = Math.PI * 0.495;
    controls.target.set( 0, 10, 0 );
    controls.minDistance = 400.0;
    controls.maxDistance = 20000.0;
    controls.update();

    //

    stats = new Stats();
    container.appendChild( stats.dom );

    // GUI

    const gui = new GUI();

    const folderSky = gui.addFolder( 'Sky' );
    folderSky.add( parameters, 'elevation', 0, 90, 0.1 ).onChange( updateSun );
    folderSky.add( parameters, 'azimuth', - 180, 180, 0.1 ).onChange( updateSun );
    folderSky.open();

    const waterUniforms = water.material.uniforms;
    

    const folderWater = gui.addFolder( 'Water' );
    folderWater.add( waterUniforms.distortionScale, 'value', 0, 8, 0.1 ).name( 'distortionScale' );
    folderWater.add( waterUniforms.size, 'value', 0.1, 10, 0.1 ).name( 'size' );
    // folderWater.add( velocity, 'value', 10,  100000, 1 ).name( 'Velocity' );
    folderWater.add( altura, 'value',1,  60, 2 ).name( 'altura');
    folderWater.open();

    //
    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {
    requestAnimationFrame( animate );
    render();
    stats.update();

}
function getRandomArbitrary(min, max) {
    return Math.random() * (max - min) + min;
}

function render() {

    // const time2 = clock.getElapsedTime() * 10;
    // const time = performance.now() * (1/velocity.value); //velocidade das ondas
    const time = performance.now() * 0.01; //velocidade das ondas


    water.material.uniforms[ 'amplitude' ].value =  altura.value + 0.25; // tamanho das ondas

    water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
    if (altura.value < 10){
        scene.background = new THREE.Color(color[0]);
    }
    if (altura.value > 10 && altura.value < 20 ){
        scene.background = new THREE.Color(color[1]);
    }
    if (altura.value > 20 && altura.value < 25 ){
        scene.background = new THREE.Color(color[2]);
    }
    if (altura.value > 30){
        scene.background = new THREE.Color(color[3]);
    }
    for ( let i = 0; i < displacement.length; i+=1 ) {

            displacement[ i ] = Math.sin( 0.1 * i + time );
            noise[ i ] += 0.5 * ( 0.5 - Math.random() );
            noise[ i ] = THREE.MathUtils.clamp( noise[ i ], - 100,3);
            
            displacement[i] += noise[ i ];
   

    }

    uvAttribute = water.geometry.attributes.uv;

    water.geometry.attributes.displacement.needsUpdate = true;

    water.geometry.needsUpdate = true;
    uvAttribute.needsUpdate = true;


    renderer.render( scene, camera );

}
