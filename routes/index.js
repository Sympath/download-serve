const router = require('koa-router')()
const path = require('path')
const utils = require('../utils/index')
let getCloneAllShRepoCmd = (name) => `git clone git@github.com:Sympath/download-sh.git ${path.resolve(__dirname, '../all-kkb/' + name)}`
let getStartDownCmd = (name) => `cd ${path.resolve(__dirname, '../all-kkb/' + name)} && sh all.sh  1>all.log 2>all_err.log`
let getRetryCmd = (name) => `cd ${path.resolve(__dirname, '../all-kkb/' + name + '/repo')} && npm run retry-linux`
let getFormatConfigCmd = (name, cookie, courseIds = []) => `
cat >> ${path.resolve(__dirname, '../all-kkb/' + name)}/config << EOF
name=${name}
cookie=${cookie}
courseIds=${courseIds}
EOF
`
let getFormatConfigNameCmd = (name, cookie) => `echo ${name} > ${path.resolve(__dirname, '../all-kkb/' + name)}/name.txt`
let getFormatConfigCookieCmd = (name, cookie) => `echo ${cookie} > ${path.resolve(__dirname, '../all-kkb/' + name)}/cookie.txt `
router.post('/start', async (ctx, next) => {
  // courseIds 用于指定要下载那些课程；如果为空数组则全部下载
  let { cookie, name, courseIds } = ctx.request.body
  console.log(cookie, name);
  if (typeof cookie === 'object') {
    cookie = JSON.stringify(cookie)
  }
  // cookie = decodeURIComponent(cookie)
  try {
    // 创建空间
    await utils.checkPath(path.resolve(__dirname, '../all-kkb'))
    // 下载脚本仓库
    let cloneAllShRepoCmd = getCloneAllShRepoCmd(name);
    // 更换配置
    let formatConfigCmd = getFormatConfigCmd(name, cookie, courseIds);
    // let formatConfigNameCmd = getFormatConfigNameCmd(name, cookie);
    // let formatConfigCookieCmd = getFormatConfigCookieCmd(name, cookie);
    // 执行启动下载脚本
    let startDownCmd = getStartDownCmd(name)
    let cmds = [
      `rm -rf ${path.resolve(__dirname, '../all-kkb/' + name)}`,
      // 切换目录
      `cd ${path.resolve(__dirname, '../all-kkb')}`,
      cloneAllShRepoCmd,
      // formatConfigNameCmd,
      formatConfigCmd,
      // formatConfigCookieCmd,
      startDownCmd
    ]
    process.nextTick(
      async () => {
        try {
          await utils.doShellAllCmd(cmds)
          console.log('下载开始');
          // await utils.writeFileRecursive(`${path.resolve(__dirname, '../all-kkb/' + name)}/cookie.txt`, cookie)
          // utils.doShellCmd(startDownCmd)
        } catch (error) {
          console.log(`执行失败${JSON.stringify(error)}`);
          ctx.body = `下载失败，原因: ${JSON.stringify(error)}`
        }
      }
    )
    ctx.body = '执行成功，正在下载'
  } catch (error) {
    ctx.body = `下载失败，原因: ${error}`
  }
})
router.post('/retry', async (ctx, next) => {
  try {
    let { name } = ctx.request.body
    // 执行启动重新执行脚本
    process.nextTick(
      () => {
        let retryCmd = getRetryCmd(name)
        debugger
        try {
          console.log('重传开始');
          utils.doShellCmd(retryCmd)
        } catch (error) {
          console.log(`执行失败${error}`);
          ctx.body = `重传失败，原因: ${error}`
        }
      }
    )
    ctx.body = '执行成功，正在重传'
  } catch (error) {
    ctx.body = `重传失败，原因: ${error}`
  }
})
module.exports = router
