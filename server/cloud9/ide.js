/**
 * @copyright 2010, Ajax.org Services B.V.
 * @license GPLv3 <http://www.gnu.org/licenses/gpl.txt>
 */
var jsDAV = require("jsdav");
var DavPermission = require("./dav/permission");
var Async = require("asyncjs");
var User = require("./user");
var fs = require("fs");
var sys = require("sys");
var Url = require("url");
var template = require("./template");
var Workspace = require("cloud9/workspace");
var EventEmitter = require("events").EventEmitter;
var util = require("./util");

var Ide = module.exports = function(options, httpServer, exts, socket) {
    EventEmitter.call(this);

    this.httpServer = httpServer;
    this.socket = socket;

    this.workspaceDir = Async.abspath(options.workspaceDir).replace(/\/+$/, "");
    var baseUrl = (options.baseUrl || "").replace(/\/+$/, "");
    var staticUrl = options.staticUrl || "/static";
    var requirejsConfig = options.requirejsConfig || {
        baseUrl: "/static/",
        paths: {
            "ace": staticUrl + "/support/ace/lib/ace",
            "debug": staticUrl + "/support/lib-v8debug/lib/v8debug",
            "treehugger": staticUrl + "/support/treehugger/lib/treehugger"
        },
        waitSeconds: 30
    };
	
    this.options = {
        workspaceDir: this.workspaceDir,
        mountDir: options.mountDir || this.workspaceDir,
        socketIoUrl: options.socketIoUrl || "socket.io",
        davPrefix: options.davPrefix || (baseUrl + "/workspace"),
        davPlugins: options.davPlugins || exports.DEFAULT_DAVPLUGINS,
        baseUrl: baseUrl,
        debug: options.debug === true,
        staticUrl: staticUrl,
        workspaceId: options.workspaceId || "ide",
        context: options.context || null,
        db: options.db || null,
        plugins: options.plugins || Ide.DEFAULT_PLUGINS,
        requirejsConfig: requirejsConfig,
        offlineManifest: options.offlineManifest || "",
        projectName: options.projectName || this.workspaceDir.split("/").pop(),
        version: options.version,
        extra: options.extra,
        remote: options.remote
    };

    this.$users = {};
    this.nodeCmd = process.argv[0];

    var davOptions = {
        node: this.options.mountDir,
        mount: this.options.davPrefix,
        plugins: this.options.davPlugins,
        server: this.httpServer,
        standalone: false
    };

    if (options.remote)
        util.extend(davOptions, options.remote);
    else
        davOptions.path = this.options.mountDir;

    this.davServer = jsDAV.mount(davOptions);
    this.davInited = false;

    this.workspace = new Workspace({ ide: this });

    this.workspace.createPlugins(exts);
    var statePlugin = this.workspace.getExt("state");
    if (statePlugin) {
        statePlugin.on("statechange", function(state) {
            state.workspaceDir = this.workspace.workspaceDir;
            state.davPrefix =  this.ide.davPrefix;
        });
    }
};

sys.inherits(Ide, EventEmitter);

