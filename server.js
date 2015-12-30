// Load required modules
var http = require("http"); // http server core module
var express = require("express"); // web framework external module
var socketio = require("socket.io"); // web socket external module
var easyrtc = require("easyrtc"); // EasyRTC external module
var port = process.env.PORT || 5000
    // Setup and configure Express http server. Expect a subfolder called "static" to be the web root.
var httpApp = express();

// Start Express http server on port 8080
var webServer = http.createServer(httpApp).listen(port, function() {
    console.log('Dev server is up on 5000');
});

// Start Socket.io so it attaches itself to Express server
var io = socketio.listen(webServer, {
    "log level": 1
});

httpApp.use(express.static('public'));

httpApp.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});


// Start EasyRTC server
var rtc = easyrtc.listen(httpApp, io, {}, function(err, rtc) {

    // After the server has started, we can still change the default room name
    rtc.setOption("roomDefaultName", "SectorZero");

    // Creates a new application called MyApp with a default room named "SectorOne".
    rtc.createApp(
        "chatapp", {
            "roomDefaultName": "RoomOne"
        }
    );

});
var userList = [];
var users = [];
easyrtc.events.on('connection', function(socket, id, next) {
    easyrtc.events.emitDefault("connection", socket, id, function(err) {
        // This gets run AFTER the default connection handler is run
        if (!err) {
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
                        'userid': data,
                        'id': id
                    });
                    users.push({
                        'name': data,
                        'id': id
                    });
                    console.log(data + ' joined the room.');
                    io.emit('userList', {
                        'list': users
                    });
                    console.log(users);
                } else {
                    io.to(socket.id).emit('exists', data);
                }
            });
            socket.on('messageServer', function(data) {
                for (var i = 0; i < userList.length; i++) {
                    if (userList[i].userid == data.to) {
                        io.to(userList[i].socket.id).emit('message', data);
                    }
                }
                if (data.msg)
                    console.log(data);
            });
        }
        next(err);
    });
});
easyrtc.events.on('disconnect', function(conn, err) {
    easyrtc.events.emitDefault("disconnect", conn, function(err) {
        for (var i = 0; i < userList.length; i++) {
            if (userList[i].socket == conn.socket) {
                console.log(userList[i].userid + ' left the room.');
                userList.splice(i, 1);
                users.splice(i, 1);
                console.log(users);
                io.emit('userList', {
                    'list': users
                });
                break;
            }
        }
    });
})
