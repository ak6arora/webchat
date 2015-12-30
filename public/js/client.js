$(window).on('load resize', function() {
    $('.online').height($(window).innerHeight() - $('.login-info').outerHeight());
});

$(document).ready(function() {
    var name = window.prompt('Enter a Unique UserID');
    var userList;
    var to = '';
    var messages = [];
    var notification = [];
    var sound = new Audio("./tones/new-message.mp3");
    var focus;
    window.onfocus = function() {
        clearInterval(focus);
        document.title = 'Chat App';
    };
    if (name != null && $.trim(name) != '') {
        var socket;
        connect();
        $('#userid').text("Logged in as " + name);

        function socketEventListeners() {
            socket.on('userList', function(data) {
                userList = data.list;
                var list = "";
                for(var i = 0; i < userList.length; i++) {
                    if (userList[i].name != name) {
                        var count = '';
                        for (var j = 0; j < notification.length; j++) {
                            if (notification[j].name == userList[i]) {
                                count = notification[j].count;
                            }
                        }
                        list += "<li class='user'><span class='icon-online'></span><span class='name'>" + userList[i].name + "</span><span class='notification'>" + count + "</span></li>";
                    }
                }
                if (list == "")
                    list = '<li>No Users Online</li>';
                $('#users-list').html(list);
                if ($('div').hasClass('chat-box')) {
                    var offline = true;
                    for (var i = 0; i < userList.length; i++) {
                        if (userList[i].name == $('.chat-box .title').text()) {
                            offline = false;
                            break;
                        }
                    }
                    if (offline) {
                        $("#msg-box").attr("disabled", "");
                        $("#image").attr("disabled", "");
                        $("#offline").show();
                    } else {
                        $("#msg-box").removeAttr("disabled");
                        $("#image").removeAttr("disabled");
                        $("#offline").hide();
                    }
                }
            });
            socket.on('exists', function(data) {
                $('body').html('UserID already exists');
            });
            socket.on('message', function(data) {
                var context;
                var history = false;
                var index;
                clearInterval(focus);
                if (!document.hasFocus()) {

                    var k = 0;
                    var flash = ['New Message from ' + data.from, 'Chat App'];
                    focus = setInterval(function() {
                        document.title = flash[k++ % 2];

                    }, 1000);
                }

                for (var i = 0; i < messages.length; i++) {
                    if (messages[i].name == data.from) {
                        context = messages[i];
                        history = true;
                        index = i;
                    }
                }
                if (!history) {
                    context = {
                        'name': data.from,
                        'chatHistory': []
                    }
                    messages.push(context);
                    index = messages.length - 1;
                }
                var im;
                if (data.msg)
                    im = {
                        'type': 'recieved',
                        'msg': data.msg
                    };
                else if (data.img)
                    im = {
                        'type': 'recieved',
                        'img': data.img
                    };
                messages[index].chatHistory.push(im);
                if ($('.chat-box').find('.title').text() == data.from) {
                    if (!document.hasFocus())
                        sound.play();
                    if (data.msg)
                        $('.chat-box ul').append("<li class='recieved'><div class='bubble'>" + data.msg + "</div></li>");
                    else if (data.img)
                        $('.chat-box ul').append("<li class='recieved'><div class='bubble'><img src='" + data.img + "' class='img-msg'/></div></li>");
                    $('.chat-box ul').scrollTop(document.getElementsByClassName('chat-box')[0].getElementsByTagName('ul')[0].scrollHeight);
                } else {
                    var notify = false;
                    var j;
                    var count;
                    for (var i = 0; i < notification.length; i++) {
                        if (notification[i].name == data.from) {
                            notify = true;
                            j = i;
                            break;
                        }
                    }
                    if (notify) {
                        notification[j].count += 1;
                        count = notification[j].count;

                    } else {
                        notification.push({
                            'name': data.from,
                            'count': 1
                        });
                        count = 1;
                    }
                    $('#users-list .user').each(function() {
                        if ($(this).find('.name').text() == data.from) {
                            $(this).find('.notification').text(count);
                            sound.play();
                        }
                    });

                }

                if (notification.length)
                    $('.notification-icon').text(notification.length);
                else
                    $('.notification-icon').text('');

            });
        }
        $('#users-list').on('click', '.user', function() {

            for (var j = 0; j < notification.length; j++) {
                if (notification[j].name == $(this).find('.name').text()) {
                    notification.splice(j, 1);
                    $(this).find('.notification').text("");
                    break;
                }
            }

            if (notification.length)
                $('.notification-icon').text(notification.length);
            else
                $('.notification-icon').text('');
            $('.chat-box').remove();
            var source = $("#chat-tab").html();
            var template = Handlebars.compile(source);
            var context;
            var history = false;
            var index;
            for (var i = 0; i < messages.length; i++) {
                if (messages[i].name == $(this).find('.name').text()) {
                    context = messages[i];
                    history = true;
                    index = i;
                }
            }
            if (!history) {
                context = {
                    'name': $(this).find('.name').text(),
                    'chatHistory': []
                }
                messages.push(context);
                index = messages.length - 1;
            }
            var html = template(context);
            $('body').append(html);
            $('#offline').hide();
            $('.chat-box').height($(window).innerHeight() - $('.login-info').outerHeight());
            $('.chat-box ul').height($('.chat-box').height() - $('.title').height() - $('.send-message').height());
            $('.chat-box ul').scrollTop(document.getElementsByClassName('chat-box')[0].getElementsByTagName('ul')[0].scrollHeight);
            $('.send-message').submit(function(e) {
                e.preventDefault();
                msg = $('#msg-box').val();
                if ($.trim(msg) != '') {
                    $('#msg-box').val('');
                    socket.emit('messageServer', {
                        'from': name,
                        'to': context.name,
                        'msg': msg
                    });
                    var im = {
                        'type': 'sent',
                        'msg': msg
                    }
                    messages[index].chatHistory.push(im);
                    $('.chat-box ul').append("<li class='sent'><div class='bubble'>" + msg + "</div></li>");
                    $('.chat-box ul').scrollTop(document.getElementsByClassName('chat-box')[0].getElementsByTagName('ul')[0].scrollHeight);
                }
            });
            $('#close-chat').click(function() {
                $('.chat-box').remove();
            });

            $('#callButton').click(function() {
                for (var i = 0; i < userList.length; i++) {
                    if (context.name == userList[i].name) {
                        performCall(userList[i].id);
                    }
                }

            })
            $('#nav-btn').trigger('click');
            $('#image').on('change', function() {
                var valid = true;
                var file = $('#image')[0].files[0];
                var _validFileExtensions = [".jpg", ".jpeg", ".bmp", ".gif", ".png"];
                var sFileName = file.name;
                if (sFileName.length > 0) {
                    var blnValid = false;
                    for (var j = 0; j < _validFileExtensions.length; j++) {
                        var sCurExtension = _validFileExtensions[j];
                        if (sFileName.substr(sFileName.length - sCurExtension.length, sCurExtension.length).toLowerCase() == sCurExtension.toLowerCase()) {
                            blnValid = true;
                            break;
                        }
                    }

                    if (!blnValid) {
                        alert("Sorry, " + sFileName + " is invalid, allowed extensions are: " + _validFileExtensions.join(", "));
                        valid = false;
                    }
                }
                if (valid) {
                    upload(file, context.name, index);
                }


            });
        });





        function upload(file, to, index) {
            var reader = new FileReader();

            // when image data was read
            reader.onload = function(event) {
                    // I usually remove the prefix to only keep data, but it depends on your server
                    var data = event.target.result;

                    socket.emit('messageServer', {
                        'from': name,
                        'to': to,
                        'img': data
                    });
                    $('.chat-box ul').append("<li class='sent'><div class='bubble'><img src='" + data + "' class='img-msg'/></div></li>");
                    messages[index].chatHistory.push({
                        'type': 'sent',
                        'img': data
                    })
                }
                // read data from file
            reader.readAsDataURL(file);

        }
        $(window).resize(function() {
            $('.chat-box').height($(window).innerHeight() - $('.login-info').outerHeight());
            $('.chat-box ul').height($('.chat-box').height() - $('.chat-head').height() - $('.send-message').height());
            if ($(this).innerWidth() > 768 && $('#nav-btn').data('toggle') == "open") {
                $('.online').css('right', '-260px');
            } else if ($(this).innerWidth() <= 768 && $('#nav-btn').data('toggle') == "open") {
                $('.online').css('right', '-101%');
            }
        });

        $('#nav-btn').on('click', function() {
            if ($(this).data('toggle') == "open") {
                $('.bar:nth-child(1)').css({
                    'right': '1px',
                    '-moz-transform': 'rotate(45deg)',
                    '-webkit-transform': 'rotate(45deg)',
                    'transform': 'rotate(45deg)'
                });
                $('.bar:nth-child(3)').css({
                    'right': '2px',
                    '-moz-transform': 'rotate(-45deg)',
                    '-webkit-transform': 'rotate(-45deg)',
                    'transform': 'rotate(-45deg)'
                });
                $('.online').css('right', '0');
                $(this).data('toggle', 'close');
            } else {
                $('.bar').attr('style', '');
                if ($(window).innerWidth() > 768)
                    $('.online').css('right', '-260px');
                else
                    $('.online').css('right', '-101%');
                $(this).data('toggle', 'open');
            }
        });

        var selfEasyrtcid = '';

        function disable(domId) {
            document.getElementById(domId).disabled = "disabled";
        }


        function enable(domId) {
            document.getElementById(domId).disabled = "";
        }


        function connect() {
            console.log("Initializing.");
            easyrtc.enableVideo(true);
            easyrtc.enableVideoReceive(true);
            //easyrtc.setRoomOccupantListener(convertListToButtons);
            easyrtc.initMediaSource(
                function() { // success callback
                    socket = io();
                    easyrtc.connect("chatapp", loginSuccess, loginFailure);
                },
                function(errorCode, errmesg) {
                    easyrtc.showError(errorCode, errmesg);
                } // failure callback
            );
        }


        function terminatePage() {
            easyrtc.disconnect();
        }


        function hangup() {
            easyrtc.hangupAll();
            //disable("hangupButton");
        }


        function clearConnectList() {
            otherClientDiv = document.getElementById("otherClients");
            while (otherClientDiv.hasChildNodes()) {
                otherClientDiv.removeChild(otherClientDiv.lastChild);
            }

        }

        function performCall(otherEasyrtcid) {
            easyrtc.hangupAll();

            var acceptedCB = function(accepted, caller) {
                if (!accepted) {
                    easyrtc.showError("CALL-REJECTED", "Sorry, your call to " + easyrtc.idToName(caller) + " was rejected");
                    //enable("otherClients");
                }
            };
            var successCB = function() {
                console.log('Call SuccessCB');
            };
            var failureCB = function() {
                console.log('Call FailureCB');
            };
            easyrtc.call(otherEasyrtcid, successCB, failureCB, acceptedCB);
            $('.call-container').css('display', 'block');
            $('#hangup').css('display', 'block');
            $('#acceptCallBox').css('display', 'none');
        }


        function loginSuccess(easyrtcid) {
            selfEasyrtcid = easyrtcid;
            socket.emit('user', name);
            socketEventListeners();
        }


        function loginFailure(errorCode, message) {
            easyrtc.showError(errorCode, message);
        }


        function disconnect() {
            document.getElementById("iam").innerHTML = "logged out";
            easyrtc.disconnect();
            console.log("disconnecting from server");
            clearConnectList();
        }


        easyrtc.setStreamAcceptor(function(easyrtcid, stream) {
            var audio = document.getElementById("callerAudio");
            easyrtc.setVideoObjectSrc(audio, stream);
        });


        easyrtc.setOnStreamClosed(function(easyrtcid) {
            easyrtc.setVideoObjectSrc(document.getElementById("callerAudio"), "");
        });


        easyrtc.setAcceptChecker(function(easyrtcid, callback) {
            $('.call-container').css('display', 'block');
            document.getElementById("acceptCallBox").style.display = "block";
            var uname = "";
            for (var i = 0; i < userList.length; i++) {
                if (easyrtcid == userList[i].id) {
                    uname = userList[i].name;
                }
            }
            if (easyrtc.getConnectionCount() > 0) {
                document.getElementById("acceptCallLabel").textContent = "Drop current call and accept new from " + uname + " ?";
            } else {
                document.getElementById("acceptCallLabel").textContent = "Accept incoming call from " + uname + " ?";
            }
            var acceptTheCall = function(wasAccepted) {
                document.getElementById("acceptCallBox").style.display = "none";
                if (wasAccepted && easyrtc.getConnectionCount() > 0) {
                    easyrtc.hangupAll();
                }
                callback(wasAccepted);
            };
            document.getElementById("callAcceptButton").onclick = function() {
                acceptTheCall(true);
                $('#hangup').css('display', 'block');

            };
            document.getElementById("callRejectButton").onclick = function() {
                acceptTheCall(false);
            };
        });
        $('#hangup').click(function() {
            hangup();
            $('.call-container').css('display', 'none');
            $('#acceptCallBox').css('display', 'none')
            $('#hangup').css('display', 'none');
        });
        $('#enableCam').click(function() {
            easyrtc.enableCamera(true);
        })
        $('#disableCam').click(function() {
            easyrtc.enableCamera(false);
        });

    } else {
        $('body').html('You must enter a userid to continue.Please reload page.');
    }
});
