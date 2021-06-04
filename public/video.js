// Mapeando uma imagem em Three.js

// import * as THREE from './resources/three.js/r126/build/three.module.js';
import * as THREE from '/build/three.module.js';

import { EffectComposer } from './jsm/postprocessing/EffectComposer.js';
import { RenderPass } from './jsm/postprocessing/RenderPass.js';
import { ShaderPass } from './jsm/postprocessing/ShaderPass.js';
import { BloomPass } from './jsm/postprocessing/BloomPass.js';
import { CopyShader } from './jsm/shaders/CopyShader.js';
import {FilmPass} from './jsm/postprocessing/FilmPass.js';
import { DotScreenShader } from './jsm/shaders/DotScreenShader.js'

import { GUI } from './jsm/libs/dat.gui.module.js';

var texture;
var renderer;
var scene;
var camera;
var video;
var light;
var planeGeometry;
var planeMat;
var plane;
let pixelPass, params;
let spotLight, lightHelper, shadowCameraHelper, composer, center, geometry, material, mesh, mouse;

function main() {

	scene 		= new THREE.Scene();
	
	video = document.getElementById( 'video' );

	camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 10000 );
	camera.position.set( 0, 0, 500 );


	scene.add( camera );
	center = new THREE.Vector3();
	center.z = - 1000;

	
	planeGeometry 	= new THREE.PlaneBufferGeometry();      

	const width = 640, height = 480;
	const nearClipping = 850, farClipping = 4000;

	geometry = new THREE.BufferGeometry();

	texture = new THREE.VideoTexture( video );
	texture.minFilter = THREE.NearestFilter;

	// planeMat 		= new THREE.MeshPhongMaterial( { map:texture } );  
	
	const vertices = new Float32Array( width * height * 3 );

	for ( let i = 0, j = 0, l = vertices.length; i < l; i += 3, j ++ ) {

		vertices[ i ] = j % width;
		vertices[ i + 1 ] = Math.floor( j / width );

	}

	geometry.setAttribute( 'position', new THREE.BufferAttribute( vertices, 3 ) );

	material = new THREE.ShaderMaterial( {

		uniforms: {

			"map": { value: texture },
			"width": { value: width },
			"height": { value: height },
			"nearClipping": { value: nearClipping },
			"farClipping": { value: farClipping },

			"pointSize": { value: 2 },
			"zOffset": { value: 1000 }

		},
		vertexShader: document.getElementById( 'vs' ).textContent,
		fragmentShader: document.getElementById( 'fs' ).textContent,
		blending: THREE.AdditiveBlending,
		depthTest: false, depthWrite: false,
		transparent: true

	} );


	mesh = new THREE.Points( geometry, material );
	scene.add( mesh );

	const gui = new GUI();
	gui.add( material.uniforms.nearClipping, 'value', 1, 10000, 1.0 ).name( 'nearClipping' );
	gui.add( material.uniforms.farClipping, 'value', 1, 10000, 1.0 ).name( 'farClipping' );
	gui.add( material.uniforms.pointSize, 'value', 1, 10, 1.0 ).name( 'pointSize' );
	gui.add( material.uniforms.zOffset, 'value', 0, 4000, 1.0 ).name( 'zOffset' );


	mouse = new THREE.Vector3( 0, 0, 1 );

	
	renderer = new THREE.WebGLRenderer();
	renderer.setPixelRatio( window.devicePixelRatio );
	renderer.setSize( window.innerWidth, window.innerHeight );
	document.getElementById("WebGL-output").appendChild(renderer.domElement)

	document.addEventListener( 'mousemove', onDocumentMouseMove );
	window.addEventListener( 'resize', onWindowResize );
	

	if ( navigator.mediaDevices && navigator.mediaDevices.getUserMedia ) {

		const constraints = { video: 	{ 	width		: 630, 
											height		: 320, 
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
	camera.position.x += ( mouse.x - camera.position.x ) * 0.05;
	camera.position.y += ( - mouse.y - camera.position.y ) * 0.05;
	camera.lookAt( center );


	renderer.render( scene, camera );

};

function onWindowResize() {

	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();

	renderer.setSize( window.innerWidth, window.innerHeight );

}

function onDocumentMouseMove( event ) {

	mouse.x = ( event.clientX - window.innerWidth / 2 ) * 8;
	mouse.y = ( event.clientY - window.innerHeight / 2 ) * 8;

}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
      x: evt.clientX - rect.left,
      y: evt.clientY - rect.top
    };
}

function updateGUI() {

	pixelPass.uniforms[ "pixelSize" ].value = params.pixelSize;

}



main();

