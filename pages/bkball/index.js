var comm = require('../../utils/util.js')
var baskball = require('../../utils/baskball.js')
var app = getApp()
Page({
  data: {
    winWidth: 0,
    winHeight: 0,
    guanzhu: comm.getNotice("basketball")[1],
    currentTab: 0,
    games: 'basketball',
    is_start_mp3: 0,
    src: getApp().globalData.bask_mp3
  },
  onLoad: function () {
    console.log("load")
    var _self = this
    var matchids = wx.getStorageSync("matchids_basketball")  || []    
    this.getGuanzhuHash(_self)
    wx.getSystemInfo({
      success: function (res) {
        _self.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    }); 
    _self.setData({ action: {method: 'pause'}})
  },
  onShow: function(){    
   comm.getAllMatches(this)
   baskball.getBfToday(this) 
   this.freshData(this)
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
     var cache_matches = wx.getStorageSync('basketball') || []
     var typeOfMatch =  e.target.dataset.games
     switch(typeOfMatch){
       // 未开始
       case 'unstart':
          show_matches = cache_matches.filter(function(a){return a.status == 0;});
         break;
      // 进行中
       case 'ongoing':
          show_matches = cache_matches.filter(function(a){return [1,2,3,4,5,50].indexOf(parseInt(a.status))>=0;});
       break;
       // 已完场
       case 'completed':
         show_matches = cache_matches.filter(function(a){return a.status == -1;});
       break;
       case 'concern':
        show_matches = comm.getNotice("basketball")[0]
       break;
       default:
        show_matches = cache_matches
     }
     _self.setData({matches: show_matches})
     _self.setData({guanzhu: comm.getNotice("basketball")[1]})
    }
  },
  intervalAllFrash: function(obj){
     setInterval(function () {
      baskball.getBfToday(obj)
    }, 120000)
  },
  freshData: function(obj){
    setInterval(function () {
    baskball.getBfChange(obj)
  }, 5000)
  },
  SortData: function(obj){
    setInterval(function () {
      var matches = wx.getStorageSync('basketball') || []
      var fresh_matches =  comm.showbkGameListByStat(obj,matches,"basketball")
      obj.setData({matches: fresh_matches.sort(comm.sortGameList)})
  }, 30000)
  },
  setNotice: function(e){    
    var _self = this
    var guanzhu = comm.getNotice("basketball")[1] 
    if(guanzhu == 0){wx.setStorageSync("matchids_basketball",[])}
    var matchids = wx.getStorageSync("matchids_basketball")  || []
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
    wx.setStorageSync("matchids_basketball",matchids)    
    this.getGuanzhuHash(_self)
    _self.setData({guanzhu: guanzhu})   
  },
   getNotice: function(e) {
     var _self = this
     var cache_matches = wx.getStorageSync('basketball') || []
     var matchids = wx.getStorageSync("matchids_basketball")  || []
     var matches = []
     if(matchids.length == 0){
       matches = []
     }else{
       matches = cache_matches.filter(function(a){return matchids.indexOf(a.match_id+"")>=0;});
     }
     return matches
   },
   getGuanzhuHash: function(obj){
     var matchids =  wx.getStorageSync("matchids_basketball") || []
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