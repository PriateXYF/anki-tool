# anki-tool

> 将解析各种类型文件，使之可导入anki。

## 安装

```bash
npm i anki-tool -S
```

## Demo

```js
const {ankitool} = require('anki-tool')

const anki = ankitool.parseMd(`
<!--start-question-->
> This is a question

Answer here.

<!--stop-question-->
`)

console.log(anki.question)
```

## 详细说明

### Markdown解析

目前支持以下4种类型的anki模板:

1. cloze
2. question
3. word
4. wordlist

每个模板的起始符与结束符都遵循以下规则：

* 起始符 `<!--start-type-->`
* 结束符 `<!--stop-type-->`

其中 `type` 对应各模板的名称。起始符与结束符必须成对出现。在同一个md文件中可以出现多对起始结束符，处理时会将结果进行合并。

#### cloze

cloze 是填空题模板，可以使用粗体或代码进行挖空。

例子：

```md
<!--start-cloze-->
* CIDR的作用是 `构成超网` 。
* 能够抑制广播风暴的设备是 **路由器**。
* PCM(脉冲编码调制) 编码过程依次为 `采样` 、 `量化` 、 `编码` 。
* 滑动窗口协议中，若采用 $n$ 比特对帧编号，则发送窗口与接收窗口需要满足条件 **$$接收窗口W_R + 发送窗口W_T > 2^n$$**
<!--stop-cloze-->
```

#### question

question 是问答题模板，可以使用Markdown中的“引用”来代表问题，之后的内容全部代表答案。

例子：

```md
<!--start-question-->
> 线性表SequenList的顺序存储实现。

\`\`\`c
typedef int Datatype; //Datatype 可为任何类型，在此为int
#define MAXSIZE 1024 //线性表可能的最大长度，假设为1024
typedef struct {
    Datatype data[MAXSIZE];
    int last;
} SequenList;
\`\`\`

> 简要介绍一下 UDP 。

无连接、开销小(8字节)、最大努力交付、面向报文、吞吐量不受拥塞控制算法调节、同时向多个客户机传输相同的消息。

> IP地址分几类？各类 可指派的网络数、最大主机数、范围 分别是多少？

IP地址分ABCDE五类。其中A、B、C为**单播**地址，D类地址为**多播**地址，E类地址**保留**为以后用。

| 类别  | 可指派的网络数         | 最大主机数            | 范围                        |
|:---:|:---------------:|:----------------:|:-------------------------:|
| A   | 126(2^7 - 2)      | 16777214(2^24 - 2) | 1.0.0.1~126.255.255.254   |
| B   | 16383(2^14 - 1)   | 65534(2^16 - 2)    | 128.1.0.1~191.255.255.254 |
| C   | 2097151(2^21 - 1) | 254(2^8 - 2)       | 192.0.1.1~223.255.255.254 |
<!--stop-question-->
```

#### word

word 是单词模板，使用列表表示，每一个列表代表一个单词，可以使用粗体或代码标识答案。当有多个答案时，会自动使用 `/` 连接。

例子：

```md
<!--start-word-->
* 悲观的 `pessimistic`
* 善心 `benevolence`
* 保持生态平衡 `keep ecological balance`
* 可持续发展 `sustainable development`
* 低碳经济 `low carbon economy`
<!--stop-word-->
```

word 与 cloze 的区别在于，word返回的结果是一个对象，可以根据自己的需要进行处理，而cloze是已经进行处理过的字符串(`{{c1 : xxx }}`)。

#### clozelist

clozelist 是填空列表模板，有时候会遇到需要将一组列表进行处理的情况。处理的结果和 cloze 类型，只不过是以 `ul` 的形式返回的。使用 `---` 分割每组。

```md
<!--start-clozelist-->
* venerable `可敬的` `值得尊敬的`
* vulnerable `脆弱的` `易受攻击的`

---

* violent `暴力的` `暴力`
* violate `违反`
* violet `紫罗兰` `紫罗兰色的`

---

* evolve `进化` `发展`
* involve `涉及` `包含`
<!--start-clozelist-->
```

## 工作原理

### Markdown解析过程

Markdown解析的工作流程如下：

1. 读取Markdown字符串
2. 按不同模板提取出各自所需Markdown字符串
3. 转换Markdown字符串为HTML字符串
4. 对HTML字符串进行预处理
    1. 处理代码标签(code)
    2. 处理多行公式($$)
    3. 处理单行公式($)
5. 解析出各模板问答列表
6. 对结果进行后期处理
    1. 处理代码标签(code)
    2. 处理多行公式($$)
    3. 处理单行公式($)

### 关于公式

在 Markdown 中，使用 `$` 代表单行公式，使用 `$$` 代表多行公式。

解析Markdown时，会在提取内容之前对公式进行预处理(Base64 Encode)，防止出现一些意外的问题。
在提取完成后会对公式进行恢复(Base64 Decode)。

解析时会自动将单行公式 `$1+1=2$` 转为 Anki 可识别的 `\(1+1=2\)`；将多行公式 `$$1+1=2$$` 转为 Anki 可识别的 `\[\begin{align}1+1=2\end{align}\]` ，若原先公式中就有 `\begin{align}\end{align}` 则不会自动添加。

### 关于代码

为了方便导入，对代码(`<code></code>`)也进行了预处理操作，将换行符替换为了 `§`，制表符替换为了 `£` 。因此，需要在卡片中额外引入处理代码：

```html
<script type="text/javascript">
	var all_code = document.getElementsByTagName('code')
	for(var temp = 0; temp < all_code.length; temp ++){
		all_code[temp].innerHTML = all_code[temp].innerText.replace(/§/g,"\n").replace(/£/g,"\t")
	}
</script>
```