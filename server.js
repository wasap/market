/**
 * Created by q on 04.05.16.
 */


var express=require('express');
var fs=require('fs');
var app=express();

var HTTP=require('./server/http');

// app.use('/node_modules', express.static('./node_modules' ));
// app.use('/pub', express.static('./pub' ));
app.use('/', express.static('./app' ));

// app.get('*',(req,res)=>{
//     res.redirect('/')
// });
app.listen(80);

/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */

    var wss = require('ws').Server,
    mime = require('mime'),
    myIp=require('ip').address();



var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var ObjectId = require('mongodb').ObjectID;
var url = 'mongodb://localhost:27017/test';

//stun
var stunsrv = require('stunsrv');
var tunServer = stunsrv.createServer();
tunServer.setAddress0(myIp);
tunServer.setAddress1('127.0.0.1');
tunServer.setPort0(6214);
tunServer.setPort1(6215);
tunServer.setResponseAddress0(myIp);
//tunServer.setResponseAddress1(myIp);
tunServer.listen();


var dbFindUser = function (db, username, callback) {
    var cursor = db.collection('users').find({user: username});
    var result = [];
    cursor.each(function (err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            result.push(doc);
        } else {
            callback(result);
        }
    });
};

var dbFindUserOptions = function (db, userid, callback) {
    var cursor = db.collection('userOptions').find({userid: userid});
    var result = [];
    cursor.each(function (err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            result.push(doc);
        } else {
            callback(result);
        }
    });
};

var dbInsertUser = function (db, username, password, callback) {
    db.collection('users').insertOne({user: username, password: password}, function (err, result) {
        assert.equal(err, null);
        callback(result);
    });
};

var dbInsertUserOptions = function (db, obj, callback) {
    db.collection('userOptions').insertOne(obj, function (err, result) {
        assert.equal(err, null);
        callback(result);
    });
};

var dbGetOrders = function (db, callback) {
    var cursor = db.collection('orders').find();
    var result = [];
    cursor.each(function (err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            result.push(doc);
        } else {
            callback(result);
        }
    });
};

var dbInsertOrder = function (db, data, callback) {
    db.collection('orders').insertOne(data, function (err, result) {
        assert.equal(err, null);
        callback(result.ops[0]);
    });
};

var dbUpdateOrder = function (db, param, data, callback) {
    db.collection('orders').replaceOne(param, data, function (err, result) {
        if (result.modifiedCount != 0)
            callback(result.ops[0]);
        else
            (callback(null));
    })
};

var dbDellOrder = function (db, id, callback) {
    db.collection('orders').deleteOne({_id: ObjectId(id)}, function (err, res) {
        callback(res);
    });
};

var dbUpdateUser = function (db, find, obj, callback) {
    db.collection('users').updateOne(find,
        {$set: obj}, function (err, result) {
            callback(result);
        })
};

var dbUpdateUserOptions = function (db, find, obj, callback) {
    db.collection('userOptions').updateOne(find,
        {$set: obj}, function (err, result) {
            callback(result);
        })
};

var dbGetUsers = function (db, callback) {
    var result = [];
    var cursor = db.collection('users').find();
    cursor.each(function (err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            var online = false;
            clients.some(function (client) {
                if (client.name == doc.user) {
                    online = true;
                    return true;
                } else
                    return false;
            });
            result.push({name: doc.user, isadmin: doc.isadmin, online: online});
        } else {
            callback(result);
        }
    });
};

var dbFindOrder = function (db, id, callback) {
    var cursor = db.collection('orders').find({_id: ObjectId(id)});
    var result = [];
    cursor.each(function (err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            result.push(doc);
        } else {
            callback(result);
        }
    });
};

var dbDellUser = function (db, name, callback) {
    db.collection('users').deleteOne({user: name}, function (err, res) {
        callback();
    });
};

var ws = new wss({port:65533});
var clients = [];