Ide.DEFAULT_PLUGINS = [
    "ext/filesystem/filesystem",
    "ext/settings/settings",
    "ext/editors/editors",
    //"ext/connect/connect",
    "ext/themes/themes",
    "ext/themes_default/themes_default",
    "ext/panels/panels",
    "ext/dockpanel/dockpanel",
    "ext/openfiles/openfiles",
    "ext/tree/tree",
    "ext/save/save",
    "ext/recentfiles/recentfiles",
    "ext/gotofile/gotofile",
    "ext/newresource/newresource",
    "ext/undo/undo",
    "ext/clipboard/clipboard",
    "ext/searchinfiles/searchinfiles",
    "ext/searchreplace/searchreplace",
    "ext/quickwatch/quickwatch",
    "ext/quicksearch/quicksearch",
    "ext/gotoline/gotoline",
    "ext/html/html",
    "ext/help/help",
    //"ext/ftp/ftp",
    "ext/code/code",
    "ext/statusbar/statusbar",
    "ext/imgview/imgview",
    //"ext/preview/preview",
    "ext/extmgr/extmgr",
    //"ext/run/run", //Add location rule
    "ext/runpanel/runpanel", //Add location rule
    "ext/debugger/debugger", //Add location rule
    "ext/noderunner/noderunner", //Add location rule
    "ext/console/console",
    "ext/consolehints/consolehints",
    "ext/tabbehaviors/tabbehaviors",
    "ext/tabsessions/tabsessions",
    "ext/keybindings/keybindings",
    "ext/keybindings_default/keybindings_default",
    "ext/watcher/watcher",
    "ext/dragdrop/dragdrop",
    "ext/beautify/beautify",
    "ext/offline/offline",
    "ext/stripws/stripws",
    "ext/testpanel/testpanel",
    "ext/nodeunit/nodeunit",
    "ext/zen/zen",
    "ext/codecomplete/codecomplete",
    //"ext/autosave/autosave",
    "ext/vim/vim",
    "ext/guidedtour/guidedtour",
    "ext/quickstart/quickstart",
    "ext/jslanguage/jslanguage",
    "ext/autotest/autotest",
    "ext/tabsessions/tabsessions",
    "ext/closeconfirmation/closeconfirmation",
    "ext/codetools/codetools",
    "ext/colorpicker/colorpicker"
    //"ext/acebugs/acebugs"
];

exports.DEFAULT_DAVPLUGINS = ["auth", "codesearch", "filelist", "filesearch"];

