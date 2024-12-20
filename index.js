const express = require('express')
const app = express()
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const path = require('path')
const bcrypt = require('bcrypt')
const userModel = require('./models/user')
const postModel = require('./models/post')

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.set('view engine', 'ejs')
app.use(express.static(path.join(__dirname, 'public')))
app.use(cookieParser())

app.get('/', (req, res) => {
  res.render('index')
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.post('/login', async (req, res) => {
  const { email, password } = req.body
  let user = await userModel.findOne({ email })
  if (!user) {
    res.redirect('index')
  }
  console.log("user found")
  bcrypt.compare(password, user.password, (err, result) => {

    if (result) {
      let token = jwt.sign({ email: user.email, id: user._id }, 'secret')

      res.cookie('token', token)

      res.redirect('profile')

    }
  })
})

app.post('/register', async (req, res) => {
  const { name, email, password, age } = req.body
  let user = await userModel.findOne({ email })
  if (user) { res.render('login') }
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(password, salt, async (err, hash) => {
      let user = await userModel.create({
        name,
        email,
        password: hash,
        age
      })
      let token = jwt.sign({ email: user.email, id: user._id }, 'secret')
      res.cookie('token', token)
      res.redirect('/profile')
    })
  })
})
app.get('/logout', isLoggedIn, (req, res) => {
  res.cookie('token', "")
  res.redirect('/')
})

app.get('/createpost', isLoggedIn, (req, res) => {
  res.render('profile')
})

app.get('/profile', isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email })
  res.render('profile', { user })
})

app.post('/createpost', isLoggedIn, async (req, res) => {
  let user = await userModel.findOne({ email: req.user.email })
  let { content } = req.body
  let post = await postModel.create({
    user: user._id,
    content
  })
  user.post.push(post._id)
  await user.save()
  res.redirect('/profile')
})

app.get('/read', async (req, res) => {
  let post = await postModel.find().populate('user', 'name')

  res.render('read', { post })
})
app.get('/like/:id', isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate('user', 'name')
  if (!post.likes.includes(req.user.id)) {
    post.likes.push(req.user.id)
  } else {
    post.likes.splice(post.likes.indexOf(req.user.id), 1)
  }
  await post.save()
  res.redirect('/read')
})
app.get('/editpost/:id', isLoggedIn, async (req, res) => {
  let post = await postModel.findOne({ _id: req.params.id }).populate('user', 'name')
  if(post.user._id.toString() === req.user.id.toString()){

    res.render('edit', { post })
  }else{
    res.redirect('/read')
  }
})
app.post('/update/:id', isLoggedIn, async (req, res) => {
  let post = await postModel.findOneAndUpdate({ _id: req.params.id }, { content: req.body.content }, { new: true })

  res.redirect('/read')
})
function isLoggedIn(req, res, next) {
  const token = req.cookies.token
  if (!token) {
    return res.redirect('/login')
  }
  try {
    const data = jwt.verify(token, 'secret')
    req.user = data
    next()
  } catch (err) {
    res.redirect('/login')
  }
}

app.listen(3000)