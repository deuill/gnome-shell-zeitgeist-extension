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
	existing_thumb = this.thumbnail_factory.lookup(this.uri, mtime);

	/* If not, make one */
	if (existing_thumb === null) {
		/* Can we make one? */
		if (this.thumbnail_factory.can_thumbnail(this.uri, this.subject.mimetype, null))
		{
			/* Allegedly. If it doesn't work, make a failed thumbnail, if it does save the new one */
			pixbuf = this.thumbnail_factory.generate_thumbnail(this.uri, this.subject.mimetype, mtime);
			if (pixbuf === null)
			{
				pixbuf = this.thumbnail_factory.create_failed_thumbnail(this.uri, mtime);
			} else {
				this.thumbnail_factory.save_thumbnail(pixbuf, this.uri, mtime);
			}
		} else {
			/* If we can't make a thumbnail, choose a generic example */
			icon = St.TextureCache.get_default().load_gicon(null, Gio.content_type_get_icon(this.subject.mimetype), size);
		}
	} else {
		/* Don't need to bother with this pixbuf malarky if we've got the filename */
		icon = new Clutter.Texture({filename: existing_thumb});
	}

	/* If we ended up with a pixbuf, turn it into an icon */
	if (icon === null)
	{
		icon = new Clutter.Texture();
		let scalingFactor = size / Math.max(pixbuf.get_width(), pixbuf.get_height());
		icon.set_width(Math.ceil(pixbuf.get_width() * scalingFactor));
		icon.set_height(Math.ceil(pixbuf.get_height() * scalingFactor));
		icon.set_from_rgb_data(pixbuf.get_pixels(), pixbuf.has_alpha, pixbuf.get_width(), pixbuf.get_height(), pixbuf.get_rowstride(), 4, 0, null);
	}
	
        return icon;
        // FIXME: "FM: We should consider caching icons" - would sharing the thumbnail_factory do the job?
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
