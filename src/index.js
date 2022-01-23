const { tool } = require('./lib/tool.js')
const config = require('config')
const ankitool = {}

// 解析markdown
ankitool.parseMd = function (mdstr, cfg=config) {
	const md_fragment_list = tool.getMdFragments(mdstr)
	var res = {}
	md_fragment_list.forEach((md_fragment) => {
		res[md_fragment.type] = tool.parseMd(md_fragment, cfg).content
	})
	return res
}
// 将markdown转为txt文本
ankitool.md2txt = function (mdstr, cfg=config) {
	const prasedMd = this.parseMd(mdstr, cfg)
	var res = {}
	for (const key in prasedMd) {
		if (Object.hasOwnProperty.call(prasedMd, key)) {
			const element = prasedMd[key];
			switch (key) {
				case 'cloze':
					res[key] = element
					break;
				case 'word':
				case 'question':
					res[key] = element.map(item => `${item.question}\t${item.answer}`)
					break;
				default:
					break;
			}
		}
	}
	return res
}

module.exports = { ankitool }