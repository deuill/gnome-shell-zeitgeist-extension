const Main = imports.ui.main;
const Lang = imports.lang;
const AppFavorites = imports.ui.appFavorites;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Semantic = Me.imports.semantic;
const Zeitgeist = Me.imports.zeitgeist;

let singalId = null;
let appSystem = null;
let recentApps = null;
let appFav = null;
let favs = null;
let isDirty = true;
let signalId1 = null;
let signalId2 = null;
let signalId3 = null;
let signalId4 = null;
let signalId5 = null;

/* redisplayDash - add in necessary apps and redisplay dash */
function populateDash (events) {
    var actors = [];
    favs = [];
    var allApps = appSystem.get_running();
    var favApps  = appFav._getIds();
    for (var i = 0; i < allApps.length; i++) {
        favs.push(allApps[i].get_id());
    }
    for (var i = 0; i < favApps.length; i++) {
        favs.push(favApps[i]);
    }
    var blackList = [];
    blackList.push("gnome-shell.desktop");
    blackList.push("synapse.desktop");
    for (var i = 0; i < events.length; i++) {
        if (events[i].actor.indexOf("application://") > -1) {
            var actor = events[i].actor.replace("application://", "").trim();
            if (favs.indexOf(actor) == -1 && actors.indexOf(actor) == -1 &&
                blackList.indexOf(actor) == -1) {
                actors.push(actor);
            }
            for (var j = 0; j < events[i].subjects.length; j++) {
                var subject = events[i].subjects[j].uri;
                if (subject.indexOf("application://") > -1) {
                    actor = subject.replace("application://", "").trim();
                    if (favs.indexOf(actor) == -1 && actors.indexOf(actor) == -1 &&
                        blackList.indexOf(actor) == -1) {
                        actors.push(actor);
                    }
                }
            }
        }
    }
    for (var i = 0; i < recentApps.length; i++) {
        Main.overview._dash._box.remove_child(recentApps[i]);
        recentApps[i].destroy();
    }
    recentApps = [];
    Main.overview._dash._redisplay();
    for (var i = 0; i < actors.length; i++) {
        var appId = actors[i];
        var app = appSystem.lookup_app(actors[i]);
        var item = { app: app,
                    item: Main.overview._dash._createAppItem(app), pos: -1 };
        Main.overview._dash._box.insert_child_at_index(item.item.actor, -1);
        recentApps.push(item.item.actor);
        if (i  == 1) break;
    }
    Main.overview._dash._adjustIconSize();
    Main.overview._dash._box.show_all();
    isDirty = false;
}

/* redisplayDash - default if nothing's changed; do Dash's _redisplay and put our own apps back in */
function redisplayDash()
{
    for (var i = 0; i < recentApps.length; i++) {
        Main.overview._dash._box.remove_child(recentApps[i]);
    }
    Main.overview._dash._redisplay();
    for (var i = 0; i < recentApps.length; i++) {
        var actor = recentApps[i];
        Main.overview._dash._box.insert_child_at_index(actor, -1);
        recentApps.push(actor);
        if (i  == 1) break;
    }
    Main.overview._dash._adjustIconSize();
    Main.overview._dash._box.show_all();
}

function prepareQuery () {
    var today = new Date()
    var now = today.getTime()
    var offset = -today.getTimezoneOffset()*60*1000
    now = now - offset;

    // If isDirty, get result from Zeitgeist, otherwise simply redisplay
    if (isDirty == true) {
        Zeitgeist.findEvents([now - 60*60*1000, Zeitgeist.MAX_TIMESTAMP],
                             [],
                             Zeitgeist.StorageState.ANY,
                             20,
                             Zeitgeist.ResultType.MOST_RECENT_ACTOR,
                             populateDash);
    } else {
        redisplayDash();
    }
}

function enable () {
    recentApps = [];
    appFav = AppFavorites.getAppFavorites();
    favs = appFav._getIds();
    appSystem = Main.overview._dash._appSystem;

    isDirty = true;
    /* Connect signals where we should set isDirty to true */
    signalId2 = appSystem.connect_after('installed-changed', Lang.bind(this,
        function () {isDirty = true; prepareQuery();}));
    signalId3 = appFav.connect('changed', Lang.bind(this,
        function () {
            favs = appFav._getIds();
            isDirty = true; prepareQuery();}));
    signalId4 = appSystem.connect_after('app-state-changed', Lang.bind(this,
        function () {isDirty = true; prepareQuery();}));

    /* Take over Dash's workId - is this morally sound? It seems tidier in that we formally enter the queueRedisplay
     * chain, and whatever way we go about it, we must decide how the _dash._redisplay happens anyway */
    this._dash_workId = Main.overview._dash._workId;
    Main.overview._dash._workId = Main.initializeDeferredWork(Main.overview._dash._box, Lang.bind(this, prepareQuery));
}

function disable() {
    Main.overview.disconnect(signalId1);
    appSystem.disconnect(signalId2);
    appFav.disconnect(signalId3);
    appSystem.disconnect(signalId4);
    Main.overview._dash.disconnect(signalId5);

    // Give Dash its workId back
    Main.overview._dash._workId = this._dash_workId;

    for (var i = 0; i < recentApps.length; i++) {
        Main.overview._dash._box.remove_child(recentApps[i]);
        recentApps[i].destroy();
    }
    Main.overview._dash._adjustIconSize();
    Main.overview._dash._box.show_all();
    signalId2 = null;
    signalId3 = null;
    signalId4 = null;
    appFav = null;
}

function init() {
}
