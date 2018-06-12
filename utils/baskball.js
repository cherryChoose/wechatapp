var util = require('util.js')

function matchStatus(id){
  var status = ['0:未开赛','1:第一节','2:第二节','3:第三节','4:第四节','5:加时','-1:已完场','6:未开赛','7:未开赛',
    '-2:待定','-3:中断','-4:取消','-5:推迟','50:中场']
  return status.filter(function(s){return s.split(":")[0] == id})[0]
}

function changeBackcolor(cache_score,newest_score){
  if (isNaN(cache_score)) {
    return ""
  } else if (parseInt(cache_score) == 0 || parseInt(newest_score) == 0) {
    return ""
  } else if (cache_score != newest_score) {
    
    return  "#DBDB56"
  }
  return ""
}

function addPropertyToMatch(cacheMatch,mateMatch,freTime,is_start_mp3){
    var scordTime = freTime =="2m" ? 12 : 4
    for (var i=1; i<=8; i++) {
      var add_property = (i % 2 > 0) ? "home" + i : "gueste" + i
      var add_value = (i % 2 > 0) ?  scordTime + i :  scordTime + i      
      cacheMatch[add_property+"_color"] = changeBackcolor(cacheMatch[add_property], mateMatch[add_value])
      cacheMatch[add_property] = mateMatch[add_value]
      if( cacheMatch[add_property+"_color"] == "#DBDB56"){
        is_start_mp3 +=1
      }
    }  
    return [cacheMatch,is_start_mp3]
}

function getBfToday(obj){
  wx.request({
    url: getApp().globalData.nba_tody,
    data:{},
    method: "GET",
    header: {'Content-Type': 'text/xml'},
    success: function (res){
      var fresh_matches = []
      var is_start_mp3 = 0
      var cache_matches = wx.getStorageSync('basketball') || []
      var match_ids = cache_matches.map(function(m){return m.match_id})

      var newestdata = util.analyJsonToAry(res.data)
      var mate_matches = newestdata.filter(function(a){return match_ids.indexOf(parseInt(a[0])) >= 0})

      if (mate_matches.length > 0) {
        var return_data = setJsonMatch(cache_matches,mate_matches)
        fresh_matches = return_data[0]
        is_start_mp3 = return_data[1]
      } else {
        fresh_matches = cache_matches
      }
      var matches =  util.showbkGameListByStat(obj,fresh_matches,"basketball")
      wx.setStorageSync("basketball",fresh_matches)
     if (is_start_mp3 > 0) {
       obj.setData({ matches: matches,action: {method: 'play'}})
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

function getBfChange(obj){
  wx.request({
    url: getApp().globalData.nba_change,
    data:{},
    method: "GET",
    header: {'Content-Type': 'text/xml'},
    success: function (res){
      var fresh_matches = []
      var is_start_mp3 = 0

      var cache_matches = wx.getStorageSync('basketball') || []
      var match_ids = cache_matches.map(function(m){return m.match_id})

      var newestdata = util.analyJsonToAry(res.data)
      var mate_matches = newestdata.filter(function(a){return match_ids.indexOf(parseInt(a[0])) >= 0})

      if (mate_matches.length > 0) {
        var return_data = setJsonChangeMatch(cache_matches,mate_matches)
        fresh_matches = return_data[0]
        is_start_mp3 = return_data[1]
      } else {
        fresh_matches = cache_matches
      }
      var matches =  util.showbkGameListByStat(obj,fresh_matches,"basketball")
      wx.setStorageSync("basketball",fresh_matches)
      //console.log("5s",is_start_mp3)
      if (is_start_mp3 > 0) {
        obj.setData({matches: matches, action: {method: 'play'}})
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

function setJsonMatch(initialMatch,mate_matches){
  var fresh_matches = []
  var is_start_mp3 = 0
  for (var ma in initialMatch) {
    
    var match = initialMatch[ma]
    var match_comp = mate_matches.filter(function(a){return a[0] == match.match_id})

    if (match_comp.length > 0 ){
      var match_change = match_comp[0]
      
      var status_mat = match_change[5]
      var init_time = match_change[4]
      var finish_score = [match_change[11],match_change[12]].join(":")
      var score = util.calculateScore(finish_score)
      var home_addscore = match_change[22] + match_change[24] + match_change[26]
      var guest_addscore = match_change[23] + match_change[25] + match_change[27]      
      var status_text = matchStatus(status_mat)
      var status = status_text.split(":")
      if(["1","2","3","4","5"].indexOf(status_mat) >=0 ){
        status_text = status[1]+match_change[6]
        match.status_text = status_text
      }else{
        match.status_text = status[1]
      }      
      match.status = status_mat

      var time = init_time.substr(init_time.length-5,6)
      if(time == '23:59'){
        match["game_time"] = "00:00"
      }else{
        match["game_time"] = time
      }
      
      match["fc_score"] = score[0]
      match['zf_score'] = score[1]
      match["homescore"] = match_change[11]
      match["guestscore"] = match_change[12]
      match["home_addscore_color"] = changeBackcolor(match.home_addscore,home_addscore)
      match["guest_addscore_color"] = changeBackcolor(match.guest_addscore,guest_addscore)
      match["home_addscore"] = home_addscore
      match["guest_addscore"] = guest_addscore
      
      var match_pro = addPropertyToMatch(match,match_change,"2m",is_start_mp3)
      match = match_pro[0]
      is_start_mp3 = match_pro[1]
    }
    fresh_matches.push(match)
  }
  return [fresh_matches,is_start_mp3]
}

function setJsonChangeMatch(initialMatch,mate_matches){
  var fresh_matches = []
  var is_start_mp3 = 0
  for (var ma in initialMatch) {

    var match = initialMatch[ma]
    var match_comp = mate_matches.filter(function(a){return a[0] == match.match_id})

    if (match_comp.length > 0 ){      
      var match_change = match_comp[0]

      var status_mat = match_change[1]
      var status_value = matchStatus(status_mat)
      var status_text_ary = status_value.split(":")
      var finish_score = [match_change[3],match_change[4]].join(":")
      var score = util.calculateScore(finish_score)
      var home_addscore = match_change[16] + match_change[18] + match_change[20]
      var guest_addscore = match_change[17] + match_change[19] + match_change[21]     
      
      if(["1","2","3","4","5"].indexOf(status_mat) >=0 ){
        var status_text = status_text_ary[1]+match_change[2]
        match.status_text = status_text
      }else{
        match.status_text = status_text_ary[1]
      }
      
      match.status = status_mat
      match["fc_score"] = score[0]
      match['zf_score'] = score[1]
      match["home_addscore_color"] = changeBackcolor(match.home_addscore,home_addscore)
      match["guest_addscore_color"] = changeBackcolor(match.guest_addscore,guest_addscore)
      match["home_addscore"] = home_addscore
      match["guest_addscore"] = guest_addscore
      match["homescore"] = match_change[3]
      match["guestscore"] = match_change[4]

      var match_pro = addPropertyToMatch(match,match_change,"5s",is_start_mp3)  
      match =  match_pro[0] 
      is_start_mp3 = match_pro[1]  
    }    
    fresh_matches.push(match)

  }   
  return [fresh_matches,is_start_mp3]
}
 module.exports = {
    getBfToday: getBfToday,
    getBfChange: getBfChange
  }
