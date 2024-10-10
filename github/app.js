const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const url = require('url');
const qs = require('querystring');

/* Chapter1-3 メッセージボート作成まで */
const index_page = fs.readFileSync('./index.ejs', 'utf8');
const msg_page = fs.readFileSync('./msg.ejs', 'utf8');
const other_page = fs.readFileSync('./other.ejs', 'utf8');
const style_css = fs.readFileSync('./style.css', 'utf8');

var server = http.createServer(getFromClient);

/* Chapter3- メッセージボート作成から */
const index_chat_page = fs.readFileSync('./index_chat.ejs', 'utf8');
const login_chat_page = fs.readFileSync('./login_chat.ejs', 'utf8');

const max_num = 10;
const filename = 'mydata.txt';
var message_data;
readFromFile(filename);

var server2 = http.createServer(getFromClientChatBoard);

server.listen(3000);
console.log('Server1 start!');
server2.listen(3001);
console.log('Server2 start!');

// ここまでメインプログラム==========

/* Chapter1-3 メッセージボート作成まで */
// サーバールーティング
function getFromClient(request, response) {
  var url_parts = url.parse(request.url, true);

  switch (url_parts.pathname) {

    case '/':
      response_index(request, response);
      break;

    case '/msg':
      response_msg(request, response);
      break;

    case '/other':
      response_other(request, response);
      break;

    case '/style.css':
      response.writeHead(200, { 'Content-Type': 'text/css' });
      response.write(style_css);
      response.end();
      break;

    default:
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('no page...');
      break;
  }
}

// ここからデータ定義
var data = {
  'Taro': '09-999-999',
  'Hanako': '080-888-888',
  'Sachiko': '070-777-777',
  'Ichiro': '060-666-666',
};

var data_msg = {
  msg: 'no message...',
};

var data_other = {
  'Taro': ['taro@yamada', '09-999-999', 'Tokyo'],
  'Hanako': ['hanako@flower', '080-888-888', 'Yokohama'],
  'Sachiko': ['sachi@happy', '070-777-777', 'Nagoya'],
  'Ichiro': ['ichi@baseball', '060-666-666', 'USA'],
}
// ここまでデータ定義

// indexのアクセス処理
function response_index(request, response) {
  var msg = "これはIndexページです。"
  var content = ejs.render(index_page, {
    title: "Index",
    content: msg,
    data: data,
    filename: 'data_item'
  });
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(content);
  response.end();
}

// msgのアクセス処理
function response_msg(request, response) {
  // POSTアクセス時の処理
  if (request.method == 'POST') {
    var body = '';

    // データ受信のイベント処理
    request.on('data', (data_msg) => {
      body += data_msg;
    });

    // データ受信終了のイベント処理
    request.on('end', () => {
      data_msg = qs.parse(body); // ☆データのパース
      setCookie('msg', data_msg.msg, request, response);
      _write_msg(request, response);
    });
  } else {
    _write_msg(request, response);
  }
}

function _write_msg(request, response) {
  var msg = "※伝言を表示します。";
  var cookie_data = getCookie('msg', request);
  var content = ejs.render(msg_page, {
    title: "Message",
    content: msg,
    data: data_msg,
    cookie_data: cookie_data,
  });
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(content);
  response.end();
}

// otherのアクセス処理
function response_other(request, response) {
  var msg = "これはOtherページです。"
  var content = ejs.render(other_page, {
    title: "Other",
    content: msg,
    data: data_other,
    filename: 'data_item'
  });
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(content);
  response.end();
}

// 共通メソッド
function setCookie(key, value, request, response) {
  var cookie = escape(value);
  var cookie_data = request.headers.cookie != undefined ? request.headers.cookie : '';
  var current_data = cookie_data.split(';');
  for (var i in current_data) {
    if (current_data[i].trim().startsWith(key + '=')) {
      var result = current_data[i].trim().substring(key.length + 1);
      if(typeof cookie !== undefined){
        cookie += ' <- ' + result;
      }
    }
  }
  response.setHeader('Set-Cookie', [key + '=' + cookie]);
}

function getCookie(key, request) {
  var cookie_data = request.headers.cookie != undefined ? request.headers.cookie : '';
  var data = cookie_data.split(';');
  for (var i in data) {
    if (data[i].trim().startsWith(key + '=')) {
      var result = data[i].trim().substring(key.length + 1);
      return unescape(result);
    }
  }
  return '';
}

/* Chapter3- メッセージボート作成から */
function getFromClientChatBoard(request, response) {
  var url_parts = url.parse(request.url, true);

  switch (url_parts.pathname) {

    case '/':
      response_chat_index(request, response);
      break;

    case '/login':
      response_chat_login(request, response);
      break;

    default:
      response.writeHead(200, { 'Content-Type': 'text/plain' });
      response.end('no page...');
      break;
  }
}

function response_chat_login(request, response) {
  var content = ejs.render(login_chat_page, {});
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(content);
  response.end();
}

function response_chat_index(request, response) {
  // POSTアクセス時の処理
  if (request.method == 'POST') {
    var body = '';

    // データ受信のイベント処理
    request.on('data', function (data) {
      body += data;
    });

    // データ受信終了のイベント処理
    request.on('end', function () {
      data = qs.parse(body);
      addToData(data.id, data.msg, filename, request);
      _write_chat_index(request, response);
    });
  } else {
    _write_chat_index(request, response);
  }
}

// indexのページ作成
function _write_chat_index(request, response) {
  var msg = "※何かメッセージを書いて下さい。";
  var content = ejs.render(index_chat_page, {
    title: 'Index',
    content: msg, 
    data: message_data,
    filename: 'data_item_chat',
  });
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(content);
  response.end();
}

// テキストファイルをロード
function readFromFile(fname) {
  fs.readFile(fname, 'utf8', (err, data) => {
    message_data = data.split('\n');
  })
}

// データを更新
function addToData(id, msg, fname, request) {
  var obj = { 'id': id, 'msg': msg };
  var obj_str = JSON.stringify(obj);
  console.log('add data: ' + obj_str);
  message_data.unshift(obj_str);
  if (message_data.length > max_num) {
    message_data.pop();
  }
  saveToFile(fname);
}

// データを保存
function saveToFile(fname) {
  var data_str = message_data.join('\n');
  fs.writeFile(fname, data_str, (err) => {
    if (err) { throw err; }
  });
}
