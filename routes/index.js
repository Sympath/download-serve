const router = require('koa-router')()
const path = require('path')
const utils = require('../utils/index')
let getCloneAllShRepoCmd = (name) => `git clone git@github.com:Sympath/download-sh.git ${path.resolve(__dirname, '../all-kkb/' + name)}`
let getStartDownCmd = (name) => `cd ${path.resolve(__dirname, '../all-kkb/' + name)} && sh all.sh`
let getFormatConfigNameCmd = (name, cookie) => `echo ${name} > ${path.resolve(__dirname, '../all-kkb/' + name)}/name.txt`
let getFormatConfigCookieCmd = (name, cookie) => `echo ${cookie} > ${path.resolve(__dirname, '../all-kkb/' + name)}/cookie.txt `
router.get('/start', async (ctx, next) => {
  let { cookie, name } = ctx.query
  console.log(cookie, name);
  cookie = decodeURIComponent(cookie)
  debugger
  try {
    // 创建空间
    await utils.checkPath(path.resolve(__dirname, '../all-kkb'))
    // 下载脚本仓库
    let cloneAllShRepoCmd = getCloneAllShRepoCmd(name);
    // 更换配置
    let formatConfigNameCmd = getFormatConfigNameCmd(name, cookie);
    let formatConfigCookieCmd = getFormatConfigCookieCmd(name, cookie);
    // 执行启动下载脚本
    let startDownCmd = getStartDownCmd(name)
    let cmds = [
      `rm -rf ${path.resolve(__dirname, '../all-kkb/' + name)}`,
      // 切换目录
      `cd ${path.resolve(__dirname, '../all-kkb')}`,
      cloneAllShRepoCmd,
      formatConfigNameCmd,
      // formatConfigCookieCmd,
      // startDownCmd
    ]
    process.nextTick(
      async () => {
        try {
          await utils.doShellAllCmd(cmds)
          console.log('下载开始');
          await utils.writeFileRecursive(`${path.resolve(__dirname, '../all-kkb/' + name)}/cookie.txt`, cookie)
          utils.doShellCmd(startDownCmd)
        } catch (error) {
          console.log(`执行失败${error}`);
          ctx.body = `下载失败，原因: ${error}`
        }
      }
    )

    // await utils.doShellCmd(getCloneAllShRepoCmd(name))

    // await utils.doShellCmd(getFormatConfigCmd(name, cookie))
    // 执行启动下载脚本
    // await utils.doShellCmd(getStartDownCmd(name))
    ctx.body = '执行成功，正在下载'
  } catch (error) {
    ctx.body = `下载失败，原因: ${error}`
  }
})
module.exports = router
