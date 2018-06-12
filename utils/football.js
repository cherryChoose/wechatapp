var util = require('util.js')
// 状态配文
function matchStatus(id){
  var status = ['0:未开赛','1:上半场','2:半','3:下半场','4:加时','5:取消',
    '-11:待定','-12:腰斩','-13:中断','-14:推迟','-1:已完场','-10:取消']
  return status.filter(function(s){return s.split(":")[0] == id})
}
// 主客红黄牌显示
function showCard(is_turn, hrc, hyc, arc, ayc){
  if (is_turn == "0") {
    return [hrc, hyc, arc, ayc]
  } else {
    return [arc,ayc,hrc,hyc]
  }
}
// finish_score 改变更改背景颜色
function changeBackcolor(cache_finish,newest_finish){
  if ( newest_finish == null || cache_finish == null  || newest_finish == "0:0" || cache_finish == "0:0") {
    return ""    
  }else if (cache_finish != newest_finish){
    return  "#DBDB56"
  }
  return ""
}
// 2分钟接口刷新数据
function mateMatchesatchesById(initialMatch,mate_matches,is_start_mp3){
   var matches = []   
   for (var ma in initialMatch) {

     var match = initialMatch[ma]     
     var mate_matche = mate_matches.filter(function(a){return a.match_id == match.match_id})

     if (mate_matche.length > 0  ) {

       var mate_content = mate_matche[0].content.split("^")

       var stat = mate_content[13]        
       var game_time = mate_content[11] 
       var finish_score = [mate_content[14], mate_content[15]].join(":")
       match.status = stat
       match.game_time = mate_content[11]       
       match.half_score =[mate_content[16],mate_content[17]].join(":")       
       var finish_score_color = changeBackcolor(match.finish_score,finish_score)
       if (( ["1","3"].indexOf(stat) ) >=0 ) {
         var text = util.GetMatchingtime(stat,mate_content[12])
         match["status_text"] = text
       }else{           
         var text = matchStatus(stat)[0]
         match["status_text"] = text.split(":")[1]
       }

       var show_cards = showCard(match.is_turn,mate_content[18],mate_content[20],mate_content[19],mate_content[21])
       match["show_host_yellow_card"] = show_cards[1]
       match["show_host_red_card"] = show_cards[0]
       match["show_away_yellow_card"] = show_cards[3]
       match["show_away_red_card"] = show_cards[2]
       match["finish_score_color"]  = finish_score_color       
       match.finish_score = finish_score
       if (finish_score_color == "#DBDB56") {
         is_start_mp3  += 1
       }
      
    }    matches.push(match)
  } 
   return [matches,is_start_mp3]
}
// 足球5s刷新数据
function setfreshData(initialMatch,mate_matches,is_start_mp3){
  var fresh_matches = []
  for (var ma in initialMatch) {

    var match = initialMatch[ma]
    var match_comp = mate_matches.filter(function(a){return a[0] == match.match_id})

    if (match_comp.length > 0 ) {
      var match_change = match_comp[0]      
      var status_mat = match_change[1]
      var finishScore = [match_change[2],match_change[3]].join(":")
      var finish_score_color = changeBackcolor(match.finish_score,finishScore)
      if (["1","3"].indexOf(status_mat) >=0 ) {
        var text = util.GetMatchingtime(status_mat,match_change[9])
        match["status_text"] = text
      } else {           
        var text = matchStatus(match_change[1])[0]
        match["status_text"] = text.split(":")[1]
      }

      match.status = status_mat 
      match.finish_score = finishScore
      match.half_score = [match_change[4],match_change[5]].join(":")
      match.game_time = match_change[8]  

      var show_cards = showCard(match.is_turn,match_change[6],match_change[12],match_change[7],match_change[13])
      match["show_host_yellow_card"] = show_cards[1]
      match["show_host_red_card"] = show_cards[0]
      match["show_away_yellow_card"] = show_cards[3]
      match["show_away_red_card"] = show_cards[2]
      match["finish_score_color"]  = finish_score_color
      if (finish_score_color == "#DBDB56"){
       is_start_mp3 += 1
      }
    }
    fresh_matches.push(match)
  }
  return [fresh_matches,is_start_mp3]
}
// 5s
function getFootChange(obj){
  wx.request({
    url: getApp().globalData.foot_change,
    data:{},
    method: "GET",
    success: function (res){

      var fresh_matches = []
      var is_start_mp3 = 0

      var initialMatch = wx.getStorageSync(obj.data.games) || []
      var match_ids = initialMatch.map(function(m){return m.match_id})
      var newestdata = util.analyJsonToAry(res.data)
      var mate_matches = newestdata.filter(function(a){return match_ids.indexOf(parseInt(a[0])) >= 0})

      if (mate_matches.length > 0) {
        var matches_and_video = setfreshData(initialMatch,mate_matches,is_start_mp3)
        fresh_matches = matches_and_video[0]
        is_start_mp3 = matches_and_video[1]   
      } else {
        fresh_matches = initialMatch
      }
      var matches =  util.showbkGameListByStat(obj,fresh_matches,obj.data.games)
      wx.setStorageSync(obj.data.games,fresh_matches) 
      if (is_start_mp3 > 0) {
       obj.setData({matches: matches, action: {method: 'play'}})
     }else{
       obj.setData({ matches: matches})
     }
    },
    fail: function (err){
        console.log('请求出错：', err.errMsg)
        return false;
    }

  })
}
// 2m
function getBfData(obj){
  wx.request({
    url: getApp().globalData.foot_bfdata,
    data:{},
    method: "GET",
    header: {'Content-Type': 'application/javascript'},
    success: function (res){
      var matches = []
      var is_start_mp3 = 0

      var cache_matches = wx.getStorageSync(obj.data.games) || []
      var match_ids = cache_matches.map(function(m){return m.match_id})
      var mate_matches = res.data.filter(function(a){return match_ids.indexOf(parseInt(a.match_id)) >= 0})
        
      if (mate_matches.length > 0) {        
        var matches_and_video = mateMatchesatchesById(cache_matches,mate_matches,is_start_mp3)
        matches = matches_and_video[0]
        is_start_mp3 = matches_and_video[1]
      } else {
        matches = cache_matches
      }  
      wx.setStorageSync(obj.data.games,matches)      
      var fresh_matches =  util.showbkGameListByStat(obj,matches,obj.data.games)
      if (is_start_mp3 > 0) {
        obj.setData({matches: fresh_matches, action: {method: 'play'}})
      } else{
        obj.setData({matches: matches})
     }
    },
    fail: function (err){
        console.log('请求出错：', err.errMsg)
        return false;
    }

  })
}

  module.exports = {
    getFootChange: getFootChange,
    getBfData: getBfData
  }
