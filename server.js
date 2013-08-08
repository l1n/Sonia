// Get the lib
var irc = require("irc");
var moment = require('moment');
var googleapis = require('googleapis');
var fs = require('fs');
var request = require('request');
var radio = require('CentovaCast.js');
RegExp.quote = require('regexp-quote');
var EventEmitter = require('eventemitter2').EventEmitter2, emitter = new EventEmitter();
var Triejs = require('triejs'), trie = new Triejs();

{
    var eventlist = ["np","listeners","song","dlc","help","rules","event","define","away","back","lastlogin","when","setproperty","do","hug","poke","nextsong","lastplayed","broadcast","add","ban","dump","load","sayWhen","quit","save","restore","skip","request","setnick","updatesong","addsong","clearqueue","pm"];
    for (var i = 0; i < eventlist.length; i++) trie.add(eventlist[i]);
    trie.add("upnext","next");
    trie.add("np","song");
}

var db = JSON.parse(fs.readFileSync('../data/db.json', "utf8"));
var now = new moment();
if (!db.name) db.name = {};
if (!db.ban)  db.ban  = {};
if (!db.away) db.away = {};
if (!db.say)  db.say  = {};
if (!db.act)  db.act  = {};
if (db.song||true) readSongDB('db.txt');
if (!db.pp)   db.pp   = {};

if (Object.keys(db.name).indexOf('ElectricErger') <= 0) {
    db.name['ElectricErger'] = now;
}
if (Object.keys(db.name).indexOf('linaea') <= 0) {
    db.name['linaea'] = now;
}

// API keys
var keys = {
    eqr: 'b0f4f4a917abbacc10b5910749e7b1bb',
    ggl: 'AIzaSyDPlGenbEo8T-sbeNHx_shvJSRCwOpCESc'
};

var rem, next, djNotified, grom = ['Sonia', 'Sonia'], upnext = [];

// Create the settings for node-irc
var settings = {
    // channels: ['#SonicRadioboom', '#SRBTests'],
    channels: ['#SRBTests'],
    botName: "SoniaBeta",
    // botName: "Sonia",
    server: "chrysalis.canternet.org",
    floodProtection: true,
    notify: false,
    disabled: false,
    verbose: false,
    introduce: false,
    context: true,
    currentSongNum: 0,
    feeling: 'like a robot'
};

// Setup radioController
var radioController = new radio.CentovaCast('radio.ponyvillelive.com', 2199, 'Linana', 'yoloswag', 'Temp',
{
    autodj: settings.autodj,
    notfyCallback: settings.notify,
    removeSongCallback: settings.verbose,
    newSongCallback: settings.verbose,
},{
    notify: function (song) {sonia.say('#SonicRadioboom', 'Now Playing: '+song);},
    removeSong:function (song, body) {debug("Error removing old song "+song);debug(body);},
    newSong:function (song) {if (db.say[song+'|event=song']) {sonia.say('#SonicRadioboom', db.say[song+'|event=song']);}},
    queueEnd: function () {addSong();}
});

// Create the bot
var sonia = new irc.Client(settings.server, settings.botName, {
    channels: settings.channels,
    floodProtection: settings.floodProtection
});

