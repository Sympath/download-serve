/*
 * @Author: zendu 
 * @Date: 2021-09-30 14:19:36 
 * @Desc: download m3u8 ts file and convert to mp4
 * @Usage node  download.js  [ https://test.com/89a0px.m3u8 ]
 */

let link = "https://v.baoshiyun.com/resource/media-855150959656960/lud/7d20beae4f6844e79a3fcec6f367815d.m3u8?MtsHlsUriToken=61ec49ff187240e48d19eca0fdbea31cc05fd48dbe294802992769a3c474ae83"


let argv = process.argv.slice(2);
if (argv.length > 0 && /^http(s?).*?\.m3u8$/.test(argv[0])) {
    link = argv[0];
}

// npm i axios m3u8-parser single-line-log
const axios = require("axios");
const m3u8Parser = require("m3u8-parser");
const path = require("path");
const fs = require("fs");
const slog = require('single-line-log').stdout;
const { exec } = require("child_process");

// ==================== 主入口
function main() {
    axios.get(link).then(async (response) => {
        outputFileName = link.split('/').pop().replace(/\./g, '_').replace('_m3u8', '.mp4');
        // 1. 获取m3u8文件信息
        let data = response.data;
        // 2. 解析文件，形成序列化的列表
        let segments = generateM3u8Segments(data);
        // 3. 循环下载每个文件
        let flag = await downloadM3u8S(segments, link);
        if (!flag) return;
        // 4. 合并ts文件到mp4
        await convertTStoMp4(segments, outputFileName);
        // 5. 清除ts文件
        await clearFile(segments);

        console.log(`output: ${outputFileName}`);
    });
}


function generateM3u8Segments(data) {
    console.log('序列化m3u8');
    const parser = new m3u8Parser.Parser();
    parser.push(data);
    parser.end();
    const parsedManifest = parser.manifest;
    segments = parsedManifest.segments;
    return segments;
}

function Progress() {
    this.pb = new ProgressBar('下载进度', 0);
}
Progress.prototype.render = (completed, total) => {
    this.pb.render({ completed: num, total: total });
}


/* 
    @segments: 
        {
            duration: 1.416667,
            uri: 'v.f230.ts?start=0&end=282375&type=mpegts',
            timeline: 0
        },
    @m3u8Link: url
    return false | true
*/
let nowDownloadNumber = 0;
let pb = new ProgressBar('下载进度', 0);
function downloadM3u8S(segments, m3u8Link, downloadDir = 'video') {
    return new Promise((resolve, reject) => {
        let originURL = m3u8Link.replace(m3u8Link.split('/').pop(), '');
        // 创建下载目录
        if (!fs.existsSync(downloadDir)) {
            fs.mkdirSync(downloadDir);
        }

        segments.forEach(async (v, i) => {
            try {
                // 构造ts文件的下载链接
                v.url = originURL + v.uri;
                v.name = path.join(downloadDir, i + 1 + '.ts');
                v.index = i + 1;
                v.length = segments.length;
                // 下载每一个ts文件
                await downloadAndSaveSingleM3u8(v);
                nowDownloadNumber++;
                pb.render({ completed: nowDownloadNumber, total: segments.length });
                // console.log(`下载：${nowDownloadNumber}/${segments.length}`);
                if (nowDownloadNumber === segments.length) {
                    resolve(true); // 下载完成
                }
            } catch (e) {
                console.log('2', 'm3u8文件下载异常, Function:downloadM3u8S');
                reject(false);
            }
        });
    })
}

async function downloadAndSaveSingleM3u8(segmentItem) {
    return new Promise((resolve, reject) => {
        axios({
            url: segmentItem.url,
            method: 'get',
            timeout: 2000,
            headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/93.0.4577.82 Safari/537.36' },
            responseType: 'arraybuffer' // 下载文件时需要将返回数据改为arraybuffer类型
        }).then(response => {

            let data = response.data;
            let status = response.status;
            if (status != 200) throw Error("request single ts file error");
            fs.writeFile(segmentItem.name, data, () => { });
            resolve(true);
        }).catch(error => {
            reject(false);
        })
    })
}

function convertTStoMp4(segments, outputname) {
    return new Promise((resolve, reject) => {
        try {
            let fileString = "concat:" + segments.map((v, i) => v.name).join("|");
            console.log("");
            if (fs.existsSync(outputname)) {
                console.log(`\n${outputname} has existed, covert to bak_${outputname}`);
                outputname = "_bak_" + outputname;
            }

            cmd = `ffmpeg -i "${fileString}" -acodec copy -vcodec copy -absf aac_adtstoasc ${outputname}`;

            exec(cmd, (err, data) => {
                if (err) console.log("3 convert fail");
                console.log("ts convert to mp4");
                resolve(true);
            });
        } catch (error) {
            reject(false);
        }

    })
}

function clearFile(segments) {
    return new Promise((resolve, reject) => {
        let cmd = `rm -f  ${segments.map((v, i) => v.name).join(" ")}`;
        exec(cmd, (err, data) => {
            if (err) console.log("5 clearfile error!");
            console.log("clear temp file");
            resolve(true);
        });
    })
}









// 下载进度条
function ProgressBar(description, bar_length) {
    // 两个基本参数(属性)
    this.description = description || 'Progress';       // 命令行开头的文字信息
    this.length = bar_length || 25;                     // 进度条的长度(单位：字符)，默认设为 25

    // 刷新进度条图案、文字的方法
    this.render = function (opts) {
        var percent = (opts.completed / opts.total).toFixed(4);    // 计算进度(子任务的 完成数 除以 总数)
        var cell_num = Math.floor(percent * this.length);             // 计算需要多少个 █ 符号来拼凑图案

        // 拼接黑色条
        var cell = '';
        for (var i = 0; i < cell_num; i++) {
            cell += '█';
        }

        // 拼接灰色条
        var empty = '';
        for (var i = 0; i < this.length - cell_num; i++) {
            empty += ' ';
        }

        // 拼接最终文本
        var cmdText = this.description + ': ' + (100 * percent).toFixed(2) + '% ' + cell + empty + ' ' + opts.completed + '/' + opts.total;

        // 在单行输出文本
        slog(cmdText);
    };
}


main();
