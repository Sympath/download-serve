const router = require('koa-router')()
const path = require('path')
const utils = require('../utils/index')
let getCloneAllShRepoCmd = (name) => `git clone git@github.com:Sympath/download-sh.git ${path.resolve(__dirname, '../all-kkb/' + name)}`
let getStartDownCmd = (name) => `cd ${path.resolve(__dirname, '../all-kkb/' + name)} && sh all.sh  1>all.log 2>all_err.log`
// 下载单个视频的动作
let getSingleDownCmd = (m3u8Url, bypyDir, bypyFullDir, filename) => {
  let params = [['m3u8Url', m3u8Url],
  ['bypyDir', bypyDir],
  ['bypyFullDir', bypyFullDir],
  ['filename', filename]]
  let paramStr = ''
  params.forEach(param => {
    let [key, val] = param;
    paramStr += `--${key}=${val} `
  })
  let cmd = `cd ${path.resolve(__dirname, '../all-kkb/' + bypyDir)} && sh single-download.sh ${paramStr} 1>single-download.log 2>single-download_err.log`
  return cmd
}
let getRetryCmd = (name) => `cd ${path.resolve(__dirname, '../all-kkb/' + name + '/repo')} && npm run retry-linux`
// 下载单个视频时写入本地文件配置
let getSingleFormatConfigCmd = (m3u8Url, courseName, bypyFullDir, bypyDir) => {
  if (typeof courseIds === 'object') {
    courseIds = courseIds.join(',')
  }
  return `cat >> ${path.resolve(__dirname, '../all-kkb/' + bypyDir + '/repo/config/single-download.js')} << EOF
module.exports = {
    m3u8Url: '${m3u8Url}',
    courseName: '${courseName}',
    bypyFullDir: '${bypyFullDir}',
    bypyDir: '${bypyDir}'
}
EOF
`
}
// 下载单个视频时写入本地文件配置
let getSingleFormatConfigJsCmd = (m3u8Url, courseName, bypyFullDir, bypyDir) => {
  if (typeof courseIds === 'object') {
    courseIds = courseIds.join(',')
  }
  return `cat >> ${path.resolve(__dirname, '../all-kkb/' + bypyDir + '/repo/config/single-download')} << EOF
m3u8Url='${m3u8Url}'
courseName='${courseName}'
bypyFullDir='${bypyFullDir}'
bypyDir='${bypyDir}'
EOF
`
}
// 下载所有视频时写入本地文件配置
let getFormatConfigCmd = (name, cookie, courseIds = []) => {
  if (typeof courseIds === 'object') {
    courseIds = courseIds.join(',')
  }
  return `cat >> ${path.resolve(__dirname, '../all-kkb/' + name)}/config << EOF
name="${name}"
cookie="${cookie.replace(/"/g, "'")}"
courseIds='${courseIds}'
EOF
`
}
router.post('/start', async (ctx, next) => {
  // courseIds 用于指定要下载那些课程；如果为空数组则全部下载
  let { cookie, name, courseIds } = ctx.request.body
  console.log(cookie, name);
  if (typeof cookie === 'object') {
    cookie = JSON.stringify(cookie)
  }
  if (typeof courseIds === 'undefined') {
    courseIds = '*'
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
    let { m3u8Url, bypyDir, bypyFullDir, filename } = ctx.request.body
    // 执行启动重新执行脚本
    process.nextTick(
      () => {
        let singleDownCmd = getSingleDownCmd(m3u8Url, bypyDir, bypyFullDir, filename)

        try {
          utils.doShellCmd(singleDownCmd)
        } catch (error) {
          console.log(`执行失败${error}`);
          ctx.body = `重传失败，原因: ${error}`
        }
      }
    )
    ctx.body = '执行成功，正在下载单个视频'
  } catch (error) {
    ctx.body = `重传失败，原因: ${error}`
  }
})
router.post('/down-single', async (ctx, next) => {
  try {
    let { m3u8Url, courseName, bypyFullDir, bypyDir } = ctx.request.body
    debugger
    let singleFormatConfigJsCmd = getSingleFormatConfigJsCmd(m3u8Url, courseName, bypyFullDir, bypyDir);
    let singleFormatConfigCmd = getSingleFormatConfigCmd(m3u8Url, courseName, bypyFullDir, bypyDir);
    let cmds = [
      `rm -rf ${path.resolve(__dirname, '../all-kkb/' + bypyDir + '/repo/config/single-download-config.js')}`,
      `rm -rf ${path.resolve(__dirname, '../all-kkb/' + bypyDir + '/repo/config/single-download-config')}`,
      // 切换目录
      `cd ${path.resolve(__dirname, '../all-kkb/' + bypyDir + '/repo')}`,
      singleFormatConfigJsCmd,
      singleFormatConfigCmd,
      // formatConfigCookieCmd,
      // 'npm run single-download'
      'npm run single-download-sh' // 考虑到日志输出问题，采用sh方式执行
    ]
    // 执行启动重新执行脚本
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
    ctx.body = '执行成功，正在重传'
  } catch (error) {
    ctx.body = `执行失败，原因: ${error}`
  }
})
module.exports = router
