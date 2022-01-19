import { tool, all_types } from './lib/tool.js'

var ankitool = {}
// 解析markdown
ankitool.parseMd = function (mdstr) {
	const md_fragment_list = tool.getMdFragments(mdstr)
	var res = {}
	md_fragment_list.forEach((md_fragment) => {
		res[md_fragment.type] = tool.parseMd(md_fragment).content
	})
	return res
}

// 将markdown转为txt文本
ankitool.md2txt = function (mdstr) {
	const prasedMd = this.parseMd(mdstr)
	var res = {}
	for (const key in prasedMd) {
		if (Object.hasOwnProperty.call(prasedMd, key)) {
			const element = prasedMd[key];
			switch (key) {
				case 'cloze':
					res[key] = element
					break;
				case 'question':
					res[key] = element.map(item=>`${item.question}\t${item.answer}`)
					break;
				case 'word':
					res[key] = element.map(item=>`${item.question}\t${item.answer}`)
					break;
				case 'wordlist':
					res[key] = element
					break;
				default:
					break;
			}
		}
	}
	return res
}

export { ankitool }