sonia.addListener('registered', function() {setTimeout(function(){
    sonia.say('NickServ', 'identify yoloswag');
    sonia.say('linaea', 'Started Sonia '+require('./package.json').version);
    radioController.onStart();
    // radioController.updateSong();
    updateNextShow();
    // Register event handlers
    emitter.on('listeners', listeners);
    emitter.on('song', song);
    emitter.on('dlc', getMeta);
    emitter.on('help', help);
    emitter.on('rules', help);
    emitter.on('event', event);
    emitter.on('define', define);
    emitter.on('away', away);
    emitter.on('back', back);
    emitter.on('lastlogin', lastLogin);
    emitter.on('when', sayWhen);
    emitter.on('setproperty', function (from, to, message, args) {
        opCommand(from, to, message, args, setProperty);
    });
    emitter.on('do', function (from, to, message, args) {
        opCommand(from, to, message, args, doSomething);
    });
    emitter.on('hug', hug);
    emitter.on('poke', poke);
    emitter.on('nextsong', nextRequest);
    emitter.on('lastplayed', lastSong);
    emitter.on('broadcast', function (from, to, message, args) {
        opCommand(from, to, message, args, say);
    });
    emitter.on('pm', function (from, to, message, args) {
        opCommand(from, to, message, args, pm);
    });
    emitter.on('add', function (from, to, message, args) {
        opCommand(from, to, message, args, addMeta);
    });
    emitter.on('ban', function (from, to, message, args) {
        opCommand(from, to, message, args, ban);
    });
    emitter.on('dump', function (from, to, message, args) {
        opCommand(from, to, message, args, dump);
    });
    emitter.on('load', function (from, to, message, args) {
        opCommand(from, to, message, args, load);
    });
    // emitter.on('sayWhen', function (from, to, message, args) {
    //     opCommand(from, to, message, args, sayWhen);
    // });
    emitter.on('quit', function (from, to, message, args) {
        opCommand(from, to, message, args, exit);
    });
    emitter.on('save', function (from, to, message, args) {
        opCommand(from, to, message, args, save);
    });
    emitter.on('restore', function (from, to, message, args) {
        opCommand(from, to, message, args, restore);
    });
    emitter.on('skip', function (from, to, message, args) {
        opCommand(from, to, message, args, skip);
    });
    emitter.on('request', req);
    emitter.on('setnick', function (from, to, message, args) {
        opCommand(from, to, message, args, nick);
    });
    // emitter.on('updatesong', function (from, to, message, args) {
    //     opCommand(from, to, message, args, radioController.updateSong);
    // });
    emitter.on('addsong', function (from, to, message, args) {
        opCommand(from, to, message, args, addSong);
    });
    emitter.on('clearqueue', function (from, to, message, args) {
        opCommand(from, to, message, args, function () {
            upnext = [];
            reply(from, to, 'Hmm... What was that again?');
        });
    });
    radioController.onStart();
    setTimeout(every(), 1000);
},5000);});
    
    function debug(message) {
        sonia.say('linaea', message);
    }
    
