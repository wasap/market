//main.js

(function ()
{
	var stun = require('./stun');

	console.log('Starting Server . . .');
	
	if ( !process.argv[2] )
	{
		console.log("Running with no parameters.");
        console.log("First parameter is the IP you want to bind/listen on.");
        console.log("Second Parameter is the other IP you are binding/listening on.");
        console.log("Third Parameter is port 1.");
        console.log("Fourth parameter is port 2.");
        console.log("The fifth and sixth parameters are the changed response IP addresses--in case you are binding to internal IPs (i.e. these are the real external IPs).");
		process.argv[2] = '127.0.0.2';
	}
	if ( !process.argv[3] )
	{
		process.argv[3] = '127.0.0.3';
	}
	if ( !process.argv[4] )
	{
		process.argv[4] = 3478;
	}
	if ( !process.argv[5] )
	{
		process.argv[5] = 3479;
	}
    if ( !process.argv[6] )
    {
		process.argv[6] = process.argv[2];
	}
    if ( !process.argv[7] )
    {
    	process.argv[7] = process.argv[3];
	}
	var server = stun.createServer();
	server.setAddress0(process.argv[2]);
	server.setAddress1(process.argv[3]);
	server.setPort0(process.argv[4]);
	server.setPort1(process.argv[5]);
    server.setResponseAddress0(process.argv[6]);
    server.setResponseAddress1(process.argv[7]);
	server.listen();
	
}).call(this)