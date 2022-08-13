const exec = require('child_process').exec;
//对exec进行一个简单的封装，返回的是一个Promise对象，便于处理。
function doShellCmd(cmd) {
    let str = cmd;
    let result = {};
    return new Promise(function (resolve, reject) {
        exec(str, function (err, stdout, stderr) {
            if (err) {
                console.log('err');
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
    })
}
function doShellCmdInTerm(cmd) {

}
function doShellAllCmd(cmds) {
    return doShellCmd(cmds.join(' && '))
}

module.exports = {
    doShellCmd,
    doShellCmdInTerm,
    doShellAllCmd
}