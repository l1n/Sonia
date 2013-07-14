// Get the lib
var irc = require("irc");
var request = require('request');
var moment = require('moment');
var parseString = require('xml2js').parseString;
var googleapis = require('googleapis');
var db = require('node-persist');


//Google API key
var key = 'AIzaSyDPlGenbEo8T-sbeNHx_shvJSRCwOpCESc';

var ip = 'http://198.211.99.242:8020/';
var chan = '#SonicRadioboom';

var now = new moment();
db.initSync();
if (!db.getItem('ElectricErger'.substring(0,12))) {
    db.setItem('ElectricErger'.substring(0,12), now);
}
if (!db.getItem('linaea'.substring(0,12))) {
    db.setItem('linaea'.substring(0,12), now);
}
var current, rem;
request(ip+'stats?sid=1', function (error, response, body) {
    if (!error && response.statusCode == 200) {
        parseString(body, function (err, result) {
            current = result;
        });
    }
});

// Create the configuration
var config = {
    channels: [chan],
    server: "irc.canternet.org",
	botName: "Sonia",
    floodProtection: true,
};

var notify = false;

// Create the bot name
var sonia = new irc.Client(config.server, config.botName, {
    channels: config.channels
});

sonia.say('linaea', 'Started Sonia '+require('./package.json').version);

sonia.addListener('message', function (from, to, message) {
    // console.log(from + ' => ' + to + ': ' + message);
    // if (message.match(/bot/i)) sonia.say(from, "I heard that!");
    if (message.match(/Sonia: /i)||message.match(/^!/i)) {
    // request('http://198.211.99.242:2199/api.php?xm=server.getstatus&f=json&a[username]=json&a[password]=secret', function (error, response, body) {http://198.211.99.242:8020/currentsong?sid=1
        // sonia.action(chan, 'Pokes '+from);
        var begin = message.match(/(Sonia: |!)/i)[1];
        message = message.match(/(?:Sonia: |!)(.*)/i)[1];
        if (message.match(/^s(?:ong| |$)/i)) {
            sonia.say(chan, 'Current Song: '+current.SHOUTCASTSERVER.SONGTITLE);
        } else if (message.match(/^l(?:isteners| |$)/i)) {
            sonia.say(chan, 'Listeners: '+current.SHOUTCASTSERVER.CURRENTLISTENERS);
        } else if (message.match(/^lo(?:gin| |$)/i) && message.match(/ (.*)/i)) {
            sonia.say(chan, "Last login by "+message.match(/ (.*)/i)[1]+": "+moment(db.getItem(message.match(/ (.*)/i)[1].substring(0,12))).fromNow());
        } else  if (message.match(/^help|command/i) || message == '?') {
            sonia.say(chan,
            'Commands: [s]ong, [l]isteners, [lo]gin, [h]ug, [p]oke, @add, [g]etdata, [n]ext, @[no]tify');
        } else if (message.match(/^no(?:tify| |$)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    notify = !notify;
                    sonia.say(chan, 'Notifications '+(notify?'on':'off'));
                } else {
                    console.log(info);
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });

        } else if (message.match(/^h(?:ug| |$)/i)) {
            sonia.action(chan, ' hugs '+from);
        } else if (message.match(/^p(?:oke| |$)/i) && message.match(/ (.*)/i)) {
            sonia.action(chan, ' pokes '+message.match(/ (.*)/i)[1]);
        } else if (message.match(/^a(?:dd| |$)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    db.setItem(current.SHOUTCASTSERVER.SONGTITLE+"", (message.match(/ (.*)/i)?message.match(/ (.*)/i)[1]:rem));
                    sonia.say(from, 'Set record for '+current.SHOUTCASTSERVER.SONGTITLE+' to '+db.getItem(current.SHOUTCASTSERVER.SONGTITLE));
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
        } else if (message.match(/^y(?:es, add it)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    db.setItem(current.SHOUTCASTSERVER.SONGTITLE+"", rem);
                    sonia.say(from, 'Set record for '+current.SHOUTCASTSERVER.SONGTITLE+' to '+db.getItem(current.SHOUTCASTSERVER.SONGTITLE));
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
        } else if (message.match(/^s(?:ay| |$)/i) && message.match(/ (.*)/i)) {
            sonia.whois(from, function (info) {
                if (info.channels.indexOf('@#SonicRadioboom') >= 0 || info.channels.indexOf('~#SonicRadioboom') >= 0 || info.channels.indexOf('%#SonicRadioboom') >= 0) {
                    sonia.say(chan, message.match(/ (.*)/i)[1]);
                } else {
                    sonia.say(from, 'You\'re not an OP, I don\'t trust you ...');
                }
            });
        } else if (message.match(/^g(?:etdata| |$)/i)) {
            var data = db.getItem((message.match(/ (.*)/i)?message.match(/ (.*)/i)[1]:current.SHOUTCASTSERVER.SONGTITLE)+"");
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
                        q: (message.match(/ (.*)/i)?message.match(/ (.*)/i)[1]:current.SHOUTCASTSERVER.SONGTITLE),
                        // order: 'rating',
                        part: 'snippet',
                        };
                          console.log(client);
                    client.youtube.search.list(params).withApiKey(key).execute(function (err, response) {
                        response.items.forEach(function (item,a,b) {
                            sonia.say(chan, from+': Does this help? '+current.SHOUTCASTSERVER.SONGTITLE+' might be http://www.youtube.com/watch?v='+item.id.videoId);
                            rem = 'http://www.youtube.com/watch?v='+item.id.videoId;
                            });
                    })});
            } else {
                sonia.say(chan, from+': Does this help? '+current.SHOUTCASTSERVER.SONGTITLE+' is '+data);
            }
        } else if (message.match(/^n(?:ext| |$)/i)) {
            googleapis.discover('calendar', 'v3').execute(function(err, client) {
                var moments = message.match(/ (.*)/i);
                if (moments) {
                    moments = moment(moments[1]);
                    moments = moments.isValid()?moments:moment();
                } else {
                    moments = moment();
                }
                var params = {
                      calendarId: 'sonicradioboom2013@gmail.com',
                      maxResults: 1,
                      timeMin: moments,
                      singleEvents: true,
                      orderBy: "startTime",
                      };
                client.calendar.events.list(params).withApiKey(key).execute(function (err, response) {
                    response.items.forEach(function (item,a,b) {sonia.say(chan, 'Next event starts '+item.summary+' '+moment(item.start.dateTime).fromNow());});
                })});
        } else if (message=='PLEASE QUIT NAO') {
            process.exit();
        } else if (begin!='!') {
            if (to!=config.botName) {
                sonia.say(chan, message+' to you, too, '+from);
            } else {
                sonia.say(from, message+' to you, too, '+from);
            }
        }
    }
});

