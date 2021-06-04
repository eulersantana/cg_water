import * as THREE from '../build/three.module.js';

/**
 * Work based on :
 * http://slayvin.net : Flat mirror for three.js
 * http://www.adelphi.edu/~stemkoski : An implementation of water shader based on the flat mirror
 * http://29a.ch/ && http://29a.ch/slides/2012/webglwater/ : Water shader explanations in WebGL
 */

var Water = function ( geometry, options ) {

	THREE.Mesh.call( this, geometry );

	var scope = this;

	options = options || {};

	var textureWidth = options.textureWidth !== undefined ? options.textureWidth : 512;
	var textureHeight = options.textureHeight !== undefined ? options.textureHeight : 512;

	var clipBias = options.clipBias !== undefined ? options.clipBias : 0.0;
	var alpha = options.alpha !== undefined ? options.alpha : 1.0;
	var time = options.time !== undefined ? options.time : 0.0;
	var normalSampler = options.waterNormals !== undefined ? options.waterNormals : null;
	var sunDirection = options.sunDirection !== undefined ? options.sunDirection : new THREE.Vector3( 0.70707, 0.70707, 0.0 );
	var sunColor = new THREE.Color( options.sunColor !== undefined ? options.sunColor : 0xffffff );
	var waterColor = new THREE.Color( options.waterColor !== undefined ? options.waterColor : 0x7F7F7F );
	var eye = options.eye !== undefined ? options.eye : new THREE.Vector3( 0, 0, 0 );
	var resolution = options.resolution !== undefined ? options.resolution : new THREE.Vector2( 0, 0 );
	var distortionScale = options.distortionScale !== undefined ? options.distortionScale : 20.0;
	var side = options.side !== undefined ? options.side : THREE.FrontSide;
	var fog = options.fog !== undefined ? options.fog : false;

	//

	var mirrorPlane = new THREE.Plane();
	var normal = new THREE.Vector3();
	var mirrorWorldPosition = new THREE.Vector3();
	var cameraWorldPosition = new THREE.Vector3();
	var rotationMatrix = new THREE.Matrix4();
	var lookAtPosition = new THREE.Vector3( 0, 0, - 1 );
	var clipPlane = new THREE.Vector4();

	var view = new THREE.Vector3();
	var target = new THREE.Vector3();
	var q = new THREE.Vector4();

	var textureMatrix = new THREE.Matrix4();

	var mirrorCamera = new THREE.PerspectiveCamera();

	var parameters = {
		minFilter: THREE.LinearFilter,
		magFilter: THREE.LinearFilter,
		format: THREE.RGBFormat
	};

	var renderTarget = new THREE.WebGLRenderTarget( textureWidth, textureHeight, parameters );

	if ( ! THREE.MathUtils.isPowerOfTwo( textureWidth ) || ! THREE.MathUtils.isPowerOfTwo( textureHeight ) ) {

		renderTarget.texture.generateMipmaps = false;

	}

	var mirrorShader = {

		uniforms: THREE.UniformsUtils.merge( [
			THREE.UniformsLib[ 'fog' ],
			THREE.UniformsLib[ 'lights' ],
			{
				'normalSampler': { value: null },
				'mirrorSampler': { value: null },
				'alpha': { value: 1.0 },
				'time': { value: 0.0 },
				'size': { value: 100.0 },
				'distortionScale': { value: 20.0 },
				'textureMatrix': { value: new THREE.Matrix4() },
				'sunColor': { value: new THREE.Color( 0x7F7F7F ) },
				'sunDirection': { value: new THREE.Vector3( 0.70707, 0.70707, 0 ) },
				'eye': { value: new THREE.Vector3() },
				'waterColor': { value: new THREE.Color( 0x555555 ) },
                'resolution': { value: new THREE.Uniform( new THREE.Vector2() )}

			}
		] ),

		vertexShader: document.getElementById( 'vs' ).textContent,

		fragmentShader: document.getElementById( 'fs' ).textContent

	};

	var material = new THREE.ShaderMaterial( {
		fragmentShader: mirrorShader.fragmentShader,
		vertexShader: mirrorShader.vertexShader,
		uniforms: THREE.UniformsUtils.clone( mirrorShader.uniforms ),
		lights: true,
		side: side,
		fog: fog
	} );

	material.uniforms[ 'mirrorSampler' ].value = renderTarget.texture;
	material.uniforms[ 'textureMatrix' ].value = textureMatrix;
	material.uniforms[ 'alpha' ].value = alpha;
	material.uniforms[ 'time' ].value = time;
	material.uniforms[ 'normalSampler' ].value = normalSampler;
	material.uniforms[ 'sunColor' ].value = sunColor;
	material.uniforms[ 'waterColor' ].value = waterColor;
	material.uniforms[ 'sunDirection' ].value = sunDirection;
	material.uniforms[ 'distortionScale' ].value = distortionScale;

	material.uniforms[ 'eye' ].value = eye;
	material.uniforms[ 'resolution' ].value = resolution;
	scope.material = material;

	scope.onBeforeRender = function ( renderer, scene, camera ) {

		mirrorWorldPosition.setFromMatrixPosition( scope.matrixWorld );
		cameraWorldPosition.setFromMatrixPosition( camera.matrixWorld );

		rotationMatrix.extractRotation( scope.matrixWorld );

		normal.set( 0, 0, 1 );
		normal.applyMatrix4( rotationMatrix );

		view.subVectors( mirrorWorldPosition, cameraWorldPosition );

		// Avoid rendering when mirror is facing away

		if ( view.dot( normal ) > 0 ) return;

		view.reflect( normal ).negate();
		view.add( mirrorWorldPosition );

		rotationMatrix.extractRotation( camera.matrixWorld );

		lookAtPosition.set( 0, 0, - 1 );
		lookAtPosition.applyMatrix4( rotationMatrix );
		lookAtPosition.add( cameraWorldPosition );

		target.subVectors( mirrorWorldPosition, lookAtPosition );
		target.reflect( normal ).negate();
		target.add( mirrorWorldPosition );

		mirrorCamera.position.copy( view );
		mirrorCamera.up.set( 0, 1, 0 );
		mirrorCamera.up.applyMatrix4( rotationMatrix );
		mirrorCamera.up.reflect( normal );
		mirrorCamera.lookAt( target );

		mirrorCamera.far = camera.far; // Used in WebGLBackground

		mirrorCamera.updateMatrixWorld();
		mirrorCamera.projectionMatrix.copy( camera.projectionMatrix );

		// Update the texture matrix
		textureMatrix.set(
			0.5, 0.0, 0.0, 0.5,
			0.0, 0.5, 0.0, 0.5,
			0.0, 0.0, 0.5, 0.5,
			0.0, 0.0, 0.0, 1.0
		);
        
		textureMatrix.multiply( mirrorCamera.projectionMatrix );
		textureMatrix.multiply( mirrorCamera.matrixWorldInverse );

		// Now update projection matrix with new clip plane, implementing code from: http://www.terathon.com/code/oblique.html
		// Paper explaining this technique: http://www.terathon.com/lengyel/Lengyel-Oblique.pdf
		mirrorPlane.setFromNormalAndCoplanarPoint( normal, mirrorWorldPosition );
		mirrorPlane.applyMatrix4( mirrorCamera.matrixWorldInverse );

		clipPlane.set( mirrorPlane.normal.x, mirrorPlane.normal.y, mirrorPlane.normal.z, mirrorPlane.constant );

		var projectionMatrix = mirrorCamera.projectionMatrix;

		q.x = ( Math.sign( clipPlane.x ) + projectionMatrix.elements[ 8 ] ) / projectionMatrix.elements[ 0 ];
		q.y = ( Math.sign( clipPlane.y ) +  projectionMatrix.elements[ 9 ] ) / projectionMatrix.elements[ 5 ];
		q.z = - 1.0;
		q.w = ( 1.0 + projectionMatrix.elements[ 10 ] ) / projectionMatrix.elements[ 14 ];

		// Calculate the scaled plane vector
		clipPlane.multiplyScalar( 2.0 / clipPlane.dot( q ) );

		// Replacing the third row of the projection matrix
		projectionMatrix.elements[ 2 ] = clipPlane.x;
		projectionMatrix.elements[ 6 ] = clipPlane.y;
		projectionMatrix.elements[ 10 ] = clipPlane.z + 1.0 - clipBias;
		projectionMatrix.elements[ 14 ] = clipPlane.w;

		eye.setFromMatrixPosition( camera.matrixWorld );

		// Render

		if ( renderer.outputEncoding !== THREE.LinearEncoding ) {

			console.log( 'THREE.Water: WebGLRenderer must use LinearEncoding as outputEncoding.' );
			scope.onBeforeRender = function () {};

			return;

		}

		if ( renderer.toneMapping !== THREE.NoToneMapping ) {

			console.log( 'THREE.Water: WebGLRenderer must use NoToneMapping as toneMapping.' );
			scope.onBeforeRender = function () {};

			return;

		}

		var currentRenderTarget = renderer.getRenderTarget();

		var currentXrEnabled = renderer.xr.enabled;
		var currentShadowAutoUpdate = renderer.shadowMap.autoUpdate;

		scope.visible = false;

		renderer.xr.enabled = false; // Avoid camera modification and recursion
		renderer.shadowMap.autoUpdate = true; // Avoid re-computing shadows

		renderer.setRenderTarget( renderTarget );

		renderer.state.buffers.depth.setMask( true ); // make sure the depth buffer is writable so it can be properly cleared, see #18897

		if ( renderer.autoClear === false ) renderer.clear();
		renderer.render( scene, mirrorCamera );

		scope.visible = true;

		renderer.xr.enabled = currentXrEnabled;
		renderer.shadowMap.autoUpdate = currentShadowAutoUpdate;

		renderer.setRenderTarget( currentRenderTarget );

		// Restore viewport

		var viewport = camera.viewport;

		if ( viewport !== undefined ) {

			renderer.state.viewport( viewport );

		}

	};

};

Water.prototype = Object.create( THREE.Mesh.prototype );
Water.prototype.constructor = Water;

export { Water };
