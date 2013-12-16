// Once the page is done loading, execute main
document.addEventListener( "DOMContentLoaded", function(){
  // Set up the camera
  Camera2.setup();
  
  // Place on the page
  var camera_container = $('#camera2_container')[0];
  var img = Camera2.get_image();
  camera_container.appendChild( img );
  
  var speed_url = rest_root+'/m/vcm/forehead_camera/net';
  clicker('head_slow',function(){
    qwest.post(speed_url,{val: JSON.stringify([4,1,50,1])});
  });
  clicker('head_single',function(){
    qwest.post(speed_url,{val: JSON.stringify([3,1,95,1])});
  });
  
});
