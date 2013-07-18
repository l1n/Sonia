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
var chan = '#SonicRadioboom';

var current, rem, next, djNotified, grom = ['Sonia', 'Sonia'], upnext = [];
var feeling = 'like a robot';
request('http://radio.ponyvillelive.com:2199/api.php?xm=server.getstatus&f=json&a[username]=Linana&a[password]=yoloswag', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            body = JSON.parse(body);
            current = body;
        if (verbose) console.log('linaea', body);}});

// Create the configuration
var config = {
    channels: [chan, '#SRBTests'],
    server: "irc.canternet.org",
	// botName: "SoniaBeta",
    botName: "Sonia",
    floodProtection: true,
};

var notify = false, disabled = false, verbose = false, introduce = false;

// Create the bot name
var sonia = new irc.Client(config.server, config.botName, {
    channels: config.channels
});

sonia.addListener('registered', function() {setTimeout(function(){sonia.say('linaea', 'Started Sonia '+require('./package.json').version);},5000);});

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
        if (verbose) console.log('linaea', from + ' => ' + to + ': ' + message);
        // sonia.action(chan, 'Pokes '+from);
        var begin = message.match(/^(Sonia?[:,]? |!)/i)
        ?message.match(/^(Sonia?[:,]? |!)/i)[1]
        :message.match(/(,? Sonia?[.! ?]*?)$/i)
        ?message.match(/(,? Sonia?[.! ?]*?)$/i)[1]
        :'';
        message = message.replace(begin, '');
        message = message.replace(/What.?s the /i, '');
        if (message.match(/^s(?:ong| |$)/i)) {
            sonia.say(chan, 'Current Song: '+current.response.data.status.currentsong);
            proc=true;message='';
        } else if (message.match(/^l(?:isteners| |$)/i)) {
            sonia.say(chan, 'Listeners: '+current.response.data.status.listenercount);
            proc=true;message='';
        } else if (message.match(/^lo(?:gin| |$)/i) && message.match(/ (.*)$/i)) {
            sonia.say(chan, "Last login by "+message.match(/ (.*)/i)[1]+": "+moment(db.name[message.match(/ (.*)/i)[1]]).fromNow());
            proc=true;message='';
        } else if (message.match(/^help|^command/i) || message == '?') {
            sonia.say(chan,
            'Commands: [s]ong, [l]isteners, [lo]gin, [help|command], @[no]tify, [h]ug, [p]oke, @[a]dd, @[s]ay, [w]hen, [g]etdata, [n]ext, @[no]tify');
            proc=true;message='';
        } else if (message.match(/^no(?:tify| |$)/i)) {
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    notify = !notify;
                    sonia.say((to==config.botName?from:to), 'Notifications '+(notify?'on':'off'));
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^i(?:ntroduce|$)/i)) {
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    introduce = !introduce;
                    sonia.say((to==config.botName?from:to), 'Introductions '+(introduce?'on':'off'));
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^ac(?:tion| |) ?/i) && message.match(/ (.*)$/i)) {
            var action = message;
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    sonia.action(chan, action.match(/ (.*)/i)[1]);
                } else {
                    sonia.action(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^h(?:ug| |$)/i)) {
            sonia.action(chan, ' hugs '+(message.match(/ (.*)/i)?message.match(/ (.*)/i)[1]:from));
            proc=true;message='';
        } else if (message.match(/^p(?:oke| |$)/i) && message.match(/ (.*)$/i)) {
            sonia.action(chan, ' pokes '+message.match(/ (.*)/i)[1]);
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
                    sonia.say(chan, say.match(/^say? (.*)$/i)[1]);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^f(?:eel| |$)/i) && message.match(/ (.*)/i)) {
            var feel = message;
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    feeling = feel.match(/ (.*)/i)[1];
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
        } else if (message.match(/^v(?:erbose)$/i)) {
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    verbose=!verbose;
                    sonia.say((to==config.botName?from:to), 'verbose: '+verbose);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^di(?:sable| |$)/i)) {
            sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    disabled=!disabled;
                    sonia.say((to==config.botName?from:to), 'Disabled: '+disabled);
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
                    if (verbose) console.log('linaea', params.q);
                    client.youtube.search.list(params).withApiKey(key).execute(function (err, response) {
                        response.items.forEach(function (item,a,b) {
                            sonia.say(chan, from+': Does this help? '+current.response.data.status.currentsong+' might be http://www.youtube.com/watch?v='+item.id.videoId);
                            rem = 'http://www.youtube.com/watch?v='+item.id.videoId;
                            });
                    })});
            } else {
                sonia.say(chan, from+': Does this help? '+current.response.data.status.currentsong+' is '+data);
            }
            proc=true;message='';
        } else if (message.match(/^n(?:ext| |$)/i)) {
            if (!next || moment(next.start.dateTime).fromNow().match('ago')) {
                updateNextShow();
            } else {
                sonia.say(chan, 'Next event '+next.summary+' starts '+moment(next.start.dateTime).fromNow());
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
        } else if (message.match(/^d(?:efine) (.+)/i)) {
            request('http://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=true&exsentences=3&redirects=true&format=json&titles='+message.match(/ (.*)/)[1], function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                var page = Object.keys(body.query.pages)[0];
                sonia.say((to==config.botName?from:to), body.query.pages[page].title+': "'+body.query.pages[page].extract+'" Source: http://en.wikipedia.org/wiki/'+body.query.pages[page].title);
            }
            });
            proc=true;message='';
        } else if (message.match(/^aw(?:ay)/i)) {
            db.away[from]=[];
            sonia.say((to==config.botName?from:to), 'I\'ll hold your messages until you get back, '+from+'.');
        } else if (message.match(/^b(?:ack) /i)) {
            var f = message.match(/ (.*)/)[1];
                sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                    delete db.away[f];
                    sonia.say((to==config.botName?from:to), 'Got it!');
                }});
        } else if (message.match(/^PLAY /i)) {
            if (!s) {
            var s = message.match(/ (.*)/)[1];
                sonia.whois(from, function (info) {
                if ((info.channels && info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) || from == 'linaea') {
                        request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&action=add&playlistname=Temp&trackname='+s, function (error, response, body) {
                            if (!error && response.statusCode == 200 && JSON.parse(body).type=='success') {
                                sonia.say(chan, 'Coming up next:'+s);
                                request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&action=activate&playlistname=Temp', function (a,b,c) {});
                                upnext.push(s);
                            } else {
                                sonia.say(chan, 'I tried my best, but I couldn\'t bring myself to play that.');
                            }
                        });
                } else {
                    sonia.say(((to==config.botName)?to:from), 'PLAY is only available to OPs in beta.');
                }
            });
            }
        } else if (message.match(/^b(?:ack)/i)) {
            if (db.away[from]) {
                sonia.say((to==config.botName?from:to), 'Welcome back! '+from);
                for (var i = 0; i < db.away[from].length; i++) {
                    sonia.say(from, db.away[from][i]);
                }
                sonia.say((to==config.botName?from:to), 'You got '+db.away[from].length+' messages while you were away.');
                delete db.away[from];
            }
        } else if (message.match(/http:\/\/.*.deviantart.com\/art\/.*|http:\/\/fav.me\/.*|http:\/\/sta.sh\/.*|http:\/\/.*.deviantart.com\/.*#\/d.*/)) {
            request('http://backend.deviantart.com/oembed?url='+message.match(/http:[^ ]*/), function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    body = JSON.parse(body);
                    sonia.say((to==config.botName?from:to), body.url+' is "'+body.title+'" by '+body.author_name+'.');
                }
            });
        }
        if (verbose) console.log(message);
        if (begin!='!'&&message&&!(message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i) && message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i).length == 3)) {
            var matched = false;
            var messagey = message;
            Object.keys(db.say).forEach(function (item, a, b) {
                if (message.match(new RegExp(item, "i")) && (db.say[item] || db.act[item])) {
                    if (!item.match('event')) {
                        matched = true;
                        if (db.say[item]) {
                            messagey = db.say[item];
                            messagey = messagey.replace('varFrom', from);
                            messagey = messagey.replace('varFeeling', feeling);
                            if (!disabled) {
                                sonia.say((to==config.botName?from:to), messagey);
                                proc=true;
                            }
                        }
                        if (db.act[item]) {
                            messagey = db.act[item];
                            messagey = messagey.replace('varFrom', from);
                            messagey = messagey.replace('varFeeling', feeling);
                            if (!disabled) {
                                sonia.action((to==config.botName?from:to), messagey);
                                proc=true;
                            }
                        }
                }}
            });
            if (!matched && !message.match(/\?$/i && begin.length)) {
                messagey = messagey+' to you too, '+from;
            }
            if (verbose) sonia.say('linaea', matched+' '+messagey);
            if (!disabled && (from!=config.botName&&grom[0]!=config.botName&&!matched)) {
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
        response.items.forEach(function (item,a,b) {next = item; sonia.say(chan, 'Next event '+item.summary+' starts '+moment(item.start.dateTime).fromNow());});
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
                    if (notify) {
                        sonia.say(chan, 'New Song: '+body.response.data.status.currentsong);
                    }
                    if (upnext.length != 0 && body.response.data.status.currentsong==upnext[upnext.length-1]) {
                        request('http://radio.ponyvillelive.com:2199/api.php?xm=server.playlist&f=json&a[username]=Linana&a[password]=yoloswag&action=remove&playlistname=Temp&trackname='+upnext.pop(), function (a,b,c) {});
                    }
                    if (db.say[body.response.data.status.currentsong+'|event=song']) {
                        sonia.say(chan, db.say[body.response.data.status.currentsong+'|event=song']);
                    }
                }
                current = body;
}});
}, 1000);
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
                if (message.match(new RegExp(item, "i")) && (db.say[item] || db.act[item])) {
                    if (!item.match('event')) {
                        matched = true;
                        if (db.say[item]) {
                            messagey = db.say[item];
                            messagey = messagey.replace('varFrom', from);
                            messagey = messagey.replace('varFeeling', feeling);
                            if (!disabled) {
                                sonia.say((to==config.botName?from:to), messagey);
                                proc=true;
                            }
                        }
                        if (db.act[item]) {
                            messagey = db.act[item];
                            messagey = messagey.replace('varFrom', from);
                            messagey = messagey.replace('varFeeling', feeling);
                            if (!disabled) {
                                sonia.action((to==config.botName?from:to), messagey);
                                proc=true;
                            }
                        }
                }}
            });
            if (!matched && !message.match(/\?$/i)) {
                messagey = messagey+', too';
            }
            if (verbose) sonia.say('linaea', matched+' '+messagey);
            if (!disabled && (from!=config.botName&&!matched)) {
                sonia.action((to==config.botName?from:to), messagey);
                proc=true;
            }
        }
        if (verbose) sonia.say('linaea', "Saw "+from+" do "+message+" to "+to);
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
        sonia.say(chan, db.say[newnick+'|event=login']);
    }});
sonia.addListener('join', function(channel, nick, message) {
    nick = nick.replace(/_*$/, '');
    if (db.ban[nick]) {
        sonia.kick(chan, nick, 'Sonia waz here.');
    } else {
    if (channel==chan && nick!=config.botName) {
        var record = db.name[nick];
        if (record) {
            sonia.say(chan, 'Welcome back! Last login: '+moment(record).fromNow()+".");
            if (db.say[nick+'|event=login']) {
                sonia.say(chan, db.say[nick+'|event=login']);
            }
            
        } else {
            sonia.say(chan, 'Haven\'t seen you around before, '+nick+'. Care to introduce yourself?');
            if (introduce) {
                sonia.say(nick, 'Welcome to '+chan+'! The radio stream is available at http://thunderlane.ponyvillelive.com/~srb/.');
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