PollEnflug
==========

PollEnflug is a simplistic and performant HTTP long polling server written in
Node.js.

It has a simple config file with an easy to understand right managment.

Config
------
Here is a simple example with two ports:

```
{
	"listen": "0.0.0.0",
	"port": "8080",
	"ports": {
		"^/messages$": { "post_ip": "^127.0.0.1$", "get_ip": "." },
		"^/chat$": { "post_ip": ".", "get_ip": "." }
	}
}
```

`listen` defines the interface to bind. Use 0.0.0.0 to bind to all interfaces.

`port` defines the tcp port to listen on.

`ports` defines the paths which are availible. Please note that you have to use
regular expressions.

* `post_ip` allows only certian ip addresses to post messages to this port

* `get_ip` allows only certian ip addresses to get messages from this port

In this example, there are two port-wildcards: 
1. `^/messages/.*$` which allows posting from the loopback ip and getting from
everywhere

2. `^/chat$` which is a wild place as Everyone can post and get

Security
--------

PollEnflug has no reliable security system. If you need authentication, use
PollEnflug as forwarder to your application as demonstrated below:

```
curl -d "Please visit http://mylittlewebservice.com/secure" -H "Location: http://mylittlewebservice.com/secure" -H "Content-Type: text/plain" http://127.0.0.1:8080/
```

Examples
--------

This package contains a very basic chat application only using jQuery, HTML,
and of course PollEnflug. See chat.html