function poke(from, to, message, args) {
    doSomething('Sonia', '#SonicRadioboom', '', 'pokes '+args);
}
function hug(from, to, message, args) {
    doSomething('Sonia', '#SonicRadioboom', '', 'hugs '+args);
}
function reply(from, to, message) {
    if (settings.verbose) debug((to==settings.botName?from:to));
    sonia.say((to==settings.botName?from:to), message);
    grom[1]=grom[0];
    grom[0]='Sonia';
}
function doSomething(from, to, message, args) {
    act(from, (to==settings.botName?from:to), message, args);
    grom[1]=grom[0];
    grom[0]='Sonia';
}
function opCommand(from, to, message, args, callback) {
    sonia.whois(from, function (info) {
        if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
            callback(from, to, message, args);
        } else {
            sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
        }
    });
}
function define(from, to,  message, args) {
    request('http://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&exsentences=3&redirects=true&format=json&titles='+args, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                var page = Object.keys(body.query.pages)[0];
                sonia.say((to==settings.botName?from:to), body.query.pages[page].title+': "'+body.query.pages[page].extract+'" Source: http://en.wikipedia.org/wiki/'+body.query.pages[page].title);
            }
        });
}
function listeners(from, to, message) {
    reply(from, to, 'Listeners: '+radioController.listeners());
}
function song(from, to, message) {
    reply(from, to, 'Current Song: '+radioController.song());
}
function help(from, to, message) {
    reply(from, to, 'Help is available, along with rules, at https://docs.google.com/document/d/15u3B8RexqXryPV1tfF9yJHcTbAAd0ltoPB6a9hKKyWc');
}
function lastLogin(from, to, message, args) {
    reply(from, to, "Last login by "+args+": "+moment(db.name[args]).fromNow());
}
function setProperty(from, to, message, args) {
    settings[args] = !settings[args];
    reply(from, to, args+' '+(settings[args]?'on':'off'));
}
function act(from, to, message, args) {
    sonia.action(to, args);
}
function say(from, to, message, args) {
    sonia.say('#SonicRadioboom', args);
}
function pm(from, to, message, args) {
    sonia.say(to, args);
}
function addMeta(from, to, message, args) {
    db.song[radioController.song()] = (args.match(/^$|^it/i))?rem:args;
    reply(from, to, 'I know that '+radioController.song()+' is '+db.song[radioController.song()]);
}
function getMeta(from, to, message, args) {
    var data = db.song[args||radioController.song()];
    if (!data||data==' ') {
        googleapis.discover('youtube', 'v3').execute(function(err, client, to, from, message, args) {
            var params = {
                maxResults: 1,
                q: args||radioController.song(),
                part: 'snippet',
                };
            client.youtube.search.list(params).withApiKey(keys.ggl).execute(function (err, response, to, from, message, args) {
                response.items.forEach(function (item,a,b) {
                    reply(from, to, from+': Does this help? '+radioController.song()+' might be http://www.youtube.com/watch?v='+item.id.videoId);
                    rem = 'http://www.youtube.com/watch?v='+item.id.videoId;
                    });
            })});
    } else {
        reply(from, to, from+': '+radioController.song()+' is '+data);
    }
}
function event(from, to, message) {
    if (!next || moment(next.start.dateTime).fromNow().match('ago')) {
        // updateNextShow();
    } else {
        reply(from, to, 'Next event '+next.summary+'; starting time is '+moment(next.start.dateTime).fromNow());
    }
}
function ban(from, to, message, args) {
    db.ban[args] = db.ban[args]===undefined?true:!db.ban[args];
    reply(from, to, 'Banned: '+db.ban[args]);
}
function dump(from, to, message) {
    sonia.say(from, JSON.stringify(db));
}
function load(from, to, message) {
    db = JSON.parse(message);
    reply(from, to, 'Loaded database.');
}
function save(from, to) {
    fs.writeFileSync('../data/db.json', JSON.stringify(db));
    reply(from, to, 'INT is now '+JSON.stringify(db).length);
}
function restore(from, to) {
    db = JSON.parse(fs.readFileSync('../data/db.json', "utf8"));
    reply(from, to, 'INT is now '+JSON.stringify(db).length);
}
function exit(from, to) {
    emitter.emit('save');
    process.exit();
}
function away(from, to) {
    db.away[from]=[];
    reply(from, to, 'I\'ll hold your messages until you get back, '+from+'.');
}
function back(from, to) {
    if (db.away[from]) {
        reply(from, to, 'Welcome back! '+from);
        var timeout = 0;
        for (var i = 0; i < db.away[from].length; i++) {
            setTimeout(sonia.say(from, db.away[from][i]), timeout);
            timeout+=15;
        }
        reply(from, to, 'You got '+db.away[from].length+' messages while you were away, '+from+'.');
        delete db.away[from];
    } else {
        reply(from, to, 'Sorry, I don\'t have anything for you, '+from+'.');
    }
}
function req(from, to, message, args) {
    var r = new RegExp(args, 'i');
    var song;
    db.songs.forEach(function(s) {if (s.match(r)) {song = s;}});
    if (song) {
        radioController.addSong(song, function(success, body) {
            if (success) {
                reply(from, to, 'Coming up next: '+song);
            } else {
                reply(from, to, 'I tried my best, but I couldn\'t bring myself to play that.');
                debug('Error adding song '+song+':');
                debug(body);
            }
        });
    } else {
        reply(from, to, 'I don\'t know that one. Pick another?');
    }
}
function nick(from, to, message, args) {
    sonia.send('nick', args);
    settings.botName = args;
}
function nextRequest(from, to) {
    reply(from, to, "Up next: "+radioController.upNext());
}
function lastSong(from, to) {
    reply(from, to, "Last Played: "+radioController.lastPlayed());
}
function skip(from, to, message, args) {
    radioController.skip(function() {reply(from, to, 'Skipped that one.');});
}
function sayWhen(from, to, message) {
    var parts = message.match(/\{(.*?)\}.*\{(.*?)\}/i);
    if (!message.match("regex") && !message.match('event')) parts[1] = RegExp.quote(parts[1]);
    if (message.match(/\}.*say.*\{/i)) db.say[parts[1]] = parts[2];
    if (message.match(/\}.*do.*\{/i)) db.act[parts[1]] = parts[2];
    reply(from, to, 'Got it!');
}

