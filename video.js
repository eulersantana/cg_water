// Mapeando uma imagem em Three.js

// import * as THREE from './resources/three.js/r126/build/three.module.js';

import * as THREE from '/build/three.module.js';

var texture;
var renderer;
var scene;
var camera;
var video;

function main() {

	scene 		= new THREE.Scene();

	renderer 	= new THREE.WebGLRenderer({ antialias: true });
	renderer.setClearColor(new THREE.Color(0.0, 0.0, 0.0));
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( 1280, 720 );

	document.getElementById("WebGL-output").appendChild(renderer.domElement);
	
	video 		= document.getElementById( 'video' );

	camera 		= new THREE.OrthographicCamera( -0.5, 0.5, 0.5, -0.5, -1.0, 1.0 );
	scene.add( camera );
	
	// Plane
	var planeGeometry 	= new THREE.PlaneBufferGeometry();                 
	const texture 		= new THREE.VideoTexture( video );

	var planeMat 		= new THREE.MeshBasicMaterial( { map:texture } );  

	var plane 			= new THREE.Mesh( planeGeometry, planeMat );
	scene.add( plane );	

	// Global Axis
	var globalAxis = new THREE.AxesHelper( 1.0 );
	globalAxis.position.set(0.0, 0.0, 0.5);
	scene.add( globalAxis );

	if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {

		const constraints = { video: 	{ 	width		: 1280, 
											height		: 720, 
											facingMode	: 'user' 
										} 
							};

		navigator.mediaDevices.getUserMedia( constraints ).then( fStream ).catch( videoError);
		} 
	else 
		console.error( 'MediaDevices interface not available.' );
		
	renderer.clear();
	animate();
};

function fStream( stream ) {
	// apply the stream to the video element used in the texture
	video.srcObject = stream;
	video.play();
} 


function videoError ( error ) {
	console.error( 'Unable to access the camera/webcam.', error ); 
}; 

function animate() {
	requestAnimationFrame( animate );
	renderer.render( scene, camera );
};

main();
