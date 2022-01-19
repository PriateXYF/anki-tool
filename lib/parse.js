const cheerio = require('cheerio');

var parse = {}

// 解析cloze
parse.parseMdCloze = function (htmlstr) {
    const $ = cheerio.load(htmlstr)
    return $('li').map((_, item) => {
        $(item).find('code').each((_, code) => {
            $(code).text(`{{c1:: ${$(code).text()} }}`)
        })
        $(item).find('strong').each((_, code) => {
            $(code).text(`{{c1:: ${$(code).text()} }}`)
        })
        return $(item).text()
    })
}

// 解析question
parse.parseMdQuestion = function (htmlstr) {
    const $ = cheerio.load(htmlstr)
    return $('blockquote').map((_, blockquote) => {
        let content = $(blockquote).nextUntil('blockquote').map((__, answerTag) => $.html(answerTag)).get().join('');
        return {
            title: $(blockquote).html().trim().replace(/\n\n/g, '<br/>').replace(/\n/g, ' ').replace(/\t/g, '  '),
            content: content.trim().replace(/\n\n/g, '<br/>').replace(/\n/g, ' ').replace(/\t/g, '  '),
        };
    }).get();
}

// 解析word
parse.parseMdWord = function (htmlstr) {
    const $ = cheerio.load(htmlstr)
    var res = []
    return $('li').map((_, item) => {
        var answer1 = $(item).find('code').map((_, code) => {
            const answer_str = $(code).text()
            $(code).remove()
            return answer_str
        }).get()
        var answer2 = $(item).find('strong').map((_, strong) => {
            const answer_str = $(strong).text()
            $(strong).remove()
            return answer_str
        }).get()
        const answer = [...answer1, ...answer2].join(" / ").trim()
        const question = $(item).text().trim()
        return {
            question,
            answer
        }
    })
}

// 解析wordlist
parse.parseMdWordList = function (htmlstr) {
    const $ = cheerio.load(htmlstr)
    return $('ul').map((_, item) => {
        $(item).find('code').each((_, code) => {
            $(code).replaceWith(`{{c1:: ${$(code).text()} }}`)
        })
        $(item).find('strong').each((_, strong) => {
            $(strong).replaceWith(`{{c1:: ${$(strong).text()} }}`)
        })
        return $.html(item).replace(/\n\n/g, '<br/>').replace(/\n/g, ' ').replace(/\t/g, '  ')
    })
}

module.exports = parse