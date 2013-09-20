// Setup the WebSocket connection and callbacks
// Form the mesh image layer
var mesh_img = new Image();
var mesh_ctx;
/* Handle the onload of the mesh_image */
var mesh_handler = function(e){
  var w = this.width;
  var h = this.height;
  var img = this;
  mesh_ctx.drawImage(this, 0, 0);
  
  // Remove the image for memory management reasons
  URL.revokeObjectURL(this.src);
  this.src = '';
}

document.addEventListener( "DOMContentLoaded", function(){
  
  // Configuration
  var mesh_port = 9001
  
  // Checksum and metadata
  var fr_sz_checksum;
  var fr_metadata;

  // setup the canvas element
  var mesh_canvas = document.createElement('canvas');
  var mesh_container = document.getElementById('mesh_container');
  mesh_canvas.setAttribute('width',mesh_container.clientWidth);
  mesh_canvas.setAttribute('height',mesh_container.clientHeight);
  mesh_ctx = mesh_canvas.getContext('2d');
  mesh_container.appendChild( mesh_canvas );

  // Connect to the websocket server
  var ws = new WebSocket('ws://' + host + ':' + mesh_port);
  //ws.binaryType = "arraybuffer";
  ws.binaryType = "blob";
  
  ws.open = function(e){
    console.log('connected!')
  }
  ws.onerror = function(e) {
    console.log('error',e)
  }
  ws.onclose = function(e) {
    console.log('close',e)
  }
	
  // Send data to the webworker
  ws.onmessage = function(e){
    if(typeof e.data === "string"){
      fr_metadata   = JSON.parse(e.data)
      var recv_time = e.timeStamp/1e6;
      var latency   = recv_time - fr_metadata.t
      //console.log('mesh Latency: '+latency*1000+'ms',fr_metadata)
      return;
    }
		
    // Use the size as a sort of checksum
    // for metadata pairing with an incoming image
    fr_sz_checksum = e.data.size;
    if(fr_metadata.sz!==fr_sz_checksum){
      console.log('Checksum fail!',fr_metadata.sz,fr_sz_checksum);
      return;
    }
    requestAnimationFrame( function(){
      // Put received JPEG data into the image
      mesh_img.src = URL.createObjectURL( e.data );
      // Trigger processing once the image is fully loaded
      mesh_img.onload = mesh_handler;
    }); //animframe
  };

}, false );