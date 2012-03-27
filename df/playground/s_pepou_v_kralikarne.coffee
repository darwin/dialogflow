@player = new FlowActor "player", "Frantisek Dobrota"
@pepa = new FlowActor "pepa", "Pepa z depa"

@n1 = new FlowNode "n1"
@n1.addSentence new FlowSentence @pepa, "Ahoj Franto!"
@n1.addSentence new FlowSentence @player, "Zdar Pepe"
@n1.addSentence new FlowSentence @pepa, "Jak ti dupou kralici?"

@n2 = new FlowNode "n2"

@n3 = new FlowNode "n3"

@n1.addOption new FlowOption "dupou dobre", ->
	"n2"

@n1.addOption new FlowOption "dupou spatne", ->
	"n3"

@n2.addOption new FlowOption "zpet k tematu", ->
	"n1"

@n3.addOption new FlowOption "zpet k tematu", ->
	"n1"

@s_pepou_v_kralikarne = new FlowGraph(@n1)

#############################

