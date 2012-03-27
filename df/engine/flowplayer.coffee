state = {
    counter: 0
    context: {}
}

getTree = (nodeId, level) ->
    state.counter++;
    [nodeId] = nodeId.split "#"
    [node, option] = nodeId.split ":"
    flowNode = FlowBase::nodes[node]
    if option
        newFlowNodeId = flowNode.options[option].execute(state.context)
        newFlowNode = FlowBase::nodes[newFlowNodeId ]
        tree = getTree(newFlowNode.id, 1)
        return {
            id: nodeId
            name: nodeId
            children: [
                id: newFlowNode.id+"#"+state.counter
                name: newFlowNode.id
                data: {}
                children: tree.children
            ]
        }
    else
        children = []
        options = flowNode.getOptionsList(state.context)
        for option, i in options
            child =
                id: flowNode.id+":"+i+"#"+state.counter
                name: option[0]
                data:
                    valid: option[1]
                children: []
            children.push child

        return {
            id: flowNode.id+"#"+state.counter
            name: flowNode.id
            data: {}
            children: children
        }

init = (graph) ->
    st = new $jit.ST(
        injectInto: "infovis"
        duration: 300
        transition: $jit.Trans.Quart.easeInOut
        levelDistance: 50
        levelsToShow: 3
        offsetX: 130
        Navigation:
            enable: true
            panning: true
            zooming: 20
        Node:
            height: 20
            width: 100
            # type: "nodeline"
            color: "#AAAA99"
            lineWidth: 3
            align: "center"
            overridable: true

        Edge:
            type: "bezier"
            lineWidth: 3
            color: "#AAAA99"
            overridable: true

        request: (nodeId, level, onComplete) ->
            ans = getTree(nodeId, level)
            console.log("+", nodeId, ans)
            onComplete.onComplete nodeId, ans

        onBeforeCompute: (node) ->
            Log.write "evaluating " + node.name

        onAfterCompute: ->
            Log.write "done"

        onCreateLabel: (label, node) ->
            label.innerHTML = node.name
            label.onclick = ->
                st.onClick node.id

            style = label.style
            style.fontFamily = "Courier"
            style.cursor = "pointer"
            style.color = "#fff"
            style.fontSize = "9px"
            style.fontWeight = "bold"
            style.textAlign = "center"

        onPlaceLabel: (label, node) ->
            style = label.style
            style.width = node.getData('width') + 'px'
            style.height = node.getData('height') + 'px'
            style.lineHeight = style.height
            style.color = node.getLabelData('color')

        onBeforePlotNode: (node) ->
            delete node.data.$color
            delete node.data.$typr

            if node.id.indexOf(":")==-1
                node.data.$type = 'ellipse'
                node.data.$height = 60
            else
                node.data.$color = "#444444" if not node.data.valid
                
            node.data.$color = "#23A4FF" if node.selected

        onBeforePlotLine: (adj) ->
            delete adj.data.$color
            delete adj.data.$lineWidth
            if adj.nodeFrom.selected and adj.nodeTo.selected
                adj.data.$color = "#23A4FF"
                adj.data.$lineWidth = 5
    )
    state.context = graph.context
    st.loadJSON getTree(graph.node.id, 1)
    st.compute()
    st.onClick st.root
	
# labelType = undefined
# useGradients = undefined
# nativeTextSupport = undefined
# animate = undefined
# (->
#     ua = navigator.userAgent
#     iStuff = ua.match(/iPhone/i) or ua.match(/iPad/i)
#     typeOfCanvas = typeof HTMLCanvasElement
#     nativeCanvasSupport = (typeOfCanvas is "object" or typeOfCanvas is "function")
#     textSupport = nativeCanvasSupport and (typeof document.createElement("canvas").getContext("2d").fillText is "function")
#     labelType = (if (not nativeCanvasSupport or (textSupport and not iStuff)) then "Native" else "HTML")
#     nativeTextSupport = labelType is "Native"
#     useGradients = nativeCanvasSupport
#     animate = not (iStuff or not nativeCanvasSupport)
# )()

Log =
    elem: false
    write: (text) ->
        @elem = document.getElementById("log") unless @elem
        @elem.innerHTML = text
		
root = exports ? this
root.Log = Log
root.init = init