ws.on('connection', function (socket) {
    clients.push(socket);
    var file = null;
    socket.on('message', function (data, type) {
        if (!type.binary) {
            data = JSON.parse(data);
            console.log(data.sys);
            switch (data.sys) {
                case 'login':
                    if (data.name == null)
                        socket.send(JSON.stringify({sys: 'login',error:"name is null"}));
                    else
                    {
                        MongoClient.connect(url, function (err, db) {
                            assert.equal(null, err);
                            dbFindUser(db, data.name, function (result) {
                                if (result.length != 0) {

                                    if (result[0].password != data.pass) {
                                        db.close();
                                        socket.send(JSON.stringify({sys: 'login', error:'wrong password'}));
                                    } else {
                                        socket.isadmin = result[0].isadmin;
                                        socket.userid = result[0]._id;
                                        socket.name = data.name;
                                        dbFindUserOptions(db, result[0]._id, function (res) {
                                            db.close();
                                            socket.send(JSON.stringify({sys: 'login', name: data.name, isadmin: result[0].isadmin, options: res[0] ? res[0].options : null}));
                                        })

                                    }

                                } else {
                                    dbInsertUser(db, data.name, data.pass, function (result) {
                                        db.close();
                                        socket.userid = result.insertedId;
                                        socket.name = data.name;
                                        socket.send(JSON.stringify({sys: 'login', name: data.name}));
                                    });
                                }
                            });
                        });
                    }
                    break;
                case 'getOrders':
                    MongoClient.connect(url, function (err, db) {
                        assert.equal(null, err);
                        dbGetOrders(db, function (result) {
                            db.close();
                            socket.send(JSON.stringify({sys: 'getOrders', list: result}));
                        });
                    });
                    break;
                case "addOrder":
                    var order = {user: socket.name,
                        type: data.type,
                        curr: data.curr,
                        rate: data.rate,
                        amount: data.amount,
                        comment: data.comment,
                        time: new Date().getTime()};

                    if (data.id == null)
                        MongoClient.connect(url, function (err, db) {
                            assert.equal(null, err);
                            dbInsertOrder(db, order, function (result) {
                                db.close();
                                broadcast(JSON.stringify({sys: 'addOrder', item: result}));
                            })
                        });
                    else
                        MongoClient.connect(url, function (err, db) {
                            assert.equal(null, err);
                            dbUpdateOrder(db, {_id: ObjectId(data.id), user: socket.name}, order, function (result) {
                                db.close();
                                if (result == null) {
                                    socket.send(JSON.stringify({sys: 'no rows affected'}));
                                    return;
                                }

                                result._id = data.id;
                                broadcast(JSON.stringify({sys: 'updateOrder', item: result}));
                            });
                        });
                    break;
                case 'delOrder':
                    MongoClient.connect(url, function (err, db) {
                        assert.equal(null, err);
                        dbFindOrder(db, data.id, function (res) {
                            if (res[0] == null || (res[0].user != socket.name && !socket.isadmin)) {
                                db.close();
                                console.log('cheater stopped %', socket.name);
                                socket.send(JSON.stringify({sys:'you are not admin and it is not your order'}));
                            } else {
                                dbDellOrder(db, data.id, function (responce) {
                                    db.close();
                                    broadcast(JSON.stringify({sys: 'delOrder', item: {_id: data.id}}));

                                })
                            }
                        });
                    });
                    break;
                case "changePass":
                    MongoClient.connect(url, function (err, db) {
                        assert.equal(null, err);
                        dbUpdateUser(db, {_id: ObjectId(socket.userid)}, {password: data.pas}, function (res) {
                            db.close();
                        })
                    });

                    break;
                case "getUsers":
                    MongoClient.connect(url, function (err, db) {
                        assert.equal(null, err);
                        dbGetUsers(db, function (res) {
                            assert.equal(null, err);
                            db.close();
                            socket.send(JSON.stringify({sys: 'getUsers', list: res}))
                        })
                    });
                    break;
                case "iAmAdmin":
                case "makeAdmin":
                    if (data.sys == "makeAdmin" && !socket.isadmin)
                        return;

                    else {
                        MongoClient.connect(url, function (err, db) {
                            assert.equal(null, err);
                            dbUpdateUser(db, {user: data.name}, {isadmin: true}, function (res) {
                                dbGetUsers(db, function (res) {
                                    assert.equal(null, err);
                                    db.close();
                                    socket.send(JSON.stringify({sys: 'usersList', list: res}))
                                })
                            })
                        });
                    }

                    break;

                case "removeAdmin":
                    if (!socket.isadmin)
                        return;
                    else {
                        MongoClient.connect(url, function (err, db) {
                            assert.equal(null, err);
                            dbUpdateUser(db, {user: data.name}, {isadmin: false}, function (res) {
                                dbGetUsers(db, function (res) {
                                    assert.equal(null, err);
                                    db.close();
                                    socket.send(JSON.stringify({sys: 'usersList', list: res}))
                                })
                            })
                        });
                    }
                    break;

                case 'adminBreakPass':
                    if (!socket.isadmin)
                        return;
                    else {
                        MongoClient.connect(url, function (err, db) {
                            assert.equal(null, err);
                            dbUpdateUser(db, {user: data.name}, {password: ''}, function (res) {
                                db.close();
                            })
                        });
                    }
                    break;

                case 'dellUser':
                    if (!socket.isadmin)
                        return;
                    else {
                        MongoClient.connect(url, function (err, db) {
                            assert.equal(null, err);
                            dbDellUser(db, data.name, function () {
                                dbGetUsers(db, function (res) {
                                    assert.equal(null, err);
                                    db.close();
                                    socket.send(JSON.stringify({sys: 'usersList', list: res}))
                                })
                            })
                        });
                    }
                    break;
                case "getProfile":
                    MongoClient.connect(url, function (err, db) {
                        assert.equal(null, err);
                        dbFindUser(db, data.name == null ? socket.name : data.name, function (result) {
                            db.close();
                            var res = result[0]||{};
                            delete res.password;
                            socket.send(JSON.stringify({sys: "getProfile", data: res}))
                        })
                    });
                    break;
                case "updateProfile":
                    MongoClient.connect(url, function (err, db) {
                        assert.equal(null, err);
                        var prop = {};
                        prop[data.prop] = data.value;
                        dbUpdateUser(db, {user: socket.name}, prop, function (res) {
                            db.close();
                        })
                    });
                    break;
                case "uploadImgStart":
                    file = {blobParts: [], type: data.type, parts: data.parts, path: "/profileImg/"};
                    break;
                case "delAvatar":
                    MongoClient.connect(url, function (err, db) {
                        assert.equal(null, err);
                        dbUpdateUser(db, {user: socket.name}, {image: null}, function (res) {
                            db.close();
                            socket.send(JSON.stringify({sys: 'imageUploaded', src: null}))
                        })
                    });
                    break;
                case 'saveOptions':
                    MongoClient.connect(url, function (err, db) {
                        assert.equal(null, err);
                        var prop = {options: {}};
                        prop.options = data.value;
                        dbUpdateUserOptions(db, {userid: socket.userid}, prop, function (res) {
                            if (res.modifiedCount == 0) {
                                prop['userid'] = socket.userid;
                                dbInsertUserOptions(db, prop, function (res) {
                                    db.close();
                                })
                            } else
                                db.close();

                        })
                    });
                    break;
                case 'RTCOffer':
                    clients.forEach(function(client){
                        if(client.name==data.name)
                            client.send(JSON.stringify({sys:'RTCOffer',offer:data.offer,chatId:data.chatId,name:socket.name}));
                    });
                    break;
                case 'RTCAnswer':
                    clients.forEach(function(client){
                        if(client.name==data.name)
                            client.send(JSON.stringify({sys:'RTCAnswer',answer:data.answer,chatId:data.chatId,name:socket.name}));
                    });
                    break;
                default:
                    console.log('wrong command: s%', data.sys);
            }
        }
        //file
        else {
            if (file == null)
                return;
            file.blobParts.push(new Buffer(data));
            if (file.blobParts.length == file.parts) {
                var f = Buffer.concat(file.blobParts);
                var src = file.path + socket.userid + file.type;
                fs.writeFile('./pub' + src, f, function (er) {
                    MongoClient.connect(url, function (err, db) {
                        assert.equal(null, err);
                        dbUpdateUser(db, {user: socket.name}, {image: src}, function (res) {
                            db.close();
                            f = null;
                            file = null;
                            socket.send(JSON.stringify({sys: 'imageUploaded', src: src}))
                        })
                    });
                    fs.readdir('./pub/profileImg/', function (err, files) {
                        if (err) {
                            console.log(err);
                            return;
                        }
                        files.forEach(function (filename) {
                            if (filename.indexOf(socket.userid) == 0 && filename != socket.userid + file.type)
                                fs.unlink('./pub/profileImg/' + filename, function (err) {
                                    if (err)
                                        console.log('error deleting file ' + src);
                                });
                        })
                    })

                });

            }
        }
    });

    socket.on('close', function () {
        clients.splice(clients.indexOf(socket), 1);
    });
});
function broadcast(data) {
    clients.forEach(function (client) {
        client.send(data);
    });
}
