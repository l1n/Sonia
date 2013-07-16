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
if (!db.ban) db.ban = {};
if (!db.say) db.say = {};
if (!db.act) db.act = {};
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


var current, rem, next, djNotified, grom = ['', ''];
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

var notify = false, disabled = false, verbose = false;

// Create the bot name
var sonia = new irc.Client(config.server, config.botName, {
    channels: config.channels
});

sonia.addListener('registered', function() {setTimeout(function(){sonia.say('linaea', 'Started Sonia '+require('./package.json').version);},5000);});

sonia.addListener('message', function (from, to, message) {
    if (to == config.botName && from != 'linaea') {
        sonia.say('linaea', 'PM from '+from+': '+message);
    }
    // if (message.match(/bot/i)) sonia.say(from, "I heard that!");
    if ((message.match(/^!|^Sonia?[:,]?/i)||message.match(/,? Sonia?[.! ?]*?$/i)||grom[0]==config.botName||to==config.botName)&&from!=config.botName) {
        // sonia.say('linaea', from + ' => ' + to + ': ' + message);
        // sonia.action(chan, 'Pokes '+from);
        var begin = message.match(/^(Sonia?[:,]? |!)/i)?message.match(/^(Sonia?[:,]? |!)/i)[1]:message.match(/(,? Sonia?[.! ?]*?)$/i)?message.match(/(,? Sonia?[.! ?]*?)$/i)[1]:'';
        message = message.replace(begin, '');
        message = message.replace(/What.?s the /i, '');
        var proc = false;
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
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    notify = !notify;
                    sonia.say((to==chan?chan:from), 'Notifications '+(notify?'on':'off'));
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^ac(?:tion| |) ?/i) && message.match(/ (.*)$/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    sonia.action(chan, message.match(/ (.*)/i)[1]);
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
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    db.song[current.response.data.status.currentsong+""] = (message.match(/ (.*)/i)?message.match(/ (.*)/i)[1]:rem);
                    sonia.say((to==chan?chan:from), 'I know that '+current.response.data.status.currentsong+' is '+db.song[current.response.data.status.currentsong]);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^y(?:es, add it|es, it is)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    db.song[current.SHOUTCASTSERVER.SONGTITLE+""] = rem;
                    sonia.say((to==chan?chan:from), 'I know that '+current.SHOUTCASTSERVER.SONGTITLE+' is '+db.song[current.SHOUTCASTSERVER.SONGTITLE]);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^sa(?:y| |$)/i) && message.match(/ (.*)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    sonia.say(chan, message.match(/ (.*)/i)[1]);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^f(?:eel| |$)/i) && message.match(/ (.*)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    feeling = message.match(/ (.*)/i)[1];
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^b(?:an| |$)/i) && message.match(/ (.*)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    db.ban[message.match(/ (.*)/i)[1]] = true;
                    sonia.say((to==chan?chan:from), 'banned: '+message.match(/ (.*)/i)[1]);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^v(?:erbose)$/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    verbose=!verbose;
                    sonia.say((to==chan?chan:from), 'verbose: '+verbose);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^di(?:sable| |$)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    disabled=!disabled;
                    sonia.say((to==chan?chan:from), 'Disabled: '+disabled);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^d(?:ump| |$)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    sonia.say(from, JSON.stringify(db));
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if (message.match(/^r(?:estore| |$)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    db = JSON.parse(message);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
            proc=true;message='';
        } else if ((message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i) && message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i).length == 3)) {
           sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    var match = message.match(/^w(?:hen).*\{(.*?)\}.*\{(.*?)\}/i);
                    if (!message.match("regex") && !message.match(event)) match[1] = RegExp.quote(match[1]);
                    if (message.match(/\}.*say.*\{/i)) db.say[match[1]] = match[2];
                    if (message.match(/\}.*do.*\{/i)) db.act[match[1]] = match[2];
                    sonia.say((to==chan?chan:from), 'Got it!');
                }});
            proc=true;message='';
        } else if (message.match(/^[dg](?:et ?link|lc| |$)/i)) {
            var data = db.song[(message.match(/ (.*)/i)?message.match(/ (.*)/i)[1]:+current.response.data.status.currentsong)+""];
            if (!data) {
                googleapis.discover('youtube', 'v3').execute(function(err, client) {
                    var moments = message.match(/ (.*)/i);
                    if (moments) {
                        moments = moment(moments[1]);
                        moments = moments.isValid()?moments:moment();
                    } else {
                        moments = moment();
                    }
                    var params = {
                        maxResults: 1,
                        q: (message.match(/ (.*)/i)?message.match(/ (.*)/i)[1]:+current.response.data.status.currentsong),
                        part: 'snippet',
                        };
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
              sonia.say((to==chan?chan:from), 'I feel smarter already!');
            });
            proc=true;message='';
        }
        if (begin!='!') {
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
                                sonia.say((to==chan?chan:from), messagey);
                                proc=true;
                            }
                        }
                        if (db.act[item]) {
                            messagey = db.act[item];
                            messagey = messagey.replace('varFrom', from);
                            messagey = messagey.replace('varFeeling', feeling);
                            if (!disabled) {
                                sonia.action((to==chan?chan:from), messagey);
                                proc=true;
                            }
                        }
                }}
            });
            if (!matched && !message.match(/\?$/i)) {
                messagey = messagey+' to you too, '+from;
            }
            if (verbose) sonia.say('linaea', matched+' '+messagey);
            if (!disabled && (from!=config.botName&&!matched)) {
                sonia.say((to==chan?chan:from), messagey);
                proc=true;
            }
        }
    }
    grom[1]=grom[0];
    grom[0]=from;
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
    request('http://radio.ponyvillelive.com:2199/api.php?xm=server.getstatus&f=json&a[username]=Linana&a[password]=yoloswag', function (error, response, body) {
            if (!error && response.statusCode == 200) {
                body = JSON.parse(body);
                if (verbose) console.log('linaea', body);
                if (current && (JSON.stringify(current.response.data.status.currentsong) != JSON.stringify(body.response.data.status.currentsong))) {
                    if (notify) {
                        sonia.say(chan, 'New Song: '+body.response.data.status.currentsong);
                    }
                    if (db.say[body.response.data.status.currentsong+'|event=song']) {
                        sonia.say(chan, db.say[body.response.data.status.currentsong+'|event=song']);
                    }
                }
                current = body;
}});
    // request(ip+'stats?sid=1', function (error, response, body) {
    //     if (!error && response.statusCode == 200) {
    //         parseString(body, function (err, result) {
    //             if (current && (JSON.stringify(current.SHOUTCASTSERVER.SONGTITLE) != JSON.stringify(result.SHOUTCASTSERVER.SONGTITLE))) {
    //                 if (notify) {
    //                     sonia.say(chan, 'New Song: '+result.SHOUTCASTSERVER.SONGTITLE);
    //                 }
    //                 if (db.song[result.SHOUTCASTSERVER.SONGTITLE+'|event=song']) {
    //                     sonia.say(chan, db.say[result.SHOUTCASTSERVER.SONGTITLE+'|event=song']);
    //                 }
    //             }
    //             current = result;
    //         });
    //     }
    // });
}, 1000);
sonia.addListener('nick', function (oldnick, newnick, channels, message) {
    if (!db.name[newnick+'|event=login']) {
        db.name[newnick+'|event=login']=db.name[oldnick+'|event=login'];
    } else if (!db.name[oldnick+'|event=login']) {
        db.name[oldnick+'|event=login']=db.name[newnick+'|event=login'];
    } else {
        sonia.say(chan, db.say[newnick+'|event=login']);
    }});
sonia.addListener('join', function(channel, nick, message) {
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
            sonia.say(nick, 'Welcome to '+chan+'! The radio stream is available at http://thunderlane.ponyvillelive.com/~srb/.');
            sonia.say(nick, 'If you haven\'t registered your nick with ChanServ already, type \"/msg NickServ register <password> <email>\" to register your nick. This way, nopony will take your name.');
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