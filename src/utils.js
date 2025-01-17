const uindow = unsafeWindow

const log = (f, ...s) => uindow.console.log(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
const warn = (f, ...s) => uindow.console.warn(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
const error = (f, ...s) => {
    uindow.console.error(`%c[exlg] ${f}`, "color: #0e90d2;", ...s)
    throw Error(s.join(" "))
}

let lg_dat = null, lg_usr = null
if (location.host === "www.luogu.com.cn" && !/blog/g.test(location.href)) {
    if (/(\?|&)_contentOnly($|=)/g.test(location.search))
        error("Content-Only pages.")
    if (uindow._feInjection.code !== 200)
        error("Luogu failed to load. Exlg stops loading.")
    lg_dat = uindow._feInjection.currentData
    lg_usr = uindow._feInjection.currentUser
}

// ==Utilities==Libraries==

// [Ctrl][Shift][Alt] + Key
const toKeyCode = e => [
    e.ctrlKey ? "Ctrl" : "",
    e.shiftKey ? "Shift" : "",
    e.altKey ? "Alt" : "",
    e.key.toInitialCase()
].join("")

const $ = jQuery.extend({
    double: (func, first, second) => [ func(first), func(second) ]
})
jQuery.fn.extend({
    whenKey: function(a, b) {
        if (typeof a === "object") {
            this.on("keydown", e => {
                let y = a[toKeyCode(e)]
                y && y(e)
            })
        }
        else {
            this.on("keydown", e => {
                if (toKeyCode(e) === a)
                    b(e)
            })
        }
    }
})

const xss = new filterXSS.FilterXSS({
    onTagAttr: (_, k, v) => {
        if (k === "style") return `${k}="${v}"`
    }
})
// const mdp = uindow.markdownPalettes

// ==Utilities==Extensions==

Date.prototype.format = function (f, UTC) {
    UTC = UTC ? "UTC" : ""
    const re = {
        "y+": this[`get${UTC}FullYear`](),
        "m+": this[`get${UTC}Month`]() + 1,
        "d+": this[`get${UTC}Date`](),
        "H+": this[`get${UTC}Hours`](),
        "M+": this[`get${UTC}Minutes`](),
        "S+": this[`get${UTC}Seconds`](),
        "s+": this[`get${UTC}Milliseconds`]()
    }
    for (const r in re) if (RegExp(`(${r})`).test(f))
        f = f.replace(RegExp.$1,
            ("000" + re[r]).substr(re[r].toString().length + 3 - RegExp.$1.length)
        )
    return f
}

String.prototype.toInitialCase = function () {
    return this[0].toUpperCase() + this.slice(1)
}

Array.prototype.lastElem = function () {
    return this[this.length-1]
}

// ==Utilities==Functions==

const version_cmp = (v1, v2) => {
    if (!v1) return "<<"

    const op = (x1, x2) => x1 === x2 ? "==" : x1 < x2 ? "<<" : ">>"
    const exs = [ "pre", "alpha", "beta" ]

    const [[ n1, e1 ], [ n2, e2 ]] = [ v1, v2 ].map(v => v.split("-"))

    let m1, m2
    if (n1 === n2)
        [ m1, m2 ] = [ e1, e2 ].map(e => [ e ? exs.findIndex(ex => e.startsWith(ex)) : Infinity, e?.match(/[0-9]+$/g)?.[0] ?? Infinity ])
    else
        [ m1, m2 ] = [ n1, n2 ].map(n => n.split("."))

    for (const [ k2, m ] of m1.entries())
        if (m !== m2[k2]) return op(+m || 0, +m2[k2] || 0)
    return "=="
}

const springboard = (param, styl) => {
    const q = new URLSearchParams(); for (let k in param) q.set(k, param[k])
    const $sb = $(`
        <iframe id="exlg-${param.type}" src=" https://www.bilibili.com/robots.txt?${q}" style="${styl}" exlg="exlg"></iframe>
    `)
    log("Building springboard: %o", $sb[0])
    return $sb
}

const cs_get = ({url, onload, onerror = err => error(err)}) => GM_xmlhttpRequest({
    url: url,
    method: "GET",
    onload: onload,
    onerror: onerror
})

// Note: cs_get 的 Promise 版本
const cs_get2 = url => new Promise((resolve, reject) => GM_xmlhttpRequest({
    url: url,
    method: "GET",
    onload: e => resolve(e),
    onerror: e => reject(e)
}))

const cs_post = ({url, data, type, header}) => new Promise((resolve, reject) => GM_xmlhttpRequest({
    url: url,
    method: "POST",
    data: data,
    headers: { "Content-Type": type, ...header },
    onload: e => resolve(e),
    onerror: e => reject(e)
}))

const get_latest = callbackfn => {
    cs_get({
        url: "https://api.github.com/repos/extend-luogu/extend-luogu/tags?per_page=1",
        onload: resp => {
            const
                latest = JSON.parse(resp.responseText)[0].name,
                version = GM_info.script.version,
                op = version_cmp(version, latest)

            const l = `Comparing version: ${version} ${op} ${latest}`
            log(l)

            callbackfn && callbackfn(latest, op)
        }
    })
}

const cur_time = (ratio = 1000) => ~~(Date.now() / ratio)

const lg_content = url => new Promise((res, rej) =>
    $.get(url + (url.includes("?") ? "&" : "?") + "_contentOnly=1", data => {
        if (data.code !== 200) rej(`Requesting failure code: ${ res.code }.`)
        res(data)
    })
)
/*
const exlg_alert_onaction = uindow.show_alert ? () => true : () => {
    if (! ` ${document.body.className.split(' ')} `.includes("lg-alert-built")) {
        $(document.head).append($(`<link rel="stylesheet" href="https://cdn.luogu.com.cn/css/amazeui.min.css">`))
        $(`<div class="am-modal am-modal-alert am-modal-out" tabindex="-1" id="exlg-alert" style="display: none; margin-top: -40px;">
            <div class="am-modal-dialog">
                <div class="am-modal-hd" id="exlg-alert-title"></div>
                <div class="am-modal-bd" id="exlg-alert-message"></div>
                <div class="am-modal-footer">
                    <span class="am-modal-btn">确定</span>
                </div>
            </div></div>`).appendTo($(document.body))
        $(document.body).addClass("lg-alert-built")
        return false
        // Note: 阅读 Amaze UI 源码得出搞法
    }
    return true
}
*/
const lg_alert = uindow.show_alert
    ? (msg, title = "exlg 提醒您") => uindow.show_alert(title, msg)
    : (msg, title = "exlg 提醒您") => uindow.alert(title + "\n" + msg)

let csrf_token = null
const lg_post = (url, data) => $.ajax({
    url: url,
    data: data,
    headers: {
        "x-csrf-token": (csrf_token === null)?
            (csrf_token = $("meta[name=csrf-token]").attr("content")) : csrf_token,
        "content-type":"application/json"
    },
    method: "post",
})

const judge_problem = text => [
    /^AT[1-9][0-9]{0,}$/i,
    /^CF[1-9][0-9]{0,}[A-Z][0-9]?$/i,
    /^SP[1-9][0-9]{0,}$/i,
    /^P[1-9][0-9]{3,}$/i,
    /^UVA[1-9][0-9]{2,}$/i,
    /^U[1-9][0-9]{0,}$/i,
    /^T[1-9][0-9]{0,}$/i,
    /^B[2-9][0-9]{3,}$/i
].some(re => re.test(text))

export {
    uindow as default, log, warn, error, xss, version_cmp, cur_time,
    lg_dat, lg_usr, lg_content, lg_alert, lg_post, cs_get, cs_get2, cs_post, springboard, $,
    judge_problem, get_latest
}