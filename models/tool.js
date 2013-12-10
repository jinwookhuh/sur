(function(ctx){
  
  // Function to hold methods
  function Tool(){}

  //////////////
  // RPC URLs //
  //////////////
  var rpc_url = rest_root+'/m/hcm/tool/model'
  
  // Relative waypoint offset in ROBOT coordinates
  // but with THREE scale (mm)
  var offset = new THREE.Vector2(690,270);
  
  /////////////////////
  // Mesh definition //
  /////////////////////
  // master
  var item_mat   = new THREE.MeshLambertMaterial({color: 0xFFD801});
  var item_geo   = new THREE.CylinderGeometry(25,25,140,12,1,false);
  // Drill direction
  var item2_mesh = new THREE.Mesh(new THREE.CylinderGeometry(30,30,240,12,1));
  // This also used as tmp variable
  var item_angle = new THREE.Euler( Math.PI/2, 0, 0 );
  item2_mesh.quaternion.setFromEuler( item_angle );
  item2_mesh.position.set(0,85,30);
  THREE.GeometryUtils.merge( item_geo, item2_mesh );
  // Drill base
  var item3_mesh = new THREE.Mesh(new THREE.CubeGeometry(80,70,120));
  item3_mesh.position.set(0,-90,0);
  THREE.GeometryUtils.merge( item_geo, item3_mesh );
  // Instantiate the master
  var item_mesh  = new THREE.Mesh( item_geo, item_mat );
  
  //////////////////////
  // Model converters //
  //////////////////////
  var three_to_model = function(){
    // Acquire the model
    item_angle.setFromQuaternion(item_mesh.quaternion);
    // Points in THREEjs to torso frame
    var model = Transform.three_to_torso(item_mesh.position,Robot);
    model.push(item_angle.y);
    console.log('tool',model);
    return model;
  }
  var model_to_three = function(model){
    // Assumption: Global coordinates
    item_mesh.position.x = 1000*model[1];
    item_mesh.position.z = 1000*model[0];
    item_mesh.rotation.y = -1*model[2];
  }
  
  /////////////////////////////
  // Object manipulation API //
  /////////////////////////////
  Tool.select = function(p,r){
    // Set the position
    item_mesh.position.copy(p);
    Tool.send();
  }
  Tool.clear = function(){

  }
  Tool.init = function(){
    // Add to the world
    World.add(item_mesh);
  }
  Tool.deinit = function(){
    // Add to the world
    World.remove(item_mesh);
  }
  Tool.send = function(){
    var model = three_to_model();
    qwest.post( rpc_url, {val:JSON.stringify(model)} );
  }
  Tool.get_mod_mesh = function(){
    return item_mesh;
  }
  Tool.loop = function(){
    // Get the model from the robot (could be pesky...?)
    qwest.get( rpc_url,{},{},function(){
      // Use a 1 second timeout for the XHR2 request for getting the model
      this.timeout = 1000; // ms
    })
    .success(function(model){
      model_to_three(model);
    });
  }
  Tool.mod_callback = function(){
    
  }
  Tool.gen_wp = function(){
    // yield the optimal waypoint
  }
  Tool.add_buttons = function(holder){
    // Grab
    var grab = document.createElement('a');
    grab.classList.add('big');
    grab.classList.add('button');
    grab.id = 'tool_grab';
    grab.href = '#';
    grab.textContent = 'Grab';
    holder.appendChild(grab);
    clicker(grab,function(){
      qwest.post(fsm_url,{fsm: 'ArmFSM', evt: 'toolgrab'});
    });
  }

  /////////////////////////
  // Metadata and Export //
  /////////////////////////
  Tool.item_name = 'Tool';
  // export
	ctx.Tool = Tool;

})(this);