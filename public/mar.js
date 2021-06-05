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
let displacement, noise, uvAttribute;

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

    camera = new THREE.PerspectiveCamera( 55, window.innerWidth / window.innerHeight, 1, 20000 );
    camera.position.set( 300, 300, 1000 );

    //

    sun = new THREE.Vector3();

    // Water

    // waterGeometry = new THREE.PlaneGeometry( 10000, 10000 );
    waterGeometry = new THREE.PlaneBufferGeometry( 10000, 10000, 512, 512 );
    // const wireframe = new THREE.WireframeGeometry( waterGeometry );
    // const line = new THREE.LineSegments( wireframe );
    // line.material.depthTest = false;
    // // line.material.opacity = 0.25;
    // line.material.transparent = true;
    // const gridHelper = new THREE.GridHelper( 512, 5 0x0000ff, 0x808080 );
	// 			// gridHelper.position.y = - 150;
	// 			// gridHelper.position.x = - 150;
	// 			scene.add( gridHelper );
    // scene.add( line );
    // var noiseTexture = new THREE.ImageUtils.loadTexture( './cloud.png' );
	// noiseTexture.wrapS = noiseTexture.wrapT = THREE.RepeatWrapping; 
    // console.log(noiseTexture);
	// magnitude of noise effect
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
    scene.add( sky );

    const skyUniforms = sky.material.uniforms;

    skyUniforms[ 'turbidity' ].value = 10;
    skyUniforms[ 'rayleigh' ].value = 2;
    skyUniforms[ 'mieCoefficient' ].value = 0.005;
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
    // vertexDisplacimente = new Float32Array(water.geometry.attributes.position.count)
    // const normals = [];
    // for(var i = 0; i < vertexDisplacimente.length; i += 1){
    //     vertexDisplacimente[i] = Math.sin(i+40);
        
    // }

    // water.geometry.verticesNeedUpdate = true;
    

    // waterGeometry.setAttribute('vertexDisplacimente', new THREE.BufferAttribute(vertexDisplacimente, 1));
    // waterGeometry.setAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ) );
   
    updateSun();

    //

    geometry = new THREE.BoxGeometry( 30, 30, 30 );

    const material = new THREE.MeshStandardMaterial( { roughness: 0 } );

    // mesh = new THREE.Mesh( geometry, material );
    // scene.add( mesh );
    // console.log(mesh)
    // //
    // geometryPostions = waterGeometry.attributes.position;

   

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

function render() {

    const time2 = clock.getElapsedTime() * 10;
    const time = performance.now() * 0.01; //velocidade das ondas

    // mesh.position.y = Math.sin( time ) * 20 + 5;
    // mesh.rotation.x = time * 0.50;
    // mesh.rotation.z = time * 1.51;
    water.material.uniforms[ 'amplitude' ].value =  30.00 + 0.25; // tamanho das ondas

    // water.geometry.positon.y =  5.00 + Math.sin(alpha) * 0.25
    water.material.uniforms[ 'time' ].value += 1.0 / 60.0;


    for ( let i = 0; i < displacement.length; i ++ ) {

        // if ( (i > displacement.length/2)){
            displacement[ i ] = Math.sin( 0.1 * i + time );
            noise[ i ] += 0.5 * ( 0.5 - Math.random() );
            noise[ i ] = THREE.MathUtils.clamp( noise[ i ], - 100,3);

            displacement[ i ] += noise[ i ];
        // }

    }

    uvAttribute = water.geometry.attributes.uv;


    for (var i = 0; i < uvAttribute.count; i++) {

        var u = uvAttribute.getX(i);
        var v = uvAttribute.getY(i);
  
        // do something with uv
        u = u + Math.random() * Math.random();
        v = v + Math.random() * Math.random() * 50.0;
  
  
        // write values back to attribute
        uvAttribute.setXY(i, u, v);
      }

   

    water.geometry.attributes.displacement.needsUpdate = true;

    // for(var i = 0; i < water.geometry.attributes.position.count; i+= 1){
       
    //         water.geometry.attributes.position.setY(i + Math.sin(i + Math.random() * 0.25)) ;
            
    // }

    water.geometry.needsUpdate = true;
    uvAttribute.needsUpdate = true;


    renderer.render( scene, camera );

}
