// Get the lib
var irc = require("irc");
var request = require('request');
var moment = require('moment');
var googleapis = require('googleapis');
var fs = require('fs');
RegExp.quote = require('regexp-quote');

var db = JSON.parse(fs.readFileSync('../data/db.json', "utf8"));
var now = new moment();
if (!db.name) db.name = {};
if (!db.ban)  db.ban  = {};
if (!db.away) db.away = {};
if (!db.say)  db.say  = {};
if (!db.act)  db.act  = {};
if (!db.song) db.song = {};
if (Object.keys(db.name).indexOf('ElectricErger') <= 0) {
    db.name['ElectricErger'] = now;
}
if (Object.keys(db.name).indexOf('linaea') <= 0) {
    db.name['linaea'] = now;
}

//Google API key
var key = 'AIzaSyDPlGenbEo8T-sbeNHx_shvJSRCwOpCESc';

var current, rem, next, djNotified, grom = ['Sonia', 'Sonia'], upnext = [], lastplayed = [];

// Create the configuration for node-irc
var config = {
    channels: ['#SonicRadioboom', '#SRBTests'],
    server: "irc.canternet.org",
    // botName: "SoniaBeta",
    botName: "Sonia",
    floodProtection: true
};

// Create settings stuff
var settings = {
    notify: false,
    disabled: false,
    verbose: false,
    introduce: false,
    autodj: false,
    feeling: 'like a robot'
};

// Create the bot
var sonia = new irc.Client(config.server, config.botName, {
    channels: config.channels
});

sonia.addListener('registered', function() {setTimeout(function(){
    sonia.say('linaea', 'Started Sonia '+require('./package.json').version);
    sonia.say('NickServ', 'identify yoloswag');
                        getRandomLine('db.txt', function (err, line) {
                            line=line.trim();
                            upnext.push(line);
                            if (settings.verbose) sonia.say('linaea', line+' up next!');
                            request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&a[action]=add&a[playlistname]=Temp&a[trackpname]='
                            +line, function (a,b,c) {})}); // TODO Change the song picker to be non-random
                            request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&a[action]=deactivate&a[playlistname]=Temp', function (a,b,c) {request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&a[action]=activate&a[playlistname]=Temp', function (a,b,c) {});});
                        },5000);});