(function () {

    this.handle = function(req, res, next) {
        var path = Url.parse(req.url).pathname;

        this.indexRe = this.indexRe || new RegExp("^" + util.escapeRegExp(this.options.baseUrl) + "(?:\\/(?:index.html?)?)?$");
        this.reconnectRe = this.reconnectRe || new RegExp("^" + util.escapeRegExp(this.options.baseUrl) + "\\/\\$reconnect$");
        this.workspaceRe = this.workspaceRe || new RegExp("^" + util.escapeRegExp(this.options.davPrefix) + "(\\/|$)");

        if (path.match(this.indexRe)) {
            if (req.method !== "GET")
                return next();
            this.$serveIndex(req, res, next);
        }
        else if (path.match(this.reconnectRe)) {
            if (req.method !== "GET")
                return next();
            res.writeHead(200);
            res.end(req.sessionID);
        }
        else if (path.match(this.workspaceRe)) {
            if (!this.davInited) {
                if (process.platform == "sunos") {
                    this.davServer.plugins["codesearch"].GREP_CMD = __dirname+"/../../support/gnu-builds/grep-sunos";
                    this.davServer.plugins["filesearch"].FIND_CMD = __dirname+"/../../support/gnu-builds/find-sunos";
                    this.davServer.plugins["filelist"].FIND_CMD = __dirname+"/../../support/gnu-builds/find-sunos";
                }
                this.davServer.plugins["permission"] = DavPermission;
                this.davInited = true;
                this.emit("configureDav", this.davServer);
            }
            this.davServer.permissions = this.getPermissions(req);
            this.davServer.exec(req, res);
        } else {
            next();
        }
    };

    this.$serveIndex = function(req, res, next) {
        var plugin, _self = this;
        fs.readFile(__dirname + "/view/ide.tmpl.html", "utf8", function(err, index) {
            if (err)
                return next(err);

            res.writeHead(200, {
                "cache-control": "no-transform",
                "Content-Type": "text/html"
            });

            var permissions = _self.getPermissions(req);
            var plugins = util.arrayToMap(_self.options.plugins);

            var client_exclude = util.arrayToMap(permissions.client_exclude.split("|"));
            for (plugin in client_exclude)
                delete plugins[plugin];

            var client_include = util.arrayToMap((permissions.client_include || "").split("|"));
            for (plugin in client_include)
                if (plugin)
                    plugins[plugin] = 1;

            var staticUrl = _self.options.staticUrl;
            var aceScripts = '<script type="text/javascript" data-ace-base="/static/js/worker" src="' + staticUrl + '/support/ace/build/src/ace.js"></script>\n';

            var replacements = {
                davPrefix: _self.options.davPrefix,
                workspaceDir: _self.options.workspaceDir,
                debug: _self.options.debug,
                staticUrl: staticUrl,
                socketIoUrl: _self.options.socketIoUrl,
                sessionId: req.sessionID, // set by connect
                workspaceId: _self.options.workspaceId,
                plugins: Object.keys(plugins),
                readonly: (permissions.dav !== "rw"),
                requirejsConfig: _self.options.requirejsConfig,
                settingsXml: "",
                offlineManifest: _self.options.offlineManifest,
                scripts: _self.options.debug ? "" : aceScripts,
                projectName: _self.options.projectName,
                version: _self.options.version
            };

            var settingsPlugin = _self.workspace.getExt("settings");
            var user = _self.getUser(req);
            if (!settingsPlugin || !user) {
                index = template.fill(index, replacements);
                res.end(index);
            }
            else {
                settingsPlugin.loadSettings(user, function(err, settings) {
                    replacements.settingsXml = err || !settings ? "defaults" : settings.replace(/]]>/g, '&#093;&#093;&gt;');
                    index = template.fill(index, replacements);
                    res.end(index);
                });
            }
        });
    };

    this.addUser = function(username, permissions, userData) {
        var user = this.$users[username];
        if (user) {
            user.setPermissions(permissions);
        }
        else {
            user = this.$users[username] = new User(username, permissions, userData);

            var _self = this;
            user.on("message", function(msg) {
                if(_self.$users[msg.user.uid]) {
                    _self.$users[msg.user.uid].last_message_time = new Date().getTime();
                }
                _self.onUserMessage(msg.user, msg.message, msg.client);
            });
            user.on("disconnectClient", function(msg) {
                _self.workspace.execHook("disconnect", msg.user, msg.client);
            });
            user.on("disconnectUser", function(user) {
                console.log("Running user disconnect timer...");
                _self.davServer.unmount();

                setTimeout(function() {
                    var now = new Date().getTime();
                    if ((now - user.last_message_time) > 10000) {
                        console.log("User fully disconnected", username);
                        _self.removeUser(user);
                    }
                }, 10000);
            });

            this.onUserCountChange();
            this.emit("userJoin", user);
        }
    };

    this.getUser = function(req) {
        var uid = req.session.uid;
        if (!uid || !this.$users[uid])
            return null;
        else
            return this.$users[uid];
    };

    this.removeUser = function(user) {
        if (!this.$users[user.uid])
            return;

        delete this.$users[user.uid];
        this.onUserCountChange();
        this.emit("userLeave", user);
    };

    this.getPermissions = function(req) {
        var user = this.getUser(req);
        if (!user)
            return User.VISITOR_PERMISSIONS;
        else
            return user.getPermissions();
    };

    this.hasUser = function(username) {
        return !!this.$users[username];
    };

    this.addClientConnection = function(username, client, message) {
        var user = this.$users[username];
        if (!user)
            return this.workspace.error("No session for user " + username, 401, message, client);

        user.addClientConnection(client, message);
    };

    this.onUserMessage = function(user, message, client) {
        this.workspace.execHook("command", user, message, client);
    };

    this.onUserCountChange = function() {
        this.emit("userCountChange", Object.keys(this.$users).length);

        // TODO remove
        this.emit("clientCountChange", Object.keys(this.$users).length);
    };

    this.broadcast = function(msg, scope) {
        try {
            // TODO check permissions
            for (var username in this.$users) {
                var user = this.$users[username];
                user.broadcast(msg, scope);
            }
        }
        catch (e) {
            var ex = new Error("Stack overflow just happened");
            ex.original = e;
            throw ex;
        }
    };

    this.sendToUser = function(username, msg) {
        //for (var u in this.$users)
        //    console.log("IDE USER", this.$users[u].uid, this.$users[u].clients);
        this.$users[username] && this.$users[username].broadcast(msg);
    };

    this.dispose = function(callback) {
        this.workspace.dispose(callback);
    };
}).call(Ide.prototype);

