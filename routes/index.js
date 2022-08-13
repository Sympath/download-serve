const router = require('koa-router')()
const path = require('path')
const utils = require('../utils/index')
let getCloneAllShRepoCmd = (name) => `git clone git@github.com:Sympath/download-sh.git ${path.resolve(__dirname, '../all-kkb/' + name)}`
let getStartDownCmd = (name) => `cd ${name} && sh all.sh`
let getFormatConfigCmd = (name, cookie) => `echo ${name} > ${path.resolve(__dirname, '../all-kkb/' + name)}/name.txt && echo ${cookie} > ${path.resolve(__dirname, '../all-kkb/' + name)}/cookie.txt `
router.get('/', async (ctx, next) => {
  await ctx.render('index', {
    title: 'Hello Koa 2!'
  })
})

router.get('/start', async (ctx, next) => {
  let { cookie, name } = ctx.query
  console.log(cookie, name);
  debugger
  try {
    // 下载脚本仓库
    let cloneAllShRepoCmd = getCloneAllShRepoCmd(name);
    // 更换配置
    let formatConfigCmd = getFormatConfigCmd(name, cookie);
    // 执行启动下载脚本
    let startDownCmd = getStartDownCmd(name)
    let cmds = [
      // 切换目录
      `cd ${path.resolve(__dirname, '../all-kkb')}`,
      cloneAllShRepoCmd,
      formatConfigCmd,
      startDownCmd
    ]
    utils.doShellAllCmd(cmds)

    // await utils.doShellCmd(getCloneAllShRepoCmd(name))

    // await utils.doShellCmd(getFormatConfigCmd(name, cookie))
    // 执行启动下载脚本
    // await utils.doShellCmd(getStartDownCmd(name))
    ctx.body = '执行成功，正在下载'
  } catch (error) {
    ctx.body = `下载失败，原因: ${error}`
  }
})

router.get('/json', async (ctx, next) => {
  ctx.body = {
    title: 'koa2 json'
  }
})

module.exports = router
