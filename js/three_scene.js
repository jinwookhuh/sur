// Setup the THREE scene
var scene, renderer, camera, stats, controls;
// special objects
var foot_floor, foot_steps, foot_geo, foot_mat;
// particle system
var particleSystem
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
  //container.addEventListener( 'mouseup', select_footstep, false );
  container.addEventListener( 'dblclick', select_footstep, false );

  console.log('THREE scene initialized!');

  // Start the webworker
  var ww_script = "mesh_worker"
  //var ww_script = "depth_worker"
  mesh_worker = new Worker("js/"+ww_script+".js");
  mesh_worker.onmessage = function(e) {
    if(e.data=='initialized'){
      console.log('Using WebWorker '+ww_script);
      return;
    }
    // TODO: Is this expensive, or just a cheap view change?
    var positions = new Float32Array(e.data);

    // debug
    console.log('processed mesh',positions);
    console.log(e)
    /*
    var midex = 320*(240/2)+(320/2);
    console.log('middle: '+positions[midex]+','+positions[midex+1]+','+positions[midex+2]);
    */
    //update_particles( positions );
  }; //onmessage
  mesh_worker.postMessage('Start!');

  // make the particle system
  make_particle_system();

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
  //console.log(placement);

  // make a new footstep
  var new_footstep = new THREE.Mesh( foot_geo, foot_mat );
  scene.add(new_footstep)

  //console.log(new_footstep)
  new_footstep.position.copy(placement);
  foot_steps.push(new_footstep);

  // Render the scene now that we have updated the footsteps
  render();
  
}
// for rotation (look for theta)
//: view-source:mrdoob.github.io/three.js/examples/webgl_interactive_voxelpainter.html

var mesh_to_three = function( raw_mesh_ctx, resolution, depths, fov, name ){
  var buf = raw_mesh_ctx.getImageData(1, 1, resolution[0], resolution[1]).data.buffer;
  var obj = {}
  obj.buf = buf;
  obj.res = resolution;
  obj.dep = depths;
  obj.fov = fov;
  obj.use = name;
  console.log(obj)
  mesh_worker.postMessage(obj,[buf]);
}

var update_particles = function( positions ){
  particleSystem.geometry.attributes.position.array = positions;
  particleSystem.geometry.attributes[ "position" ].needsUpdate = true;
}

var make_particle_system = function(){
  // TODO: Ensure nparticles does not exceed 65000
  // TODO: Use the index attribute to overcome the limit
  // as documented in buffer triangles
  var nparticles = 500*480;

  var geometry = new THREE.BufferGeometry();
  geometry.attributes = {
    position: {
      itemSize: 3,
      array: new Float32Array( nparticles * 3 )
    },
    color: {
      itemSize: 3,
      array: new Float32Array( nparticles * 3 )
    }
  } // geom attr
  
  // default (random) particle positions/colors
  var positions = geometry.attributes.position.array;
  var colors = geometry.attributes.color.array;
  var color = new THREE.Color();
  var n = 1000, n2 = n / 2; // particles spread in the cube
  for ( var i = 0; i < positions.length; i += 3 ) {

    // positions

    var x = Math.random() * n - n2;
    var y = Math.random() * n - n2;
    var z = Math.random() * n - n2;

    positions[ i ]     = x;
    positions[ i + 1 ] = y;
    positions[ i + 2 ] = z;

    // colors
    
    var vx = ( x / n ) + 0.5;
    var vy = ( y / n ) + 0.5;
    var vz = ( z / n ) + 0.5;

    color.setRGB( vx, vy, vz );
    
    color.setRGB( .5, .5, .5 );

    colors[ i ]     = color.r;
    colors[ i + 1 ] = color.g;
    colors[ i + 2 ] = color.b;

  }

  geometry.computeBoundingSphere();
  // default size: 15
  var material = new THREE.ParticleBasicMaterial( { size: .002, vertexColors: true } ); 

  particleSystem = new THREE.ParticleSystem( geometry, material );
  scene.add( particleSystem );
}