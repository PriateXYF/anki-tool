const marked = require('marked')
const parse = require('./parse')

var tool = {}

// 所有可处理的类型
const all_types = ['cloze', 'question', 'word', 'clozelist']

// 通过指定注释符获取各类型内容
tool.getMdFragments = function (mdstr) {
    return all_types.map((type) => {
        const start_sign = `<!--start-${type}-->`
        const stop_sign = `<!--stop-${type}-->`
        const reg = RegExp(`${start_sign}([\\s\\S]*?)${stop_sign}`, "ig");
        const content = mdstr.match(reg) && mdstr.match(reg).map(item => item.replace(start_sign, "")).map(item => item.replace(stop_sign, ""))
        return { type, content }
    })
}

tool.parseMd = function (item, cfg) {
    var res = { type: item.type, content: [] };
    if (item.content) {
        switch (item.type) {
            case 'cloze':
                item.content.forEach(mdstr => {
                    const cloze_list = parse.parseMdCloze(marked.parse(mdstr), cfg)
                    res.content.push(...cloze_list)
                })
                break;
            case 'question':
                item.content.forEach(mdstr => {
                    const question_list = parse.parseMdQuestion(marked.parse(mdstr), cfg)
                    res.content.push(...question_list)
                })
                break;
            case 'word':
                item.content.forEach(mdstr => {
                    const word_list = parse.parseMdWord(marked.parse(mdstr), cfg)
                    res.content.push(...word_list)
                })
                break;
            case 'clozelist':
                item.content.forEach(mdstr => {
                    const clozelist_list = parse.parseMdClozeList(marked.parse(mdstr), cfg)
                    res.content.push(...clozelist_list)
                })
                break;
            default:
                break;
        }
    }
    return res
}

module.exports = { tool , all_types }