sonia.addListener('message', function (from, to, message) {
        var proc = false;
    if (to!=config.botName) {
        Object.keys(db.away).forEach(function (item, a, b) {
            db.away[item].push('<'+from+'>: '+message);
        });
    }
    if (to == config.botName && from != 'linaea') {
        sonia.say('linaea', 'PM from '+from+': '+message);
    }
    // if (message.match(/bot/i)) sonia.say(from, "I heard that!");
    if ((message.match(/^!|^Sonia?[:,]?/i)||message.match(/,? Sonia?[.! ?]*?$/i)
    || grom[0]==config.botName || to==config.botName) && from!=config.botName) {
        if (settings.verbose) console.log('linaea', from + ' => ' + to + ': ' + message);
        // sonia.action(chan, 'Pokes '+from);
        var begin = message.match(/^(Sonia?[:,]? |!)/i)
        ?message.match(/^(Sonia?[:,]? |!)/i)[1]
        :message.match(/(,? Sonia?[.! ?]*?)$/i)
        ?message.match(/(,? Sonia?[.! ?]*?)$/i)[1]
        :'';
        message = message.replace(begin, '');
        message = message.replace(/What.?s the /i, '');
        if (message.match(/^s(?:ong| |$)/i)) {
            sonia.say((to==config.botName?from:to), 'Current Song: '+current.response.data.status.currentsong);
            proc=true;message='';
        } else if (message.match(/^l(?:isteners| |$)/i)) {
            sonia.say((to==config.botName?from:to), 'Listeners: '+current.response.data.status.listenercount);
            proc=true;message='';
        } else if (message.match(/^lo(?:gin| |$)/i) && message.match(/ (.*)$/i)) {
            sonia.say((to==config.botName?from:to), "Last login by "+message.match(/ (.*)/i)[1]+": "+moment(db.name[message.match(/ (.*)/i)[1]]).fromNow());
            proc=true;message='';
        } else if (message.match(/^help|^command/i) || message == '?') {
            sonia.say((to==config.botName?from:to),
            'Commands: [s]ong, [l]isteners, [lo]gin, [help|command], @[no]tify, [h]ug, [p]oke, @[a]dd, @[s]ay, [w]hen, [g]etdata, [n]ext, @[no]tify');
            proc=true;message='';
        } else if (message.match(/^set /i)) {
            var setting = message.match(/ (.*)/i);
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    settings[setting] = !settings[setting];
                    sonia.say((to==config.botName?from:to), setting+' '+(settings[setting]?'on':'off'));
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^ac(?:tion| |) ?/i) && message.match(/ (.*)$/i)) {
            var action = message;
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    sonia.action('#SonicRadioboom', action.match(/ (.*)/i)[1]);
                } else {
                    sonia.action(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^h(?:ug| |$)/i)) {
            sonia.action('#SonicRadioboom', ' hugs '+(message.match(/ (.*)/i)?message.match(/ (.*)/i)[1]:from));
            proc=true;message='';
        } else if (message.match(/^p(?:oke| |$)/i) && message.match(/ (.*)$/i)) {
            sonia.action('#SonicRadioboom', ' pokes '+message.match(/ (.*)/i)[1]);
            proc=true;message='';
        } else if (message.match(/^a(?:dd| |$)/i)) {
            var add = message;
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    db.song[current.response.data.status.currentsong+""] = (add.match(/ (.*)/i)?add.match(/ (.*)/i)[1]:rem);
                    sonia.say((to==config.botName?from:to), 'I know that '+current.response.data.status.currentsong+' is '+db.song[current.response.data.status.currentsong]);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^y(?:es, add it|es, it is)/i)) {
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    db.song[current.SHOUTCASTSERVER.SONGTITLE+""] = rem;
                    sonia.say((to==config.botName?from:to), 'I know that '+current.SHOUTCASTSERVER.SONGTITLE+' is '+db.song[current.SHOUTCASTSERVER.SONGTITLE]);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^sa(?:y| |$)/i) && message.match(/ (.*)/i)) {
            var say = message;
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    sonia.say('#SonicRadioboom', say.match(/^say? (.*)$/i)[1]);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^b(?:an| |$)/i) && message.match(/ (.*)/i)) {
            var ban = message;
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    db.ban[ban.match(/ (.*)/i)[1]] = true;
                    sonia.say((to==config.botName?from:to), 'banned: '+ban.match(/ (.*)/i)[1]);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^d(?:ump| |$)/i)) {
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    sonia.say(from, JSON.stringify(db));
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^r(?:estore| |$)/i)) {
            var restore = message;
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    db = JSON.parse(restore);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        
        } else if ((message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i) 
        && message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i).length == 3)) {
            var event = message;
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    var match = event.match(/\{(.*?)\}.*\{(.*?)\}/i);
                    if (!event.match("regex") && !event.match('event')) match[1] = RegExp.quote(match[1]);
                    if (event.match(/\}.*say.*\{/i)) db.say[match[1]] = match[2];
                    if (event.match(/\}.*do.*\{/i)) db.act[match[1]] = match[2];
                    sonia.say((to==config.botName?from:to), 'Got it!');
                }});
            proc=true;
        } else if (message.match(/^[dg](?:et ?link|lc| |$)/i)) {
            message = message.replace('get link','getlink');
            var data = db.song[(message.match(/ (.*)/i)?message.match(/ (.*)/i)[1]:+current.response.data.status.currentsong)+""];
            var dlc = message;
            if (!data) {
                googleapis.discover('youtube', 'v3').execute(function(err, client) {
                    var params = {
                        maxResults: 1,
                        q: (dlc.match(/ (.*)/i)?dlc.match(/ (.*)/i)[1]:current.response.data.status.currentsong),
                        part: 'snippet',
                        };
                    if (settings.verbose) console.log('linaea', params.q);
                    client.youtube.search.list(params).withApiKey(key).execute(function (err, response) {
                        response.items.forEach(function (item,a,b) {
                            sonia.say((to==config.botName?from:to), from+': Does this help? '+current.response.data.status.currentsong+' might be http://www.youtube.com/watch?v='+item.id.videoId);
                            rem = 'http://www.youtube.com/watch?v='+item.id.videoId;
                            });
                    })});
            } else {
                sonia.say((to==config.botName?from:to), from+': Does this help? '+current.response.data.status.currentsong+' is '+data);
            }
            proc=true;message='';
        } else if (message.match(/^n(?:ext| |$)/i)) {
            if (!next || moment(next.start.dateTime).fromNow().match('ago')) {
                updateNextShow();
            } else {
                sonia.say((to==config.botName?from:to), 'Next event '+next.summary+' starts '+moment(next.start.dateTime).fromNow());
            }
            proc=true;message='';
        } else if (message=='PLEASE QUIT NAO') {
            fs.writeFileSync('../data/db.json', JSON.stringify(db));
            proc=true;message='';
            process.exit();
        } else if (message.match(/^SAVE/i)) {
            fs.writeFile('../data/db.json', JSON.stringify(db), function (err) {
              if (err) return console.log(err);
              sonia.say((to==config.botName?from:to), 'I feel smarter already!');
            });
            proc=true;message='';
        } else if (message.match(/^d(?:efine)? (.+)/i)) {
            request('http://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&exsentences=3&redirects=true&format=json&titles='+message.match(/ (.*)/)[1], function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                var page = Object.keys(body.query.pages)[0];
                sonia.say((to==config.botName?from:to), body.query.pages[page].title+': "'+body.query.pages[page].extract+'" Source: http://en.wikipedia.org/wiki/'+body.query.pages[page].title);
            }
            });
            proc=true;message='';
        } else if (message.match(/^aw(?:ay)?/i)) {
            db.away[from]=[];
            sonia.say((to==config.botName?from:to), 'I\'ll hold your messages until you get back, '+from+'.');
        } else if (message.match(/^b(?:ack) /i)) {
            var f = message.match(/ (.*)/)[1];
                sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    delete db.away[f];
                    sonia.say((to==config.botName?from:to), 'Got it!');
                }});
        } else if (message.match(/^request /i)) {
            if (!s) {
            var s = message.match(/ (.*)/)[1];
            fs.readFile("db.txt", function(err, cont) {if (err) throw err;
            console.log(JSON.stringify(s));
            var r = new RegExp('^.*('+s+').*$', "g");
            console.log(r.toString());
            // s=cont.toString().match(r);
            if (settings.verbose) console.log(s);
                request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&a[action]=add&a[playlistname]=Temp&a[trackname]='+s, function (error, response, body) {
                    if (settings.verbose) console.log(body);
                    if (!error && response.statusCode == 200 && JSON.parse(body).type=='success') {
                        sonia.say((to==config.botName?from:to), 'Coming up next: '+s);
                        request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&a[action]=activate&a[playlistname]=Temp', function (a,b,c) {if (settings.verbose) console.log(c);});
                        upnext.push(s);
                    } else {
                        sonia.say((to==config.botName?from:to), 'I tried my best, but I couldn\'t bring myself to play that.');
                        if (settings.verbose) sonia.say('linaea', 'Error adding '+s+' to the playlist, backtrace: '+body);
                    }
                });});
            }
        } else if (message.match(/^SKIP/i)) {
                sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    request('http://radio.ponyvillelive.com:2199/api.php?xm=server.nextsong&f=json&a[username]=Linana&a[password]=yoloswag', function (a,b,c) {});
                    sonia.say((to==config.botName?from:to), 'Skipped that one.');
                }});
        } else if (message.match(/^b(?:ack)?/i)) {
            if (db.away[from]) {
                sonia.say((to==config.botName?from:to), 'Welcome back! '+from);
                for (var i = 0; i < db.away[from].length; i++) {
                    sonia.say(from, db.away[from][i]);
                }
                sonia.say((to==config.botName?from:to), 'You got '+db.away[from].length+' messages while you were away.');
                delete db.away[from];
            }
        } else if (message.match(/^up(?:next)/i)) {
            sonia.say((to==config.botName?from:to), "Up next: "+upnext[upnext.length-1]);
        } else if (message.match(/^la(?:st)? ?(played)/i)) {
            sonia.say((to==config.botName?from:to), "Last Played: "+lastplayed[lastplayed.length-2]);
        } else if (message.match(/http:\/\/.*.deviantart.com\/art\/.*|http:\/\/fav.me\/.*|http:\/\/sta.sh\/.*|http:\/\/.*.deviantart.com\/.*#\/d.*/)) {
            request('http://backend.deviantart.com/oembed?url='+message.match(/http:[^ ]*/), function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    body = JSON.parse(body);
                    sonia.say((to==config.botName?from:to), body.url+' is "'+body.title+'" by '+body.author_name+'.');
                }
            });
        }
        if (settings.verbose) console.log(message);
        if (begin!='!'&&message&&!(message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i) && message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i).length == 3)) {
            var matched = false;
            var messagey = message;
            Object.keys(db.say).forEach(function (item, a, b) {
                if (message.match(new RegExp(item, "i")) && (db.say[item] || db.act[item])) {
                    if (!item.match(/event=(?:song|login)/)) {
                        matched = true;
                        if (db.say[item]) {
                            messagey = db.say[item];
                            while (messagey.match('<[^ ]*?>')) {
                                messagey.replace(messagey.match('<[^ ]*?>')[0], settings[messagey.match('<[^ ]*?>')[0]]);
                            }
                            if (!settings.disabled) {
                                sonia.say((to==config.botName?from:to), messagey);
                                proc=true;
                            }
                        }
                        if (db.act[item]) {
                            messagey = db.act[item];
                            while (messagey.match('<[^ ]*?>')) {
                                messagey.replace(messagey.match('<[^ ]*?>')[0], settings[messagey.match('<[^ ]*?>')[0]]);
                            }
                            if (!settings.disabled) {
                                sonia.action((to==config.botName?from:to), messagey);
                                proc=true;
                            }
                        }
                }}
            });
            if (!matched && !message.match(/\?$/i && begin.length)) {
                messagey = messagey+' to you too, '+from;
            }
            if (settings.verbose) sonia.say('linaea', matched+' '+messagey);
            if (!settings.disabled && (from!=config.botName&&grom[0]!=config.botName&&!matched)) {
                sonia.say((to==config.botName?from:to), messagey);
                proc=true;
            }
        }
    }
    grom[1]=grom[0];
    grom[0]=from;
    if (proc) {
            grom[1]=grom[0];
            grom[0]='Sonia';
    }
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
    client.calendar.events.list(params).withApiKey(key).execute(function (err, response) {
        response.items.forEach(function (item,a,b) {next = item; sonia.say('#SonicRadioboom', 'Next event '+item.summary+' starts '+moment(item.start.dateTime).fromNow());});
    })});
}

