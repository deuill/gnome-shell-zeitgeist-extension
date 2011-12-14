const Panel = imports.ui.panel;
const Main = imports.ui.main;
const ViewSelector = imports.ui.viewSelector;
const Clutter = imports.gi.Clutter;
const Signals = imports.signals;
const Lang = imports.lang;
const Shell = imports.gi.Shell;
const St = imports.gi.St;
const IconGrid = imports.ui.iconGrid;
const Dash = imports.ui.dash;
const Extension = imports.ui.extensionSystem.extensions["hugo@gnome-shell-extensions.zeitgeist-project.com"];
const AppLauncher = Extension.appLauncher;

let tabBar = null;
let tabBox = null;
let searchArea = null;
let appButton = null;
let signalId1 = null;
let signalId2 = null;

function _allocateTabBar (container, box, flags) {
    let allocWidth = box.x2 - box.x1;
    let allocHeight = box.y2 - box.y1;

    let [searchMinWidth, searchNatWidth] = Main.overview._viewSelector._searchArea.get_preferred_width(-1);
    let childBox = new Clutter.ActorBox();
    childBox.y1 = 0;
    childBox.y2 = allocHeight;
    
    var width = Main.layoutManager.monitors[Main.layoutManager.primaryIndex].width;
    var offset = width - allocWidth;
    
    childBox.x1 = allocWidth/2 - searchNatWidth/2 - offset/2;
    childBox.x2 = allocWidth/2 + searchNatWidth/2 - offset/2;
    
    Main.overview._viewSelector._searchArea.allocate(childBox, flags);
    Main.overview._dash._redisplay();
    Main.overview._viewSelector._tabBox.hide();
}

function enable() {
    tabBar = Main.overview._viewSelector._tabBar;
    tabBox = Main.overview._viewSelector._tabBox;
    searchArea = Main.overview._viewSelector._searchArea;
    appButton = new AppLauncher.AppLauncher();
    signalId1 = tabBar.connect('allocate', this._allocateTabBar);
    Main.overview._dash._box.insert_actor(appButton.actor, -1);
    signalId2 = Main.overview.connect('showing', Lang.bind(this, function () { 
        appButton.setActive(false);
    }));
    Main.overview._dash.iconSize = -2;
    Main.overview._dash._adjustIconSize();
}

function disable() {
    tabBar.disconnect(signalId1);
    Main.overview.disconnect(signalId2);
    Main.overview._viewSelector._tabBox.show();
    Main.overview._dash._box.remove_actor(appButton.actor);
    appButton.actor.destroy();
    appButton = null;
}

function init() {
}
