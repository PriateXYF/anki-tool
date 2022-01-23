const cheerio = require('cheerio')
var _ = require('lodash');
var parse = {}

// 预处理
parse.preproccess = function(htmlstr, cfg) {
    var $ = cheerio.load(htmlstr)
    // 处理代码
    $('code').each((_, code) => {
        var raw_code = $(code).html().trim().replace(/\n/g, '<br>').replace(/\t/g, '    ')
        raw_code = Buffer.from(raw_code, 'utf-8').toString('base64');
        $(code).html(`œœ${raw_code}œœ`)
    })
    htmlstr = $.html()
    // 处理多行公式
    var reg = RegExp(/\$\$([\s\S]*?)\$\$/);
    while (htmlstr.match(reg)) {
        var replace_str = htmlstr.match(reg)[1].replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/</g, '\\lt ').replace(/>/g, '\\gt ')
        replace_str = Buffer.from(replace_str, 'utf-8').toString('base64');
        htmlstr = htmlstr.replace(htmlstr.match(reg)[0], `¢¢${replace_str}¢¢`)
    }
    // 处理单行公式
    reg = RegExp(/\$(.*?)\$/);
    while (htmlstr.match(reg)) {
        var replace_str = htmlstr.match(reg)[1].replace(/\t/g, '  ').replace(/</g, '\\lt ').replace(/>/g, '\\gt ')
        replace_str = Buffer.from(replace_str, 'utf-8').toString('base64');
        htmlstr = htmlstr.replace(htmlstr.match(reg)[0], `¡¡${replace_str}¡¡`)
    }
    $ = cheerio.load(htmlstr)
    return $
}

// 后处理
parse.postproccess = function(htmlstr, cfg) {
    htmlstr = htmlstr.trim().replace(/\n\n/g, '<br/>').replace(/\n/g, ' ').replace(/\t/g, '  ')
    // 恢复单行公式
    var reg = RegExp(/¡¡(.*?)¡¡/);
    while (htmlstr.match(reg)) {
        var replace_str = htmlstr.match(reg)[1]
        replace_str = Buffer.from(replace_str, 'base64').toString('utf-8')
        htmlstr = htmlstr.replace(htmlstr.match(reg)[0], `\\(${replace_str}\\)`)
    }
    // 恢复多行公式
    reg = RegExp(/¢¢(.*?)¢¢/);
    while (htmlstr.match(reg)) {
        var replace_str = htmlstr.match(reg)[1]
        replace_str = Buffer.from(replace_str, 'base64').toString('utf-8')
        if (replace_str.indexOf("\begin{align}") >= 0)
            htmlstr = htmlstr.replace(htmlstr.match(reg)[0], `\\[${replace_str}\\]`)
        else htmlstr = htmlstr.replace(htmlstr.match(reg)[0], `\\[\\begin{align}${replace_str}\\end{align}\\]`)
    }
    // 恢复代码块
    reg = RegExp(/œœ(.*?)œœ/);
    while (htmlstr.match(reg)) {
        var replace_str = htmlstr.match(reg)[1]
        replace_str = Buffer.from(replace_str, 'base64').toString('utf-8')
        htmlstr = htmlstr.replace(htmlstr.match(reg)[0], replace_str)
    }
    const $ = cheerio.load(htmlstr)
    // 是否去除外层标签
    const isWrap = _.has(cfg, 'base.wrap') ? cfg.base.wrap : true
    htmlstr = isWrap ? htmlstr : $('body').children().html()
    return htmlstr
}

// 解析question
parse.parseMdQuestion = function(htmlstr, cfg) {
    const $ = this.preproccess(htmlstr, cfg)
    const items = _.has(cfg, 'question.item') ? cfg.question.item : 'blockquote'
    return $(items).map((_, item) => {
        let answer = $(item).nextUntil(item).map((__, answerTag) => $.html(answerTag)).get().join('');
        answer = this.postproccess(answer, cfg)
        let question = $(item).html()
        question = this.postproccess(question, cfg)
        return {
            question,
            answer,
        };
    }).get();
}

// 解析word
parse.parseMdWord = function(htmlstr, cfg) {
    const $ = this.preproccess(htmlstr, cfg)
    const items = _.has(cfg, 'word.item') ? cfg.word.item : 'li'
    var res = []
    return $(items).map((_, item) => {
        var answer1 = $(item).find('code').map((_, code) => {
            const answer_str = $(code).text()
            $(code).remove()
            return this.postproccess(answer_str, cfg)
        }).get()
        var answer2 = $(item).find('strong').map((_, strong) => {
            const answer_str = $(strong).text()
            $(strong).remove()
            return this.postproccess(answer_str, cfg)
        }).get()
        const answer = [...answer1, ...answer2].join(" / ").trim()
        const question = this.postproccess($(item).text(), cfg)
        return {
            question,
            answer
        }
    })
}

// 解析cloze
parse.parseMdCloze = function(htmlstr, cfg) {
    const $ = this.preproccess(htmlstr, cfg)
    const items = _.has(cfg, 'cloze.item') ? cfg.cloze.item : 'ul'
    const tags = _.has(cfg, 'cloze.tags') ? cfg.cloze.tags : ["code", "strong"]
    return $(items).map((_, item) => {
        tags.forEach((tag) => {
            $(item).find(tag).each((_, raw) => {
                $(raw).replaceWith(`{{c1:: ${$(raw).text()} }}`)
            })
        })
        return this.postproccess($.html(item), cfg)
    })
}

module.exports = parse