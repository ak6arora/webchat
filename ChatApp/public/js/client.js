$(window).on('load resize', function() {
    $('.online').height($(window).innerHeight() - $('.login-info').outerHeight());
})

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
    }
    if (name != null && $.trim(name) != '') {
        var socket = io();
        $('#userid').text("Logged in as " + name);
        socket.on('userList', function(data) {
            userList = data.list;
            var list = "";
            for (var i = 0; i < userList.length; i++) {
                if (userList[i] != name) {
                    var count = '';
                    for (var j = 0; j < notification.length; j++) {
                        if (notification[j].name == userList[i]) {
                            count = notification[j].count;
                        }
                    }
                    list += "<li class='user'><span class='icon-online'></span><span class='name'>" + userList[i] + "</span><span class='notification'>" + count + "</span></li>";
                }
            }
            if (list == "")
                list = '<li>No Users Online</li>';
            $('#users-list').html(list);
            if ($('div').hasClass('chat-box')) {
                var offline = true;
                for (var i = 0; i < userList.length; i++) {
                    if (userList[i] == $('.chat-box .title').text()) {
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
        socket.on('connect', function() {
            socket.emit('user', name);
        });
        socket.on('exists', function(data) {
            $('body').html('UserID already exists');
        });

        $('#users-list').on('click', '.user', function() {
            for (var j = 0; j < notification.length; j++) {
                if (notification[j].name == $(this).find('.name').text()) {
                    notification.splice(j, 1);
                    $(this).find('.notification').text("");
                    break;
                }
            }
            var total = 0;
            for (var n = 0; n < notification.length; n++) {
                total += notification[n].count;
            }
            if (total)
                $('.notification-icon').text(total);
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
            var total = 0;
            for (var n = 0; n < notification.length; n++) {
                total += notification[n].count;
            }
            if (total)
                $('.notification-icon').text(total);
            else
                $('.notification-icon').text('');

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
            $('.chat-box ul').height($('.chat-box').height() - $('.title').height() - $('.send-message').height());
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
                $('.online').css('right', '-260px');
                $(this).data('toggle', 'open');
            }
        });


    } else {
        $('body').html('You must enter a userid to continue.Please reload page.');
    }
});
