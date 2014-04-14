this.addEventListener("load", function () {
	'use strict';
	// Add the touches for the whole page...
	// Open the websockets to send back to the host for processing
  var body = document.getElementsByTagName("body")[0],
		port = 9064,
		ws = new window.WebSocket('ws://' + this.hostname + ':' + port),
		beats = {},
		BEAT_INTERVAL = 75,
		trails = {},
		trail_counts = {},
		N_TRAILS = 5,
		TRAIL_INTERVAL = 500 / N_TRAILS,
		V1,
		V2,
		d3 = this.d3,
		svg = d3.select("body").append("svg")
			.attr("class", "overlay")
			.attr("width", '100%')
			.attr("height", '100%'),
		standardLineF = d3.svg.line()
			.x(function (d) { return d.x; })
			.y(function (d) { return d.y; })
			.interpolate("linear"),
		circleSymbolF = d3.svg.symbol()
			.type('circle')
			.size(function(d){ return 10*d.sz; }),
		symbolTransF = function (d) {
			return "translate(" + d.x + "," + d.y + ")";
		};
	
	function draw(e) {
		// Parse the data
		var processed = JSON.parse(e.data);
		// Plot some items
		//window.console.log(processed);
		// Draw with d3
		// TODO: Should I be using enter and data?
		// Add contacts and trails
		svg.append("path")
			.attr("d", standardLineF(processed.move))
			.attr("stroke", "blue")
			.attr("stroke-width", 4)
			.attr("fill", "none");
		svg.append("path")
			.attr("d", standardLineF(processed.trail))
			.attr("stroke", "red")
			.attr("stroke-width", 2)
			.attr("fill", "none");
		// Heartbeats
		if (processed.beats !== undefined) {
			var beats_group = svg.append('g'),
				beats_data = [],
				beats = processed.beats,
				i,
				b,
				m,
				datum;
			for (i = 0; i < beats.length; i = i + 1) {
				b = beats[i];
				m = processed.move[b.i - 1];
				datum = {
					x: m.x,
					y: m.y,
					sz: b.n
				};
				beats_data.push(datum);
			}
			beats_group.selectAll('path')
				.data(beats_data)
				.enter()
				.append("path")
				.attr("transform", symbolTransF)
				.attr("d", circleSymbolF);
		}// if beats
	}
	
	function refresh(evt) {
		ws.send(JSON.stringify({
			t: Date.now(),
			e: 'refresh'
		}));
	}
	
	function heartbeat(id) {
		var beater = {
			t: Date.now(),
			e: 'beat',
			id: id
		};
		ws.send(JSON.stringify(beater));
	}

	function trail(id) {
		var cnt = trail_counts[id],
			trailer;
		// Increment the count
		trail_counts[id] = cnt + 1;
		// Check if done the trail
		if (cnt > N_TRAILS) {
			clearInterval(trails[id]);
			delete trails[id];
			delete trail_counts[id];
			trailer = {
				t: Date.now(),
				id: id,
				e: 'finish'
			};
		} else {
			trailer = {
				t: Date.now(),
				id: id,
				e: 'trail',
				cnt: cnt // cnt begins at 1
			};
		}
		ws.send(JSON.stringify(trailer));
	}
	
	function procTouch(evt, name) {
		var data = {
			t: evt.timeStamp,
			e: name,
			touch: []
		},
			t = evt.changedTouches,
			n = t.length,
			i, tmp, id, touch;
		for (i = 0; i < n; i = i + 1) {
			tmp = t[i];
			id = tmp.identifier;
			touch = {
				x: tmp.clientX,
				y: tmp.clientY,
				id: id
			};
			data.touch.push(touch);
			/*
			Clear the timeout for this id,
			since an event happened
			*/
			if (beats[id] !== undefined) {
				clearInterval(beats[id]);
			}
			/* If touch is dead, remove key so 
				memory does not leak. Leave a trail on stop
			*/
			switch (name) {
			case 'start':
			case 'move':
				beats[id] = setInterval(heartbeat.bind(undefined, id), BEAT_INTERVAL);
				break;
			case 'stop':
				trails[id] = setInterval(trail.bind(undefined, id), TRAIL_INTERVAL);
				trail_counts[id] = 0;
				break;
			case 'cancel':
			case 'leave':
				delete beats[id];
				break;
			}
		}
		ws.send(JSON.stringify(data));
	}
	
	function procMouse(evt, name) {
		var data = {
			t: evt.timeStamp,
			e: name,
			touch: [{
				x: evt.clientX,
				y: evt.clientY,
				id: 1
			}]
		};
		if (beats[1] !== undefined) {
			clearInterval(beats[1]);
		}
		ws.send(JSON.stringify(data));
	}
	
	function handleStart(evt) {
		evt.preventDefault();
		procTouch(evt, 'start');
	}
	function handleEnd(evt) {
		evt.preventDefault();
		procTouch(evt, 'stop');
	}
	function handleCancel(evt) {
		evt.preventDefault();
		procTouch(evt, 'cancel');
	}
	function handleLeave(evt) {
		evt.preventDefault();
		procTouch(evt, 'leave');
	}
	function handleMove(evt) {
		evt.preventDefault();
		procTouch(evt, 'move');
	}
	function handleMouseMove(evt) {
		evt.preventDefault();
		procMouse(evt, 'move');
		beats[1] = setInterval(heartbeat.bind(undefined, 1), BEAT_INTERVAL);
	}
	function handleMouseDown(evt) {
		evt.preventDefault();
		procMouse(evt, 'start');
		window.addEventListener("mousemove", handleMouseMove, false);
		beats[1] = setInterval(heartbeat.bind(undefined, 1), BEAT_INTERVAL);
	}
	function handleMouseUp(evt) {
		evt.preventDefault();
		procMouse(evt, 'stop');
		window.removeEventListener("mousemove", handleMouseMove, false);
		trails[1] = setInterval(trail.bind(undefined, 1), TRAIL_INTERVAL);
		trail_counts[1] = 0;
	}
	
  window.addEventListener("touchstart", handleStart, false);
  window.addEventListener("touchend", handleEnd, false);
  window.addEventListener("touchcancel", handleCancel, false);
  window.addEventListener("touchleave", handleLeave, false);
  window.addEventListener("touchmove", handleMove, false);
	// Compatibility with desktop
	window.addEventListener("mousedown", handleMouseDown, false);
	window.addEventListener("mouseup", handleMouseUp, false);
	// Send when loaded
	ws.onopen = refresh;
	// Overlay some svg of the swipe
	ws.onmessage = draw;
	
	// TODO: Use animation frames to send the websocket data...?
	
	// Add the Video stream overlay
	V1 = new this.Video('arm_cam', 9003);
	//V2 = new this.Video('kinect_cam', 9004);
	// Place on the page
  body.appendChild(V1.img);
	
});
