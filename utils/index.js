const fs = require('fs');
const path = require('path');
const shell = require('shelljs');
const exec = require('child_process').exec;
//对exec进行一个简单的封装，返回的是一个Promise对象，便于处理。
function doShellCmd(cmd) {
    let str = cmd;
    let result = {};
    return new Promise(function (resolve, reject) {
        try {
            exec(str, function (err, stdout, stderr) {
                if (err) {

                    console.log('err', err);
                    result.errCode = 500;
                    result.data = "操作失败！请重试";
                    reject(result);
                } else {
                    console.log('stdout ', stdout);//标准输出
                    result.errCode = 200;
                    result.data = "操作成功！";
                    resolve(result);
                }
            })
        } catch (error) {
            throw new Error(error)
        }

    })
}
function doShellCmdInTerm(cmd) {

}
async function doShellAllCmd(cmds) {
    for (let index = 0; index < cmds.length; index++) {
        const cmd = cmds[index];
        await doShellCmd(cmd);
    }
}


const checkPath = async function (path) {
    try {
        await fs.promises.access(path)
    } catch {
        fs.mkdirSync(path)
    }
    return true
}
// 清空目录
const clearDir = async (dirPath) => {
    // 先删后生成
    await deleteDirOrFile(dirPath)
    checkPath(dirPath)
}
// 删除
const deleteDirOrFile = async (dirPath) => {
    try {
        shell.rm('-rf', dirPath)
    } catch {
    }
}
// 写入文件
const writeFileRecursive = function (path, buffer) {
    return new Promise((res, rej) => {
        let lastPath = path.substring(0, path.lastIndexOf("/"));
        fs.mkdir(lastPath, { recursive: true }, (err) => {
            if (err) return rej(err);
            fs.writeFile(path, buffer, function (err) {
                if (err) return rej(err);
                return res(null);
            });
        });
    });
};

module.exports = {
    clearDir,
    deleteDirOrFile,
    doShellCmd,
    doShellCmdInTerm,
    doShellAllCmd,
    checkPath,
    writeFileRecursive
}