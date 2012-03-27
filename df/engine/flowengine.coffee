# !!! keep it as simple as possible

class FlowBase

	constructor: ->
		console.log("created #{@}")
		
	nodes: {}
	actors: {}
		
	# By default, Underscore uses **ERB**-style template delimiters, change the
	# following template settings to use alternative delimiters.
	templateSettings: {
	  start:        '<%'
	  end:          '%>'
	  interpolate:  /<%=(.+?)%>/g
	}

	# JavaScript templating a-la **ERB**, pilfered from John Resig's
	# *Secrets of the JavaScript Ninja*, page 83.
	# Single-quote fix from Rick Strahl.
	# With alterations for arbitrary delimiters, and to preserve whitespace.
	template: (str, data) ->
	  c = @templateSettings
	  endMatch = new RegExp("'(?=[^"+c.end.substr(0, 1)+"]*"+escapeRegExp(c.end)+")","g")
	  fn = new Function 'obj',
	    'var p=[],print=function(){p.push.apply(p,arguments);};' +
	    'with(obj||{}){p.push(\'' +
	    str.replace(/\r/g, '\\r')
	       .replace(/\n/g, '\\n')
	       .replace(/\t/g, '\\t')
	       .replace(endMatch,"✄")
	       .split("'").join("\\'")
	       .split("✄").join("'")
	       .replace(c.interpolate, "',$1,'")
	       .split(c.start).join("');")
	       .split(c.end).join("p.push('") +
	       "');}return p.join('');"
	  if data then fn(data) else fn
		  		
	evalString: (string, context) ->
		return string(context) if typeof string is "function"
		@template(string, context)

class FlowActor extends FlowBase

	constructor: (@id, @name) ->
		FlowActor::actors[@id] = @
		super()
		
	toString: ->
		"<FlowActor: #{@id}>"

class FlowSentence extends FlowBase

	constructor: (@actor, @sentence) ->
		super()

	toString: ->
		"<FlowSentence: #{@actor}, #{@sentence}>"

class FlowOption extends FlowBase

	constructor: (@text, @action, @predicate) ->
		super()

	toString: ->
		"<FlowOption: #{@text}>"

	execute: (context) ->
		return @action if typeof @action is "string"
		@action.call context
	
	isValid: (context) ->
		return yes unless @predicate?
		@predicate.call(context)

class FlowNode extends FlowBase
	
	constructor: (@id) ->
		@sentences = []
		@options = []
		FlowNode::nodes[@id] = @
		super()

	toString: ->
		"<FlowNode: #{@id}>"
		
	addSentence: (sentence) ->
		@sentences.push(sentence)
		@
		
	addOption: (option) ->
		@options.push(option)
		@
		
	getOptionsList: (context) ->
		list = []
		for option in @options
			list.push([option.text, option.isValid(context)])
		list
		
class FlowState extends FlowBase

	constructor: (@node, @context) ->
		super()
		
	setContext: (@context) ->
	
	toString: ->
		"<FlowState: #{@node}>"

	# return array of options
	options: ->
		@node.options
	
	getOptionsList: (context) ->
		@node.getOptionsList(context)
		
	select: (option) ->
		o = @node.options[option]
		nodeId = o.execute @
		node = FlowState::nodes[nodeId]
		# toto warning about failed lookup
		state = new FlowState(node, @context)

class FlowGraph extends FlowState

	constructor: (@node, @context) ->
		super

	toString: ->
		"<FlowGraph: #{@node}>"

################################################

root = exports ? this
root.FlowBase = FlowBase
root.FlowActor = FlowActor
root.FlowSentence = FlowSentence
root.FlowOption = FlowOption
root.FlowNode = FlowNode
root.FlowGraph = FlowGraph