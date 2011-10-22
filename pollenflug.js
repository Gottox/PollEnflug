var fs = require('fs');
var config = JSON.parse(fs.readFileSync('config.json', "utf8"));
var http = require('http');

var portRules = []
for(var rule in config.ports) {
	portRules.push({
		port: new RegExp(rule),
		post_ip: new RegExp(config.ports[rule].post_ip),
		get_ip: new RegExp(config.ports[rule].get_ip)
	})
}

var ports = {}

var errors = {
	not_existing: "This Port does not exist!",
	unallowed_post: "You are not allowed to post to this port.",
	unallowed_get: "You are not allowed to poll to this port."
}

var copyHeaders = [
	{ key: 'Location', status:302 },
	{ key: 'Content-Type', status:null },
	{ key: 'Content-Length', status:null }
];

function createPort(url, listen) {
	var port = ports[url];
	if(port)
		return port;
	for(var i = 0; i < portRules.length; i++) {
		var host = portRules[i].port
		if(host.exec(url)) {
			port = ports[url] = [];
			port.rule = portRules[i];
			return port;
		}
	}
	return null;
}

function dropIfEmpty(url) {
	if(ports[url].length == 0)
		delete ports[url];
}

function listen(req, res) {
	var port = createPort(req.url);
	if(!port) {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end(errors.not_existing);
	}
	else if(!port.rule.get_ip.exec(req.socket.remoteAddress)) {
		res.writeHead(403, { 'Content-Type': 'text/plain' });
		res.end(errors.unallowed_get);

		dropIfEmpty(req.url);
	}
	else {
		ports[req.url].push(res);
		req.connection.addListener('end', function() {
			var port = ports[req.url];
			if(port) {
				for(var i = 0; i < port.length; i++) {
					if(res == port[i]) {
						port.splice(i, 1);
						break;
					}
				}
			}
		})
	}
}

function trigger(req, res) {
	var port = createPort(req.url)
	if(!port) {
		res.writeHead(404, { 'Content-Type': 'text/plain' });
		res.end(errors.not_existing);
	}
	else if(!port.rule.post_ip.exec(req.socket.remoteAddress)) {
		res.writeHead(403, { 'Content-Type': 'text/plain' });
		res.end(errors.unallowed_post);

		dropIfEmpty(req.url);
	}
	else {
		var status = 200;
		var headers = {}
		for(var i = 0; i < copyHeaders.length; i++) {
			var sc = copyHeaders[i].status;
			var h = copyHeaders[i].key;
			var lc = h.toLowerCase();
			if(req.headers[lc]) {
				headers[h] = req.headers[lc];
				if(sc != null)
					status = sc;
			}
		}
		for(var i = 0; i < port.length; i++) {
			port[i].writeHead(status, headers);
		}
		req.addListener('data', function(chunk) {
			for(var i = 0; i < port.length; i++) {
				port[i].write(chunk)
			}
		})
		req.addListener('end', function() {
			var i;
			for(i = 0; i < port.length; i++) {
				port[i].end()
			}
			res.end('{ "count": ' +i+ ' }')
			delete ports[req.url];
		});
	}
}

http.createServer(function (req, res) {
	if(req.method == "POST")
		trigger(req, res);
	else 
		listen(req, res);
}
).listen(config.port, config.listen);
