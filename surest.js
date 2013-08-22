/***
* SUR: Data forwarding
* (c) Stephen McGill, 2013
*/

var util    = require('util');
var fs      = require('fs');
var zmq     = require('zmq');
var mp      = require('msgpack');
var restify = require('restify');
var dgram   = require("dgram");

//var homepage="index.html"
var homepage="simple.html"

/* Remote Procedure Call Configuration */
//var rpc_host     = '192.168.123.22'
var rpc_host     = 'localhost'
var zmq_rpc_addr = 'tcp://'+rpc_host+':5555'

/**
* Load configuration values
* TODO: Make these JSON for both the browser and node
*/
var bridges = [];
bridges.push({
	name : 'LIDAR mesh',
	ws : 9001,
	udp: 5001,
	clients : []
});
bridges.push({
	name : 'Kinect rgbd',
	ws : 9002,
	udp: 5002,
	clients : []
});
bridges.push({
	name : 'Spacemouse',
	ws : 9003,
	ipc: 'spacemouse',
	clients : []
});


/* Begin the REST HTTP server */
var server = restify.createServer({
  name: 'surest',
  version: '0.0.1'
});
server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.bodyParser());

// HTML files
var load_html = function (req, res, next) {
  var body = fs.readFileSync(homepage,{encoding:'utf8'});
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'text/html'
  });
  res.write(body);
  res.end();
};
server.get('/', load_html );

// Javascript libraries
var load_js = function (req, res, next) {
  //console.log('library',req.params.library)
  var body = fs.readFileSync(this.base_dir+'/'+req.params.js,{encoding:'utf8'});
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'text/javascript'
  });
  res.write(body);
  res.end();
};
server.get('/lib/:js', load_js.bind({base_dir: 'lib'}) );
server.get('/js/:js', load_js.bind({base_dir: 'js'}) );

// CSS stylesheet
var load_js = function (req, res, next) {
  //console.log('library',req.params.library)
  var body = fs.readFileSync(this.base_dir+'/'+req.params.css,{encoding:'utf8'});
  res.writeHead(200, {
    'Content-Length': Buffer.byteLength(body),
    'Content-Type': 'text/css'
  });
  res.write(body);
  res.end();
};
server.get('/css/:css', load_js.bind({base_dir: 'css'}) );

/* GET: [memory].get_[segment]_[key]()
* vcm.get_head_camera_t()
* */
var rest_get = function (req, res, next) {
  // Send the reply to the host
  var reply_handler = function(data){
    // TODO: Add any timestamp information or anything?
    res.json( mp.unpack(data) )
  }
  zmq_req_skt.once('message', reply_handler);
  
  // Send the RPC over the ZMQ REQ/REP
  // TODO: Deal with concurrent requests?
  // Form the Remote Procedure Call
  req.params.call   = 'get'
  req.params.memory = this.mem;
  zmq_req_skt.send( mp.pack(req.params) );
  
  // TODO: Set a timeout for the REP for HTTP sanity, via LINGER?
  console.log(req.params);
  return next();
}

/* PUT: [memory].set_[segment]_[key]([val])
* vcm.set_head_camera_t(1120.2)
* Request must have all of the values in []
* */
var rest_put = function (req, res, next) {
  // Send the reply to the host
  var reply_handler = function(data){ this.res.send(200); }
  zmq_req_skt.once('message', reply_handler.bind({res:res}));
  req.params.call = 'set';
  req.params.memory = this.mem;
  req.params.val  = JSON.parse( req.params.val );
  zmq_req_skt.send( mp.pack(req.params) );
  console.log(req.params);
  return next();
}

/***
* Communication with the robot uses ZeroMQ
* Metadata is messagepack'd
* Communication with the web browser uses websockets
*/
var WebSocketServer = require('ws').Server;

/***************
* WebSocket handlers
*/
var ws_error = function(e){
	if(e!==undefined){ console.log('Error:',e); }
}

var ws_message = function(msg){
  /* Accept JSON browser commands and no binary */
  var cmd = JSON.parse(msg);
  console.log('\nBrowser '+bridges[this.id]+' | ',cmd);
}

var ws_connection = function(ws){
  /* Web Browser Message */
  ws.on('message', ws_message.bind({id: this.id}) );
  /* Save this web socket connection */
  bridges[this.id].clients.push(ws);
}

var bridge_send_ws = function(b_id,meta,payload){
	var b_c = bridges[b_id].clients;
  var str = JSON.stringify(meta);
	for( var i=0; i<b_c.length; i++ ) {
		var ws = b_c[i];
		/* Send the metadata on the websocket connection */
		ws.send(str,ws_error);
		/* Follow the metadata with the binary payload (if it exists) */
		if(meta.sz>0){
			ws.send(payload,{binary: true},ws_error);
		}
	} // for each client
}

/***************
* ZeroMQ receiving
*/
var zmq_message = function(metadata,payload){
  /* msgpack -> JSON */
  var meta = mp.unpack(metadata);
  /* Add the payload sz parameter to the metadata */
  meta.sz = 0;
  if(payload!==undefined){meta.sz = payload.length;}
  bridge_send_ws(this.id,meta,payload);
};

/***************
* UDP robot data receiving
*/
var udp_message = function(msg,rinfo){
  /* msgpack -> JSON */
  /* the jpeg is right after the messagepacked metadata (concatenated) */
  var meta = mp.unpack(msg)
  var payload = msg.slice(msg.length - tbl.sz) // offset
  /* Add the payload sz parameter to the metadata */
  meta.sz = 0;
  if(payload!==undefined){meta.sz = payload.length;}
	bridge_send_ws(this.id,meta,payload);
}

/* Bridge to  websockets */
for( var w=0; w<bridges.length; w++) {

	var b = bridges[w];
  
	if( b.ws !== undefined ) {

		var wss = new WebSocketServer({port: b.ws});
		wss.on('connection', ws_connection.bind({id: w}) );
		console.log('\n'+b.name);

		if( b.ipc !== undefined ) {
			var zmq_recv_skt = zmq.socket('sub');
			zmq_recv_skt.connect('ipc:///tmp/'+b.ipc);
			zmq_recv_skt.subscribe('');
			zmq_recv_skt.on('message', zmq_message.bind({id:w}) );
			console.log('\tIPC Bridge');
		}

		if( b.udp !== undefined ){
			var udp_recv_skt = dgram.createSocket("udp4");
			udp_recv_skt.bind( b.udp );
			udp_recv_skt.on( "message", udp_message.bind({id:w}) );
			console.log('\tUDP Bridge');
		}

	} //ws check

} // for w

/* Setup the REST routes */
server.get('/vcm/:segment/:key', rest_get.bind({mem:'vcm'}) );
server.put('/vcm/:segment/:key', rest_put.bind({mem:'vcm'}) );
server.get('/mcm/:segment/:key', rest_get.bind({mem:'mcm'}) );
server.put('/mcm/:segment/:key', rest_put.bind({mem:'mcm'}) );

/* Connect to the RPC server */
var zmq_req_skt = zmq.socket('req');
var ret = zmq_req_skt.connect(zmq_rpc_addr);
console.log('\nRESTful RPC connected to '+zmq_rpc_addr);

/* Listen for HTTP on port 8080 */
server.listen(8080, function () {
  console.log('%s listening at %s', server.name, server.url);
});