setInterval(function() {
    if (!next || moment(next.start.dateTime).fromNow() == "in 5 minutes" && !djNotified) {
        updateNextShow();
        fs.writeFile('../data/db.json', JSON.stringify(db), function (err) {
              if (err) return console.log(err);
            });
        setTimeout(function() {
            djNotified = false;
        }, 5*60*1000);
    }
    sonia.send('PONG', 'empty');
    request('http://radio.ponyvillelive.com:2199/api.php?xm=server.getstatus&f=json&a[username]=Linana&a[password]=yoloswag', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                // if (verbose) console.log('linaea', body);
                if (current && (JSON.stringify(current.response.data.status.currentsong) != JSON.stringify(body.response.data.status.currentsong))) {
                    if (settings.notify) {
                        sonia.say('#SonicRadioboom', 'New Song: '+body.response.data.status.currentsong);
                    }
                    if (!moment(next.start.dateTime).fromNow().match("ago") && upnext.length !== 0 || body.response.data.status.currentsong.match(lastplayed[lastplayed.length-2])) {
                        request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&action=remove&playlistname=Temp&trackname='+lastplayed.push(upnext.pop()), function (a,b,c) {
                        });
                    }
                    if (upnext.length===0 && settings.autodj)
                        getRandomLine('db.txt', function (err, line) {
                            line=line.trim();
                            upnext.push(line);
                            if (settings.verbose) sonia.say('linaea', line+' up next!');
                            request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&a[action]=add&a[playlistname]=Temp&a[trackname]='
                            +line, function (a,b,c) {if (JSON.parse(c).type!="successs") {sonia.say('linaea', "There was an error adding '"+line+"' to the playlist. Debugging data: "+body);} })}); // TODO Change the song picker to be non-random
request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&a[action]=deactivate&a[playlistname]=Temp', function (a,b,c) {request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&a[action]=activate&a[playlistname]=Temp', function (a,b,c) {});});
                    if (db.say[body.response.data.status.currentsong+'|event=song']) {
                        sonia.say('#SonicRadioboom', db.say[body.response.data.status.currentsong+'|event=song']);
                    }
                }
                current = body;
}});
}, 1000);

