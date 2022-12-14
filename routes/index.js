const router = require('koa-router')()
const path = require('path')
const utils = require('../utils/index')
let getCloneAllShRepoCmd = (currentShRepoPath) => `git clone git@github.com:Sympath/download-sh.git ${currentShRepoPath}`
let getStartDownCmd = (currentShRepoPath) => `cd ${currentShRepoPath} && npm run all`
let getXiaoETDownCmd = (currentShRepoPath) => `cd ${currentShRepoPath} && npm run xiaoet-all`
let getDownCoursewareCmd = (currentShRepoPath) => `cd ${currentShRepoPath} && npm run courseware-all`
let getRunDownCmd = (currentShRepoPath) => `cd ${currentShRepoPath} && npm run config-retry`
// 下载单个视频时写入本地文件配置
let getSingleFormatConfigCmd = (m3u8Url, courseName, bypyFullDir, bypyDir) => {
  if (typeof courseIds === 'object') {
    courseIds = courseIds.join(',')
  }
  return `cat > ${path.resolve(__dirname, '../all-kkb/' + bypyDir + '/repo/config/single-download.js')} << EOF
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
  return `cat > ${path.resolve(__dirname, '../all-kkb/' + bypyDir + '/repo/config/single-download')} << EOF
m3u8Url='${m3u8Url}'
courseName='${courseName}'
bypyFullDir='${bypyFullDir}'
bypyDir='${bypyDir}'
EOF
`
}
// 下载所有视频时写入本地文件配置
let getFormatConfigCmd = (currentShRepoPath, name, cookie, courseIds = [], donwType = "") => {
  if (typeof courseIds === 'object') {
    courseIds = courseIds.join(',')
  }
  return `cat > ${currentShRepoPath}/config << EOF
name="${name}"
cookie="${cookie.replace(/"/g, "'")}"
courseIds="${courseIds}",
donwType="${donwType}"
EOF
`
}
router.post('/start', async (ctx, next) => {
  // courseIds 用于指定要下载那些课程；如果为空数组则全部下载
  let { cookie, name, courseIds, donwType = 'down-all' } = ctx.request.body
  console.log(cookie, name);
  let currentRepoPath = path.resolve(__dirname, '../all-kkb/' + name + '/repo')
  let currentShRepoPath = path.resolve(__dirname, '../all-kkb/' + name)
  debugger
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
    debugger
    // 下载脚本仓库
    let cloneAllShRepoCmd = getCloneAllShRepoCmd(currentShRepoPath);
    // 更换配置
    let formatConfigCmd = getFormatConfigCmd(currentShRepoPath, name, cookie, courseIds, donwType);
    // let formatConfigNameCmd = getFormatConfigNameCmd(name, cookie);
    // let formatConfigCookieCmd = getFormatConfigCookieCmd(name, cookie);
    // 执行启动下载脚本
    let startDownCmd = getStartDownCmd(currentShRepoPath, name)
    let cmds = [
      // `rm -rf ${currentShRepoPath}`,
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
router.post('/config-retry', async (ctx, next) => {
  // courseIds 用于指定要下载那些课程；如果为空数组则全部下载
  let { cookie, name, courseIds } = ctx.request.body
  let currentRepoPath = path.resolve(__dirname, '../all-kkb/' + name + '/repo')
  let currentShRepoPath = path.resolve(__dirname, '../all-kkb/' + name)
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
    // 更换配置
    let formatConfigCmd = getFormatConfigCmd(currentShRepoPath, name, cookie, courseIds);
    // let formatConfigNameCmd = getFormatConfigNameCmd(name, cookie);
    // let formatConfigCookieCmd = getFormatConfigCookieCmd(name, cookie);
    // 执行启动下载脚本：生成新的配置文件后重新启动，这里不会重新生成课程配置文件（current）
    let retryDownCmd = getRunDownCmd(currentShRepoPath)
    let cmds = [
      formatConfigCmd,
      retryDownCmd
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
// 下载单个视频
router.post('/down-single', async (ctx, next) => {
  try {
    let { m3u8Url, courseName, bypyFullDir, bypyDir } = ctx.request.body
    let currentRepoPath = path.resolve(__dirname, '../all-kkb/' + bypyDir + '/repo')
    debugger
    let singleFormatConfigJsCmd = getSingleFormatConfigJsCmd(m3u8Url, courseName, bypyFullDir, bypyDir);
    let singleFormatConfigCmd = getSingleFormatConfigCmd(m3u8Url, courseName, bypyFullDir, bypyDir);
    let cmds = [
      // `rm -rf ${currentRepoPath}/config/single-download-config.js`,
      // `rm -rf ${currentRepoPath}/config/single-download-config`,
      // 切换目录
      singleFormatConfigJsCmd,
      singleFormatConfigCmd,
      `cd ${currentRepoPath} && npm run single-download-sh` // 考虑到日志输出问题，采用sh方式执行
    ]
    debugger
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
// 小鹅通配置导出
router.post('/xiaoet-start', async (ctx, next) => {
  // courseIds 用于指定要下载那些课程；如果为空数组则全部下载
  let { cookie, name, courseIds, donwType = 'down-all' } = ctx.request.body
  console.log(cookie, name);
  let currentRepoPath = path.resolve(__dirname, '../all-kkb/' + name + '/repo')
  let currentShRepoPath = path.resolve(__dirname, '../all-kkb/' + name)
  debugger
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
    debugger
    // 下载脚本仓库
    let cloneAllShRepoCmd = getCloneAllShRepoCmd(currentShRepoPath);
    // 更换配置
    let formatConfigCmd = getFormatConfigCmd(currentShRepoPath, name, cookie, courseIds, donwType);
    // let formatConfigNameCmd = getFormatConfigNameCmd(name, cookie);
    // let formatConfigCookieCmd = getFormatConfigCookieCmd(name, cookie);
    // 执行启动下载脚本
    let startDownCmd = getXiaoETDownCmd(currentShRepoPath)
    let cmds = [
      // `rm -rf ${currentShRepoPath}`,
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
// 下载课件
router.post('/down-courseware', async (ctx, next) => {
  // courseIds 用于指定要下载那些课程；如果为空数组则全部下载
  let { cookie, name, courseIds, donwType = 'down-all' } = ctx.request.body
  console.log(cookie, name);
  let currentRepoPath = path.resolve(__dirname, '../all-kkb/' + name + '/repo')
  let currentShRepoPath = path.resolve(__dirname, '../all-kkb/' + name)
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
    let cloneAllShRepoCmd = getCloneAllShRepoCmd(currentShRepoPath);
    // 更换配置
    let formatConfigCmd = getFormatConfigCmd(currentShRepoPath, name, cookie, courseIds, donwType);
    // let formatConfigNameCmd = getFormatConfigNameCmd(name, cookie);
    // let formatConfigCookieCmd = getFormatConfigCookieCmd(name, cookie);
    // 执行启动下载脚本
    let startDownCmd = getDownCoursewareCmd(currentShRepoPath)
    let cmds = [
      // `rm -rf ${currentShRepoPath}`,
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
module.exports = router
