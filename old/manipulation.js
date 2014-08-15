/*****
 * Camera display in the DOM
 */
(function(ctx){
  
  // Function to hold methods
  function Manipulation(){}
  
  // Make the modifying visual
  var tcontrol;
  
  // Manipulatable items
  var items = [];
  var cur_item_id = -1, cur_item = null;
  
  // Functions to start/stop modifying
  var yes_mod = function(){
    if(Manipulation.is_mod==true){return;}
    Manipulation.is_mod = true;
    // Initial callback
    cur_item.mod_callback();
    // stop the normal controls
    World.disable_orbit();
    // attach the tcontrol
    var cur_mesh = cur_item.get_mod_mesh();
    tcontrol.attach( cur_mesh );
    World.add( tcontrol );
    tcontrol.update();
    // Keyboard shortcuts for tcontrol
    keypress.register_many(tcontrol_hotkeys);
  };
  var no_mod = function(){
    if(Manipulation.is_mod==false){return;}
    Manipulation.is_mod = false;
    // Final callback
    cur_item.mod_callback();
    // Remove the tcontrol
    World.remove( tcontrol );
    // detach the tcontrol
    var cur_mesh = cur_item.get_mod_mesh();
    tcontrol.detach( cur_mesh );
    // Go back to the normal view
    World.enable_orbit();
    
    // Keyboard shortcuts
    keypress.unregister_many(tcontrol_hotkeys);
    // send the model to the robot
    //cur_item.send();
    
  };
  // Function to cycle manipulation item to the item_id
  Manipulation.cycle_item = function(item_id){
    // Remove the event listener
    tcontrol.removeEventListener( 'modify', cur_item.mod_callback );
    // De-init
    cur_item.deinit(tcontrol);
    
    // set the next item
    cur_item_id = item_id;
    if(cur_item_id>=items.length){cur_item_id=0;}
    cur_item = items[cur_item_id];
    
    // Init the item
    cur_item.init(tcontrol);
    // Add the event listener
    tcontrol.addEventListener( 'modify', cur_item.mod_callback );
    // Handle intersections with meshes in the world
    World.handle_intersection(cur_item.select);
    
  }

  ////////////////
  // Global API //
  ////////////////
  Manipulation.is_mod = false;
  
  // Loop the item
  Manipulation.loop = function(){
    cur_item.loop(tcontrol);
  }
  
  Manipulation.modify = function(set){
    if(set=='yes'||set==true){
      yes_mod();
    } else if(set=='no'||set==false){
      no_mod();
    } else {
      // Toggle
      if(Manipulation.is_mod==false){yes_mod();}else{no_mod();}
    }
  }
  
  // Add an item
  Manipulation.add_item = function(item){
    var item_id = items.length;
    // Store in our array
    items.push(item);
    // Place as a select option
    var menu = $('#menu_obj')[0];
    // If no menu, then exit
    if(menu===undefined){return;}
    var option = new Option(item.item_name);
    option.value = item_id;
    menu.appendChild(option);
  }
  
  // Vantage point for looking at objects
  Manipulation.get_item = function(){
    return cur_item;
  }
  
  Manipulation.setup = function(){
    // initialize the element
    cur_item_id = 0;
    cur_item    = items[cur_item_id];
    cur_item.init();
    //cur_item.add_buttons();
    // Handle intersections with meshes in the world
    World.handle_intersection(cur_item.select);
    // Make a tcontrol
    tcontrol = World.generate_tcontrol();
    tcontrol.attach( cur_item.get_mod_mesh() );
    tcontrol.addEventListener( 'modify', cur_item.mod_callback );
    // Setup hotkeys for items
    keypress.register_many(item_hotkeys);
  } // setup

  //////
  // Keypressing hotkeys
  var tcontrol_hotkeys = [
/*
    {
      // swap global/local for visual cue
      "keys"          : "`",
      "is_exclusive"  : true,
      "on_keyup"      : function(event) {
          event.preventDefault();
          tcontrol.setSpace( tcontrol.space == "local" ? "world" : "local" );
      },
      "this"          : ctx
    },
*/
    {
      // translation
      "keys"          : "t",
      "is_exclusive"  : true,
      "on_keyup"      : function(event) {
          event.preventDefault();
          tcontrol.setMode( "translate" );
      },
      "this"          : ctx
    },
    {
      // rotation
      "keys"          : "r",
      "is_exclusive"  : true,
      "on_keyup"      : function(event) {
          event.preventDefault();
          tcontrol.setMode( "rotate" );
      },
      "this"          : ctx
    },
  ];
  
  // Keypressing hotkeys
  var dp = 100; // 10cm at a time waypoint
  var ddp = 10;//25; // 1in at a time fine tune
  var item_hotkeys = [
{
      "keys"          : "`",
      "is_exclusive"  : true,
      "on_keyup"      : function(event) {
          event.preventDefault();
        if(cur_item.item_name=='Hand'){
		Hand.switch();
	}
          
      },
      "this"          : ctx
    },   
{
      // Escape modifications
      "keys"          : "0",
      "is_exclusive"  : true,
      "on_keyup"      : function(event) {
          event.preventDefault();
          Manipulation.modify();
      },
      "this"          : ctx
    },

  {
    // loop
    "keys"          : "k",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        Manipulation.loop();
    },
    "this"          : ctx
  },
  {
    // proceed
    "keys"          : "=",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        qwest.post( rpc_url_proceed, {val:JSON.stringify([1])} )
    },
    "this"          : ctx
  },
  {
    // reverse
    "keys"          : "-",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        qwest.post( rpc_url_proceed, {val:JSON.stringify([-1])} )
    },
    "this"          : ctx
  },
  //
  {
    "keys"          : "i",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
      event.preventDefault();
      var mod_mesh = cur_item.get_mod_mesh();
      // Relative direction wrt robot
      var pa = Robot.pa;
      var ca = Math.cos(pa), sa = Math.sin(pa);

var dx,dy;
	if(cur_item.item_name=='Waypoint'){
dx = dp*sa, dy = dp*ca;
	} else {
dx = ddp*sa, dy = ddp*ca;
}

      mod_mesh.position.x += dx;
      mod_mesh.position.z += dy;
      cur_item.mod_callback();
    },
    "this"          : ctx
  },
  {
    "keys"          : ",",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
      event.preventDefault();
      var mod_mesh = cur_item.get_mod_mesh();
      // Relative direction wrt robot
      var pa = Robot.pa;
      var ca = Math.cos(pa), sa = Math.sin(pa);


var dx,dy;
	if(cur_item.item_name=='Waypoint'){
dx = dp*sa, dy = dp*ca;
	} else {
dx = ddp*sa, dy = ddp*ca;
}

      mod_mesh.position.x -= dx;
      mod_mesh.position.z -= dy;
      cur_item.mod_callback();
    },
    "this"          : ctx
  },
  {
    "keys"          : "j",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
      event.preventDefault();
      var mod_mesh = cur_item.get_mod_mesh();
      // Relative direction wrt robot
      var pa = Robot.pa;
      var ca = Math.cos(pa), sa = Math.sin(pa);
var dx,dy;
	if(cur_item.item_name=='Waypoint'){
dx = dp*sa, dy = dp*ca;
	} else {
dx = ddp*sa, dy = ddp*ca;
}
      mod_mesh.position.x += dy;
      mod_mesh.position.z -= dx;
      cur_item.mod_callback();
    },
    "this"          : ctx
  },
  {
    "keys"          : "l",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
        // Relative direction wrt robot
        var pa = Robot.pa;
        var ca = Math.cos(pa), sa = Math.sin(pa);
var dx,dy;
	if(cur_item.item_name=='Waypoint'){
dx = dp*sa, dy = -dp*ca;
	} else {
dx = ddp*sa, dy = -ddp*ca;
}
        
        mod_mesh.position.x += dy;
        mod_mesh.position.z += dx;
        //
        cur_item.mod_callback();
    },
    "this"          : ctx
  },
  {
    "keys"          : "u",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
	if(cur_item.item_name=='Waypoint'){
mod_mesh.position.y += dp;
	} else {
mod_mesh.position.y += ddp;
}
        cur_item.mod_callback();
    },
    "this"          : ctx
  },
  {
    "keys"          : "m",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
	if(cur_item.item_name=='Waypoint'){
mod_mesh.position.y -= dp;
	} else {
mod_mesh.position.y -= ddp;
}
        
        cur_item.mod_callback();
        
    },
    "this"          : ctx
  },
  // yaw
  {
    "keys"          : ";",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
if(cur_item.item_name=='Waypoint'){
        mod_mesh.rotation.y += 10*DEG_TO_RAD;
} else {
        mod_mesh.rotation.y += 5*DEG_TO_RAD;
} 
       cur_item.mod_callback();
    },
    "this"          : ctx
  },
  {
    "keys"          : "'",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
if(cur_item.item_name=='Waypoint'){
        mod_mesh.rotation.y -= 10*DEG_TO_RAD;
} else {
        mod_mesh.rotation.y -= 5*DEG_TO_RAD;
} 
        cur_item.mod_callback();
    },
    "this"          : ctx
  },
  // pitch
  {
    "keys"          : "o",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
if(cur_item.item_name=='Waypoint'){
        mod_mesh.rotation.x += 10*DEG_TO_RAD;
} else {
        mod_mesh.rotation.x += 5*DEG_TO_RAD;
} 
        cur_item.mod_callback();
    },
    "this"          : ctx
  },
  {
    "keys"          : "p",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
if(cur_item.item_name=='Waypoint'){
        mod_mesh.rotation.x -= 10*DEG_TO_RAD;
} else {
        mod_mesh.rotation.x -= 5*DEG_TO_RAD;
} 
        cur_item.mod_callback();
    },
    "this"          : ctx
  },
  // roll
  {
    "keys"          : ".",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
if(cur_item.item_name=='Waypoint'){
        mod_mesh.rotation.z += 10*DEG_TO_RAD;
} else {
        mod_mesh.rotation.z += 5*DEG_TO_RAD;
} 
        cur_item.mod_callback();
    },
    "this"          : ctx
  },
  {
    "keys"          : "/",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
if(cur_item.item_name=='Waypoint'){
        mod_mesh.rotation.z -= 10*DEG_TO_RAD;
} else {
        mod_mesh.rotation.z -= 5*DEG_TO_RAD;
} 
        cur_item.mod_callback();
    },
    "this"          : ctx
  },
  // Special keys
  {
    "keys"          : "[",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        if(cur_item.item_name=='Hand'){Hand.special-=1}
    },
    "this"          : ctx
  },
  {
    "keys"          : "]",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
	if(cur_item.item_name=='Hand'){Hand.special+=1}
    },
    "this"          : ctx
  },
  
