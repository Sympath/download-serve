const fs = require("fs");
const path = require("path");
const m3u8ToMp4 = require("./m3u8ToMp4.js"); // 引入核心模块，注意路径
const converter = new m3u8ToMp4();

// 具体参数可自行修改
downloadMedia({
    // 测试视频，如果链接失效的话就自己找一个
    url: 'https://v.baoshiyun.com/resource/media-855150995341312/lud/912e0c3075fa4c47b60935b0fb258d23.m3u8?MtsHlsUriToken=9cfb9aa4bf334f0a8ff305f01383abc782e90db6aeb14a4c85dbb52dbfe37045',
    filename: 'lesson7-基于模版以及 NN 的对话生成'
});
/** 下载m3u8视频
 * 
 * @param {*} opt 
 * {
 * url：u3u8地址
 * output 文件输出目录
 * filename 文件名称
 * }
 */
async function downloadMedia(opt) {
    let url = opt.url
    let output = opt.output || 'video';
    let filename = opt.filename + '.mp4' || 'video.mp4';

    if (!fs.existsSync(output)) {
        fs.mkdirSync(output, {
            recursive: true,
        });
    }
    try {
        console.log("准备下载...");

        await converter
            .setInputFile(url)
            .setOutputFile(path.join(output, filename))
            .start();

        console.log("下载完成!");
        // 返回视频地址
        return path.join(output, filename)
    } catch (error) {
        throw new Error("哎呀，出错啦! 检查一下参数传对了没喔。", error);
    }
}

