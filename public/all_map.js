(function (ctx) {
	'use strict';
	// Private variables
	var d3 = ctx.d3,
    peer_id = 'all_map',
    peer_scene_id = 'all_scene',
    peer,
    p_conn,
    overlay,
    map_c,
		polyF = d3.svg.line()
			.x(function (d) { return d.x; })
			.y(function (d) { return d.y; })
    .interpolate("linear-closed");
  
  function debug(arr){
    d3.select("#info").html(arr.join('<br/>'));
  }
  
  function add_cylinder(){
  	overlay.append("circle")
  		.attr("cx", data.xc / -1000)
  		.attr("cy", data.zc / -1000)
  		.attr("r", data.r / 1000)
  		.style("fill", "red")
  		.style("stroke", "blue")
  		.style("stroke-width", 0.01);
    });
  }
  
  function add_plane(){
  	svg.append("rect")
  		.attr("class", "goal")
  		.attr("id", "cur_goal")
  		.attr("width", g_mark_w)
  		.attr("height", g_mark_h)
  		.attr("x", -g_mark_w / 2)
  		.attr("y", -g_mark_w / 2)
  		.style("fill", "green")
  		.style("stroke", "black")
  		.style("stroke-width", 3);
  }
  
  function setup_rtc (){
    peer = new Peer(peer_id, {host: 'localhost', port: 9000});
    peer.on('open', function(id) {
      console.log('My peer ID is: ' + id);
      console.log('peer', peer);
    });
    peer.on('disconnected', function(conn) {
      console.log('disconnected');
    });
    peer.on('error', function(e) {
      console.log('error', e);
    });
    peer.on('close', function() {
      console.log('close');
    });
    p_conn = peer.connect(peer_scene_id);
    p_conn.on('open', function(){
      console.log('p_conn', p_conn);
      p_conn.send('hello from a map');
    });
    p_conn.on('close', function(){
      console.log('p_conn closed');
    });
    p_conn.on('data',function(data){
      console.log('scene data', data);

  }
  /*
    minx—the beginning x coordinate
    miny—the beginning y coordinate
    width—width of the view box
    height—height of the view box
  */
  function setup(){
    setup_rtc();
    map_c = d3.select('#map_container').node();
  	// Add the overlay
  	overlay = d3.select("#map_container").append("svg").attr('class', 'overlay')
    .attr('viewBox', "-2 -2 4 4").attr('preserveAspectRatio', "none")
    .attr('width', map_c.clientWidth).attr('height', map_c.clientHeight);
    var points = [/*tip*/{'x':0,'y':0}, {'x':-0.05,'y':0.25},{'x':0.05,'y':0.25}];
    overlay.append("path")
  		.attr("d", polyF(points))
  		.attr("stroke", "red")
  		.attr("stroke-width", 0.01)
  		.attr("fill", "none")
      .attr("transform", "translate(" + 0 + "," + 0 + ")")
      .attr('id', 'pose');
  }
  
	// Handle resizing
	window.addEventListener('resize', function () {
    overlay.attr('width', map_c.clientWidth).attr('height', map_c.clientHeight);
	}, false);

	// Load the Styling
	ctx.util.lcss('/css/gh-buttons.css');
	ctx.util.lcss('/css/all_map.css', function () {
		d3.html('/view/all_map.html', function (error, view) {
			// Remove landing page elements and add new content
			d3.select("div#landing").remove();
			// Just see the scene
			document.body.appendChild(view);
      ctx.util.ljs('/js/peer.min.js', setup);
		});
	});
  
}(this));