/*
  // FINE TUNE
  {
    "keys"          : "w",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
      event.preventDefault();
      var mod_mesh = cur_item.get_mod_mesh();
      // Relative direction wrt robot
      var pa = Robot.pa;
      var ca = Math.cos(pa), sa = Math.sin(pa);
      var dx = ddp*ca, dy = ddp*sa;
      mod_mesh.position.x += dy;
      mod_mesh.position.z += dx;
      cur_item.mod_callback();
        //if(cur_item.item_name!='Waypoint'){cur_item.send();}
    },
    "this"          : ctx
  },
  {
    "keys"          : "x",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
      event.preventDefault();
      var mod_mesh = cur_item.get_mod_mesh();
      var pa = Robot.pa;
      var ca = Math.cos(pa), sa = Math.sin(pa);
      var dx = ddp*ca, dy = ddp*sa;
      mod_mesh.position.x -= dy;
      mod_mesh.position.z -= dx;
      cur_item.mod_callback();
        //if(cur_item.item_name!='Waypoint'){cur_item.send();}
    },
    "this"          : ctx
  },
  {
    "keys"          : "a",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
      event.preventDefault();
      var mod_mesh = cur_item.get_mod_mesh();
      var pa = Robot.pa;
      var ca = Math.cos(pa), sa = Math.sin(pa);
      var dx = ddp*sa, dy = -ddp*ca;
      mod_mesh.position.x -= dy;
      mod_mesh.position.z -= dx;
      cur_item.mod_callback();
        //if(cur_item.item_name!='Waypoint'){cur_item.send();}
    },
    "this"          : ctx
  },
  {
    "keys"          : "d",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
        var pa = Robot.pa;
        var ca = Math.cos(pa), sa = Math.sin(pa);
        var dx = ddp*sa, dy = -ddp*ca;
        mod_mesh.position.x += dy;
        mod_mesh.position.z += dx;
        cur_item.mod_callback();
        //if(cur_item.item_name!='Waypoint'){cur_item.send();}
    },
    "this"          : ctx
  },
  {
    "keys"          : "q",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
        mod_mesh.position.y += ddp;
        cur_item.mod_callback();
        //if(cur_item.item_name!='Waypoint'){cur_item.send();}
    },
    "this"          : ctx
  },
  {
    "keys"          : "z",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
        var mod_mesh = cur_item.get_mod_mesh();
        mod_mesh.position.y -= ddp;
        cur_item.mod_callback();
        //if(cur_item.item_name!='Waypoint'){cur_item.send();}
    },
    "this"          : ctx
  },
*/
  //
  {
    "keys"          : "space",
    "is_exclusive"  : true,
    "on_keyup"      : function(event) {
        event.preventDefault();
console.log('sending...')
        cur_item.send();
    },
    "this"          : ctx
  },
  //
  
  ];

  // export
	ctx.Manipulation = Manipulation;

})(this);