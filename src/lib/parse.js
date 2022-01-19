const cheerio = require('cheerio')

var parse = {}

// 预处理
parse.preproccess = function(htmlstr){
    var $ = cheerio.load(htmlstr)
    // 处理代码
    $('code').each((_,code)=>{
        var raw_code = $(code).html().trim().replace(/\n/g, '§').replace(/\t/g, '£')
        raw_code = Buffer.from(raw_code, 'utf-8').toString('base64');
        $(code).html(`œœ${raw_code}œœ`)
    })
    htmlstr = $.html()
    // 处理多行公式
    var reg = RegExp(/\$\$([\s\S]*?)\$\$/);
    while(htmlstr.match(reg)){
        var replace_str = htmlstr.match(reg)[1].replace(/\t/g, ' ').replace(/\n/g, ' ').replace(/</g, '\\lt ').replace(/>/g, '\\gt ')
        replace_str = Buffer.from(replace_str, 'utf-8').toString('base64');
        htmlstr = htmlstr.replace(htmlstr.match(reg)[0],`¢¢${replace_str}¢¢`)
    }
    // 处理单行公式
    reg = RegExp(/\$(.*?)\$/);
    while(htmlstr.match(reg)){
        var replace_str = htmlstr.match(reg)[1].replace(/\t/g, '  ').replace(/</g, '\\lt ').replace(/>/g, '\\gt ')
        replace_str = Buffer.from(replace_str, 'utf-8').toString('base64');
        htmlstr = htmlstr.replace(htmlstr.match(reg)[0],`¡¡${replace_str}¡¡`)
    }
    $ = cheerio.load(htmlstr)
    return $
}

// 后处理
parse.postproccess = function(htmlstr){
    htmlstr = htmlstr.trim().replace(/\n\n/g, '<br/>').replace(/\n/g, ' ').replace(/\t/g, '  ')
    // 恢复单行公式
    var reg = RegExp(/¡¡(.*?)¡¡/);
    while(htmlstr.match(reg)){
        var replace_str = htmlstr.match(reg)[1]
        replace_str = Buffer.from(replace_str, 'base64').toString('utf-8')
        htmlstr = htmlstr.replace(htmlstr.match(reg)[0],`\\(${replace_str}\\)`)
    }
    // 恢复多行公式
    reg = RegExp(/¢¢(.*?)¢¢/);
    while(htmlstr.match(reg)){
        var replace_str = htmlstr.match(reg)[1]
        replace_str = Buffer.from(replace_str, 'base64').toString('utf-8')
        if(replace_str.indexOf("\begin{align}") >= 0)
            htmlstr = htmlstr.replace(htmlstr.match(reg)[0],`\\[${replace_str}\\]`)
        else htmlstr = htmlstr.replace(htmlstr.match(reg)[0],`\\[\\begin{align}${replace_str}\\end{align}\\]`)
    }
    // 恢复代码块
    reg = RegExp(/œœ(.*?)œœ/);
    while(htmlstr.match(reg)){
        var replace_str = htmlstr.match(reg)[1]
        replace_str = Buffer.from(replace_str, 'base64').toString('utf-8')
        htmlstr = htmlstr.replace(htmlstr.match(reg)[0],replace_str)
    }
    return htmlstr
}


// 解析cloze
parse.parseMdCloze = function (htmlstr) {
    const $ = this.preproccess(htmlstr)
    return $('li').map((_, item) => {
        $(item).find('code').each((_, code) => {
            $(code).text(`{{c1:: ${$(code).text()} }}`)
        })
        $(item).find('strong').each((_, code) => {
            $(code).text(`{{c1:: ${$(code).text()} }}`)
        })
        return this.postproccess($(item).text())
    })
}

// 解析question
parse.parseMdQuestion = function (htmlstr) {
    const $ = this.preproccess(htmlstr)
    return $('blockquote').map((_, blockquote) => {
        let answer = $(blockquote).nextUntil('blockquote').map((__, answerTag) => $.html(answerTag)).get().join('');
        answer = this.postproccess(answer)
        let question = $(blockquote).html()
        question = this.postproccess(question)
        return {
            question,
            answer,
        };
    }).get();
}

// 解析word
parse.parseMdWord = function (htmlstr) {
    const $ = this.preproccess(htmlstr)
    var res = []
    return $('li').map((_, item) => {
        var answer1 = $(item).find('code').map((_, code) => {
            const answer_str = $(code).text()
            $(code).remove()
            return this.postproccess(answer_str)
        }).get()
        var answer2 = $(item).find('strong').map((_, strong) => {
            const answer_str = $(strong).text()
            $(strong).remove()
            return this.postproccess(answer_str)
        }).get()
        const answer = [...answer1, ...answer2].join(" / ").trim()
        const question = this.postproccess($(item).text())
        return {
            question,
            answer
        }
    })
}

// 解析clozelist
parse.parseMdClozeList = function (htmlstr) {
    const $ = this.preproccess(htmlstr)
    return $('ul').map((_, item) => {
        $(item).find('code').each((_, code) => {
            $(code).replaceWith(`{{c1:: ${$(code).text()} }}`)
        })
        $(item).find('strong').each((_, strong) => {
            $(strong).replaceWith(`{{c1:: ${$(strong).text()} }}`)
        })
        return this.postproccess($.html(item))
    })
}

module.exports = parse