//app.js
App({
  onLaunch: function () {
    //调用API从本地缓存中获取数据
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)
  },
  getUserInfo:function(cb){
    var that = this
    if(this.globalData.userInfo){
      typeof cb == "function" && cb(this.globalData.userInfo)
    }else{
      //调用登录接口
      wx.login({
        success: function () {
          wx.getUserInfo({
            success: function (res) {
              that.globalData.userInfo = res.userInfo
              typeof cb == "function" && cb(that.globalData.userInfo)
            }
          })
        }
      })
    }
  },
  globalData:{
    userInfo:null,
    foot_mp3: "http://m.jc258.cn/images/goals.wav",
    bask_mp3: 'http://m.jc258.cn/images/live/sound.mp3',
    live_api_url:"https://sec.jc258.cn/api/live/",
    foot_bfdata: "https://sec.jc258.cn/api/livedata/bfdata",
    foot_change: "https://sec.jc258.cn/api/livedata/change",
    nba_tody: "https://sec.jc258.cn/api/livedata/nba_today",
    nba_change: 'https://sec.jc258.cn/api/livedata/nba_change'
  }
})