/* -*- mode: js2; js2-basic-offset: 4; indent-tabs-mode: nil -*- */

const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GnomeDesktop = imports.gi.GnomeDesktop;
const St = imports.gi.St;
const Search = imports.ui.search;

function ZeitgeistItemInfo(event) {
    this._init(event);
}

ZeitgeistItemInfo.prototype = {
    _init : function(event) {
        this.event = event;
        this.subject = event.subjects[0];
        this.timestamp = event.timestamp;
        this.name = this.subject.text;
        this._lowerName = this.name.toLowerCase();
        this.uri = this.subject.uri;
        if (this.event.actor == "application://banshee.desktop")
            this.subject.mimetype = "audio/mpeg";
        this.mimeType = this.subject.mimetype;
        this.interpretation = this.subject.interpretation;

        // FIXME: It would seem slightly more efficient to have this shared, but to minimize structural changes in this commit, I've just left it here for the moment.
        this.thumbnail_factory = new GnomeDesktop.DesktopThumbnailFactory();
    },

    createIcon : function(size) {
  let icon = null;
  let pixbuf = null;
  let mtimeval = new GLib.TimeVal();
        Gio.file_new_for_uri(this.uri).query_info("time::modified", Gio.FileQueryInfoFlags.NONE, null).get_modification_time(mtimeval);
  let mtime = mtimeval.tv_sec;

  /* Based on shell-texture-cache.c : gnome-shell */

  /* Check whether a thumb has been made */
  let existing_thumb = this.thumbnail_factory.lookup(this.uri, mtime);

  /* If we can't make a thumbnail, choose a generic example */
  if (existing_thumb === null) {
    icon = St.TextureCache.get_default().load_gicon(null, Gio.content_type_get_icon(this.subject.mimetype), size);
  } else {
    /* Don't need to bother with this pixbuf malarky if we've got the filename */
    icon = new Clutter.Texture({filename: existing_thumb});
    icon.set_keep_aspect_ratio(true);
  }
  
        return icon;
        // FIXME: "FM: We should consider caching icons" - is this sufficient for what you mean?
    },

    launch : function() {
        Gio.app_info_launch_default_for_uri(this.uri,
                                            global.create_app_launch_context());
    },

    matchTerms: function(terms) {
        let mtype = Search.MatchType.NONE;
        for (let i = 0; i < terms.length; i++) {
            let term = terms[i];
            let idx = this._lowerName.indexOf(term);
            if (idx == 0) {
                mtype = Search.MatchType.PREFIX;
            } else if (idx > 0) {
                if (mtype == Search.MatchType.NONE)
                    mtype = Search.MatchType.SUBSTRING;
            } else {
                return Search.MatchType.NONE;
            }
        }
        return mtype;
    },
};
