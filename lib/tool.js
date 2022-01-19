const marked = require('marked')
const parse = require('./parse')
var tool = {}

// 所有可处理的类型
const all_type = ['cloze', 'question', 'word', 'wordlist']

// 通过指定注释符获取各类型内容
tool.getMdFragments = function (mdstr) {
    return all_type.map((type) => {
        const start_sign = `<!--start-${type}-->`
        const stop_sign = `<!--stop-${type}-->`
        const reg = RegExp(`${start_sign}([\\s\\S]*?)${stop_sign}`, "ig");
        const content = mdstr.match(reg) && mdstr.match(reg).map(item => item.replace(start_sign, "")).map(item => item.replace(stop_sign, ""))
        return { type, content }
    })
}

tool.parseMd = function (item) {
    var res = { type: item.type, content: [] };
    if (item.content) {
        switch (item.type) {
            case 'cloze':
                item.content.forEach(mdstr => {
                    cloze_list = parse.parseMdCloze(marked.parse(mdstr))
                    res.content.push(...cloze_list)
                })
                break;
            case 'question':
                item.content.forEach(mdstr => {
                    question_list = parse.parseMdQuestion(marked.parse(mdstr))
                    res.content.push(...question_list)
                })
                break;
            case 'word':
                item.content.forEach(mdstr => {
                    word_list = parse.parseMdWord(marked.parse(mdstr))
                    res.content.push(...word_list)
                })
                break;
            case 'wordlist':
                item.content.forEach(mdstr => {
                    wordlist_list = parse.parseMdWordList(marked.parse(mdstr))
                    res.content.push(...wordlist_list)
                })
                break;
            default:
                break;
        }
    }
    return res
}

module.exports = tool