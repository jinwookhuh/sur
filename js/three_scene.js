// Setup the THREE scene
var scene, renderer, camera, stats, controls;
// special objects
var foot_floor, foot_steps, foot_geo, foot_mat;
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
  camera.position.y = -500;

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
  //container.appendChild( stats.domElement );

  ///////////////
///////////////
var sphereMaterial =
  new THREE.MeshLambertMaterial(
    {
      color: 0xFF0000
    });
var wireMaterial = new THREE.MeshBasicMaterial({
  wireframe: true,
  color: 'blue'
})
// set up the sphere vars
var radius = 100,
    segments = 16,
    rings = 16;

var pl_width = 5000, pl_height = 5000, pl_seg = 100;

// create a new mesh with
// sphere geometry - we will cover
// the sphereMaterial next!

var sphere = new THREE.Mesh(
  new THREE.SphereGeometry(
    radius,
    segments,
    rings),
  sphereMaterial);
//scene.add(sphere);

foot_floor = new THREE.Mesh(
new THREE.PlaneGeometry(pl_width, pl_height, pl_seg, pl_seg),wireMaterial);
//foot_floor.material.side = THREE.DoubleSide;
scene.add(foot_floor);
// move it around in the scene
//mesh.position = new THREE.Vector3(100, 100, 100)

// Make the footstep queue
// TODO: Use underscore to remove arbitrary footsteps
foot_geo = new THREE.CubeGeometry( 50, 100, 10 );
foot_mat = new THREE.MeshLambertMaterial({
  color: 0xAAAAAA
});
foot_steps = []

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

  // add event for picking the location of a click on the plane
  container.addEventListener( 'mousedown', select_footstep, false );

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

// http://stackoverflow.com/questions/17044070/three-js-cast-an-picking-array
var select_footstep = function(event){
  // find the mouse position (use NDC coordinates, per documentation)
  var mouse_vector = new THREE.Vector3(
    ( event.offsetX / CANVAS_WIDTH ) * 2 - 1,
    -( event.offsetY / CANVAS_HEIGHT ) * 2 + 1);
  //console.log('Mouse',mouse_vector); // need Vector3, not vector2

  var projector = new THREE.Projector();
  //console.log('projector',projector)
  var raycaster = projector.pickingRay(mouse_vector,camera);
  //console.log('picking raycaster',raycaster)

  // intersect the plane
  var intersection = raycaster.intersectObject( foot_floor );
  // if no intersection
  if(intersection.length==0){ return; }

  // record the position
  var placement = intersection[0].point;
  console.log(placement);

  // make a new footstep
  var new_footstep = new THREE.Mesh( foot_geo, foot_mat );
  scene.add(new_footstep)

  console.log(new_footstep)
  new_footstep.position.copy(placement);
  foot_steps.push(new_footstep);

  render();
  
}
// for rotation (look for theta)
//: view-source:mrdoob.github.io/three.js/examples/webgl_interactive_voxelpainter.html