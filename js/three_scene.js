// Setup the THREE scene
var scene, renderer, camera, stats, controls;
var CANVAS_WIDTH, CANVAS_HEIGHT;
document.addEventListener( "DOMContentLoaded", function(){
  var container = document.getElementById( 'three_container' );
  if(container===undefined){return;}
  CANVAS_WIDTH = container.clientWidth;
  CANVAS_HEIGHT = container.clientHeight;

  // Look at things!
  var lookTarget = new THREE.Vector3(0,0,0);

  // add the camera
  camera = new THREE.PerspectiveCamera( 60, CANVAS_WIDTH / CANVAS_HEIGHT, 0.1, 1e6 );
  // add the camera to the scene
  camera.position.z = 500;

  // add controls
  controls = new THREE.OrbitControls( camera, container );
  controls.addEventListener( 'change', render );
  //controls.addEventListener('change',function(){requestAnimationFrame( animate )});

  // make the scene
  scene = new THREE.Scene();

  // add light to the scene
  var dirLight = new THREE.DirectionalLight( 0xffffff );
  dirLight.position.set( 0, 0, 1000 ).normalize();
  scene.add( dirLight );

  // re-add?
  renderer = new THREE.WebGLRenderer( { antialias: false } );
  renderer.setClearColor( 0x005500, 1 );
  renderer.setSize( CANVAS_WIDTH, CANVAS_HEIGHT );
  // Add to the container
  container.appendChild( renderer.domElement );

  // fps stats  
  stats = new Stats();
  container.appendChild( stats.domElement );

  ///////////////
///////////////
var sphereMaterial =
  new THREE.MeshLambertMaterial(
    {
      color: 0xFF0000
    });
// set up the sphere vars
var radius = 100,
    segments = 16,
    rings = 16;

var pl_width = 1, pl_height = 1;

// create a new mesh with
// sphere geometry - we will cover
// the sphereMaterial next!

var sphere = new THREE.Mesh(
  new THREE.SphereGeometry(
    radius,
    segments,
    rings),
  sphereMaterial);
scene.add(sphere);

var plane = new THREE.Mesh(
new THREE.PlaneGeometry(pl_width, pl_height),sphereMaterial);
plane.material.side = THREE.DoubleSide;
//scene.add(plane);

///////////////
///////////////

  // handle resizing
  window.addEventListener( 'resize', function() {
    // update the width/height
    var container = document.getElementById( 'three_container' );
    CANVAS_WIDTH  = container.clientWidth;
    CANVAS_HEIGHT = container.clientHeight;
    // update the camera view
    camera.aspect = CANVAS_WIDTH / CANVAS_HEIGHT;
    camera.updateProjectionMatrix();
    // Set the rendering size
    renderer.setSize( CANVAS_WIDTH, CANVAS_HEIGHT );
    // re-render
    render();
  }, false );

  console.log('THREE scene initialized!');
  // Begin animation
  animate();

}, false );

var render = function(){
  //console.log('whoa!')
  // render the scene using the camera
  renderer.render( scene, camera );
  stats.update();
}

var animate = function(){
  // request itself again
  //requestAnimationFrame( animate );
  controls.update();
  render();
};