/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

        (function () {
            window.RTCPeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection ||
                    window.webkitRTCPeerConnection || window.msRTCPeerConnection;
            window.RTCSessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription ||
                    window.webkitRTCSessionDescription || window.msRTCSessionDescription;

            navigator.getUserMedia = navigator.getUserMedia || navigator.mozGetUserMedia ||
                    navigator.webkitGetUserMedia || navigator.msGetUserMedia;

            var logError = function (e) {
                console.dir(e);
            }
            var dateOptions = {
                day: "numeric", month: "numeric"
                , hour: "2-digit", minute: "2-digit"
            };

            var stunServers = {"iceServers": [{"urls": ['stun:' + window.location.hostname + ':6215',
                            'stun:' + window.location.hostname + ':6214']}]}

            var ws, tbody, user, id, bg, orders = [], filterEl = {}, dialogUsersList, isadmin, dialogMyProfile, options, peerConnections = [], chats = [];
            startWs();
            if (Notification)
                if (Notification.permission !== "granted")
                    Notification.requestPermission();
            function startWs() {

                try {
                    ws = new WebSocket('ws://' + window.location.hostname + ':80');
                } catch (e) {
                    console.log('catch');
                }
                ws.onopen = function () {
                    ws.send(JSON.stringify({sys: 'name', name: localStorage.getItem('name'), pass: localStorage.getItem('p')}));
                    ws.onmessage = function (evt) {
                        //console.log(evt.data);
                        var data = JSON.parse(evt.data);
                        switch (data.sys) {
                            case 'enterName':
                                loginDialog('Please, enter name');
                                break;
                            case 'changeName':
                                loginDialog('Wrong password');
                                break;
                            case 'login':
                                isadmin = data.isadmin;
                                var obj = {};
                                options = data.options || obj;
                                login(data.name);
                                break;
                            case 'ordersList':
                                orders = data.list.sort(function (a, b) {
                                    return a.type + a.rate < b.type + b.rate;
                                });
                                orders.forEach(function (item) {
                                    drawItem(item);
                                });
                                break;
                            case 'drawItem':
                                drawItem(data.item, true);
                                if (data.item.user == null)
                                    orders.some(function (item, index) {
                                        if (item._id == data.item._id) {
                                            orders.splice(index, 1)
                                            return true
                                        } else
                                            return false;
                                    });
                                else {
                                    var update = orders.some(function (item, index) {
                                        if (item._id == data.item._id) {
                                            orders[index] = data.item;
                                            return true
                                        } else
                                            return false
                                    })
                                    if (!update)
                                        orders.push(data.item);
                                }
                                break;
                            case "usersList":
                                showUsersList(data);
                                break;
                            case 'userProfile':
                                showEditProfile(data.data);
                                break;
                            case 'imageUploaded':
                                if (dialogMyProfile.parentNode != null) {
                                    var avatar = dialogMyProfile.getElementsByClassName('avatarView')[0];
                                    if (data.src != null)
                                        avatar.setAttribute('style', 'background-image:url(' + data.src + '?' + new Date().getTime() + ')');
                                    else
                                        avatar.removeAttribute('style');
                                }
                                break;
                            case "RTCOffer":
                                handleOffer(data.offer, data.chatId, data.name);
                                break;
                            case 'RTCAnswer':
                                handleAnswer(data.answer, data.chatId);
                                break;
                            default:
                                console.log('i dont know command: %s', data.sys);
                        }
                    };
                    ws.onclose = function () {
                        console.log('close');
                        var a = setInterval(function () {
                            console.log('trying to reconnect');
                            if (ws.readyState == 3)
                                startWs()
                            else
                                clearInterval(a);
                        }, 30000)
                        //setTimeout(startWs, 1000);
                    }
                    ws.onerror = function () {
                        console.log('error');
                        setTimeout(startWs, 1000);
                    }
                };
            }

            function loginDialog(text) {
                document.body.innerHTML = '';
                var bg = document.createElement('div');
                bg.className = 'bg';
                document.body.appendChild(bg);
                var box = document.createElement('div');
                box.id = 'loginBox';
                bg.appendChild(box);
                var title = document.createElement('div');
                title.textContent = text;
                title.id = 'loginTitle';
                box.appendChild(title);
                var inp = document.createElement('input');
                inp.placeholder = 'login';
                inp.className = 'loginInput';
                box.appendChild(inp);
                inp.onkeydown = function (e) {
                    if (e.keyCode == 13)
                        btn.onclick.apply();
                }
                var pass = document.createElement('input');
                pass.placeholder = 'password';
                pass.className = 'loginInput';
                pass.setAttribute('type', 'password');
                pass.onkeydown = function (e) {
                    if (e.keyCode == 13)
                        btn.onclick.apply();
                }
                box.appendChild(pass);
                var btn = document.createElement('div');
                btn.id = 'loginBtn';
                box.appendChild(btn);
                btn.onclick = function () {
                    if (inp.value != '') {
                        ws.send(JSON.stringify({sys: 'name', name: inp.value, pass: pass.value}));
                        localStorage.setItem('p', pass.value);
                    } else
                        showValidator(inp);
                }
            }

            function login(name) {
                document.body.innerHTML = '';
                localStorage.setItem('name', name);
                user = name;
                ws.send(JSON.stringify({sys: 'getList'}));
                var topPanel = document.createElement('div');
                topPanel.id = 'top';
                document.body.appendChild(topPanel);
                var profile = document.createElement('div');
                profile.id = 'profile';
                if (isadmin)
                    profile.className = 'moderator';
                profile.textContent = name;
                var profileBox = document.createElement('div');
                profileBox.style.display = 'none';
                profileBox.id = 'profileBox';
                profile.appendChild(profileBox);
                var changePass = document.createElement('div');
                changePass.className = 'profileText';
                changePass.innerHTML = 'Change password';
                profileBox.appendChild(changePass);
                changePass.onclick = function () {
                    var back = document.createElement('div');
                    back.className = 'bg';
                    back.onclick = function () {
                        document.body.removeChild(back);
                    }
                    document.body.appendChild(back);
                    var dialogDiv = document.createElement('div');
                    dialogDiv.id = 'dialogPass';
                    dialogDiv.onclick = function (e) {
                        e.stopPropagation();
                    }
                    back.appendChild(dialogDiv);
                    var inputPas = document.createElement('input');
                    inputPas.type = 'password';
                    inputPas.placeholder = 'Enter new password';
                    dialogDiv.appendChild(inputPas);
                    var acceptBtn = document.createElement('div');
                    acceptBtn.className = 'accept';
                    dialogDiv.appendChild(acceptBtn);
                    acceptBtn.onclick = function (e) {
                        popup(e, 'Password was changed');
                        ws.send(JSON.stringify({sys: 'changePass', pas: inputPas.value}));
                        localStorage.setItem('p', inputPas.value);
                        document.body.removeChild(back);
                    }

                    var declineBtn = document.createElement('div');
                    declineBtn.className = 'decline';
                    dialogDiv.appendChild(declineBtn);
                    declineBtn.onclick = function () {
                        document.body.removeChild(back);
                    }
                }

                var usersList = document.createElement('div');
                usersList.className = 'profileText';
                usersList.innerHTML = 'Users list';
                profileBox.appendChild(usersList);
                usersList.onclick = function () {
                    dialogUsersList = document.createElement('div');
                    var back = document.createElement('div');
                    back.className = 'bg';
                    back.onclick = function () {
                        document.body.removeChild(back);
                        dialogUsersList.innerHTML = '';
                    }
                    document.body.appendChild(back);

                    dialogUsersList.id = 'dialogUsers';
                    dialogUsersList.onclick = function (e) {
                        e.stopPropagation();
                    }
                    back.appendChild(dialogUsersList);
                    var closeBtn = document.createElement('div');
                    closeBtn.className = 'closeBtn close';
                    closeBtn.onclick = function () {
                        document.body.removeChild(back);
                        dialogUsersList.innerHTML = '';
                    }
                    dialogUsersList.appendChild(closeBtn);
                    dialogUsersList.innerHTML = 'Loading';
                    ws.send(JSON.stringify({sys: 'getUsers'}));
                }

                var editProfile = document.createElement('div');
                editProfile.innerHTML = 'Profile';
                editProfile.className = 'profileText';
                editProfile.onclick = function () {
                    promptProfile(null);
                };
                profileBox.appendChild(editProfile);
                var settings = document.createElement('div');
                settings.innerHTML = 'Options';
                settings.className = 'profileText';
                settings.onclick = showsettings;
                profileBox.appendChild(settings);
                var exit = document.createElement('div');
                exit.id = 'exit';
                exit.innerHTML = 'Exit';
                exit.className = 'profileText';
                profileBox.appendChild(exit);
                exit.onclick = function (e) {
                    localStorage.clear();
                    window.location.reload();
                }

                profile.onmouseenter = function (e) {
                    profileBox.style.display = 'block';
                };
                profile.onmouseleave = function (e) {
                    profileBox.style.display = 'none';
                };
                topPanel.appendChild(profile);
                bg = document.createElement('div');
                bg.className = 'bg';
                bg.onclick = function () {
                    bg.style.display = 'none';
                }
                document.body.appendChild(bg);
                bg.style.display = 'none';
                var box = document.createElement('div');
                box.id = 'box';
                bg.appendChild(box);
                box.onclick = function (e) {
                    e.stopPropagation();
                }

                var title = document.createElement('div');
                title.id = 'title';
                title.innerHTML = 'Please enter currence, rate and amount';
                box.appendChild(title);
                var type = document.createElement('div');
                type.id = 'type';
                type.title = 'Click to change';
                type.className = 'sell';
                type.onclick = function () {
                    (type.className == 'sell') ? type.className = 'buy' : type.className = 'sell';
                }
                box.appendChild(type);
                var currency = document.createElement('input');
                currency.id = 'currency';
                currency.placeholder = 'Currency';
                box.appendChild(currency);
                var rate = document.createElement('input');
                rate.id = 'rate';
                rate.placeholder = 'Rate';
                box.appendChild(rate);
                var amount = document.createElement('input');
                amount.id = 'amount';
                amount.placeholder = 'Amount';
                box.appendChild(amount);
                var comment = document.createElement('textarea');
                comment.id = 'comment';
                comment.placeholder = 'Comment';
                box.appendChild(comment);
                var save = document.createElement('div');
                save.id = 'save';
                box.appendChild(save);
                save.onclick = function () {
                    if (rate.value != '' && amount.value != '' && currency.value != '') {
                        ws.send(JSON.stringify({sys: 'newOrder',
                            id: id,
                            type: type.className,
                            curr: currency.value,
                            rate: rate.value,
                            amount: amount.value,
                            comment: comment.value}));
                        rate.value = '';
                        amount.value = '';
                        currency.value = '';
                        comment.value = '';
                        bg.style.display = 'none';
                    } else {
                        if (rate.value == '')
                            showValidator(rate);
                        if (amount.value == '')
                            showValidator(amount);
                        if (currency.value == '')
                            showValidator(currency);
                    }
                }

                var add = document.createElement('div');
                add.id = 'add';
                add.onclick = function () {
                    id = null;
                    (bg.style.display == 'none') ? bg.style.removeProperty('display') : bg.style.display = 'none';
                }
                topPanel.appendChild(add);
                var filter = document.createElement('div');
                filter.className = 'filter';
                topPanel.appendChild(filter);
                filter.onclick = function () {
                    filterBg.style.removeProperty('display');
                    filter.className = 'filter filterApplied';
                }
                var filterBg = document.createElement('div');
                filterBg.className = 'bg';
                filterBg.style.display = 'none';
                filterBg.onclick = function () {
                    filter.className = 'filter';
                    filterEl = {}
                    filterTypeBuy.className = 'buy filterType';
                    filterTypeSell.className = 'sell filterType';
                    filterCurr.value = '';
                    filterCurrValidator.innerHTML = '';
                    filterRateFrom.value = '';
                    filterRateTo.value = '';
                    tbody.innerHTML = '';
                    orders.forEach(function (item) {
                        drawItem(item);
                    });
                    filterBg.style.display = 'none';
                }
                document.body.appendChild(filterBg);
                var filterBox = document.createElement('div');
                filterBox.onclick = function (e) {
                    e.stopPropagation();
                };
                filterBox.id = 'filterBox';
                filterBg.appendChild(filterBox);
                var filterTitle = document.createElement('div');
                filterTitle.innerHTML = 'Type';
                filterTitle.id = 'filterTitle';
                filterBox.appendChild(filterTitle);
                var filterTypeBuy = document.createElement('div');
                filterTypeBuy.className = 'buy filterType';
                filterTypeBuy.onclick = function () {
                    filterTypeBuy.className == 'buy filterType' ? (filterTypeBuy.className += ' filterTypeChecked', filterEl.buy = true) : (filterTypeBuy.className = 'buy filterType', delete filterEl.buy);
                }
                filterBox.appendChild(filterTypeBuy);
                var filterTypeSell = document.createElement('div');
                filterTypeSell.className = 'sell filterType';
                filterTypeSell.onclick = function () {
                    filterTypeSell.className == 'sell filterType' ? (filterTypeSell.className += ' filterTypeChecked', filterEl.sell = true) : (filterTypeSell.className = 'sell filterType', delete filterEl.sell);
                }
                filterBox.appendChild(filterTypeSell);
                var filterCurrValidator = document.createElement('div');
                filterCurrValidator.id = 'filterCurrNotValid'
                var filterCurr = document.createElement('input');
                filterCurr.title = '[a-z] - only english layout\nhrn|usd - hryvna or dollar';
                filterCurr.placeholder = 'Currency filter';
                filterBox.appendChild(filterCurr);
                filterCurr.onchange = function () {
                    try {
                        new RegExp(filterCurr.value, 'gi');
                        filterCurrValidator.innerHTML = '';
                    } catch (e) {
                        filterCurrValidator.innerHTML = e;
                    }
                }
                filterBox.appendChild(filterCurrValidator);
                var filterRateFrom = document.createElement('input');
                filterRateFrom.id = 'rateFrom';
                filterRateFrom.placeholder = 'Rate from';
                filterBox.appendChild(filterRateFrom);
                var filterRateTo = document.createElement('input');
                filterRateTo.id = 'rateTo';
                filterRateTo.placeholder = 'Rate to';
                filterBox.appendChild(filterRateTo);
                var applyFilter = document.createElement('div');
                applyFilter.id = 'applyFilter';
                filterBox.appendChild(applyFilter);
                applyFilter.onclick = function () {
                    if (filterCurrValidator.innerHTML != '')
                        return;
                    if (filterCurr.value.length > 0)
                        filterEl.curr = filterCurr.value;
                    else
                        delete filterEl.curr;
                    if (filterRateFrom.value.length > 0)
                        filterEl.from = filterRateFrom.value;
                    else
                        delete filterEl.from;
                    if (filterRateTo.value.length > 0)
                        filterEl.to = filterRateTo.value;
                    else
                        delete filterEl.to;
                    if (Object.keys(filterEl).length > 0)
                        filter.className = 'filter filterApplied';
                    else
                        filter.className = 'filter';
                    tbody.innerHTML = '';
                    orders.forEach(function (item) {
                        drawItem(item);
                    });
                    filterBg.style.display = 'none';
                }

                var removeFilter = document.createElement('div');
                removeFilter.id = 'removeFilter';
                filterBox.appendChild(removeFilter);
                removeFilter.onclick = function () {
                    filter.className = 'filter';
                    filterEl = {}
                    filterTypeBuy.className = 'buy filterType';
                    filterTypeSell.className = 'sell filterType';
                    filterCurr.value = '';
                    filterCurrValidator.innerHTML = '';
                    filterRateFrom.value = '';
                    filterRateTo.value = '';
                    tbody.innerHTML = '';
                    orders.forEach(function (item) {
                        drawItem(item);
                    });
                    filterBg.style.display = 'none';
                };

                var messages = document.createElement('div');
                messages.id = 'openChat';
                messages.onclick = function () {
                    openChat(null);
                }
                topPanel.appendChild(messages);

                var unread = document.createElement('div');
                unread.className = 'unreadMessages';
                unread.style.display = 'none';
                messages.appendChild(unread);

                var workspace = document.createElement('div');
                workspace.id = 'center';
                var table = document.createElement('table');
                table.id = 'tab';
                var tr = document.createElement('tr');
                table.appendChild(tr);
                tr.id = 'header';
                ['Type', 'User', 'Currency', 'Rate', 'Amount', 'Comment', 'Time', 'Actions'].forEach(function (item, index) {
                    var td = document.createElement('td');
                    td.innerHTML = item;
                    tr.appendChild(td);
                    var key;
                    switch (item) {
                        case 'Type':
                            key = 'type';
                            break;
                        case 'User':
                            key = 'user';
                            break;
                        case 'Currency':
                            key = 'curr';
                            break;
                        case 'Rate':
                            key = 'rate';
                            break;
                        case 'Amount':
                            key = 'amount';
                            break;
                        case 'Comment':
                            key = 'comment';
                            break;
                        case 'Time':
                            key = 'time';
                            break;
                        default:
                            key = 'user';
                            break;
                    }
                    var direction = false;
                    td.onclick = function () {
                        direction = !direction;
                        tbody.innerHTML = '';
                        orders.sort(function (a, b) {
                            if (key == 'rate' || key == 'amount')
                                if (direction)
                                    return  parseFloat(a[key]) < parseFloat(b[key]);
                                else
                                    return  parseFloat(a[key]) > parseFloat(b[key]);
                            else
                            if (direction)
                                return  a[key] < b[key];
                            else
                                return  a[key] > b[key]
                        }).forEach(function (itm) {
                            drawItem(itm);
                        })
                    }
                });
                tbody = document.createElement('tbody');
                tbody.id = 'tblBody';
                table.appendChild(tbody);
                workspace.appendChild(table);
                document.body.appendChild(workspace);
            }

            function drawItem(item, newItem) {

                var old = document.getElementById(item._id);
                if (old != null)
                    old.parentNode.removeChild(old);
                if (item.user == null)
                    return;
                if (filterEl != {})
                    if (parseFloat(item.rate) < parseFloat(filterEl.from) || parseFloat(item.rate) > parseFloat(filterEl.to) ||
                            (filterEl.curr && !item.curr.match(new RegExp(filterEl.curr, 'i'))) ||
                            (filterEl.buy && filterEl.sell == null && item.type == 'sell') ||
                            (filterEl.sell && filterEl.buy == null && item.type == 'buy'))
                        return;
                var my = item.user == user;
                var tr = document.createElement('tr');
                tr.id = item._id;
                if (my)
                    tr.className = 'my';
                tbody.appendChild(tr);
                var type = document.createElement('td');
                type.className = 'type ' + item.type;
                tr.appendChild(type);
                var username = document.createElement('td');
                username.textContent = item.user;
                username.className = 'orderListUser';
                username.onclick = function () {
                    promptProfile(item.user);
                }
                tr.appendChild(username);
                var curr = document.createElement('td');
                curr.textContent = item.curr;
                tr.appendChild(curr);
                var rate = document.createElement('td');
                rate.textContent = item.rate;
                tr.appendChild(rate);
                var amount = document.createElement('td');
                amount.textContent = item.amount;
                tr.appendChild(amount);
                var comment = document.createElement('td');
                comment.textContent = item.comment;
                tr.appendChild(comment);
                var dat = document.createElement('td');
                dat.textContent = new Date(item.time).toLocaleString();
                tr.appendChild(dat);
                var actions = document.createElement('td');
                tr.appendChild(actions);
                if (my) {
                    var modify = document.createElement('div');
                    modify.className = 'modify';
                    actions.appendChild(modify);
                    modify.onclick = function () {
                        id = item._id;
                        bg.style.removeProperty('display');
                        document.getElementById('type').className = item.type;
                        document.getElementById('currency').value = item.curr;
                        document.getElementById('rate').value = item.rate;
                        document.getElementById('amount').value = item.amount;
                        document.getElementById('comment').value = item.comment;
                    }
                    var del = document.createElement('div');
                    del.className = 'delete';
                    actions.appendChild(del);
                    del.onclick = function () {
                        ws.send(JSON.stringify({sys: 'dellItem', id: item._id}));
                    };
                } else if (isadmin) {
                    var del = document.createElement('div');
                    del.className = 'delete';
                    actions.appendChild(del);
                    del.onclick = function () {
                        ws.send(JSON.stringify({sys: 'dellItem', id: item._id, name: user}));
                    };
                }

                if (!my) {
                    var startChat = document.createElement('div');
                    startChat.title = 'Open chat';
                    startChat.className = 'startChat';
                    startChat.onclick = function () {
                        openChat(item.user);
                    }
                    actions.appendChild(startChat);
                }

                if (newItem) {
                    tr.className += ' newItem';
                    tr.scrollIntoView();
                }
                if (document.hidden && item.time > new Date() - 50000 && !options.disablePopup) {
                    var notify;
                    if (navigator.platform.indexOf('Linux') != null)
                        notify = new Notification(item.user + (item.type == 'sell' ? ' sells' : ' buys'), {body: item.amount + ' ' + item.curr + ' Rate: ' + item.rate});
                    else
                        notify = new Notification(item.user, {icon: '/img/' + item.type + '.png', body: item.amount + ' ' + item.curr + ' Rate: ' + item.rate});
                    notify.onclick = function () {
                        tr.className = 'newItem';
                        tr.scrollIntoView();
                    }
                    if (options.popupTime) {
                        notify.onshow = function () {
                            setTimeout(function () {
                                notify.close();
                                console.log('notification closed in ' + options.popupTime * 1000 + 'ms')
                            }, options.popupTime * 1000)
                        }
                    }
                }
            }
            function showValidator(el) {
                el.setCustomValidity('Fill this, please');
                el.onfocus = function () {
                    el.setCustomValidity('');
                }
            }
            function showUsersList(data) {
                dialogUsersList.innerHTML = '';
                var closeBtn = document.createElement('div');
                closeBtn.className = 'closeBtn';
                closeBtn.onclick = function () {
                    document.body.removeChild(dialogUsersList.parentNode);
                    dialogUsersList.innerHTML = '';
                }
                dialogUsersList.appendChild(closeBtn);
                var title = document.createElement('div');
                title.className = 'usersListTitle';
                title.innerHTML = 'Users list';
                dialogUsersList.appendChild(title);
                data.list.forEach(function (item) {
                    var row = document.createElement('div');
                    row.className = 'usersListRow';
                    dialogUsersList.appendChild(row);
                    var status = document.createElement('div');
                    status.className = ((item.online == true) ? 'statusOnline' : 'statusOffline') + ' usersListStatus';
                    status.title = 'online status';
                    row.appendChild(status);
                    var username = document.createElement('div');
                    username.className = 'usersListName' + (item.isadmin ? ' userAdmin' : '') + ' orderListUser';
                    username.textContent = item.name;
                    username.onclick = function () {
                        promptProfile(item.name);
                    }
                    row.appendChild(username);
                    if (isadmin) {
                        var adminButton = document.createElement('div');
                        adminButton.className = 'adminButton';
                        row.appendChild(adminButton);
                        if (item.isadmin) {
                            adminButton.className += ' removeAdmin';
                            adminButton.title = 'Remove admin rules';
                            adminButton.onclick = function () {
                                ws.send(JSON.stringify({sys: 'removeAdmin', name: item.name}))
                            }
                        } else {
                            adminButton.className += ' makeAdmin';
                            adminButton.title = 'Make admin';
                            adminButton.onclick = function () {
                                ws.send(JSON.stringify({sys: 'makeAdmin', name: item.name}))
                            }
                        }

                        var breakPassword = document.createElement('div');
                        breakPassword.className = 'adminButton adminBreakPass';
                        breakPassword.title = 'Make blank password';
                        row.appendChild(breakPassword);
                        breakPassword.onclick = function (e) {
                            popup(e, 'Password was set to blank');
                            ws.send(JSON.stringify({sys: 'adminBreakPass', name: item.name}))
                        }

                        var dellUser = document.createElement('div');
                        dellUser.className = 'adminButton adminDellUser';
                        dellUser.title = 'Delete user';
                        row.appendChild(dellUser);
                        dellUser.onclick = function () {
                            ws.send(JSON.stringify({sys: 'dellUser', name: item.name}))
                        }

                    }
                    if (user != item.name) {
                        var startChat = document.createElement('div');
                        startChat.title = 'Open chat';
                        startChat.className = 'startChat';
                        startChat.onclick = function () {
                            openChat(item.name);
                        }
                        row.appendChild(startChat);
                    }


                })
            }

            function popup(ev, text, color) {
                var window = document.createElement('div');
                document.body.appendChild(window);
                window.setAttribute('style', 'left:' + (ev.clientX - 170) + 'px;top:' + (ev.clientY) + 'px;');
                if (color != null)
                    window.style.backgroundColor = color;
                //console.log(window.style.backgroundColor)
                window.className = 'popup';
                window.innerHTML = text;

                setTimeout(function () {
                    document.body.removeChild(window)
                    window = null;
                }, 2000);
            }

            function showEditProfile(data) {
                var my = data.user == user;
                dialogMyProfile.innerHTML = '';
                var progressBar = document.createElement('div');
                var title = document.createElement('div');
                title.className = 'profile Title';
                title.textContent = data.user + '\'s profile';
                dialogMyProfile.appendChild(title);
                if (my) {
                    var avatarInput = document.createElement('input');
                    avatarInput.type = 'file';
                    avatarInput.id = 'avatarInput';
                    avatarInput.onchange = function () {
                        // console.dir(avatarInput.files[0]);
                        if (avatarInput.files[0].type.indexOf('image') == -1) {
                            var rect = avatarInput.getBoundingClientRect();
                            popup({clientX: rect.left + rect.width / 2, clientY: avatarInput.getBoundingClientRect().top}, 'Pick image, please', '#F3CACA');
                            avatarInput.value = null;
                        } else {
                            var file = avatarInput.files[0];
                            ws.send(JSON.stringify({sys: "uploadImgStart",
                                type: file.name.substr(file.name.lastIndexOf('.'), file.name.length),
                                parts: Math.ceil(file.size / 16384)}));
                            var cursor = 0;
                            function sendFile() {
                                if (cursor < file.size) {
                                    progressBar.style.background = 'linear-gradient(to right, lightseagreen ' + cursor / file.size * 100 + '%, white 0%)'
                                    ws.send(file.slice(cursor, cursor += 16384))
                                    setTimeout(sendFile, 1)
                                } else
                                    progressBar.removeAttribute('style');
                            }
                            sendFile();
                        }
                    }
                    dialogMyProfile.appendChild(avatarInput);
                }
                var avatarView = document.createElement('div');
                avatarView.className = 'avatarView';
                if (my)
                    avatarView.onclick = function (e) {
                        // e.stopPropagation();
                        avatarInput.click();
                    }
                dialogMyProfile.appendChild(avatarView);
                if (data.image != null)
                    avatarView.style.backgroundImage = 'url(' + data.image + '?' + new Date().getTime() + ')';
                if (my) {
                    var delAvatar = document.createElement('div');
                    delAvatar.className = 'closeBtn';
                    delAvatar.onclick = function (e) {
                        e.stopPropagation();
                        ws.send(JSON.stringify({sys: "delAvatar"}))
                    }
                    avatarView.appendChild(delAvatar);

                    progressBar.className = 'progressBar';
                    avatarView.appendChild(progressBar);
                }
                var skype = document.createElement('div');
                skype.className = 'skypeProfile';
                if (data.skype != null)
                    skype.textContent = my ? data.skype : '<a href="skype:' + data.skype + '?chat">' + data.skype + '</a>';
                if (my)
                    skype.onclick = function () {
                        var oldValue = skype.textContent;
                        skype.setAttribute('contenteditable', 'true');
                        skype.focus();
                        skype.onblur = function () {
                            if (oldValue == skype.textContent)
                                return
                            skype.removeAttribute('contenteditable');
                            Array.prototype.forEach.call(skype.childNodes, function (n) {
                                if (n.nodeType == 1 && n.nodeName != 'BR')
                                    skype.replaceChild(document.createTextNode(n.textContent))
                            })
                            ws.send(JSON.stringify({sys: 'updateProfile', prop: 'skype', value: skype.textContent}))
                        }
                    }
                dialogMyProfile.appendChild(skype);
                var comment = document.createElement('div');
                if (data.comment != null)
                    comment.innerHTML = safetyInnerHTML(data.comment);
                comment.className = 'commentProfile';
                if (my)
                    comment.onclick = function () {
                        var oldValue = comment.innerHTML;
                        comment.setAttribute('contenteditable', 'true');
                        comment.focus();
                        comment.onblur = function () {
                            if (oldValue == comment.innerHTML)
                                return
                            comment.removeAttribute('contenteditable');
                            Array.prototype.forEach.call(comment.childNodes, function (n) {
                                if (n.nodeType == 1 && n.nodeName != 'BR')
                                    comment.replaceChild(document.createTextNode(n.textContent))
                            })
                            ws.send(JSON.stringify({sys: 'updateProfile', prop: 'comment', value: comment.innerHTML}))
                        }
                    }
                dialogMyProfile.appendChild(comment);
            }

            function promptProfile(name) {
                var bg = document.createElement('div');
                bg.className = 'bg';
                document.body.appendChild(bg);
                bg.onclick = function () {
                    document.body.removeChild(bg);
                    dialogMyProfile.innerHTML = '';
                }

                dialogMyProfile = document.createElement('div');
                dialogMyProfile.innerHTML = 'Loading';
                dialogMyProfile.id = 'showProfile';
                dialogMyProfile.onclick = function (e) {
                    e.stopPropagation();
                };
                bg.appendChild(dialogMyProfile);
                ws.send(JSON.stringify({sys: "getProfile", name: name}));
            }

            function showsettings() {
                var bg = document.createElement('div');
                var box = document.createElement('div')
                bg.className = 'bg';
                document.body.appendChild(bg);
                bg.onclick = function () {
                    document.body.removeChild(bg);
                    box.innerHTML = '';
                }
                bg.appendChild(box);
                box.className = 'optionsBox';
                box.onclick = function (e) {
                    e.stopPropagation();
                }

                var title = document.createElement('div');
                title.className = 'optionsTitle';
                title.innerHTML = 'Options';
                box.appendChild(title);
                var disablePopupTitle = document.createElement('div');
                disablePopupTitle.className = 'optionsPopupDisable';
                disablePopupTitle.textContent = 'disable notifications';
                box.appendChild(disablePopupTitle);
                var disablePopup = document.createElement('div');
                disablePopup.className = 'disableNotifications' + (options.disablePopup ? ' checkmark' : '');
                disablePopup.onclick = function () {
                    if (disablePopup.className.indexOf('checkmark') == -1) {
                        disablePopup.className += ' checkmark';
                        options.disablePopup = true;
                        ws.send(JSON.stringify({sys: 'saveOptions', value: options}));
                    } else {
                        disablePopup.className = disablePopup.className.replace(' checkmark', '');
                        delete options.disablePopup;
                        ws.send(JSON.stringify({sys: 'saveOptions', value: options}));
                    }
                }
                box.appendChild(disablePopup);


                var popupTime = document.createElement('div');
                popupTime.className = 'popupTime';
                popupTime.setAttribute('contenteditable', 'true');
                popupTime.textContent = options.popupTime || 'default';
                popupTime.onfocus = function () {
                    if (popupTime.textContent == 'default')
                        popupTime.textContent = '';
                }
                popupTime.onblur = function () {
                    popupTime.textContent = parseFloat(popupTime.textContent) || 'default';
                    var param = popupTime.textContent == 'default' ? null : popupTime.textContent;
                    if (options.popupTime != param) {
                        options.popupTime = param;
                        ws.send(JSON.stringify({sys: 'saveOptions', value: options}));
                    }

                }
                box.appendChild(popupTime);
                var chatHeight = document.createElement('div');
                chatHeight.className = 'chatHeight';
                chatHeight.setAttribute('contenteditable', 'true');
                chatHeight.textContent = options.chatBoxHeight || 'default';
                chatHeight.onfocus = function () {
                    if (chatHeight.textContent == 'default')
                        chatHeight.textContent = '';
                }
                chatHeight.onblur = function () {
                    if (chatHeight.textContent == '')
                        chatHeight.textContent = 'default'

                    var param = chatHeight.textContent == 'default' ? null : chatHeight.textContent;
                    if (options.chatBoxHeight != param) {
                        options.chatBoxHeight = param;
                        ws.send(JSON.stringify({sys: 'saveOptions', value: options}));
                    }

                }
                box.appendChild(chatHeight);

                var chatWidth = document.createElement('div');
                chatWidth.className = 'chatWidth';
                chatWidth.setAttribute('contenteditable', 'true');
                chatWidth.textContent = options.chatBoxWidth || 'default';
                chatWidth.onfocus = function () {
                    if (chatWidth.textContent == 'default')
                        chatWidth.textContent = '';
                }
                chatWidth.onblur = function () {
                    if (chatWidth.textContent == '')
                        chatHeight.textContent = 'default'
                    var param = chatWidth.textContent == 'default' ? null : chatWidth.textContent;
                    if (options.chatBoxWidth != param) {
                        options.chatBoxWidth = param;
                        ws.send(JSON.stringify({sys: 'saveOptions', value: options}));
                    }

                }
                box.appendChild(chatWidth);

                var chatTransform = document.createElement('div');
                chatTransform.className = 'chatTransform';
                chatTransform.setAttribute('contenteditable', 'true');
                chatTransform.textContent = options.chatTransform || 'default';
                chatTransform.onfocus = function () {
                    if (chatTransform.textContent == 'default')
                        chatTransform.textContent = '';
                }
                chatTransform.onblur = function () {
                    if (chatTransform.textContent == '' || !chatTransform.textContent.match(/[-0-9]+px, [-0-9]+px$/))
                        chatTransform.textContent = 'default'
                    var param = chatTransform.textContent == 'default' ? null : chatTransform.textContent;
                    if (options.chatTransform != param) {
                        options.chatTransform = param;
                        ws.send(JSON.stringify({sys: 'saveOptions', value: options}));
                    }

                }
                box.appendChild(chatTransform);

                var reset = document.createElement('div');
                reset.className = 'optionsReset';
                box.appendChild(reset);
            }

            function openChat(user) {
                //console.log(user);

                var chatBox = document.createElement('div');
                chatBox.className = 'chatBox';
                chatBox.setAttribute('style', 'width:' + (options.chatBoxWidth || '300px') +
                        ';height:' + (options.chatBoxHeight || '200px') +
                        ';transform:translate(' + (options.chatTransform || '0px, 0px') + ');');


                chatBox.onmouseup = function (e) {
                    if (e.target != chatBox)
                        return;
                    if (chatBox.style.width != '' || chatBox.style.height != '') {
                        if (chatBox.style.width != options.chatBoxWidth || chatBox.style.height != options.chatBoxHeight) {
                            options.chatBoxWidth = chatBox.style.width;
                            options.chatBoxHeight = chatBox.style.height;
                            ws.send(JSON.stringify({sys: 'saveOptions', value: options}));
                        }
                    }
                }
                document.body.appendChild(chatBox);


                if (user) {
                    var chatId;
                    chats.some(function (ch) {
                        if (ch.chatId.match(/(.+?)-/)[1] == user) {
                            chatId = ch.chatId;
                            return true;
                        }
                        return false;

                    })

                    if (chatId == null) {
                        chatId = user + '-' + parseInt(Math.random() * 0x666).toString(16) + '-' + Date.now();
                        chats.push({chatId: chatId, messages: []})
                    }
                    var peer;
                    peerConnections.some(function (p) {
                        if (p.chatId.match(/(.+?)-/)[1] == user) {
                            peer = p;
                            return true;
                        }
                        return false;
                    })

                    if (peer == null || (peer != null && peer.dc.readyState != 'open'))
                        createOffer(user, chatId);
                    drawMessagesBox(chatBox, user, chatId);
                } else
                    drawChatsBox(chatBox);
            }

            function drawMessagesBox(chatBox, User, chatId) {
                chatBox.innerHTML = '';

                var movingBar = createMovingBar(chatBox, 'chat with ' + User);
                chatBox.appendChild(movingBar);

                var back = document.createElement('div');
                back.className = 'chatBoxGoBack';
                back.onclick = function () {
                    drawChatsBox(chatBox);
                }
                movingBar.appendChild(back);



                var messagesBox = document.createElement('div');
                messagesBox.className = 'chatBoxMessages';
                messagesBox.id = chatId;
                chatBox.appendChild(messagesBox);



                var input = document.createElement('div');
                input.setAttribute('contenteditable', 'true');
                input.className = 'chatBoxInput';
                chatBox.appendChild(input);
                input.onkeydown = function (e) {
                    if (e.keyCode == 13)
                        send.onclick();
                }

                var dc;
                peerConnections.some(function (peer) {
                    if (peer.chatId == chatId) {
                        dc = peer.dc;
                        return true
                    } else
                        return false;
                })


                var chatMessages;
                chats.some(function (ch) {
                    if (ch.chatId == chatId) {
                        if (ch.unread) {
                            var ur = document.getElementsByClassName('unreadMessages')[0];
                            ur.innerHTML = parseInt(ur.innerHTML) - ch.unread;
                            if (ur.innerHTML == '0')
                                ur.style.display = 'none';
                            delete ch.unread;
                        }
                        chatMessages = ch.messages;
                        return true;
                    } else
                        return false;
                })

                chatMessages.forEach(function (m) {
                    drawMessage(m, messagesBox);

                })

                var send = document.createElement('div');
                send.className = 'chatBoxSend';
                send.onclick = function () {
                    if (input.textContent.length == 0)
                        return;
                    //console.log(dc)
                    var message = {user: user, chatId: chatId, text: input.innerHTML, time: Date.now()}
                    chatMessages.push(message)
                    input.innerHTML = '';
                    drawMessage(message, messagesBox);
                    if (dc && dc.readyState == 'open')
                        dc.send(JSON.stringify(message));
                }
                chatBox.appendChild(send);

                var attachFileIcon = document.createElement('div');
                attachFileIcon.className = 'chatBoxFileIcon';
                chatBox.appendChild(attachFileIcon);

                var attachFile = document.createElement('input');
                attachFile.type = 'file';
                attachFile.multiple = 'true';
                attachFile.className = 'chatBoxFileInput';
                attachFileIcon.appendChild(attachFile);
            }

            function drawChatsBox(chatBox) {
                chatBox.innerHTML = '';
                chatBox.appendChild(createMovingBar(chatBox, 'history'));
                var historyBox = document.createElement('div');
                historyBox.className = 'chatBoxHistory';
                chatBox.appendChild(historyBox);
                function createHistoryItem(i) {
                    //console.log(i)
                    var row = document.createElement('div');
                    row.className = 'chatBoxHistoryRow';
                    row.onclick = function () {
                        drawMessagesBox(chatBox, i.chatId.split('-')[0], i.chatId);
                    }
                    var username = document.createElement('div');
                    username.className = 'chatBoxHistoryUser';
                    username.textContent = i.chatId.split('-')[0];
                    username.onclick = function (e) {
                        e.stopPropagation();
                        promptProfile(username.innerHTML);
                    }
                    row.appendChild(username);

                    var time = document.createElement('div');
                    time.className = 'chatBoxHistoryTime';
                    row.appendChild(time);

                    var lastMsg = document.createElement('div');
                    lastMsg.className = 'chatBoxHistoryLast';
                    row.appendChild(lastMsg);
                    if (i.unread) {
                        var unread = document.createElement('div');
                        unread.innerHTML = i.unread;
                        unread.className = 'chatBoxistoryUnread';
                        row.appendChild(unread);
                    }

                    var last = i.messages[i.messages.length - 1];
                    if (last) {
                        lastMsg.innerHTML = safetyInnerHTML(last.text);
                        time.innerHTML = new Date(last.time).toLocaleDateString('en-us', dateOptions);
                    } else
                        lastMsg.innerHTML = 'no messages yet';

                    return row;
                }
                chats.forEach(function (chat) {
                    historyBox.appendChild(createHistoryItem(chat));
                })
            }

            function createMovingBar(chatBox, textContent) {
                var movingBar = document.createElement('div');
                movingBar.textContent = textContent;
                movingBar.className = 'chatBoxMovingBar';
                movingBar.onmousedown = function (ev) {
                    var last = {x: ev.clientX, y: ev.clientY};
                    function chatMove(e) {
                        var param = chatBox.style.transform.match(/\(([-0-9]+)px, ([-0-9]+)px\)/);
                        chatBox.style.transform = 'translate(' + (parseInt(param[1]) + e.clientX - last.x) + 'px, ' + (parseInt(param[2]) + e.clientY - last.y) + 'px)';
                        last = {x: e.clientX, y: e.clientY};
                    }
                    function chatMoveEnd() {
                        window.removeEventListener('mousemove', chatMove);
                        window.removeEventListener('mouseup', chatMoveEnd);
                        var pos = chatBox.style.transform.match(/\((.*)\)/)[1];
                        //console.log(pos)
                        if (options.chatTransform != pos) {
                            options.chatTransform = pos;
                            ws.send(JSON.stringify({sys: 'saveOptions', value: options}));
                        }

                    }


                    window.addEventListener('mousemove', chatMove)

                    window.addEventListener('mouseup', chatMoveEnd);
                }


                var closeChat = document.createElement('div');
                closeChat.className = 'chatBoxClose close';
                closeChat.onclick = function () {
                    document.body.removeChild(chatBox);
                }
                movingBar.appendChild(closeChat);
                return movingBar;
            }


            function createOffer(name, chatId) {
                var pc1 = new RTCPeerConnection(stunServers),
                        dc1 = null;

                pc1.onicecandidate = function (e) {
                    //console.log('candidate', e)
                    if (e.candidate == null)
                        ws.send(JSON.stringify({sys: 'RTCOffer', offer: pc1.localDescription, chatId: chatId, name: name}))
                }

                dc1 = pc1.createDataChannel('test');
                //console.log("Created datachannel (pc1)");
                manageDataChannel(dc1, chatId);


                pc1.createOffer(function (offer) {
                    pc1.setLocalDescription(offer, function () {
                    }, logError)
                }, function (e) {
                    //console.log(e)
                }, logError)

                peerConnections.push({pc: pc1, dc: dc1, chatId: chatId});
            }

            function handleOffer(offer, chatId, name) {
                var pc1 = new RTCPeerConnection(stunServers),
                        dc1 = null;
                pc1.onicecandidate = function (e) {
                    //console.log('candidate', e)
                    if (e.candidate == null)
                        ws.send(JSON.stringify({sys: 'RTCAnswer', answer: pc1.localDescription, chatId: chatId, name: name}))
                }

                pc1.setRemoteDescription(new RTCSessionDescription(new RTCSessionDescription(offer)), function () {
                    pc1.createAnswer(function (answer) {
                        pc1.setLocalDescription(answer)
                    }, function () {}, function () {})
                }, function (e) {
                    //console.log(e)
                })

                pc1.ondatachannel = function (e) {
                    dc1 = e.channel || e;
                    chatId = name + chatId.substr(chatId.indexOf('-'), chatId.length);
                    peerConnections.push({pc: pc1, dc: dc1, chatId: chatId});
                    chats.push({chatId: chatId, messages: []})
                    manageDataChannel(dc1, chatId);
                }
            }

            function handleAnswer(answer, chatId) {
                peerConnections.some(function (peer) {
                    if (peer.chatId == chatId) {
                        peer.pc.setRemoteDescription(new RTCSessionDescription(answer));
                        //console.log('answer')
                        return true;
                    } else
                        return false;
                })

            }

            function manageDataChannel(dc1, chatId) {
                var chat;
                chats.some(function (ch) {
                    if (ch.chatId == chatId) {
                        chat = ch;
                        return true;
                    } else
                        return false;
                })
                dc1.onopen = function (e) {
                    //console.log('data channel connect', e);
                }
                dc1.onmessage = function (e) {

                    //console.log("Got message (pc1)", e.data);
                    var data = JSON.parse(e.data)
                    //console.log(data)
                    chat.messages.push(data);
                    var messagesBox = document.getElementById(chatId);
                    if (messagesBox)
                        drawMessage(data, messagesBox)
                    else {
                        chat.unread = (chat.unread || 0) + 1;
                        var unread = document.getElementsByClassName('unreadMessages')[0];
                        unread.style.removeProperty('display');
                        unread.innerHTML = (parseInt(unread.innerHTML) || 0) + 1;
                        unread = null;

                        if (document.getElementsByClassName('chatBoxHistory')[0])
                            drawChatsBox(document.getElementsByClassName('chatBox')[0]);
                    }
                }
                dc1.onclose = function () {
                    peerConnections.some(function (peer, index) {
                        if (peer.dc == dc1) {
                            peer.pc.close();
                            peerConnections.splice(index, 1);
                            return true;
                        } else
                            return false;
                    })
                }
            }

            function drawMessage(m, messagesBox) {
                var row = document.createElement('div');
                row.className = 'chatMessageRow';
                messagesBox.appendChild(row);
                var time = document.createElement('div');
                time.className = 'chatMessageTime';
                time.innerHTML = new Date(m.time).toLocaleDateString('en-us', dateOptions);
                row.appendChild(time);

                var messageText = document.createElement('div');
                messageText.className = 'chatMessageText';
                messageText.innerHTML = safetyInnerHTML(m.text);
                row.appendChild(messageText);
                if (m.user == user)
                    messageText.className += ' chatMessageTextMy';
                row.scrollIntoView();
            }

            function safetyInnerHTML(text) {
                //todo later
                var t = document.createElement('div');
                t.innerHTML = text;
                text = t.textContent.replace('\n', '<br>');
                t = null;
                return text;
            }

        })();
