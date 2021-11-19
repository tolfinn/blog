var express = require('express')
var path = require('path')
var app = express()
var router = require('./router')
var bodyParser = require('body-parser')
var session = require('express-session')
const fs = require('fs')

app.use('/public/', express.static(path.join(__dirname, './public/')))
app.use('/node_modules/', express.static(path.join(__dirname, './node_modules/')))

app.engine('html', require('express-art-template'))
app.set('views', path.join(__dirname, './views/'))

// 配置解析表单 POST 请求体插件
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.use(session({
  secret: 'itcast',
  resave: false,
  saveUninitialized: true,
  // cookie: { secure: true }
}))

//将路由挂载在app中
app.use(router)

//自定义中间件，当访问出错时显示404.html
app.use(function (req, res, next) {
  res.render('404.html')
})

//处理router中的错误
app.use(function (err, req, res, next) {
  res.status(500).json({
    err_code: 500,
    message:err.message

  })
})

app.listen(5000, function () {
  console.log('..... 127.0.0.1:5000 ....')
})
