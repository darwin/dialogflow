exports.Config = {
    workspace: "../workspace",
	plugins: [
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
	    //"ext/quickwatch/quickwatch",
	    "ext/quicksearch/quicksearch",
	    "ext/gotoline/gotoline",
	    // "ext/html/html",
	    // "ext/help/help",
	    //"ext/ftp/ftp",
	    "ext/code/code",
	    "ext/imgview/imgview",
	    //"ext/preview/preview",
	    "ext/extmgr/extmgr",
	    //"ext/run/run", //Add location rule
	    // "ext/runpanel/runpanel", //Add location rule
	    // "ext/debugger/debugger", //Add location rule
	    // "ext/noderunner/noderunner", //Add location rule
	    // "ext/console/console",
	    "ext/tabbehaviors/tabbehaviors",
	    "ext/tabsessions/tabsessions",
	    "ext/keybindings/keybindings",
	    "ext/keybindings_default/keybindings_default",
	    // "ext/watcher/watcher",
	    "ext/dragdrop/dragdrop",
	    // "ext/beautify/beautify",
	    "ext/offline/offline",
	    "ext/stripws/stripws",
	    // "ext/testpanel/testpanel",
	    // "ext/nodeunit/nodeunit",
	    // "ext/zen/zen",
	    //"ext/codecomplete/codecomplete",
	    //"ext/autosave/autosave",
	    // "ext/vim/vim",
	    // "ext/guidedtour/guidedtour",
	    // "ext/quickstart/quickstart",
	    //"ext/jslanguage/jslanguage",
	    // "ext/autotest/autotest",
	    "ext/tabsessions/tabsessions"
	    //"ext/acebugs/acebugs"
	],
    ip: "127.0.0.1",
    port: 3000,
    gaeLocalPath: ".",
};