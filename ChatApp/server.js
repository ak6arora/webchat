var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
app.use(express.static('public'));
app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});
http.listen(3000, function() {
    console.log("Dev Server is running on localhost");
});

var userList = [];
var users=[];

io.on('connection', function(socket) {

    socket.on('user', function(data) {
        var exists = false;
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].userid == data) {
                exists = true;
                break;
            }
        }
        if (!exists) {
            userList.push({
                'socket': socket,
                'userid': data
            });
            users.push(data);
            console.log(data + ' joined the room.');
            io.emit('userList', {'list': users});
            console.log(users);
        } else {
            io.to(socket.id).emit('exists', data);
        }
    });
    socket.on('disconnect', function() {
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].socket == socket) {
                console.log(userList[i].userid + ' left the room.');
                userList.splice(i,1);
                users.splice(i,1);
                console.log(users);
                io.emit('userList', {'list': users});
                break;
            }
        }

    });
    socket.on('messageServer',function(data){
    	for(var i=0;i<userList.length;i++){
    		if(userList[i].userid==data.to){
    			io.to(userList[i].socket.id).emit('message',data);
    		}
    	}
        if(data.msg)
            console.log(data);
    });
});