sonia.addListener('message', function (from, to, message) {
    settings.from = from;
    settings.to = to;
    settings.message = message;
    // settings.nowplaying = current.response.data.status.currentsong;
    
    if (to!=settings.botName) {
        Object.keys(db.away).forEach(function (item, a, b) {
            db.away[item].push('<'+from+'>: '+message);
        });
    }
    if (to == settings.botName && from != 'linaea') {
        debug('PM from '+from+': '+message);
    }
    Object.keys(db.pp).forEach(function (item, a, b) {
        if (message.match(db.pp[item].find)) {
            message = message.replace(db.pp[item].find, db.pp[item].replace);
        }
    });
    if (message.match('getSettings')) sonia.say('linaea', JSON.stringify(settings));
    if ((message.match(/^!|^Sonia?[:,]?/i)||message.match(/,? Sonia?[.! ?]*?$/i))
    || (grom[0]==settings.botName || to==settings.botName && from!=settings.botName && settings.context)) {
        var begin = message.match(/^(Sonia?[:,]? |!)/i)
        ?message.match(/^(Sonia?[:,]? |!)/i)[1]
        :message.match(/(,? Sonia?[.! ?]*?)$/i)
        ?message.match(/(,? Sonia?[.! ?]*?)$/i)[1]
        :'';
        message = message.replace(begin, '');
        message = message.replace(/What.?s the /i, '');
        
        var command = message.match(/^\w*/)[0]||message;
        var argumen = message.match(/ .*/)?message.match(/ .*/)[0]:'';
        argumen     = argumen.trim();
        
        if (settings.verbose) debug(trie.find(command), from, to, message, argumen);
        emitter.emit(trie.find(command.toLowerCase()), from, to, message, argumen);
        
        if (message.match(/http:\/\/.*.deviantart.com\/art\/.*|http:\/\/fav.me\/.*|http:\/\/sta.sh\/.*|http:\/\/.*.deviantart.com\/.*#\/d.*/)) {
            request('http://backend.deviantart.com/oembed?url='+message.match(/http:[^ ]*/), function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    body = JSON.parse(body);
                    reply(from, to, body.url+' is "'+body.title+'" by '+body.author_name+'.');
                }
            });
        }
        if (begin!='!'&&message&&!(message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i) && message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i).length == 3)) {
            var matched = false;
            var messagey = message;
            Object.keys(db.say).forEach(function (item, a, b) {
                if (message.match(new RegExp(item, "i")) && (db.say[item] || db.act[item])) {
                    if (!item.match(/event=(?:song|login|hour|minute|second)/)) {
                        matched = true;
                        if (db.say[item]) {
                            messagey = db.say[item];
                            messagey = messagey.replace('Sonia','<from>');
                            while (messagey.match(/<[^ ]*?>/)) {
                                messagey = messagey.replace(/<[^ ]*?>/, settings[messagey.match('<([^ ]*?)>')[1]]);
                            }
                            if (!settings.disabled) reply(from, to, messagey);
                        }
                        if (db.act[item]) {
                            messagey = db.act[item];
                            messagey = messagey.replace('Sonia', '<from>');
                            while (messagey.match(/<[^ ]*?>/)) {
                                messagey = messagey.replace(/<[^ ]*?>/, settings[messagey.match('<([^ ]*?)>')[1]]);
                            }
                            if (!settings.disabled) doSomething(to, (to==settings.botName?from:to), messagey, messagey);
                        }
                }}
            });
            if (!matched && !message.match(/\?$/i && begin.length)) {
                messagey = messagey+' to you too, '+from;
                messagey = messagey.replace('Sonia', '<from>');
                while (messagey.match(/<[^ ]*?>/)) {
                    messagey = messagey.replace(/<[^ ]*?>/, settings[messagey.match('<([^ ]*?)>')[1]]);
                }
                }
            if (settings.verbose) debug(matched+' '+messagey);
            if (!settings.disabled && (from!=settings.botName&&grom[0]!=settings.botName&&!matched)) reply(from, to, messagey);
        }
    }
    grom[1]=grom[0];
    grom[0]='Sonia';
});

