var express = require('express')
var md5 = require('blueimp-md5')
var router = express.Router()

var User = require('./model/user')
//渲染首页
router.get('/', function (req, res, next) {
  // if(req.session){
  //   console.log(req.session.user)
  // }else{
  //   console.log('no session')
  // }
  // console.log('user3-----',req.session.user)
  res.render('index.html', {
    user: req.session.user
  })
})

//登录
router.get('/login', function (req, res, next) {
  res.render('login.html')
})
router.post('/login', function (req, res, next) {
  var body = req.body
  User.findOne({
    email: body.email,
    password: md5(md5(body.password))

  }, function (err, user) {
    if (err) {
      // return res.status(500).json({
      //   err_code:500
      // })
      return next(err)
    }

    if (!user) {
      return res.status(200).json({
        err_code: 1
      })
    }

    req.session.user = user

    res.status(200).json({
      err_code: 0,
      message: 'OK'
    })

  })
})


//注册
router.get('/register', function (req, res, next) {
  res.render('register.html')
})

router.post('/register', function (req, res, next) {
  // 1. 获取表单提交的数据
  //    req.body
  // 2. 操作数据库
  //    判断改用户是否存在
  //    如果已存在，不允许注册
  //    如果不存在，注册新建用户
  // 3. 发送响应
  var body = req.body
  User.findOne({
    $or: [{
      email: body.email
    },
    {
      nickname: body.nickname
    }
    ]
  }, function (err, data) {
    if (err) {
      // return res.status(500).json({
      //   success: false,
      //   message: '服务端错误'
      // })
      return next(err)
    }
    // console.log(data)
    if (data) {
      // 邮箱或者昵称已存在
      return res.status(200).json({
        err_code: 1,
        message: 'Email or nickname aleady exists.'
      })
    }

    // 对密码进行 md5 重复加密
    body.password = md5(md5(body.password))

    new User(body).save(function (err, user) {
      if (err) {
        return next(err)
      }

      // 注册成功，使用 Session 记录用户的登陆状态
      req.session.user = user

      // Express 提供了一个响应方法：json
      // 该方法接收一个对象作为参数，它会自动帮你把对象转为字符串再发送给浏览器
      res.status(200).json({
        err_code: 0,
        message: 'OK'
      })

      // 服务端重定向只针对同步请求才有效，异步请求无效
      // res.redirect('/')
    })
  })
})

//退出登录
router.get('/logout', function (req, res, next) {
  req.session.user = null
  res.redirect('/')
})


//发表
router.get('/topics/new', function (req, res, next) {
  res.render('topic/new.html', {
    user: req.session.user
  })
})


//设置--基本信息
router.get('/settings/profile', function (req, res, next) {
  res.render('settings/profile.html', {
    user: req.session.user,
    stnav: 1
  })
})

router.post('/settings/profile', function (req, res, next) {
  var body = req.body
  User.findByIdAndUpdate(req.session.user._id, {
    nickname: body.nickname,
    bio: body.bio,
    birthday: new Date(body.birthday),
    gender: parseInt(body.genderOption)
  }, function (err, ret) {
    if (err) {
      return next(err)
    } else {
      User.findOne({
        _id: req.session.user._id
      }, function (err, u) {
        if (err) {
          return next(err)
        } else {
          req.session.user = u
          res.status(200).json({
            err_code: 0,
            message: 'OK'
          })
        }
      })
    }
  })
})

//账户设置 修改密码
router.get('/settings/admin', function (req, res, next) {
  res.render('settings/admin.html', {
    user: req.session.user,
    stnav: 2
  })
})

router.post('/settings/admin', function (req, res, next) {
  var body = req.body
  //处于登录状态
  if (!req.session.user) {
    return res.status(200).json({
      err_code: 2,
      message: 'pls login first.'
    })
  }
  if (md5(md5(body.oldPasssWord)) !== req.session.user.password) {
    return res.status(200).json({
      err_code: 4,
      message: 'The old password is wrong.'
    })
  }
  if (body.oldPasssWord === body.newPassWord) {
    return res.status(200).json({
      err_code: 3,
      message: 'The old and new passwords are consistent.'
    })
  }

  if (body.confirmNewPassWord !== body.newPassWord) {
    return res.status(200).json({
      err_code: 1,
      message: 'The passwords entered twice are inconsistent'
    })
  }

  //修改密码
  User.findByIdAndUpdate(req.session.user._id, {
    password: md5(md5(body.newPassWord))
  }, function (err, ret) {
    if (err) {
      return next(err)
    } else {
      req.session.user = null
      res.status(200).json({
        err_code: 0,
        message: 'OK'
      })
    }
  })

})
//注销账户
router.get('/cancellation' , function(req, res, next){
  User.remove({
    _id: req.session.user._id
  }, function(err, ret) {
    if (err) {
      return next(err)
    } else {
      req.session.user = null
      res.redirect('/')
    }
  })
})

module.exports = router