setInterval(function() {
    request(ip+'stats?sid=1', function (error, response, body) {
        if (!error && response.statusCode == 200) {
            parseString(body, function (err, result) {
                if (notify && current && (JSON.stringify(current.SHOUTCASTSERVER.SONGTITLE) != JSON.stringify(result.SHOUTCASTSERVER.SONGTITLE))) {
                    sonia.say(chan, 'New Song: '+result.SHOUTCASTSERVER.SONGTITLE);
                }
                current = result;
            });
        }
    });
}, 1000);

sonia.addListener('join', function(channel, nick, message) {
    if (channel==chan && nick!=config.botName) {
        sonia.say(chan, 'Hello '+nick+"!");
        var record = db.getItem(nick.substring(0,12));
        if (record) {
            sonia.say(chan, 'Welcome back! Last login: '+moment(record).fromNow()+".");
            
        } else {
            sonia.say(chan, 'Haven\'t seen you around before, care to introduce yourself?');
            sonia.say(nick, 'Welcome to #'+chan+'! The radio stream is available at http://thunderlane.ponyvillelive.com/~srb/.');
        }
        db.setItem(nick.substring(0,12), moment());
    }
});

sonia.addListener('quit', function(channel, nick, message) {
    db.setItem(nick.substring(0,12), moment());
});

sonia.addListener('error', function(message) {
    console.log('error: ', message);
});