function updateNextShow(message) {
    googleapis.discover('calendar', 'v3').execute(function(err, client) {
    var params = {
        calendarId: 'sonicradioboom2013@gmail.com',
        maxResults: 1,
        timeMin: moment(),
        singleEvents: true,
        orderBy: "startTime",
        };
    djNotified = true;
    client.calendar.events.list(params).withApiKey(keys.ggl).execute(function (err, response) {
        if (err) return debug(err);
        response.items.forEach(function (item,a,b) {next = item;});
    if (!next || moment(next.start.dateTime).fromNow() == "in 5 minutes" && !djNotified) {
        sonia.say('#SonicRadioboom', 'Next event '+next.summary+'; starting time is '+moment(next.start.dateTime).fromNow());
        setTimeout(function() {
            djNotified = false;
        }, 5*60*1000);
    }
    })});
}
function autosave() {
    if (settings.verbose) debug('writing');
    fs.writeFile('../data/db.json', JSON.stringify(db), function (err) {
        if (err) return console.log(err);
        if (settings.verbose) debug('done writing');
    });
}

function addSong() {
    var song = db.songs[settings.currentSongNum++||0];
    if (db.songs.length-1==settings.currentSongNum) {
        debug('rereading db, out of songs');
        readSongDB('db.txt');
        settings.currentSongNum = 0;
    } else {
        if (settings.notify) sonia.say('#SonicRadioboom', song+', coming up next!');
        radioController.addSong(song, function (success, body) {
            // console.log(body);
            body = JSON.parse(body);
            if (!success) {
                debug("There was an error adding '"+song+"' to the playlist.");
                debug("Server Response: "+JSON.stringify(body));
                setTimeout(addSong, 1000);
            } else {
                if (settings.verbose) debug("Server Response: "+JSON.stringify(body));
            }
        });
    }
    radioController.activate(null);
}

function readSongDB(filename) {
    fs.readFile(filename, function (err, data) {
        if (err) throw err;
        data = data.toString('utf-8').split("\n");
        db.songs = shuffle(data);
        if (settings.autodj) addSong();
    });
}

// Courtesy of Blender@SO (http://stackoverflow.com/questions/6274339/how-can-i-shuffle-an-array-in-javascript/6274398#6274398)
function shuffle(array) {
    var counter = array.length, temp, index;

    // While there are elements in the array
    while (counter--) {
        // Pick a random index
        index = (Math.random() * counter) | 0;

        // And swap the last element with it
        temp = array[counter];
        array[counter] = array[index];
        array[index] = temp;
    }

    return array;
}

// XXXX Hack for calling action handlers.
sonia.addListener('raw', function (message) {
    if (message.command == 'PING') sonia.send('PONG', 'empty');
    if (message.command == 'PRIVMSG' && message.args[1].match(/ACTION/))
    action(message.nick, message.args[0], message.args[1].match(/ACTION (.*)\u0001$/)[1]);
    });