// Modified from solution by FGRibreau
function getRandomLine(filename, callback) {
    fs.readFile(filename, function (err, data) {
    if (err) throw err;

    // Data is a buffer that we need to convert to a string
    // Improvement: loop over the buffer and stop when the line is reached
    var lines = data.toString('utf-8').split("\n");
    var line_no = Math.floor(Math.random() * (lines.length - 1 + 1)) + 1;

    if(+line_no > lines.length){
        return callback('File end reached without finding line', null);
    }

    callback(null, lines[+line_no]);
    });
}
// XXXX Hack for calling action handlers.
sonia.addListener('raw', function (message) {
    if (message.command == 'PRIVMSG' && message.args[1].match(/ACTION/))
    action(message.nick, message.args[0], message.args[1].match(/ACTION (.*)\u0001$/)[1]);
    });
function action(from, to, message) {
        if (to!=config.botName) {
        Object.keys(db.away).forEach(function (item, a, b) {
            db.away[item].push('*'+from+' '+message+'*');
        });
    }
    if ((message.match(/^!|^Sonia?[:,]?/i)||message.match(/,? Sonia?[.! ?]*?$/i)
    || grom[0]==config.botName || to==config.botName) && from!=config.botName) {
        var begin = message.match(/^(Sonia?[:,]? |!)/i)?message.match(/^(Sonia?[:,]? |!)/i)[1]:message.match(/(,? Sonia?[.! ?]*?)$/i)?message.match(/(,? Sonia?[.! ?]*?)$/i)[1]:'';
        message = message.replace(begin, '');
        message = message.replace(/What.?s the /i, '');
        var proc = false;
            if (begin!='!'&&message&&!(message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i) && message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i).length == 3)) {
            var matched = false;
            var messagey = message;
            Object.keys(db.say).forEach(function (item, a, b) {
                if (message.match(new RegExp(item+'\\|event=action', "i")) && (db.say[item] || db.act[item])) {
                    if (item.match('\\|event=action')) {
                        matched = true;
                        if (db.say[item]) {
                            messagey = db.say[item];
                            while (messagey.match('<[^ ]*?>')) {
                                messagey.replace(messagey.match('<[^ ]*?>')[0], settings[messagey.match('<[^ ]*?>')[0]]);
                            }
                            if (!settings.disabled) {
                                sonia.say((to==config.botName?from:to), messagey);
                                proc=true;
                            }
                        }
                        if (db.act[item]) {
                            messagey = db.act[item];
                            while (messagey.match('<[^ ]*?>')) {
                                messagey.replace(messagey.match('<[^ ]*?>')[0], settings[messagey.match('<[^ ]*?>')[0]]);
                            }
                            if (!settings.disabled) {
                                sonia.action((to==config.botName?from:to), messagey);
                                proc=true;
                            }
                        }
                }}
            });
            if (!matched && !message.match(/\?$/i)) {
                messagey = messagey+', too';
            }
            if (settings.verbose) sonia.say('linaea', matched+' '+messagey);
            if (!settings.disabled && (from!=config.botName&&!matched)) {
                sonia.action((to==config.botName?from:to), messagey);
                proc=true;
            }
        }
        if (settings.verbose) sonia.say('linaea', "Saw "+from+" do "+message+" to "+to);
    }
    grom[1]=grom[0];
    grom[0]=from;
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
        sonia.kick('#SonicRadioboom', nick, 'Sonia waz here.');
    } else {
    if (channel=='#SonicRadioboom' && nick!=config.botName) {
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
    console.log('error: ', message);
});
process.on('uncaughtException', function(err) {
  console.log('linaea', 'Caught exception: ' + err.stack);
  // sonia.say('ElectricErger', 'Caught exception: ' + err.stack);
});