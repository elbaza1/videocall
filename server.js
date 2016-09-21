/*var PeerServer = require('peer').PeerServer;
var server = PeerServer({port: 8081, path: '/peerjs',allow_discovery: true});


server.on('connection', function (id) {
  # id is correct (a string)
  console.log('new connection with id ' + id);
});

*/

// initialize express
var express = require('express');
var app = express();
// create express peer server
var ExpressPeerServer = require('peer').ExpressPeerServer;

var options = {

    debug: true,
	allow_discovery: true
}

// create a http server instance to listen to request
var server = require('http').createServer(app);

/*app.get('/', function (req, res) {
  res.sendfile(__dirname+'/index.html');
});
*/
app.get('/', function (req, res) {
 // res.send('works,server running');
 res.end('Service is up');
});
var port =  process.env.OPENSHIFT_NODEJS_PORT ||8080;
var server_id_add =  process.env.OPENSHIFT_NODEJS_IP || '127.0.0.1';
// Now listen to your ip and port.
//server.listen(port);
app.listen(port,server_id_add,function(){
	
 console.log("listening on "+server_id_add +" port " +port);	
});

app.get('/logs.txt', function (req, res) {
 // res.send('works,server running');
 res.sendfile('logs.txt');
});


// Now listen to your ip and port.
//server.listen(8081);
// peerjs is the path that the peerjs server will be connected to.
var peerServer = ExpressPeerServer(server, options);
app.use('/peerjs',peerServer );
  // enabling access control origin
    app.use(function (req, res, next) {
       // res.header("Access-Control-Allow-Origin", "*");
        //res.header("Access-Control-Allow-Headers", "Origin",
		//X-Requested-With, Content-Type, "Accept");
		//res.setHeader('Access-Control-Allow-Origin', "http://"+req.headers.host+':8080');
		res.setHeader('Access-Control-Allow-Origin', 'TRUE');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
        
        next();
    });

var connected = [];
var text = "";
var admin = null;
var first = true;

peerServer.on('connection', function(id) {
    
	
		

});


peerServer.on('disconnect', function (id) {
  //var idx = connected.peerid.indexOf(id); // only attempt to remove id if it's in the list
  //if (idx !== -1) {connected.splice(idx, 1);}
      for(i =0;i<connected.length;i++)
	 {
		 if(connected[i].peerid.search(id)!=-1)
		 {
			
			 connected.splice(i, 1);
			 console.log('log off ..');
		 }
	 }
	
	 if(admin!=null && id == admin.peerid  )
	 {
		 console.log("admin "+admin.name+" of room : "+admin.peerid + " logged off..");
		 admin=null;
		 first = true;
		 
		 
	 }
	 
	 

});


app.get('/addname',function (req, res) {
  
  var ur = req.query.name;
  var pe = req.query.peer;
  
  if(first == true)
  {
	  admin= { name : ur, peerid : pe};
	  console.log('admin is : ' + admin.name + "  and he's id is  "+admin.peerid);
	  first = false;
	  res.send(" you are the admin");
	  
  }else
  {
	  console.log('url = '+ur +'    peer : '+pe); 
		var trouv = 0;   
		
		   for(i=0;i<connected.length;i++)
		   {
			   if(connected[i].peerid==pe  )
			   {
				   trouv=1;
			   }
			   if(admin !=null && admin.peerid==pe)
			   {
				   trouv=1;
			   }
			   
		   }
		   
		   if(trouv!=1)
		   {
				connected.push({ name : ur, peerid : pe});
				res.send("");
				
		   }
	  
  }
		
  
  // var idx = connected.peerid.indexOf(pe); // only add id if it's not in the list yet
  //if (idx === -1) {connected.push(pe);}
 
});


app.get('/logs',function (req, res) {
       
	   var data = { adm : admin, con : connected};
	if(connected.length!=0)
		{
			 res.send(data);
			/*
			 text="";
		     console.log('*************************** connected peers ***************************');
			for(i =0;i<connected.length;i++)
			{
				var x = ""+connected[i].peerid;
				console.log('user :  ' + connected[i].name);
			text+="<br> -  <button id='"+ connected[i].peerid+"'  onclick=coun('"+ x +"') >"+  "CONNECT " +connected[i].name   +"</button>";
			}
			console.log('***********************************************************************');
			*/
				//console.log('con = '+data.con.length);
		}else{
			if(first == false)
			{
				// on a un admin
				
				
				data = { adm : admin, con : null};
				res.send(data);
				//console.log('con = '+data.con.length);
			}else
			{
				res.send(null);
			}
				
			
		}
		
  
});






/*

peerServer.prototype.listAllPeers = function(cb) {
  cb = cb || function() {};
  var self = this;
  var http = new XMLHttpRequest();
  var protocol = this.options.secure ? 'https://' : 'http://';
  var url = protocol + this.options.host + ':' + this.options.port +
    this.options.path + this.options.key + '/peers';
  var queryString = '?ts=' + new Date().getTime() + '' + Math.random();
  url += queryString;

  // If there's no ID we need to wait for one before trying to init socket.
  http.open('get', url, true);
  http.onerror = function(e) {
    self._abort('server-error', 'Could not get peers from the server.');
    cb([]);
  };
  http.onreadystatechange = function() {
    if (http.readyState !== 4) {
      return;
    }
    if (http.status === 401) {
      var helpfulError = '';
      if (self.options.host !== util.CLOUD_HOST) {
        helpfulError = 'It looks like you\'re using the cloud server. You can email ' +
          'team@peerjs.com to enable peer listing for your API key.';
      } else {
        helpfulError = 'You need to enable `allow_discovery` on your self-hosted ' +
          'PeerServer to use this feature.';
      }
      cb([]);
      throw new Error('It doesn\'t look like you have permission to list peers IDs. ' + helpfulError);
    } else if (http.status !== 200) {
      cb([]);
    } else {
      cb(JSON.parse(http.responseText));
    }
  };
  http.send(null);
};


*/





