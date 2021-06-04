import * as THREE from '../build/three.module.js';
import { RoomEnvironment } from './jsm/environments/RoomEnvironment.js';
import { KTX2Loader } from './jsm/loaders/KTX2Loader.js';

import Stats from './jsm/libs/stats.module.js';

import { OrbitControls } from './jsm/controls/OrbitControls.js';
import { GLTFLoader } from './jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from './jsm/libs/meshopt_decoder.module.js';

let stats, mixer, camera, scene, renderer, clock, man_walk;

const controls = {

    moveForward: false,
    moveBackward: false,
    moveLeft: false,
    moveRight: false

};
var xSpeed = 2;

var ySpeed = 0.06;

init();
animate();

function init() {

    const container = document.createElement( 'div' );
    document.body.appendChild( container );
    renderer = new THREE.WebGLRenderer();

    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.set( 0, 10, -10 );
    // camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 4000 );
    // camera.position.set( 0, 150, 1300 );

    // camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 2000 );
	// 			camera.position.set( 20, 10, 0 );



    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xffffff );
    scene.fog = new THREE.Fog( 0xffffff, 1000, 4000 );

    scene.add( camera );

    clock = new THREE.Clock();

    // ground
    const mesh = new THREE.Mesh( new THREE.PlaneGeometry( 2000, 2000 ), new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } ) );
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );
    // const geometry = new THREE.PlaneGeometry( 500, 500 );
    // const material = new THREE.MeshPhongMaterial( { color: 0x999999, depthWrite: false } );

    // const ground = new THREE.Mesh( geometry, material );
    // ground.position.set( 0, - 5, 0 );
    // ground.rotation.x = - Math.PI / 2;
    // ground.receiveShadow = true;
    // scene.add( ground );

    // const grid = new THREE.GridHelper( 500, 100, 0x000000, 0x000000 );
    // grid.position.y = - 5;
    // grid.material.opacity = 0.2;
    // grid.material.transparent = true;
    // scene.add( grid );

    // lights

    scene.add( new THREE.AmbientLight( 0x222222 ) );

    const light = new THREE.DirectionalLight( 0xffffff, 2.25 );
    light.position.set( 200, 450, 500 );

    light.castShadow = true;

    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 512;

    light.shadow.camera.near = 100;
    light.shadow.camera.far = 1200;

    light.shadow.camera.left = - 1000;
    light.shadow.camera.right = 1000;
    light.shadow.camera.top = 350;
    light.shadow.camera.bottom = - 350;

    scene.add( light );

    const grid = new THREE.GridHelper( 500, 10, 0xffffff, 0xffffff );
				grid.material.opacity = 0.5;
				grid.material.depthWrite = false;
				grid.material.transparent = true;
				scene.add( grid );

    //

    const loader = new GLTFLoader();
    loader.load( './castelul_martinuzzi_vintu_de_jos_romania/scene.gltf', function ( gltf ) {
        gltf.scene.scale.multiplyScalar(0.000001 / 0.000001);
       
        
        scene.add( gltf.scene );
        // gltf.scene.position.y = 0;

        gltf.scene.traverse( function ( child ) {

            if ( child.isSkinnedMesh ) child.castShadow = true;

        } );

    } );

    // const gt = new THREE.TextureLoader().load( "castelul_martinuzzi_vintu_de_jos_romania/textures/material0_diffuse.jpeg" );
    // const gg = new THREE.PlaneGeometry( 16000, 16000 );
    // const gm = new THREE.MeshPhongMaterial( { color: 0xffffff, map: gt } );

    // const ground = new THREE.Mesh( gg, gm );
    // ground.rotation.x = - Math.PI / 2;
    // ground.material.map.repeat.set( 64, 64 );
    // ground.material.map.wrapS = THREE.RepeatWrapping;
    // ground.material.map.wrapT = THREE.RepeatWrapping;
    // ground.material.map.encoding = THREE.sRGBEncoding;
    // // note that because the ground does not cast a shadow, .castShadow is left false
    // ground.receiveShadow = true;

    // scene.add( ground );
    
    const ktx2Loader = new KTX2Loader()
        .setTranscoderPath( 'js/libs/basis/' )
        .detectSupport( renderer );

    loader.setKTX2Loader( ktx2Loader );
    loader.setMeshoptDecoder( MeshoptDecoder );
    loader.load( './roboto/scene.gltf', function ( gltf ) {
        man_walk = gltf.scene;
        man_walk.position.set(0, 0, 10);

        man_walk.rotateY(210.5);        
        man_walk.scale.multiplyScalar(1 / 100); // adjust scalar factor to match your scene scale
        // gltf.scene.position.x = 0; // once rescaled, position the model where needed
        // gltf.scene.position.y = 0;
        // gltf.scene.position.z = 0;
        scene.add( man_walk);

        
        mixer = new THREE.AnimationMixer( man_walk);

        mixer.clipAction( gltf.animations[ 0 ] ).play();



        }, undefined, function ( e ) {

            console.error( e );

        } );
    
    //

    
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.shadowMap.enabled = true;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild( renderer.domElement );

    //

    stats = new Stats();
    container.appendChild( stats.dom );

    // const controls = new OrbitControls( camera, renderer.domElement );
    // controls.enablePan = false;
    // controls.minDistance = 5;
    // controls.maxDistance = 50;

    const controls = new OrbitControls( camera, renderer.domElement );
				controls.addEventListener( 'change', render ); // use if there is no animation loop
    controls.enablePan = false;

				controls.minDistance = 5;
				controls.maxDistance = 500;
				controls.target.set( 0, -1, 10 );
				controls.update();

				window.addEventListener( 'resize', onWindowResize, false );
document.addEventListener("keydown", onDocumentKeyDown, false);


}


function onDocumentKeyDown(event) {

var keyCode = event.which;

if (keyCode == 87) {

    man_walk.position.z += ySpeed;

} else if (keyCode == 38) {

    man_walk.position.z -= ySpeed;

} else if (keyCode == 37) {

    man_walk.position.x -= xSpeed;

} else if (keyCode == 39) {

    man_walk.position.x += xSpeed;

}
};

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

    animate();

}



function animate() {

    requestAnimationFrame( animate );

    if ( mixer ) mixer.update( clock.getDelta() );

    render();
    stats.update();

}

function render() {

    renderer.render( scene, camera );

}