//获取应用实例
var getData = require('../../utils/football.js')
var comm = require('../../utils/util.js')
var app = getApp()
Page({
  data: {
    winWidth: 0,
    winHeight: 0,
    guanzhu: comm.getNotice("football")[1],
    // tab初识值  
    currentTab: 0,
    games: 'football',
    is_start_mp3: 0,
    src: getApp().globalData.foot_mp3
  },
  onLoad: function () {
    var _self = this    
    // 从缓存中得到关注球队数
    var matchids = wx.getStorageSync("matchids_football")  || []    
    this.getGuanzhuHash(_self)
   
    // 获取系统信息自适应屏幕大小
    wx.getSystemInfo({
      success: function (res) {
        _self.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    });
  },
  onShow: function(){
    
     // 页面初识数据显示
    comm.getAllMatches(this)
    // 初始化显示数据       
    getData.getBfData(this)
    // 每隔5s局部刷新
    this.freshData(this)
    // 每隔2分钟执行一次全部刷新
    this.intervalAllFrash(this) 
  },
  onHide: function(){
     this.setData({ show_video: 1})
  },
  // 点击tab切换 
  swichNav: function (e) {
    var _self = this
    if (_self.data.currentTab === e.target.dataset.current) {
      return false;
    } else {
      _self.setData({ currentTab: e.target.dataset.current })
      var show_matches = []
     var cache_matches = wx.getStorageSync('football') || []
     var typeOfMatch =  e.target.dataset.games
     switch(typeOfMatch){
       // 未开始
       case 'unstart':
          show_matches = cache_matches.filter(function(a){return a.status == 0;});
         break;
      // 进行中
       case 'ongoing':
          show_matches = cache_matches.filter(function(a){return ["1","2","3","4"].indexOf(a.status) >= 0;});
       break;
       // 已完场
       case 'completed':
         show_matches = cache_matches.filter(function(a){return a.status == -1;});
       break;
       case 'concern':
        show_matches = comm.getNotice("football")[0]
       break;
       default:
        show_matches = wx.getStorageSync('football')
     }
     _self.setData({matches: show_matches})
     _self.setData({guanzhu: comm.getNotice("football")[1]})
    }
  },
  intervalAllFrash: function(obj){
     setInterval(function () {
      getData.getBfData(obj)
    },120000)
  },
  freshData: function(obj){
    setInterval(function () {
    getData.getFootChange(obj)
  }, 5000)
  },
  SortData: function(obj){
    setInterval(function () {
      var matches = wx.getStorageSync('football') || []
      var fresh_matches =  comm.showbkGameListByStat(obj,matches,"football")
      obj.setData({matches: fresh_matches.sort(comm.sortGameList)})
  }, 30000)
  }, 
   setNotice: function(e){    
    var _self = this
    var guanzhu = comm.getNotice("football")[1] 
    if(guanzhu == 0){wx.setStorageSync("matchids_football",[])}
    var matchids = wx.getStorageSync("matchids_football")  || []
    var matchId = e.currentTarget.dataset.match
    if (matchids.length == 0 ) {
      matchids = [matchId]
      guanzhu += 1
    } else if (matchids.indexOf(matchId+"") >= 0) {
      matchids.splice(matchids.indexOf(matchId+""),1)
      guanzhu -= 1
    }else{
      matchids.push(matchId)
      guanzhu += 1
    }
    wx.setStorageSync("matchids_football",matchids)    
    this.getGuanzhuHash(_self)
    _self.setData({guanzhu: guanzhu})   
  },
   getNotice: function(e) {
     var _self = this
     var cache_matches = wx.getStorageSync('football') || []
     var matchids = wx.getStorageSync("matchids_football")  || []
     var matches = []
     if(matchids.length == 0){
       matches = []
     }else{
       matches = cache_matches.filter(function(a){return matchids.indexOf(a.match_id+"")>=0;});
     }
     return matches
   },
   getGuanzhuHash: function(obj){
     var matchids =  wx.getStorageSync("matchids_football") || []
     var matchidsHash = {}
     if (matchids.length > 0) {
        for (var item in matchids) {
          var key = matchids[item]
          matchidsHash[key] = key
        } 
      }
    obj.setData({matchids_hash: matchidsHash})
   }
}) 