function action(from, to, message) {
    settings.from = from;
    settings.to = to;
    settings.message = message;
    if (to!=settings.botName) {
    Object.keys(db.away).forEach(function (item, a, b) {
        db.away[item].push('*'+from+' '+message+'*');
    });
    }
    if ((message.match(/^!|^Sonia?[:,]?/i)||message.match(/,? Sonia?[.! ?]*?$/i))
    || (grom[0]==settings.botName || to==settings.botName && from!=settings.botName)) {
        var begin = message.match(/^(Sonia?[:,]? |!)/i)?message.match(/^(Sonia?[:,]? |!)/i)[1]:message.match(/(,? Sonia?[.! ?]*?)$/i)?message.match(/(,? Sonia?[.! ?]*?)$/i)[1]:'';
        // message = message.replace(begin, '');
        // message = message.replace(/What.?s the /i, '');
            message = message.replace('Sonia', '<from>');
            if (begin!='!'&&message&&!(message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i) && message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i).length == 3)) {
            var matched = false;
            var messagey = message;
            Object.keys(db.say).forEach(function (item, a, b) {
                if (message.match(new RegExp(item+'\\|event=action', "i")) && (db.say[item] || db.act[item])) {
                    if (item.match('\\|event=action')) {
                        matched = true;
                        if (db.say[item]) {
                            messagey = db.say[item];
                            while (messagey.match(/<[^ ]*?>/)) {
                                messagey = messagey.replace(/<[^ ]*?>/, settings[messagey.match('<([^ ]*?)>')[1]]);
                            }
                            if (!settings.disabled) reply(from, to, messagey);
                        }
                        if (db.act[item]) {
                            messagey = db.act[item];
                            while (messagey.match(/<[^ ]*?>/)) {
                                messagey = messagey.replace(/<[^ ]*?>/, settings[messagey.match('<([^ ]*?)>')[1]]);
                            }
                            if (!settings.disabled) doSomething(to, (to==settings.botName?from:to), messagey, messagey);
                        }
                }}
            });
            if (!settings.disabled && !matched && !message.match(/\?$/i)) {
                messagey = messagey+', too';
                while (messagey.match(/<[^ ]*?>/)) {
                    debug(messagey);
                    messagey = messagey.replace(/<[^ ]*?>/, settings[messagey.match('<([^ ]*?)>')[1]]);
                }
            }
            if (!settings.disabled && (from!=settings.botName&&!matched)) doSomething(to, (to==settings.botName?from:to), messagey, messagey);
        }
    }
    grom[1]=grom[0];
    grom[0]=from;
}

var t = 0;
function every() {
    t++;
    if (t%1===0) second();
    if (t%60===0) minute();
    if (t%(60*60)===0) hour();
    if (t%(20*60)===0) updateNextShow();
    if (t%(5*60)===0) autosave();
    setTimeout(function () {every()}, 1000);
}
function hour() {
    sonia.say('#SonicRadioboom', db.say['event=hour']);
    }
function minute() {
    sonia.say('#SonicRadioboom', db.say['event=minute']);
    }
function second() {
    sonia.say('#SonicRadioboom', db.say['event=second']);
    }

sonia.addListener('nick', function (oldnick, newnick, channels, message) {
    newnick = newnick.replace(/_*$/, '');
    oldnick = oldnick.replace(/_*$/, '');
    if (!db.name[newnick]) db.name[newnick] = moment();
    if (!db.name[newnick+'|event=login']) {
        db.name[newnick+'|event=login']=db.name[oldnick+'|event=login'];
    } else if (!db.name[oldnick+'|event=login']) {
        db.name[oldnick+'|event=login']=db.name[newnick+'|event=login'];
    } else {
        sonia.say('#SonicRadioboom', db.say[newnick+'|event=login']);
    }});
sonia.addListener('join', function(channel, nick, message) {
    nick = nick.replace(/_*$/, '');
    if (db.ban[nick]) {
        sonia.send('KICK', '#SonicRadioboom', nick, 'Sonia waz here.');
    } else {
    if (channel=='#SonicRadioboom' && nick!=settings.botName) {
        var record = db.name[nick];
        if (record) {
            sonia.say('#SonicRadioboom', 'Welcome back! Last login: '+moment(record).fromNow()+".");
            if (db.say[nick+'|event=login']) {
                sonia.say('#SonicRadioboom', db.say[nick+'|event=login']);
            }
            
        } else {
            sonia.say('#SonicRadioboom', 'Haven\'t seen you around before, '+nick+'. Care to introduce yourself?');
            if (settings.introduce) {
                sonia.say(nick, 'Welcome to '+'#SonicRadioboom'+'! The radio stream is available at http://thunderlane.ponyvillelive.com/~srb/.');
                sonia.say(nick, 'If you haven\'t registered your nick with ChanServ already, type \"/msg NickServ register <password> <email>\" to register your nick. This way, nopony will take your name.');
            }
        }
        db.name[nick] = moment();
    }
    }
});
sonia.addListener('quit', function(channel, nick, message) {
    db.name[nick] = moment();
});
sonia.addListener('error', function(message) {
    console.log('error: '+ JSON.stringify(message));
});
process.on('uncaughtException', function(err) {
  console.log('Caught exception: ' + err + err.stack);
  // sonia.say('ElectricErger', 'Caught exception: ' + err.stack);
});