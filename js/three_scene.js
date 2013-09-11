// Setup the THREE scene
var scene, renderer, camera, stats;
document.addEventListener( "DOMContentLoaded", function(){
  var CANVAS_WIDTH = 200, CANVAS_HEIGHT = 200;
  var container = document.getElementById( 'scene_container' );
  if(container===undefined){return;}

  // make the scene
  scene = new THREE.Scene();

  // add the camera
  camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 0.1, 1e6 );

  // add light

  var dirLight = new THREE.DirectionalLight( 0xffffff );
  dirLight.position.set( 0, 0, 10 ).normalize();

  camera.add( dirLight );
  camera.add( dirLight.target );
  
  // add the camera to the scene
  
  scene.add( camera );

  // fps stats
  
  stats = new Stats();

  // re-add?
  renderer = new THREE.WebGLRenderer( { antialias: false } );
  renderer.setClearColor( 0x000000, 1 );
  renderer.setSize( CANVAS_WIDTH, CANVAS_HEIGHT );
  // Add to the container
  container.appendChild( renderer.domElement );
  container.appendChild( stats.domElement );

  console.log('THREE scene initialized!');
  // Begin animation
  animate();

}, false );

var animate = function(){
  //console.log('here')
  //controls.update(clock.getDelta());
  // render the scene using the camera
  renderer.render( scene, camera );
  stats.update();
  // request itself again
  requestAnimationFrame( animate );
}