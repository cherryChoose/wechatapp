function formatTime(date) {
  var year = date.getFullYear()
  var month = date.getMonth() + 1
  var day = date.getDate()

  var hour = date.getHours()
  var minute = date.getMinutes()
  var second = date.getSeconds();

  return [year, month, day].map(formatNumber).join('/') + ' ' + [hour, minute, second].map(formatNumber).join(':')
}

function formatNumber(n) {
  n = n.toString()
  return n[1] ? n : '0' + n
}
// 获取比赛进行时间
function GetMatchingtime(st, time) {
  var t = time.split(",");
  
  var sert = new Date();
  var t2 = new Date(t[0], t[1], t[2], t[3], t[4], t[5]);
  if (st == "1") {
    var goTime = Math.floor((sert - t2) / 60000);
    if (goTime > 45) goTime = "45";
    if (goTime < 1) goTime = "1";
    return "进行中：" + goTime ;
  } else if (st == "3") {
    goTime = Math.floor((sert - t2) / 60000) + 46;
    if (goTime > 90) goTime = "90";
    if (goTime < 46) goTime = "46";
    return "进行中：" + goTime ;
  }
  return "";
}
// 计算主客支持率
function calSupport(support_host,support_away){
  if(support_host == null || support_away == null){
    return [50,50]
  }else{    
    var sum = support_host + support_away
    var host = (support_host/sum).toFixed(2) * 100
    var away = (support_away/sum).toFixed(2) * 100
    return [parseInt(host),parseInt(away)]
  }
}
// 计算主客分差、总分
function calculateScore(score) {
   var scores  = score.split(":")
   var hs = isNaN(parseInt(scores[0])) ? "" : parseInt(scores[0]);
   var aws = isNaN(parseInt(scores[1])) ? "" : parseInt(scores[1]);
   return [(hs - aws), (hs + aws)]  
}
// 排序
function sortGameList(a,b) {
    var direction = -1;
    if (a.status < b.status)  return -direction;
    if (a.status > b.status)  return direction;
    if (a.sort_key < b.sort_key)  return direction;
    if (a.sort_key > b.sort_key)  return -direction;
}
// 数据初始化状态配文
function initStatus(id){
  var status = ['0:未开赛','5:取消','-1:已完成',]
  return status.filter(function(s){return s.split(":")[0] == id})
}
// 点击导航筛选响应数据
function showbkGameListByStat(obj,cache_matches,match_type){
  var current_tab = obj.data["currentTab"]
  var show_matches = []
  switch(current_tab){
    case '1':
      show_matches = cache_matches.filter(function(a){return a.status == 0;});
      break;
    case '2':
      show_matches = cache_matches.filter(function(a){return ["1","2","3","4","5","50"].indexOf(a.status)>=0;});
    break;
    case '3':
      show_matches = cache_matches.filter(function(a){return a.status == -1;});
    break;
    case '4':
    show_matches = getNotice(match_type)[0]
    break;
    default:
    show_matches = cache_matches
  }
  return show_matches
}
// 得到关注赛事并加入缓存
function getNotice(match_type) {

  var matchids_cache = "matchids_" + match_type

  var cache_matches = wx.getStorageSync(match_type) || []
  var matchids = wx.getStorageSync(matchids_cache)  || []
  var matches = cache_matches.filter(function(a){return matchids.indexOf(a.match_id+"")>=0;});
  if (matchids.length == 0) {
    matches = []
    wx.setStorageSync(matchids_cache,[])    
  }
  return [matches,matches.length]
}
// 将接口返回content数据拆分存入数组
function analyJsonToAry(xmldata){
   var contents = []   
   if (xmldata.length > 0){
    for (var i = 0; i < xmldata.length; i++) {        
      var change_content =  xmldata[i].content
      var match_change = change_content.split("^")
      contents.push(match_change)
    }
  }
   return contents
}
// 比赛初始化数据
function getAllMatches(obj) {
  wx.request({
    url: getApp().globalData.live_api_url + obj.data.games,
    data: {},
    method: "GET",
    header: { 'Content-Type': 'application/json' },
    success: function (res) {
      var matches = []
      var is_start_mp3 = obj.data.start_mp3
      for(var init in res.data.data){
        var match = res.data.data[init]
        if(parseInt(match.status) == 2){
          match.status = 0
        }else if (parseInt(match.status) >= 6 ){
          match.status = -1
        }        
        var text = initStatus(match.status)[0]        
        match["status_text"] = text.split(":")[1]
        match["sort_key"] = match.game_time.replace(/[\-|\s|\:]/g,"") + match.game_no.substr(2,3)
        var time = match.game_time.split(" ")[1]
        var gameTime = time.substring(0,5)
        if(gameTime == '23:59'){
          match.game_time  = "00:00"
        }else{          
          match.game_time = gameTime
        }
        
        var hostName = match.host_name.substring(0,4)
        var awayName = match.away_name.substring(0,4)
        match.host_name = hostName
        match.away_name = awayName

        if (obj.data.games == 'basketball' && match.status >=6 ) {
            
            match["home1"] = match.first_score.split(":")[0]
            match["gueste2"] = match.first_score.split(":")[1]

            match["home3"] = match.half_score.split(":")[0]
            match["gueste4"] = match.half_score.split(":")[1]

            match["home5"] = match.third_score.split(":")[0]
            match["gueste6"] = match.third_score.split(":")[1]

            match["home7"] = match.fourth_score.split(":")[0]
            match["gueste8"] = match.fourth_score.split(":")[1]

            match["homescore"] = match.finish_score.split(":")[0]
            match["guestscore"] = match.finish_score.split(":")[1]
            var score = calculateScore(match.finish_score)
            match["fc_score"] = score[0]
            match["zf_score"] = score[1]
        }else if (obj.data.games == 'football'){
          var host_support = match.extend.host_support
          var away_support = match.extend.away_support
          match.extend.host_support = calSupport(host_support,away_support)[0]
          match.extend.away_support = calSupport(host_support,away_support)[1]
        }
        matches.push(match)
      }    

      obj.setData({matches: matches.sort(sortGameList)})
      wx.setStorageSync(obj.data.games,matches.sort(sortGameList))
    },
    fail: function (err) {
      console.log('请求出错：', err.errMsg)
      return false;
    }
  })
}
module.exports = {
  formatTime: formatTime,
  sortGameList: sortGameList,
  initStatus: initStatus,
  GetMatchingtime: GetMatchingtime,
  getAllMatches: getAllMatches,
  calculateScore: calculateScore,
  analyJsonToAry: analyJsonToAry,
  showbkGameListByStat: showbkGameListByStat,
  getNotice: getNotice
}
  
