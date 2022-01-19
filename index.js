const tool = require('./lib/tool')
var ankitool = {}
const default_config = {
	preproccess : true
}
ankitool.md2txt = function(mdstr, config=default_config){
	// console.log(marked.parse(mdstr))
	const md_fragment_list = tool.getMdFragments(mdstr)
	// console.log(md_fragment_list)
	const res = md_fragment_list.map((item) => tool.parseMd(item))
	console.log(res[2])
}

module.exports = ankitool