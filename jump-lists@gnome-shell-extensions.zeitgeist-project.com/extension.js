
/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

/* JournalDisplay object to show a timeline of the user's past activities
 *
 * This file exports a JournalDisplay object, which carries a JournalDisplay.actor.
 * This is a view of the user's past activities, shown as a timeline, and
 * whose data comes from what is logged in the Zeitgeist service.
 */

const Clutter = imports.gi.Clutter;
const Config = imports.misc.config;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Shell = imports.gi.Shell;
const Lang = imports.lang;
const Signals = imports.signals;
const St = imports.gi.St;
const Mainloop = imports.mainloop;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const PopupMenu = imports.ui.popupMenu;
const AppDisplay = imports.ui.appDisplay;
const Main = imports.ui.main;
const Util = imports.misc.util;

const DocInfo = Me.imports.docInfo;
const Semantic = Me.imports.semantic;
const Zeitgeist = Me.imports.zeitgeist;

const Jumplist = Me.imports.jumplist_hack;
let jumplist = new Jumplist.Jumplist();

function setJumplist (appIconMenu) {
    var eventTemplate = new Zeitgeist.Event('', '', "application://" + appIconMenu._source.app.get_id(), [], []);
    
    function appendJumplist (events) {
    
        let fetchedUris = [];
        let hasJumplist = false;

        function appendJumplistItem (event, type) {
            let info = new DocInfo.ZeitgeistItemInfo(event);
            let item = new PopupMenu.PopupMenuItem(info.name);

            item.iconbox = new St.BoxLayout({style_class: 'popup-menu-icons'});
            item.actor.add(item.iconbox, {expand: true, x_fill: false, x_align: St.Align.END});

            item.icon = new St.Icon({icon_name: type, style_class: 'popup-menu-icon'});
            item.iconbox.add_actor(item.icon);

            appIconMenu.addMenuItem(item);
            item.connect('activate', Lang.bind(appIconMenu, function () {
                let app = Shell.AppSystem.get_default().lookup_app(appIconMenu._source.app.get_id());
                let timestamp = global.display.get_current_time_roundtrip();
                app.get_app_info().launch_uris([info.uri], global.create_app_launch_context(timestamp, -1));
                Main.overview.hide();
            }));
        }

        function appendEvents(events2, count, type) {
            if (count == null) {
                count = 3;
            }
            if (type == null) {
                type = "emblem-favorite-symbolic";
            }
            let j = 0;

            if (events.length > 0) {
                for (let i in events) {
                    let uri = events[i].subjects[0].uri.replace('file://', '');
                    uri = uri.replace(/\%20/g, ' '); // FIXME: properly unescape, or get the display name otherwise
                    if (fetchedUris.indexOf(uri) == -1 &&
                        (GLib.file_test(uri, GLib.FileTest.EXISTS) || appIconMenu._source.app.get_id() == "tomboy.desktop")) {
                        if (!hasJumplist) {
                            appIconMenu._appendSeparator();
                            hasJumplist = true;
                        }
                        appendJumplistItem(events[i], type);
                        fetchedUris.push(uri);
                        j++;
                        if (j >= count)
                            break;
                    }
                }
            }
        }
        
        appendEvents.call(this, events, 4, "document-open-recent-symbolic");
        Zeitgeist.findEvents([new Date().getTime() - 86400000*90, Zeitgeist.MAX_TIMESTAMP],
                             [eventTemplate],
                             Zeitgeist.StorageState.ANY,
                             100,
                             Zeitgeist.ResultType.MOST_POPULAR_SUBJECTS,
                             Lang.bind(appIconMenu, appendEvents));
        
    }
    
    Zeitgeist.findEvents([new Date().getTime() - 86400000*90, Zeitgeist.MAX_TIMESTAMP],
                             [eventTemplate],
                             Zeitgeist.StorageState.ANY,
                             100,
                             Zeitgeist.ResultType.MOST_RECENT_SUBJECTS,
                             Lang.bind(appIconMenu, appendJumplist));
}

function init(metadata) {
    imports.gettext.bindtextdomain('gnome-shell-extensions', Config.LOCALEDIR);
}

function enable() {
    jumplist.add(setJumplist);
}

function disable() {
    jumplist.remove(setJumplist);
}
