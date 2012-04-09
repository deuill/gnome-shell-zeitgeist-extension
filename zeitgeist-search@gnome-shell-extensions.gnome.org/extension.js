
/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */
        
/* JournalDisplay object to show a timeline of the user's past activities
 *
 * This file exports a JournalDisplay object, which carries a JournalDisplay.actor.
 * This is a view of the user's past activities, shown as a timeline, and
 * whose data comes from what is logged in the Zeitgeist service.
 */

/* Style classes used here:
 *
 * journal - The main journal layout
 *     item-spacing - Horizontal space between items in the journal view
 *     row-spacing - Vertical space between rows in the journal view
 *
 * journal-heading - Heading labels for date blocks inside the journal
 *
 * .journal-item .overview-icon - Items in the journal, used to represent files/documents/etc.
 * You can style "icon-size", "font-size", etc. in them; the hierarchy for each item is
 * is StButton -> IconGrid.BaseIcon
 */

const Clutter = imports.gi.Clutter;
const GLib = imports.gi.GLib;
const Pango = imports.gi.Pango;
const Shell = imports.gi.Shell;
const Lang = imports.lang;
const Signals = imports.signals;
const St = imports.gi.St;
const Mainloop = imports.mainloop;
const Gettext = imports.gettext.domain('gnome-shell');
const _ = Gettext.gettext;
const C_ = Gettext.pgettext;

const ContactDisplay = imports.ui.contactDisplay;
const PlaceDisplay = imports.ui.placeDisplay;
const AppDisplay = imports.ui.appDisplay;

// Dearly departed...
// https://bugzilla.gnome.org/show_bug.cgi?id=670150
//const DocDisplay = imports.ui.docDisplay;

const Me = imports.misc.extensionUtils.getCurrentExtension();

const Main = imports.ui.main;
const Util = imports.misc.util;
const DocInfo = Me.imports.docInfo;
const Semantic = Me.imports.semantic;
const Zeitgeist = Me.imports.zeitgeist;
const ZeitgeistSearch = Me.imports.zeitgeistSearch;

function init(metadata)
{
}

function enable() {
    
    var searchProviders = Main.overview._viewSelector._searchTab._searchSystem._providers;
    
    for (var i = 0; i < searchProviders.length; i++) {
        log(searchProviders[i].title);
        Main.overview._viewSelector._searchTab.removeSearchProvider(searchProviders[i]);
        i--;
    }
    Main.overview._viewSelector.addSearchProvider(new ZeitgeistSearch.AppAsyncSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new ZeitgeistSearch.SettingsAsyncSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new PlaceDisplay.PlaceSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new ZeitgeistSearch.DocumentsAsyncSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new ZeitgeistSearch.VideosAsyncSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new ZeitgeistSearch.MusicAsyncSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new ZeitgeistSearch.PicturesAsyncSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new ZeitgeistSearch.OtherAsyncSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new ContactDisplay.ContactSearchProvider());
}

function disable() {
    var searchProviders = Main.overview._viewSelector._searchTab._searchSystem._providers;
    
    for (var i = 0; i < searchProviders.length; i++) {
        log(searchProviders[i].title);
        Main.overview._viewSelector._searchTab.removeSearchProvider(searchProviders[i]);
        i--;
    }
    Main.overview._viewSelector.addSearchProvider(new AppDisplay.AppSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new AppDisplay.SettingsSearchProvider());
    //Main.overview._viewSelector.addSearchProvider(new DocDisplay.DocSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new PlaceDisplay.PlaceSearchProvider());
    Main.overview._viewSelector.addSearchProvider(new ContactDisplay.ContactSearchProvider());
}

